import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import { fileAddressFor } from '@deepseek-ai/dsh-util-workspace-path'
import type { BoardIdRequest, BoardRecord, CreateBoardRequest, DeleteBoardRequest, GrantBoardSessionRequest } from '../types.ts'
import { REMOTE_NAMESPACE, TYPERT_REMOTE } from '../remote.ts'
import { en, NS, zh, type WhiteboardKey } from './locales.ts'
import { boardToRestore, clearLastBoard, readLastBoard, writeLastBoard } from './last-board.ts'
import { WhiteboardPanel, type WhiteboardFace } from './WhiteboardPanel.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { whiteboard: WhiteboardKey }
}

interface RemoteService {
  listBoards(): Promise<RemoteResult<BoardRecord[]>>
  createBoard(request: CreateBoardRequest): Promise<RemoteResult<BoardRecord>>
  previewBoard(request: BoardIdRequest): Promise<RemoteResult<string | null>>
  deleteBoard(request: DeleteBoardRequest): Promise<RemoteResult<void>>
  grantBoardSession(request: GrantBoardSessionRequest): Promise<RemoteResult<void>>
}

async function unwrap<T>(call: Promise<RemoteResult<T>>): Promise<T> {
  const result = await call
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

function BoardIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="14" rx="2" />
    <path d="m5 13 3.2-3.2 2.2 2.2 3.8-4M5 6.5h3" />
  </svg>
}

export const inject = ['slots', 'locale', 'remote', 'sessions', 'uiWorkspace', 'sidebarRight', 'sidebarRightTabs']
export async function apply(ctx: Context): Promise<void> {
  const off = await ctx.remote.$mount(TYPERT_REMOTE)
  ctx.effect(() => () => off(), 'whiteboard: remote mount')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'whiteboard: dictionaries')
  const t = ctx.locale.bind(NS)
  const remote = (): RemoteService => {
    const service = ctx.get(`remote.${REMOTE_NAMESPACE}`) as RemoteService | undefined
    if (!service) throw new Error('Whiteboard service is unavailable')
    return service
  }
  const sessions = ctx.sessions as unknown as ISessions
  let lastSessionId: Awaited<ReturnType<typeof sessions.create>> | undefined

  /** One open tab as the Sidebar's inventory publishes it. */
  type OpenTab = ReturnType<typeof ctx.sidebarRight.openTabs.getSnapshot>[number]

  /** The drawio editor tab open for the mounted session: the active tab or a background one. */
  const openEditorTab = (sessionId: string): { tabId?: string } | undefined => {
    const known = ctx.sidebarRight.openTabs.getSnapshot().find(
      (tab: OpenTab) => tab.sessionId === sessionId && tab.kind === 'drawio-edit')
    if (known) return { tabId: known.tabId }
    return ctx.sidebarRight.active()?.kind === 'drawio-edit' ? {} : undefined
  }

  const face: WhiteboardFace = {
    list: () => unwrap(remote().listBoards()),
    preview: id => unwrap(remote().previewBoard({ id })),
    remove: (id, expectedUpdatedAt) => unwrap(remote().deleteBoard({ id, expectedUpdatedAt })),
    create: async name => {
      if (!ctx.sidebarRightTabs.get('drawio-edit')) throw new Error(t('editorMissing'))
      const board = await unwrap(remote().createBoard({ name }))
      writeLastBoard(board)
      return board
    },
    open: async board => {
      if (!ctx.sidebarRightTabs.get('drawio-edit')) throw new Error(t('editorMissing'))
      const catalog = sessions.list.getSnapshot().byId
      let sessionId = lastSessionId && catalog[lastSessionId] ? lastSessionId : undefined
      if (!sessionId) sessionId = await sessions.create({ cwd: board.directory })
      await unwrap(remote().grantBoardSession({ sessionId }))
      lastSessionId = sessionId
      // The board has to be remembered before the column opens: a collapse or a
      // new session attempt in between must not lose which board was being edited.
      writeLastBoard(board)
      // Selecting a Session also shows its Conversation in the middle column. This
      // page's gallery gives way to the editor on the first board of a Session;
      // later boards in that Session reuse it, so nothing has to switch again.
      if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) {
        ctx.uiWorkspace.openSession(sessionId)
        // A column that never binds this Session must not swallow the board: the
        // open below still decides, and its own error is the one worth showing.
        await waitForSidebar(ctx, sessionId).catch(() => {})
      }
      ctx.sidebarRight.openResource(fileAddressFor(sessionId, board.directory, board.path), { kind: 'drawio-edit' })
      // The editor takes the screen: the frame is too narrow for a working draw.io
      // surface next to the gallery, and the editor needs its own left palette and
      // right format panel. The panel's presentation control returns to the split.
      const panel = typeof document === 'undefined' ? undefined
        : [...document.querySelectorAll<HTMLElement>('[data-sidebar-right-panel]')]
          .find(element => element.dataset.sidebarRightSession === sessionId)
      if (window.innerWidth >= 768 && panel?.dataset.sidebarRightPanel !== 'fullscreen') {
        const target = ctx.sidebarRight.commandTarget(null)
        if (target) ctx.sidebarRight.toggleFullscreen(target)
      }
    },
    restore: async () => {
      if (!ctx.sidebarRightTabs.get('drawio-edit')) throw new Error(t('editorMissing'))
      const sessionId = ctx.sidebarRight.mounted.getSnapshot()
      // Opening needs a mounted seat; without one the column is not on screen at
      // all, and the stored record survives for the next attempt.
      if (sessionId === undefined) return 'none'
      const open = openEditorTab(sessionId)
      if (open) {
        if (open.tabId !== undefined) ctx.sidebarRight.focus(open.tabId)
        return 'focused'
      }
      const rows = await unwrap(remote().listBoards())
      const board = boardToRestore(rows, readLastBoard())
      if (!board) return 'none'
      await face.open(board)
      return 'reopened'
    },
  }
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'whiteboard', locale: NS, inject: () => face }, WhiteboardPanel))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: 'whiteboard', order: 26, label: () => t('nav'),
  }, BoardIcon))
  ctx.effect(() => ctx.sidebarRight.registerCloseHandler('drawio-edit', (_sessionId, tab) => {
    // An explicit close is the only way to forget the board; a collapsed column keeps its tab.
    if (tab.kind === 'drawio-edit') clearLastBoard()
  }), 'whiteboard: forget a closed board')
}

function waitForSidebar(ctx: Context, sessionId: string): Promise<void> {
  if (ctx.sidebarRight.mounted.getSnapshot() === sessionId) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      unsubscribe()
      reject(new Error('The editor sidebar did not become available'))
    }, 5000)
    const unsubscribe = ctx.sidebarRight.mounted.subscribe(() => {
      if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) return
      window.clearTimeout(timeout)
      unsubscribe()
      resolve()
    })
  })
}
