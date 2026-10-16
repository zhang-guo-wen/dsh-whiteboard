import { describe, expect, it, vi } from 'vitest'
import { boardPreviewKey, createBoardPreviewCache, type BoardPreviewSubject } from '../src/client/board-preview-cache.ts'

function board(id: string, updatedAt: number): BoardPreviewSubject { return { id, updatedAt } }

/** A cache whose reads and drawings are cheap and observable. */
function gallery(options: { capacity?: number; load?: (id: string) => Promise<string | null> } = {}) {
  const loads = vi.fn(options.load ?? (async (id: string) => `<mxGraphModel data-board="${id}" />`))
  const draws = vi.fn((source: string) => `data:image/svg+xml,${encodeURIComponent(source)}`)
  const cache = createBoardPreviewCache({
    capacity: options.capacity ?? 4,
    load: loads,
    render: draws,
    // The real yield is a macrotask; the tests own the scheduling boundary.
    yieldToMainThread: async () => {},
  })
  return { cache, loads, draws }
}

describe('board preview cache', () => {
  it('addresses an image by board id and revision', () => {
    const base = boardPreviewKey(board('a', 1))
    expect(base).not.toBe(boardPreviewKey(board('a', 2)))
    expect(base).not.toBe(boardPreviewKey(board('b', 1)))
    expect(base).toBe(boardPreviewKey(board('a', 1)))
  })

  it('draws one revision once and reuses the image across mounts', async () => {
    const { cache, loads, draws } = gallery()
    const subject = board('a', 1)
    const first = await cache.preview(subject)
    // A remount asks for the same revision; it must not read or draw again.
    const second = await cache.preview(subject)
    expect(first).toBe(`data:image/svg+xml,${encodeURIComponent('<mxGraphModel data-board="a" />')}`)
    expect(second).toBe(first)
    expect(loads).toHaveBeenCalledTimes(1)
    expect(draws).toHaveBeenCalledTimes(1)
    expect(cache.peek(subject)).toBe(first)
    expect(cache.size()).toBe(1)
  })

  it('regenerates a board after its revision moves and forgets the stale image', async () => {
    const { cache, loads, draws } = gallery()
    await cache.preview(board('a', 1))
    await cache.preview(board('a', 2))
    expect(loads).toHaveBeenCalledTimes(2)
    expect(draws).toHaveBeenCalledTimes(2)
    expect(cache.peek(board('a', 1))).toBeUndefined()
    expect(cache.size()).toBe(1)
  })

  it('holds no more than its capacity, dropping the least recently used revision', async () => {
    const { cache } = gallery({ capacity: 2 })
    await cache.preview(board('a', 1))
    await cache.preview(board('b', 1))
    await cache.preview(board('a', 1))
    await cache.preview(board('c', 1))
    expect(cache.size()).toBe(2)
    expect(cache.peek(board('b', 1))).toBeUndefined()
    expect(cache.peek(board('a', 1))).toBeDefined()
    expect(cache.peek(board('c', 1))).toBeDefined()
  })

  it('shares one generation between callers that ask for the same revision', async () => {
    let resolveLoad: (source: string) => void = () => {}
    const load = vi.fn(() => new Promise<string>(resolve => { resolveLoad = resolve }))
    const { cache, draws } = gallery({ load })
    const subject = board('a', 1)
    const first = cache.preview(subject)
    const second = cache.preview(subject)
    expect(second).toBe(first)
    resolveLoad('<mxGraphModel />')
    await Promise.all([first, second])
    expect(load).toHaveBeenCalledTimes(1)
    expect(draws).toHaveBeenCalledTimes(1)
  })

  it('draws one at a time and hands the event loop back before each drawing', async () => {
    const events: string[] = []
    let drawing = 0
    let peak = 0
    const cache = createBoardPreviewCache({
      capacity: 4,
      load: async id => id,
      render: source => {
        drawing += 1
        peak = Math.max(peak, drawing)
        events.push(`draw:${source}`)
        drawing -= 1
        return source
      },
      yieldToMainThread: async () => { events.push('yield') },
    })
    await Promise.all([
      cache.preview(board('a', 1)),
      cache.preview(board('b', 1)),
      cache.preview(board('c', 1)),
    ])
    expect(peak).toBe(1)
    expect(events).toEqual(['yield', 'draw:a', 'yield', 'draw:b', 'yield', 'draw:c'])
  })

  it('remembers an empty board, which is different from an uncached one', async () => {
    const { cache, loads } = gallery({ load: async () => null })
    const subject = board('empty', 1)
    expect(await cache.preview(subject)).toBeNull()
    expect(await cache.preview(subject)).toBeNull()
    expect(loads).toHaveBeenCalledTimes(1)
    expect(cache.peek(subject)).toBeNull()
    expect(cache.peek(board('missing', 1))).toBeUndefined()
  })

  it('does not cache a failed read, so the next attempt retries', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('<mxGraphModel />')
    const { cache } = gallery({ load })
    const subject = board('a', 1)
    await expect(cache.preview(subject)).rejects.toThrow('offline')
    expect(await cache.preview(subject)).toBe(`data:image/svg+xml,${encodeURIComponent('<mxGraphModel />')}`)
    expect(load).toHaveBeenCalledTimes(2)
  })
})
