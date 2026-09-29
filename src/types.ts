export interface BoardRecord {
  id: string
  title: string
  path: string
  directory: string
  updatedAt: number
}

export interface GrantBoardSessionRequest { sessionId: string }
export interface CreateBoardRequest { name: string }
export interface BoardIdRequest { id: string }
export interface DeleteBoardRequest extends BoardIdRequest { expectedUpdatedAt: number }
