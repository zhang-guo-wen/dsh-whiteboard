/**
 * Cross-mount preview store for the whiteboard gallery.
 *
 * A rendered image is addressed by board id plus `updatedAt`: remounting the
 * same revision reuses the image instead of regenerating it, a revision bump
 * discards the old one, and the oldest entry leaves once the capacity is
 * reached. Only one render runs at a time and the event loop is handed back
 * between renders, so a screen of visible cards becomes several short tasks
 * instead of one long one. Rendering itself stays on the main thread: it draws
 * SVG through the DOM, which a worker cannot reach.
 */

/** A self-contained image URL, or `null` when the board has nothing to draw. */
export type BoardPreviewImage = string | null

/** The board fields that decide whether a cached image is still current. */
export interface BoardPreviewSubject {
  id: string
  updatedAt: number
}

export interface BoardPreviewCacheOptions {
  /** Rendered images kept across mounts. */
  capacity: number
  /** Read the board source; `null` means the Host has no such board. */
  load: (id: string) => Promise<string | null>
  /** Draw one source into an image URL; may resolve the renderer on first use. */
  render: (source: string) => BoardPreviewImage | Promise<BoardPreviewImage>
  /** Hand the event loop back between renders. */
  yieldToMainThread?: () => Promise<void>
}

export interface BoardPreviewCache {
  /** The image cached for this revision, without starting any work. */
  peek: (subject: BoardPreviewSubject) => BoardPreviewImage | undefined
  /** The cached image, or one generation shared by every caller of this revision. */
  preview: (subject: BoardPreviewSubject) => Promise<BoardPreviewImage>
  /** Cached images held right now; the capacity contract is observable through it. */
  size: () => number
}

const KEY_SEPARATOR = '\u0000'

/** Cache identity of one board revision. */
export function boardPreviewKey(subject: BoardPreviewSubject): string {
  return `${subject.id}${KEY_SEPARATOR}${subject.updatedAt}`
}

/** Hand the event loop back, so consecutive renders land in separate tasks. */
export function yieldToMainThread(): Promise<void> {
  return new Promise<void>(resolve => { setTimeout(resolve, 0) })
}

/** Create the gallery-wide preview store; one instance lives as long as the plugin. */
export function createBoardPreviewCache(options: BoardPreviewCacheOptions): BoardPreviewCache {
  const { capacity, load, render } = options
  const release = options.yieldToMainThread ?? yieldToMainThread
  const images = new Map<string, BoardPreviewImage>()
  const pending = new Map<string, Promise<BoardPreviewImage>>()
  // Renders are serialized: two drawings never share one main-thread task, and
  // neither do they share one task with the yield that precedes them.
  let renderQueue: Promise<void> = Promise.resolve()

  const idOf = (key: string): string => key.slice(0, key.indexOf(KEY_SEPARATOR))

  /** Newest first in iteration order: re-inserting a key refreshes its age. */
  const read = (key: string): BoardPreviewImage | undefined => {
    const image = images.get(key)
    if (image === undefined) return undefined
    images.delete(key)
    images.set(key, image)
    return image
  }

  const remember = (key: string, image: BoardPreviewImage): void => {
    // Only the newest revision of a board can be asked for again, so keeping an
    // older one would hold memory the gallery can never show.
    const id = idOf(key)
    for (const known of [...images.keys()]) {
      if (known !== key && idOf(known) === id) images.delete(known)
    }
    images.delete(key)
    images.set(key, image)
    while (images.size > capacity) {
      const oldest = images.keys().next()
      if (oldest.done) break
      images.delete(oldest.value)
    }
  }

  const drawInTurn = (source: string): Promise<BoardPreviewImage> => {
    const drawn = renderQueue.then(async () => {
      await release()
      return await render(source)
    })
    // A failed render must not stall the cards queued behind it.
    renderQueue = drawn.then(() => undefined, () => undefined)
    return drawn
  }

  const preview = (subject: BoardPreviewSubject): Promise<BoardPreviewImage> => {
    const key = boardPreviewKey(subject)
    const cached = read(key)
    if (cached !== undefined) return Promise.resolve(cached)
    const running = pending.get(key)
    if (running !== undefined) return running
    const started = (async (): Promise<BoardPreviewImage> => {
      const source = await load(subject.id)
      const image = source === null ? null : await drawInTurn(source)
      remember(key, image)
      return image
    })().finally(() => { pending.delete(key) })
    pending.set(key, started)
    return started
  }

  return {
    peek: subject => read(boardPreviewKey(subject)),
    preview,
    size: () => images.size,
  }
}
