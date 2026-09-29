import type { Context } from '@deepseek-ai/cordis'
import { fileURLToPath } from 'node:url'
import { BoardStore } from './boards.ts'
import { BoardService } from './board-service.ts'

export const name = 'whiteboard'
export const inject = ['sessions']

export function apply(ctx: Context): void {
  new BoardService(ctx, new BoardStore(fileURLToPath(new URL('../files/', import.meta.url))))
}
