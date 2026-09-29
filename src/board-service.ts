import { Context } from '@deepseek-ai/cordis'
import { resolve } from 'node:path'
import { setSandboxMode } from '@deepseek-ai/dsh-sandbox-policy'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { BoardStore } from './boards.ts'
import type { BoardIdRequest, BoardRecord, CreateBoardRequest, DeleteBoardRequest, GrantBoardSessionRequest } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context { whiteboard: BoardService }
}

export class BoardService extends TypertRemoteService {
  constructor(ctx: Context, readonly store: BoardStore) { super(ctx, 'whiteboard') }

  @Remote('listBoards')
  async listBoards(): Promise<BoardRecord[]> { return this.store.list() }

  @Remote('createBoard')
  async createBoard(request: CreateBoardRequest): Promise<BoardRecord> { return this.store.create(request?.name) }

  @Remote('previewBoard')
  async previewBoard(request: BoardIdRequest): Promise<string | null> { return this.store.preview(request?.id) }

  @Remote('deleteBoard')
  async deleteBoard(request: DeleteBoardRequest): Promise<void> {
    return this.store.delete(request?.id, request?.expectedUpdatedAt)
  }

  @Remote('grantBoardSession')
  async grantBoardSession(request: GrantBoardSessionRequest): Promise<void> {
    const session = typeof request?.sessionId === 'string' ? this.ctx.sessions.get(request.sessionId as SessionId) : undefined
    const expected = resolve(this.store.directory).toLowerCase()
    if (!session || typeof session.header.cwd !== 'string' || resolve(session.header.cwd).toLowerCase() !== expected) {
      throw new Error('Whiteboard session must belong to the plugin files directory')
    }
    setSandboxMode(session, 'workspace-write')
  }
}
