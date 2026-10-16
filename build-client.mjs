// build-client.mjs — bundle src/client into the DSH client-loader handoff format.
// window.__ModuleLoader__.load({ id, chunk?, factory }). React external; browser-safe utilities bundled.
// CSS modules compiled with lightningcss; `.module.css` -> hashed class map + <style> inject.
//
// The entry stays small and self-contained: the draw.io renderer is behind the
// source's own `import()` in preview-renderer.ts, which rolldown emits as the
// sibling chunk `client.board-preview.js`. The Client module loader serves
// package-local chunks through a factory's `require.async`, so the compiler's
// deferred `require()` is rewritten to that operation; a synchronous relative
// `require("./client*.js")` would be a runtime miss, and the entry must not keep
// one.
import { rolldown } from 'rolldown'
import { transform } from 'lightningcss'
import { readdir, readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
// Protocol identity: this must stay equal to package.json `name`. The Host
// cache-busts changed client artifacts with their content revision.
const HANDOFF_ID = '@guowenzhang/dsh-whiteboard'
const VIRT = '\0dsh-css:'
const SUFFIX = '.mjs'

/** One package-local chunk, in the shape the module loader accepts. */
const CHUNK_FILE = /^client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js$/

const footer = 'return module.exports; } });'
const intro = 'var module = { exports: {} }; var exports = module.exports;'

function registration(fileName, isEntry) {
  const chunk = isEntry ? '' : `chunk: ${JSON.stringify(fileName)}, `
  return `window.__ModuleLoader__.load({ id: ${JSON.stringify(HANDOFF_ID)}, ${chunk}factory: (require) => {`
}

const cssModulePlugin = {
  name: 'dsh-css-modules-inline',
  resolveId(source, importer) {
    if (!source.endsWith('.module.css')) return null
    const abs = importer ? join(dirname(importer), source) : source
    return VIRT + abs + SUFFIX
  },
  async load(id) {
    if (!id.startsWith(VIRT)) return null
    const fileId = id.slice(VIRT.length, -SUFFIX.length)
    this.addWatchFile?.(fileId)
    const css = await readFile(fileId)
    const { code, exports: cssExports } = transform({
      filename: fileId,
      code: css,
      cssModules: { pattern: '[hash]_[local]' },
      minify: true,
    })
    const classMap = {}
    // lightningcss's `exports` object carries no stable key order, so an
    // unsorted walk emits the same entries in a different sequence on every
    // build: behaviourally identical, but a different byte-for-byte artifact
    // and a spurious diff in the committed lib/. Sort the local names.
    for (const local of Object.keys(cssExports ?? {}).sort()) {
      classMap[local] = cssExports[local].name
    }
    const cssText = String(code)
    const tagId = HANDOFF_ID + '/' + fileId.split(/[\\/]/).pop()
    return [
      'const css = ' + JSON.stringify(cssText) + ';',
      'const tagId = ' + JSON.stringify(tagId) + ';',
      "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
      "  const tag = document.createElement('style');",
      '  tag.dataset.pluginCss = tagId;',
      '  tag.textContent = css;',
      '  document.head.appendChild(tag);',
      '}',
      'export default ' + JSON.stringify(classMap) + ';',
    ].join('\n')
  },
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Route package-local dynamic chunks through the loader's asynchronous require.
 * Rolldown renders `import('./x.ts')` in CJS output as a deferred synchronous
 * `require`, which resolves nothing: a chunk is a separate script the loader has
 * to fetch first, and only the factory's `require.async` does that.
 */
function asyncChunkRequirePlugin() {
  return {
    name: 'dsh-client-async-chunk-require',
    renderChunk(code, chunk, outputOptions) {
      if (outputOptions.format !== 'cjs') return null
      const replacements = []
      for (const dynamicImport of chunk.dynamicImports) {
        const fileName = dynamicImport.startsWith('./') ? dynamicImport.slice(2) : dynamicImport
        if (!CHUNK_FILE.test(fileName)) continue
        const specifier = `./${fileName}`
        const deferred = new RegExp(
          `Promise\\.resolve\\(\\)\\.then\\(\\(\\)\\s*=>\\s*require\\((['"])${escapeRegExp(specifier)}\\1\\)\\)`,
          'gu',
        )
        const matches = [...code.matchAll(deferred)]
        if (matches.length === 0) {
          throw new Error(`client bundle compiler: dynamic chunk ${JSON.stringify(specifier)} has no generated import expression`)
        }
        for (const match of matches) {
          replacements.push({ at: match.index, length: match[0].length, call: `require.async(${JSON.stringify(specifier)})` })
        }
      }
      if (replacements.length === 0) return null
      let next = ''
      let cursor = 0
      for (const replacement of replacements.sort((left, right) => left.at - right.at)) {
        next += code.slice(cursor, replacement.at) + replacement.call
        cursor = replacement.at + replacement.length
      }
      return next + code.slice(cursor)
    },
  }
}

const lib = join(root, 'lib')
const bundle = await rolldown({
  input: { client: join(root, 'src', 'client', 'index.tsx') },
  platform: 'browser',
  external: [/^react$/, /^react\//],
  plugins: [cssModulePlugin, asyncChunkRequirePlugin()],
})
const written = await bundle.write({
  format: 'cjs',
  dir: lib,
  entryFileNames: 'client.js',
  // The imported source basename becomes the published chunk name, so the
  // `files` entry for `lib` already ships it.
  chunkFileNames: 'client.[name].js',
  banner: chunk => registration(chunk.fileName, chunk.isEntry),
  footer,
  intro,
  sourcemap: false,
})
// Entry and every chunk are rewritten by the same run, so stale outputs are
// swept only after a successful write: a failed build leaves the tracked
// artifacts it did not replace exactly as they were.
const emitted = new Set(written.output.map(output => output.fileName))
for (const entry of await readdir(lib).catch(() => [])) {
  if (!/^client(\.[^/]+)?\.js$/.test(entry) || emitted.has(entry)) continue
  await rm(join(lib, entry), { force: true })
}
console.log(`lib/${[...emitted].sort().join(', lib/')} written (ModuleLoader handoff bundle)`)
