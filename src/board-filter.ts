import type { BoardRecord } from './types.ts'

/**
 * Local title filter for the whiteboard gallery. An empty or whitespace-only
 * query means "no filtering", so the caller can render the full list.
 */
export function matchesBoard(board: Pick<BoardRecord, 'title'>, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase()
  return needle === '' || board.title.toLocaleLowerCase().includes(needle)
}
