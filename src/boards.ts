import { lstat, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { normalizeBoardName } from './board-name.ts'
import type { BoardRecord } from './types.ts'

export const BLANK_BOARD = '<mxGraphModel dx="900" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'
export const MAX_PREVIEW_BYTES = 4 * 1024 * 1024

function titleOf(name: string): string { return name.slice(0, -'.drawio'.length) }
function boardId(value: unknown): string {
  if (typeof value !== 'string' || !value.toLowerCase().endsWith('.drawio')
    || value.length <= '.drawio'.length || value.length > 255
    || /[<>:"/\\|?*\x00-\x1f]/u.test(value)) throw new Error('WHITEBOARD_INVALID_ID')
  return value
}

export class BoardStore {
  constructor(readonly directory: string) {}

  async list(): Promise<BoardRecord[]> {
    await mkdir(this.directory, { recursive: true })
    const entries = await readdir(this.directory, { withFileTypes: true })
    const files = entries.filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.drawio'))
    const records = await Promise.all(files.map(async entry => {
      const info = await stat(join(this.directory, entry.name))
      let title = titleOf(entry.name)
      // Keep displaying names stored by the previous whiteboard implementation.
      if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.drawio$/iu.test(entry.name)) {
        try {
          const metadata: unknown = JSON.parse(await readFile(join(this.directory, `${title}.json`), 'utf8'))
          if (typeof metadata === 'object' && metadata !== null && typeof (metadata as { title?: unknown }).title === 'string') {
            title = (metadata as { title: string }).title
          }
        } catch { /* legacy sidecar is optional */ }
      }
      return { id: entry.name, title, path: join(this.directory, entry.name), directory: this.directory, updatedAt: info.mtimeMs }
    }))
    return records.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
  }

  async create(value: unknown): Promise<BoardRecord> {
    await mkdir(this.directory, { recursive: true })
    const name = `${normalizeBoardName(value)}.drawio`
    const path = join(this.directory, name)
    try { await writeFile(path, BLANK_BOARD, { flag: 'wx' }) }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('WHITEBOARD_NAME_EXISTS')
      throw error
    }
    const info = await stat(path)
    return { id: name, title: titleOf(name), path, directory: this.directory, updatedAt: info.mtimeMs }
  }

  async preview(value: unknown): Promise<string | null> {
    const path = join(this.directory, boardId(value))
    const info = await lstat(path)
    if (!info.isFile()) throw new Error('WHITEBOARD_INVALID_ID')
    if (info.size > MAX_PREVIEW_BYTES) return null
    return readFile(path, 'utf8')
  }

  async delete(value: unknown, expectedUpdatedAt: unknown): Promise<void> {
    const id = boardId(value)
    const path = join(this.directory, id)
    const info = await lstat(path)
    if (!info.isFile()) throw new Error('WHITEBOARD_INVALID_ID')
    if (typeof expectedUpdatedAt !== 'number' || info.mtimeMs !== expectedUpdatedAt) {
      throw new Error('WHITEBOARD_MODIFIED')
    }
    await unlink(path)
    if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.drawio$/iu.test(id)) {
      try { await unlink(join(this.directory, `${titleOf(id)}.json`)) }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    }
  }
}
