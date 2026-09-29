import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.tsx'
import type { WhiteboardFace } from '../src/client/WhiteboardPanel.tsx'

describe('whiteboard client registration', () => {
  it('does not create a file when drawioedit is unavailable', async () => {
    let face: WhiteboardFace | undefined
    let creates = 0
    const ctx = {
      remote: { $mount: async () => () => {} },
      effect: (effect: () => unknown) => { effect() },
      locale: { register: () => () => {}, bind: () => (key: string) => key },
      get: () => ({ createBoard: async () => { creates++; return { ok: true, value: {} } } }),
      sidebarRightTabs: { get: () => undefined },
      slots: {
        inject: (_name: string, effect: () => void) => effect(),
        register: (options: { name: string; inject?: () => WhiteboardFace }) => {
          if (options.name === 'main') face = options.inject?.()
          return () => {}
        },
      },
    } as unknown as Context
    await apply(ctx)
    await expect(face!.create('白板')).rejects.toThrow('editorMissing')
    expect(creates).toBe(0)
  })

  it('creates a timestamp file and opens it through drawioedit in a writable dedicated session', async () => {
    let face: WhiteboardFace | undefined
    const openings: Array<{ address: string; kind: string }> = []
    const calls: Array<{ method: string; args: unknown[] }> = []
    let fullscreenCount = 0
    const previousWindow = globalThis.window
    Object.assign(globalThis, { window: { innerWidth: 1200, setTimeout, clearTimeout } })
    try {
      const board = { id: '2026-09-29_09-46-00-000.drawio', title: '2026-09-29_09-46-00-000', path: 'C:\\plugin\\files\\2026-09-29_09-46-00-000.drawio', directory: 'C:\\plugin\\files', updatedAt: 1 }
      const ctx = {
        remote: { $mount: async () => () => {} },
        effect: (effect: () => unknown) => { effect() },
        locale: { register: () => () => {}, bind: () => (key: string) => key },
        get: () => ({
          listBoards: async (...args: unknown[]) => { calls.push({ method: 'listBoards', args }); return { ok: true, value: [board] } },
          createBoard: async (...args: unknown[]) => { calls.push({ method: 'createBoard', args }); return { ok: true, value: board } },
          previewBoard: async (...args: unknown[]) => { calls.push({ method: 'previewBoard', args }); return { ok: true, value: '<mxGraphModel />' } },
          deleteBoard: async (...args: unknown[]) => { calls.push({ method: 'deleteBoard', args }); return { ok: true, value: undefined } },
          grantBoardSession: async (...args: unknown[]) => { calls.push({ method: 'grantBoardSession', args }); return { ok: true, value: undefined } },
        }),
        sessions: { list: { getSnapshot: () => ({ byId: {} }) }, create: async (options: unknown) => { calls.push({ method: 'sessionCreate', args: [options] }); return 'session-1' } },
        uiWorkspace: { openSession: () => {} },
        sidebarRightTabs: { get: () => ({ kind: 'drawio-edit' }) },
        sidebarRight: {
          mounted: { getSnapshot: () => 'session-1', subscribe: () => () => {} },
          openResource: (address: string, options: { kind: string }) => openings.push({ address, kind: options.kind }),
          commandTarget: () => ({ paneId: 'pane-1' }),
          toggleFullscreen: () => { fullscreenCount++ },
        },
        slots: {
          inject: (_name: string, effect: () => void) => effect(),
          register: (options: { name: string; inject?: () => WhiteboardFace }) => {
            if (options.name === 'main') face = options.inject?.()
            return () => {}
          },
        },
      } as unknown as Context
      await apply(ctx)
      expect(await face?.list()).toEqual([board])
      expect(await face?.create('系统架构')).toEqual(board)
      expect(await face?.preview(board.id)).toBe('<mxGraphModel />')
      await face?.remove(board.id, board.updatedAt)
      await face!.open(board)
      expect(calls).toEqual([
        { method: 'listBoards', args: [] }, { method: 'createBoard', args: [{ name: '系统架构' }] },
        { method: 'previewBoard', args: [{ id: board.id }] },
        { method: 'deleteBoard', args: [{ id: board.id, expectedUpdatedAt: board.updatedAt }] },
        { method: 'sessionCreate', args: [{ cwd: board.directory }] },
        { method: 'grantBoardSession', args: [{ sessionId: 'session-1' }] },
      ])
      expect(openings).toHaveLength(1)
      expect(openings[0]?.kind).toBe('drawio-edit')
      expect(openings[0]?.address).toContain('2026-09-29_09-46-00-000.drawio')
      expect(fullscreenCount).toBe(1)
    } finally {
      Object.assign(globalThis, { window: previousWindow })
    }
  })
})
