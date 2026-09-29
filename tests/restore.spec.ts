import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.tsx'
import type { WhiteboardFace } from '../src/client/WhiteboardPanel.tsx'

const board = {
  id: '2026-09-29_09-46-00-000.drawio',
  title: '系统架构',
  path: 'C:\\plugin\\files\\2026-09-29_09-46-00-000.drawio',
  directory: 'C:\\plugin\\files',
  updatedAt: 7,
}

function fakeStorage(): Storage {
  const entries = new Map<string, string>()
  return {
    get length() { return entries.size },
    clear: () => entries.clear(),
    getItem: key => entries.get(key) ?? null,
    key: index => [...entries.keys()][index] ?? null,
    removeItem: key => { entries.delete(key) },
    setItem: (key, value) => { entries.set(key, value) },
  }
}

interface Harness {
  face: WhiteboardFace
  calls: Array<{ method: string; args: unknown[] }>
  openings: Array<{ address: string; kind?: string }>
  focuses: string[]
  sessionOpens: string[]
  closes: Array<{ kind: string; tab: { kind?: string } }>
  closeHandlers: Map<string, (sessionId: string, tab: { kind?: string }) => void>
}

/** A client context wired far enough to exercise the restore path. */
async function harness(options: { mounted?: string | undefined; openTabs?: unknown[]; activeTab?: unknown } = {}): Promise<Harness> {
  const calls: Harness['calls'] = []
  const openings: Harness['openings'] = []
  const focuses: string[] = []
  const sessionOpens: string[] = []
  const closes: Harness['closes'] = []
  const closeHandlers: Harness['closeHandlers'] = new Map()
  let face: WhiteboardFace | undefined
  const ctx = {
    remote: { $mount: async () => () => {} },
    effect: (effect: () => unknown) => { effect() },
    locale: { register: () => () => {}, bind: () => (key: string) => key },
    get: () => ({
      listBoards: async (...args: unknown[]) => { calls.push({ method: 'listBoards', args }); return { ok: true, value: [board] } },
      createBoard: async (...args: unknown[]) => { calls.push({ method: 'createBoard', args }); return { ok: true, value: board } },
      previewBoard: async (...args: unknown[]) => { calls.push({ method: 'previewBoard', args }); return { ok: true, value: null } },
      deleteBoard: async (...args: unknown[]) => { calls.push({ method: 'deleteBoard', args }); return { ok: true, value: undefined } },
      grantBoardSession: async (...args: unknown[]) => { calls.push({ method: 'grantBoardSession', args }); return { ok: true, value: undefined } },
    }),
    sessions: {
      list: { getSnapshot: () => ({ byId: {} }) },
      create: async (options: unknown) => { calls.push({ method: 'sessionCreate', args: [options] }); return 'session-1' },
    },
    uiWorkspace: { openSession: (id: string) => { sessionOpens.push(id) } },
    sidebarRightTabs: { get: () => ({ kind: 'drawio-edit' }) },
    sidebarRight: {
      mounted: { getSnapshot: () => ('mounted' in options ? options.mounted : 'session-1'), subscribe: () => () => {} },
      openTabs: { getSnapshot: () => options.openTabs ?? [] },
      active: () => options.activeTab,
      openResource: (address: string, openOptions?: { kind?: string }) => openings.push({ address, kind: openOptions?.kind }),
      focus: (tabId: string) => focuses.push(tabId),
      commandTarget: () => undefined,
      toggleFullscreen: () => {},
      registerCloseHandler: (kind: string, handler: (sessionId: string, tab: { kind?: string }) => void) => {
        closes.push({ kind, tab: { kind } })
        closeHandlers.set(kind, handler)
        return () => {}
      },
    },
    slots: {
      inject: (_name: string, effect: () => void) => effect(),
      register: (registration: { name: string; inject?: () => WhiteboardFace }) => {
        if (registration.name === 'main') face = registration.inject?.()
        return () => {}
      },
    },
  } as unknown as Context
  await apply(ctx)
  return { face: face!, calls, openings, focuses, sessionOpens, closes, closeHandlers }
}

describe('whiteboard restore', () => {
  const previousWindow = globalThis.window

  function withStorage(): Storage {
    const storage = fakeStorage()
    Object.assign(globalThis, { window: { innerWidth: 1200, setTimeout, clearTimeout, localStorage: storage } })
    return storage
  }

  it('reopens the board that was being edited before the page was left', async () => {
    const storage = withStorage()
    try {
      storage.setItem('dsh.whiteboard.v1.last-board', JSON.stringify({ id: board.id, title: board.title, updatedAt: board.updatedAt }))
      const test = await harness()
      expect(await test.face.restore()).toBe('reopened')
      expect(test.calls).toEqual([
        { method: 'listBoards', args: [] },
        { method: 'sessionCreate', args: [{ cwd: board.directory }] },
        { method: 'grantBoardSession', args: [{ sessionId: 'session-1' }] },
      ])
      expect(test.openings).toHaveLength(1)
      expect(test.openings[0]?.kind).toBe('drawio-edit')
      expect(test.openings[0]?.address).toContain(board.id)
      // The editor column is already on this Session (the recorded board), so no
      // Session switch is needed to bring the board back.
      expect(test.sessionOpens).toEqual([])
    } finally {
      Object.assign(globalThis, { window: previousWindow })
    }
  })

  it('keeps the gallery when nothing was being edited', async () => {
    withStorage()
    try {
      const test = await harness()
      expect(await test.face.restore()).toBe('none')
      expect(test.calls).toEqual([{ method: 'listBoards', args: [] }])
      expect(test.openings).toHaveLength(0)
    } finally {
      Object.assign(globalThis, { window: previousWindow })
    }
  })

  it('focuses the open editor tab instead of opening the board twice', async () => {
    const storage = withStorage()
    try {
      storage.setItem('dsh.whiteboard.v1.last-board', JSON.stringify({ id: board.id, title: board.title, updatedAt: board.updatedAt }))
      const test = await harness({ openTabs: [{ sessionId: 'session-1', kind: 'drawio-edit', tabId: 'tab-9', contentId: board.id }] })
      expect(await test.face.restore()).toBe('focused')
      expect(test.focuses).toEqual(['tab-9'])
      expect(test.calls).toEqual([])
    } finally {
      Object.assign(globalThis, { window: previousWindow })
    }
  })

  it('reopens nothing while no session seat is mounted', async () => {
    const storage = withStorage()
    try {
      storage.setItem('dsh.whiteboard.v1.last-board', JSON.stringify({ id: board.id, title: board.title, updatedAt: board.updatedAt }))
      const test = await harness({ mounted: undefined })
      expect(await test.face.restore()).toBe('none')
      expect(test.calls).toEqual([])
    } finally {
      Object.assign(globalThis, { window: previousWindow })
    }
  })

  it('forgets the board when the editor tab is closed explicitly', async () => {
    const storage = withStorage()
    try {
      storage.setItem('dsh.whiteboard.v1.last-board', JSON.stringify({ id: board.id, title: board.title, updatedAt: board.updatedAt }))
      const test = await harness()
      const handler = test.closeHandlers.get('drawio-edit')
      expect(handler).toBeTypeOf('function')
      expect(storage.getItem('dsh.whiteboard.v1.last-board')).not.toBeNull()
      handler!('session-1', { kind: 'drawio-edit' })
      expect(storage.getItem('dsh.whiteboard.v1.last-board')).toBeNull()
      expect(await test.face.restore()).toBe('none')
    } finally {
      Object.assign(globalThis, { window: previousWindow })
    }
  })
})
