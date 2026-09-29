import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { boardToRestore, clearLastBoard, readLastBoard, writeLastBoard } from '../src/client/last-board.ts'
import type { BoardRecord } from '../src/types.ts'

const board = (id: string, title = id, updatedAt = 1): BoardRecord =>
  ({ id, title, path: `C:\\plugin\\files\\${id}`, directory: 'C:\\plugin\\files', updatedAt })

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

describe('remembered whiteboard', () => {
  const previous = globalThis.window

  beforeEach(() => { Object.assign(globalThis, { window: { localStorage: fakeStorage() } }) })
  afterEach(() => { Object.assign(globalThis, { window: previous }); vi.restoreAllMocks() })

  it('survives a reload: an opened board is written and read back', () => {
    expect(readLastBoard()).toBeUndefined()
    writeLastBoard(board('2026-09-29_09-46-00-000.drawio', '系统架构', 42))
    expect(readLastBoard()).toEqual({ id: '2026-09-29_09-46-00-000.drawio', title: '系统架构', updatedAt: 42 })
  })

  it('forgets the board only on an explicit close', () => {
    writeLastBoard(board('a.drawio'))
    clearLastBoard()
    expect(readLastBoard()).toBeUndefined()
  })

  it('ignores unusable payloads instead of failing the gallery', () => {
    window.localStorage.setItem('dsh.whiteboard.v1.last-board', 'not json')
    expect(readLastBoard()).toBeUndefined()
    window.localStorage.setItem('dsh.whiteboard.v1.last-board', JSON.stringify({ id: '', title: 'x', updatedAt: 1 }))
    expect(readLastBoard()).toBeUndefined()
    window.localStorage.setItem('dsh.whiteboard.v1.last-board', JSON.stringify({ id: 'a', title: 'x' }))
    expect(readLastBoard()).toBeUndefined()
  })

  it('does not throw when storage itself is unavailable', () => {
    Object.assign(globalThis, { window: {} as Window })
    expect(() => writeLastBoard(board('a.drawio'))).not.toThrow()
    expect(readLastBoard()).toBeUndefined()
    expect(() => clearLastBoard()).not.toThrow()
  })

  it('restores the stored board while it still matches the loaded gallery', () => {
    const boards = [board('a.drawio', '系统架构', 1), board('b.drawio', '流程草图', 2)]
    expect(boardToRestore(boards, { id: 'b.drawio', title: '流程草图', updatedAt: 2 })).toEqual(boards[1])
  })

  it('leaves a board alone once it was renamed, edited elsewhere, deleted or replaced', () => {
    const boards = [board('a.drawio', '系统架构', 5)]
    expect(boardToRestore(boards, { id: 'a.drawio', title: '旧名字', updatedAt: 5 })).toBeUndefined()
    expect(boardToRestore(boards, { id: 'a.drawio', title: '系统架构', updatedAt: 4 })).toBeUndefined()
    expect(boardToRestore(boards, { id: 'gone.drawio', title: '系统架构', updatedAt: 5 })).toBeUndefined()
    expect(boardToRestore([], { id: 'a.drawio', title: '系统架构', updatedAt: 5 })).toBeUndefined()
    expect(boardToRestore(boards, undefined)).toBeUndefined()
  })
})
