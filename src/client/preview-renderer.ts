/**
 * The one entry point to the draw.io renderer.
 *
 * The graphics library behind a preview is the bulk of this plugin's client
 * bundle, so the gallery entry reaches it only through this dynamic import:
 * the build emits it as a separate `client.board-preview.js` chunk that the
 * module loader fetches when the first card actually needs a picture. Reading
 * the source file and parsing its XML cannot be separated from the drawing
 * today — the same module hosts both — but the drawing stays on the main
 * thread, because it builds SVG through the DOM.
 */

/** Draw one board source into a self-contained image URL. */
export async function renderBoardPreviewLazily(source: string): Promise<string | null> {
  const { renderBoardPreview } = await import('./board-preview.ts')
  return renderBoardPreview(source)
}
