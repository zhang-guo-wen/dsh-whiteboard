// @vitest-environment jsdom
// Gallery behaviour that only a mounted panel can show: a refresh must keep the
// cards it already has (same DOM nodes, same generated previews, same scroll
// position), and a remount must reuse the images the cache already holds.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createBoardPreviewCache } from '../src/client/board-preview-cache.ts'
import { WhiteboardPanel, type WhiteboardFace } from '../src/client/WhiteboardPanel.tsx'
import { zh, type WhiteboardKey } from '../src/client/locales.ts'
import type { BoardRecord } from '../src/types.ts'

afterEach(cleanup)

const t = (key: WhiteboardKey) => zh[key]

function record(index: number, updatedAt = 1000 + index): BoardRecord {
  const id = `board-${index}.drawio`
  return { id, title: `Board ${index}`, path: `C:\\plugin\\files\\${id}`, directory: 'C:\\plugin\\files', updatedAt }
}

/** A gallery whose Host reads and drawings are observable. */
function gallery(options: { rows?: BoardRecord[]; list?: () => Promise<BoardRecord[]> } = {}) {
  const rows = options.rows ?? [record(0), record(1), record(2)]
  const loads = vi.fn(async (id: string) => `<mxGraphModel data-board="${id}" />`)
  const draws: string[] = []
  const previews = createBoardPreviewCache({
    capacity: 24,
    load: loads,
    render: source => { draws.push(source); return `data:image/svg+xml,${encodeURIComponent(source)}` },
    yieldToMainThread: async () => {},
  })
  const list = vi.fn(options.list ?? (async () => rows))
  const face: WhiteboardFace = {
    list,
    create: async () => rows[0] as BoardRecord,
    previewImage: board => previews.preview(board),
    cachedPreviewImage: board => previews.peek(board),
    remove: async () => {},
    open: async () => {},
    restore: async () => 'none',
  }
  return { face, list, loads, draws, previews }
}

function open(face: WhiteboardFace) {
  return render(<WhiteboardPanel {...face} t={t} />)
}

function cards(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('li')]
}

describe('whiteboard gallery', () => {
  it('shows the grid skeleton first and the rows once they arrive', async () => {
    let resolveList: (rows: BoardRecord[]) => void = () => {}
    const { face } = gallery({ list: () => new Promise(resolve => { resolveList = resolve }) })
    const view = open(face)

    // The first paint owns the grid's geometry, not a spinner line.
    expect(cards(view.container)).toHaveLength(6)
    expect(screen.queryByText('Board 0')).toBeNull()

    resolveList([record(0), record(1)])
    await waitFor(() => expect(screen.getByText('Board 0')).toBeTruthy())
    expect(cards(view.container)).toHaveLength(2)
  })

  it('keeps the mounted cards, their previews and the scroll position across a refresh', async () => {
    const { face, list, loads, draws } = gallery()
    const view = open(face)
    await waitFor(() => expect(view.container.querySelectorAll('img')).toHaveLength(3))

    const before = cards(view.container)
    const page = view.container.querySelector('main') as HTMLElement
    page.scrollTop = 120

    // Hold the second read open so the busy state can be observed mid-refresh.
    let finishRefresh: () => void = () => {}
    list.mockImplementationOnce(() => new Promise(resolve => {
      finishRefresh = () => resolve([record(0), record(1), record(2)])
    }))
    fireEvent.click(screen.getByRole('button', { name: zh.refresh }))
    await waitFor(() => expect(screen.getByText(zh.refreshing)).toBeTruthy())

    // The rows stay on screen while the read is in flight: no skeleton, no unmount.
    expect(cards(view.container)).toEqual(before)
    expect(view.container.querySelectorAll('img')).toHaveLength(3)
    expect(page.scrollTop).toBe(120)

    finishRefresh()
    await waitFor(() => expect(screen.queryByText(zh.refreshing)).toBeNull())
    expect(cards(view.container)).toEqual(before)
    expect(view.container.querySelectorAll('img')).toHaveLength(3)
    expect(page.scrollTop).toBe(120)
    // One read per board, and not one of them repeated by the refresh.
    expect(loads).toHaveBeenCalledTimes(3)
    expect(draws).toHaveLength(3)
  })

  it('regenerates only the board whose revision moved', async () => {
    const { face, list, loads, draws } = gallery()
    const view = open(face)
    await waitFor(() => expect(view.container.querySelectorAll('img')).toHaveLength(3))

    list.mockImplementationOnce(async () => [record(0), record(1, 9999), record(2)])
    fireEvent.click(screen.getByRole('button', { name: zh.refresh }))
    await waitFor(() => expect(draws).toHaveLength(4))

    expect(loads).toHaveBeenCalledTimes(4)
    expect(loads).toHaveBeenLastCalledWith('board-1.drawio')
  })

  it('reuses cached images when the page is mounted again', async () => {
    const { face, loads, draws } = gallery()
    const first = open(face)
    await waitFor(() => expect(first.container.querySelectorAll('img')).toHaveLength(3))
    first.unmount()

    const second = open(face)
    await waitFor(() => expect(second.container.querySelectorAll('img')).toHaveLength(3))
    expect(loads).toHaveBeenCalledTimes(3)
    expect(draws).toHaveLength(3)
  })

  it('offers a create action from an empty gallery', async () => {
    const { face } = gallery({ list: async () => [] })
    open(face)
    await waitFor(() => expect(screen.getByText(zh.empty)).toBeTruthy())

    const create = screen.getAllByRole('button', { name: zh.add })
    expect(create).toHaveLength(2)
    fireEvent.click(create[1] as HTMLElement)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('offers the way out of a filter that matches nothing', async () => {
    const { face } = gallery()
    const view = open(face)
    await waitFor(() => expect(cards(view.container)).toHaveLength(3))

    const search = screen.getByRole('searchbox')
    fireEvent.change(search, { target: { value: 'nothing matches this' } })
    await waitFor(() => expect(screen.getByText(zh.searchNoResults)).toBeTruthy())

    // The field's own clear affordance shares this name; the empty state owns one too.
    const emptyState = screen.getByText(zh.searchNoResults).parentElement as HTMLElement
    fireEvent.click(within(emptyState).getByRole('button', { name: zh.clearSearch }))
    await waitFor(() => expect(cards(view.container)).toHaveLength(3))
    expect((search as HTMLInputElement).value).toBe('')
  })

  it('filters by title and lets Escape undo the filter', async () => {
    const { face } = gallery()
    const view = open(face)
    await waitFor(() => expect(cards(view.container)).toHaveLength(3))

    const search = screen.getByRole('searchbox')
    fireEvent.change(search, { target: { value: 'Board 2' } })
    await waitFor(() => expect(cards(view.container)).toHaveLength(1))
    expect(screen.getByText('Board 2')).toBeTruthy()

    fireEvent.keyDown(search, { key: 'Escape' })
    await waitFor(() => expect(cards(view.container)).toHaveLength(3))
  })
})
