import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { installBoardSessionPanel, readBoardSession, writeBoardSession } from '../src/client/board-session.ts'
import { WhiteboardPanel, type WhiteboardFace } from '../src/client/WhiteboardPanel.tsx'

function harness() {
  let mounted: string | undefined
  let listener = () => {}
  let cleanup = () => {}
  const registrations: Array<{ name: string; key: string; priority: number; inject: () => WhiteboardFace; component: unknown; disposed: boolean }> = []
  const face = { restore: async () => 'reopened' } as WhiteboardFace
  const ctx = {
    sidebarRight: { mounted: { getSnapshot: () => mounted, subscribe: (fn: () => void) => { listener = fn; return () => { listener = () => {} } } } },
    slots: {
      inject: (_: string, effect: () => () => void) => { cleanup = effect() },
      register: (options: Omit<(typeof registrations)[number], 'component' | 'disposed'>, component: unknown) => {
        const entry = { ...options, component, disposed: false }
        registrations.push(entry)
        return () => { entry.disposed = true }
      },
    },
  } as unknown as Context
  const refresh = installBoardSessionPanel(ctx, id => id === 'board-session', face)
  return { registrations, refresh, cleanup: () => cleanup(), mount: (id?: string) => { mounted = id; listener() } }
}

describe('whiteboard Session main occupant', () => {
  it('keeps the board list behind fullscreen without changing navigation or the editor', async () => {
    const test = harness()
    test.mount('chat-session')
    expect(test.registrations).toEqual([])
    test.mount('board-session')
    expect(test.registrations).toHaveLength(1)
    const entry = test.registrations[0]!
    expect(entry).toMatchObject({ name: 'main', key: 'conversation', priority: -1, component: WhiteboardPanel, disposed: false })
    // Mounting the list (including exiting fullscreen) must not auto-reopen the
    // board and turn fullscreen back on, or focus a different editor tab.
    expect(await entry.inject().restore()).toBe('none')
    test.refresh()
    test.mount('board-session')
    expect(test.registrations).toHaveLength(1)
    expect(entry.disposed).toBe(false)
    test.mount('chat-session')
    expect(entry.disposed).toBe(true)
    test.mount('board-session')
    expect(test.registrations).toHaveLength(2)
    test.cleanup()
    expect(test.registrations[1]!.disposed).toBe(true)
  })

  it('removes the shadow on global pages and restores it when returning to the board Session', () => {
    const test = harness()
    test.mount('board-session')
    test.mount(undefined)
    expect(test.registrations[0]!.disposed).toBe(true)
    test.mount('board-session')
    expect(test.registrations[1]!.disposed).toBe(false)
    test.cleanup()
  })

  it('persists only the dedicated Session identity and tolerates disabled storage', () => {
    const previous = globalThis.window
    const values = new Map<string, string>()
    try {
      Object.assign(globalThis, { window: { localStorage: { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) } } })
      expect(readBoardSession()).toBeUndefined()
      writeBoardSession('board-session')
      expect(readBoardSession()).toBe('board-session')
      Object.assign(globalThis, { window: {} })
      expect(() => writeBoardSession('board-session')).not.toThrow()
      expect(readBoardSession()).toBeUndefined()
    } finally { Object.assign(globalThis, { window: previous }) }
  })
})
