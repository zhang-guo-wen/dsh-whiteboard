# dsh-whiteboard

Independent DeepSeek Harness plugin. The browser proposes an editable timestamp-based name, then the host creates the `.drawio` file under this plugin's `files/` directory only after confirmation. The browser previews the first page in each card and opens files in a dedicated session through `@guowenzhang/dsh-drawioedit`; drawioedit owns autosaving. Keep visible copy in `src/client/locales.ts`. Install with `npm ci --legacy-peer-deps` because the published drawioedit peer tree conflicts with the current DSH dev dependencies. Rebuild the tracked `lib/` after source changes; run `npm run typecheck`, `npm test`, and `npm run build`.

## Client bundle

`build-client.mjs` emits more than one artifact. The entry `lib/client.js` carries React and the gallery; the draw.io renderer sits behind the source's own `import()` in `src/client/preview-renderer.ts` and lands in `lib/client.board-preview.js`. Both are tracked: commit them together. The Client module loader serves a package-local chunk only through a factory's `require.async`, so the build rewrites rolldown's deferred `require()` into that call and fails the build when the expected expression is missing. Do not add a second static path to `board-preview.ts`, and do not import it from the entry directly — that would pull the graphics library back into `lib/client.js` and reintroduce a synchronous relative `require("./client*.js")`, which the loader cannot answer.

The preview store in `src/client/board-preview-cache.ts` keeps one instance per plugin fiber, keyed by board id plus `updatedAt`, and draws one board at a time with an event-loop yield between drawings. `WhiteboardPanel` is a pure consumer: it takes `previewImage` and `cachedPreviewImage` from the inject face and must keep the rows mounted while a refresh is in flight.

## Tests

`jsdom`, `react-dom` and `@testing-library/react` are dev-only, for the component specs; they are not part of the published bundle. A jsdom spec opts in with `// @vitest-environment jsdom` on its first line. Node-side specs and the panel store remain the bulk of the suite, and `tests/plugin-metadata.test.mjs` runs through `npm run test:metadata` rather than Vitest.
