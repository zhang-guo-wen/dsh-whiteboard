import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { WhiteboardPanel, type WhiteboardFace } from './WhiteboardPanel.tsx'
import { NS } from './locales.ts'

const STORAGE_KEY = 'dsh.whiteboard.v1.session'

/** The dedicated editor Session survives reloads; it is not a chat destination. */
export function readBoardSession(): string | undefined {
  try { return window.localStorage?.getItem(STORAGE_KEY) || undefined }
  catch { return undefined }
}

export function writeBoardSession(sessionId: string): void {
  try { window.localStorage?.setItem(STORAGE_KEY, sessionId) }
  catch { /* Storage may be disabled; the in-memory binding still works. */ }
}

/**
 * Replace only a known whiteboard Session's central occupant, not its navigation
 * or rightbar binding. Selecting the global whiteboard panel here would hide the
 * rightbar: the Host only exposes it while the Conversation main key is selected.
 * The normal Conversation registration stays installed underneath this shadow.
 */
export function installBoardSessionPanel(ctx: Context, owned: (id: string) => boolean, face: WhiteboardFace): () => void {
  let reconcile = () => {}
  ctx.slots.inject('main', () => {
    let release: (() => void) | undefined
    reconcile = () => {
      const sessionId = ctx.sidebarRight.mounted.getSnapshot()
      const showList = sessionId !== undefined && owned(sessionId)
      if (showList && !release) {
        release = ctx.slots.register({ name: 'main', key: 'conversation', priority: -1, locale: NS, inject: () => ({ ...face, restore: async () => 'none' as const }) }, WhiteboardPanel)
      } else if (!showList && release) {
        release()
        release = undefined
      }
    }
    const unsubscribe = ctx.sidebarRight.mounted.subscribe(() => reconcile())
    reconcile()
    return () => { unsubscribe(); release?.(); reconcile = () => {} }
  })
  return () => reconcile()
}
