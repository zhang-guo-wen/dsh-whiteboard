import { useCallback, useEffect, useRef, useState } from 'react'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { BoardRecord } from '../types.ts'
import { timestampName } from '../board-name.ts'
import { renderBoardPreview } from './board-preview.ts'
import css from './WhiteboardPanel.module.css'

export interface WhiteboardFace {
  list(): Promise<BoardRecord[]>
  create(name: string): Promise<BoardRecord>
  preview(id: string): Promise<string | null>
  remove(id: string, expectedUpdatedAt: number): Promise<void>
  open(board: BoardRecord): Promise<void>
}
type Props = PropsLocale<'whiteboard'> & InjectFace<WhiteboardFace>

function message(error: unknown): string { return error instanceof Error ? error.message : String(error) }
function when(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

type PreviewState = { kind: 'loading' | 'empty' | 'unavailable' } | { kind: 'image'; url: string }

function BoardPreview({ board, load, t }: { board: BoardRecord; load: WhiteboardFace['preview']; t: Props['t'] }) {
  const element = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<PreviewState>({ kind: 'loading' })

  useEffect(() => {
    const target = element.current
    if (!target || typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      setVisible(true)
      observer.disconnect()
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let active = true
    setState({ kind: 'loading' })
    void load(board.id).then(source => {
      if (!active) return
      if (source === null) { setState({ kind: 'unavailable' }); return }
      const url = renderBoardPreview(source)
      setState(url ? { kind: 'image', url } : { kind: 'empty' })
    }).catch(() => { if (active) setState({ kind: 'unavailable' }) })
    return () => { active = false }
  }, [board.id, board.updatedAt, load, visible])

  return <span ref={element} className={css.preview} aria-hidden="true">
    {state.kind === 'image' ? <img src={state.url} alt="" />
      : <span className={css.previewStatus}>{t(state.kind === 'empty' ? 'previewEmpty'
        : state.kind === 'unavailable' ? 'previewUnavailable' : 'previewLoading')}</span>}
  </span>
}

export function WhiteboardPanel({ list, create, preview, remove, open, t }: Props) {
  const [boards, setBoards] = useState<BoardRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<BoardRecord | null>(null)
  const generation = useRef(0)

  const refresh = useCallback(async () => {
    const current = ++generation.current
    setError('')
    setLoading(true)
    try {
      const rows = await list()
      if (generation.current === current) setBoards(rows)
    } catch (failure) {
      if (generation.current === current) setError(message(failure))
    } finally {
      if (generation.current === current) setLoading(false)
    }
  }, [list])

  useEffect(() => {
    void refresh()
    return () => { generation.current++ }
  }, [refresh])

  const showCreate = () => {
    setName(timestampName(new Date(), t('defaultNamePrefix')))
    setNameError('')
    setCreateOpen(true)
  }

  const createNew = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    setNameError('')
    let board: BoardRecord
    try {
      board = await create(name)
    } catch (failure) {
      const detail = message(failure)
      if (detail.includes('WHITEBOARD_NAME_EXISTS')) setNameError(t('nameExists'))
      else if (detail.includes('WHITEBOARD_INVALID_NAME')) setNameError(t('invalidName'))
      else setNameError(detail)
      setBusy(false)
      return
    }
    setBoards(rows => [board, ...rows])
    setCreateOpen(false)
    try { await open(board) }
    catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  const openBoard = async (board: BoardRecord) => {
    if (busy) return
    setBusy(true)
    setError('')
    try { await open(board) }
    catch (failure) { setError(message(failure)) }
    finally { setBusy(false) }
  }

  const deleteBoard = async () => {
    if (busy || !pendingDelete) return
    const board = pendingDelete
    setBusy(true)
    setError('')
    try {
      await remove(board.id, board.updatedAt)
      setBoards(rows => rows.filter(row => row.id !== board.id))
      setPendingDelete(null)
    } catch (failure) {
      setPendingDelete(null)
      if (message(failure).includes('WHITEBOARD_MODIFIED')) {
        await refresh()
        setError(t('changed'))
      } else setError(message(failure))
    } finally { setBusy(false) }
  }

  return <main className={css.page}>
    <div className={css.inner}>
      <header className={css.header}>
        <div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div>
        <button type="button" className={css.primary} disabled={busy} onClick={showCreate}>{t('add')}</button>
      </header>
      <div className={css.toolbar}>
        <button type="button" className={css.refresh} onClick={() => void refresh()} disabled={loading}>{t('refresh')}</button>
      </div>
      {error && <div className={css.error} role="alert">{t('error')}: {error} <button type="button" onClick={() => void refresh()}>{t('retry')}</button></div>}
      {loading ? <p className={css.placeholder} role="status">{t('loading')}</p>
        : boards.length === 0 ? <div className={css.empty}><strong>{t('empty')}</strong><span>{t('emptyHint')}</span></div>
          : <ul className={css.grid}>{boards.map(board => <li key={board.id} className={css.card}>
            <button type="button" className={css.cardOpen} onClick={() => void openBoard(board)} disabled={busy} aria-label={`${t('open')}: ${board.title}`}>
              <strong className={css.cardTitle}>{board.title}</strong>
              <BoardPreview board={board} load={preview} t={t} />
              <span className={css.cardFooter}>{t('modified')}: {when(board.updatedAt)}</span>
            </button>
            <button type="button" className={css.deleteMark} disabled={busy} onClick={() => setPendingDelete(board)}
              aria-label={`${t('delete')}: ${board.title}`} title={t('delete')}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" /></svg>
            </button>
          </li>)}</ul>}
    </div>
    {createOpen && <div className={css.backdrop} role="presentation">
      <section className={css.dialog} role="dialog" aria-modal="true" aria-labelledby="whiteboard-create-title"
        onKeyDown={event => { if (event.key === 'Escape' && !busy) setCreateOpen(false) }}>
        <h2 id="whiteboard-create-title">{t('createTitle')}</h2>
        <p>{t('createHint')}</p>
        <form onSubmit={event => void createNew(event)}>
          <label htmlFor="whiteboard-create-name">{t('nameLabel')}</label>
          <div className={css.nameField}>
            <input id="whiteboard-create-name" autoFocus required maxLength={100} value={name}
              aria-invalid={Boolean(nameError)} onChange={event => { setName(event.target.value); setNameError('') }} />
            <span>.drawio</span>
          </div>
          {nameError && <p className={css.nameError} role="alert">{nameError}</p>}
          <div className={css.dialogActions}>
            <button type="button" className={css.cancel} disabled={busy} onClick={() => setCreateOpen(false)}>{t('cancel')}</button>
            <button type="submit" className={css.primary} disabled={busy || !name.trim()}>{busy ? t('creating') : t('confirmCreate')}</button>
          </div>
        </form>
      </section>
    </div>}
    {pendingDelete && <div className={css.backdrop} role="presentation">
      <section className={css.dialog} role="dialog" aria-modal="true" aria-labelledby="whiteboard-delete-title"
        onKeyDown={event => { if (event.key === 'Escape' && !busy) setPendingDelete(null) }}>
        <h2 id="whiteboard-delete-title">{t('deleteTitle')}</h2>
        <p>{t('deleteHint')} <strong>{pendingDelete.title}</strong></p>
        <div className={css.dialogActions}>
          <button type="button" className={css.cancel} disabled={busy} onClick={() => setPendingDelete(null)}>{t('cancel')}</button>
          <button type="button" className={css.danger} disabled={busy} onClick={() => void deleteBoard()}>
            {busy ? t('deleting') : t('confirmDelete')}
          </button>
        </div>
      </section>
    </div>}
  </main>
}
