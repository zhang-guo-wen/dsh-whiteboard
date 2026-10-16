import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { BoardRecord } from '../types.ts'
import { timestampName } from '../board-name.ts'
import { matchesBoard } from '../board-filter.ts'
import css from './WhiteboardPanel.module.css'

export interface WhiteboardFace {
  list(): Promise<BoardRecord[]>
  create(name: string): Promise<BoardRecord>
  /** The preview image for this board revision; cached across mounts, generated once. */
  previewImage(board: BoardRecord): Promise<string | null>
  /** The cached preview image without starting any work; `undefined` when not cached. */
  cachedPreviewImage(board: BoardRecord): string | null | undefined
  remove(id: string, expectedUpdatedAt: number): Promise<void>
  open(board: BoardRecord): Promise<void>
  /** Return to the board being edited before this page was left; `none` keeps the gallery. */
  restore(): Promise<'reopened' | 'focused' | 'none'>
}
type Props = PropsLocale<'whiteboard'> & InjectFace<WhiteboardFace>

function message(error: unknown): string { return error instanceof Error ? error.message : String(error) }
function when(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

type PreviewState = { kind: 'loading' | 'empty' | 'unavailable' } | { kind: 'image'; url: string }

/** `undefined` is an uncached revision; `null` is a board with nothing to draw. */
function previewState(image: string | null | undefined): PreviewState {
  if (image === undefined) return { kind: 'loading' }
  return image === null ? { kind: 'empty' } : { kind: 'image', url: image }
}

function BoardPreview({ board, cached, load, t }: {
  board: BoardRecord
  cached: WhiteboardFace['cachedPreviewImage']
  load: WhiteboardFace['previewImage']
  t: Props['t']
}) {
  const element = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  // A revision that is already cached starts on its image: returning to this
  // page must not flash a placeholder over a picture that already exists.
  const [state, setState] = useState<PreviewState>(() => previewState(cached(board)))

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

  // Keyed on the revision, not the row object: a refresh that returns the same
  // revision leaves the running effect alone and issues no second request.
  useEffect(() => {
    if (!visible) return
    const known = cached(board)
    if (known !== undefined) { setState(previewState(known)); return }
    let active = true
    setState({ kind: 'loading' })
    void load(board).then(image => {
      if (active) setState(previewState(image))
    }).catch(() => { if (active) setState({ kind: 'unavailable' }) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- board is read only for the revision pair below.
  }, [board.id, board.updatedAt, cached, load, visible])

  return <span ref={element} className={css.preview} aria-hidden="true">
    {state.kind === 'image' ? <img src={state.url} alt="" />
      : <span className={css.previewStatus} data-kind={state.kind}>{t(state.kind === 'empty' ? 'previewEmpty'
        : state.kind === 'unavailable' ? 'previewUnavailable' : 'previewLoading')}</span>}
  </span>
}

type BoardListProps = {
  boards: BoardRecord[]
  shown: BoardRecord[]
  busy: boolean
  refreshing: boolean
  t: Props['t']
  cached: WhiteboardFace['cachedPreviewImage']
  load: WhiteboardFace['previewImage']
  onOpen: (board: BoardRecord) => void
  onDelete: (board: BoardRecord) => void
  onCreate: () => void
  onClearSearch: () => void
}

function BoardList({ boards, shown, busy, refreshing, t, cached, load, onOpen, onDelete, onCreate, onClearSearch }: BoardListProps) {
  // Both empty states say why the list is empty and offer the way out of it.
  if (boards.length === 0) return <div className={css.empty}>
    <strong>{t('empty')}</strong><span>{t('emptyHint')}</span>
    <button type="button" className={css.primary} disabled={busy} onClick={onCreate}>{t('add')}</button>
  </div>
  if (shown.length === 0) return <div className={css.empty} role="status">
    <strong>{t('searchNoResults')}</strong><span>{t('searchNoResultsHint')}</span>
    <button type="button" className={css.cancel} onClick={onClearSearch}>{t('clearSearch')}</button>
  </div>
  return <ul className={css.grid} aria-busy={refreshing}>{shown.map(board => <li key={board.id} className={css.card}>
    <button type="button" className={css.cardOpen} onClick={() => onOpen(board)} disabled={busy} aria-label={`${t('open')}: ${board.title}`}>
      <strong className={css.cardTitle}>{board.title}</strong>
      <BoardPreview board={board} cached={cached} load={load} t={t} />
      <span className={css.cardFooter}>{t('modified')}: {when(board.updatedAt)}</span>
    </button>
    <button type="button" className={css.deleteMark} disabled={busy} onClick={() => onDelete(board)}
      aria-label={`${t('delete')}: ${board.title}`} title={t('delete')}>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" /></svg>
    </button>
  </li>)}</ul>
}

/** First screen: the grid's own geometry, so the cards land where the bones were. */
function BoardSkeleton({ t }: { t: Props['t'] }) {
  return <div role="status">
    <span className={css.srOnly}>{t('loading')}</span>
    <ul className={css.grid} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map(index => <li key={index} className={css.card}><div className={css.skeletonCard} /></li>)}
    </ul>
  </div>
}

export function WhiteboardPanel({ list, create, previewImage, cachedPreviewImage, remove, open, restore, t }: Props) {
  const [boards, setBoards] = useState<BoardRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<BoardRecord | null>(null)
  const [query, setQuery] = useState('')
  const generation = useRef(0)
  /** Whether this mount already tried to return to the board that was open. */
  const restored = useRef(false)

  // Title search stays local: the gallery is already loaded in memory, so
  // filtering never issues another remote call.
  const shown = useMemo(() => boards.filter(board => matchesBoard(board, query)), [boards, query])

  // A refresh keeps the rows that are already on screen and only reports its own
  // progress, so the cards stay mounted, keep their previews, and the panel
  // keeps its scroll position.
  const refresh = useCallback(async () => {
    const current = ++generation.current
    setError('')
    setRefreshing(true)
    try {
      const rows = await list()
      if (generation.current === current) setBoards(rows)
    } catch (failure) {
      if (generation.current === current) setError(message(failure))
    } finally {
      if (generation.current === current) { setRefreshing(false); setLoaded(true) }
    }
  }, [list])

  useEffect(() => {
    void refresh()
    return () => { generation.current++ }
  }, [refresh])

  // Coming back to this page should land on the board that was being edited, not
  // on the gallery. The first pass still has no rows, so wait for the first load
  // to settle; one attempt per mount is enough — the user can always pick a card.
  // A restore that is still running when the page is left stays harmless: it can
  // only reveal the board the user was already editing.
  useEffect(() => {
    if (restored.current || !loaded) return
    restored.current = true
    void restore().catch(() => { /* the gallery stays usable; the next visit tries again */ })
  }, [loaded, restore])

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
        {refreshing && loaded && <span className={css.busy} role="status">{t('refreshing')}</span>}
        <div className={css.searchBox} role="search">
          <input type="search" value={query} maxLength={100} disabled={!loaded}
            placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')}
            onChange={event => setQuery(event.target.value)}
            // Escape undoes the filter without touching the rows it hid.
            onKeyDown={event => { if (event.key === 'Escape' && query !== '') { event.stopPropagation(); setQuery('') } }} />
          {query !== '' && <button type="button" className={css.searchClear} title={t('clearSearch')}
            aria-label={t('clearSearch')} onClick={() => setQuery('')}>×</button>}
        </div>
        <button type="button" className={css.refresh} onClick={() => void refresh()} disabled={refreshing || busy}>{t('refresh')}</button>
      </div>
      {error && <div className={css.error} role="alert"><span>{t('error')}: {error}</span> <button type="button" onClick={() => void refresh()}>{t('retry')}</button></div>}
      {loaded ? <div aria-live="polite">
        <BoardList boards={boards} shown={shown} busy={busy} refreshing={refreshing} t={t}
          cached={cachedPreviewImage} load={previewImage}
          onOpen={board => void openBoard(board)} onDelete={setPendingDelete}
          onCreate={showCreate} onClearSearch={() => setQuery('')} />
      </div> : <BoardSkeleton t={t} />}
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
