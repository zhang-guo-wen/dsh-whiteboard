import type { BoardRecord } from '../types.ts'

/**
 * The whiteboard the user was actually editing, remembered across main-panel
 * switches, sidebar toggles and page reloads. Only an explicit close of the
 * drawio tab clears it: collapsing the sidebar keeps the tab and the record,
 * so showing the whiteboard page again can return to the same board.
 */
export interface LastBoard {
  id: string
  title: string
  updatedAt: number
}

const STORAGE_KEY = 'dsh.whiteboard.v1.last-board'

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    // Blocked storage (private mode, disabled cookies) just loses the memory.
    return undefined
  }
}

/** The remembered board, or `undefined` when none was recorded or the payload is unusable. */
export function readLastBoard(): LastBoard | undefined {
  const store = storage()
  if (!store) return undefined
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (raw === null) return undefined
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return undefined
    const { id, title, updatedAt } = value as Record<string, unknown>
    if (typeof id !== 'string' || id === '' || typeof title !== 'string' || typeof updatedAt !== 'number') return undefined
    return { id, title, updatedAt }
  } catch {
    return undefined
  }
}

/** Remember the board that was just opened, replacing any earlier one. */
export function writeLastBoard(board: BoardRecord): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify({ id: board.id, title: board.title, updatedAt: board.updatedAt }))
  } catch {
    // A full or blocked store is not worth failing an open over.
  }
}

/** Forget the remembered board, so the next visit does not reopen it. */
export function clearLastBoard(): void {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(STORAGE_KEY)
  } catch {
    // See writeLastBoard.
  }
}

/**
 * The board a returning visit should open: the remembered one, and only while
 * it still exists unchanged in the loaded gallery. A board that was renamed,
 * edited elsewhere, deleted or replaced no longer matches and is left alone.
 */
export function boardToRestore(boards: readonly BoardRecord[], last: LastBoard | undefined): BoardRecord | undefined {
  if (!last) return undefined
  return boards.find(board => board.id === last.id && board.title === last.title && board.updatedAt === last.updatedAt)
}
