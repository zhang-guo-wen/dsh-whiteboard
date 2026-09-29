import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BLANK_BOARD, BoardStore, MAX_PREVIEW_BYTES } from '../src/boards.ts'
import { normalizeBoardName, timestampName } from '../src/board-name.ts'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

async function fixture(): Promise<BoardStore> {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-whiteboard-'))
  directories.push(directory)
  return new BoardStore(directory)
}

describe('plugin-owned whiteboards', () => {
  it('creates only the confirmed filename and lists the file', async () => {
    const store = await fixture()
    const suggested = timestampName(new Date(2026, 8, 29, 18, 15, 3, 7), '白板')
    expect(suggested).toBe('白板-2026-09-29_18-15-03-007')
    const board = await store.create('系统架构')
    expect(board.id).toBe('系统架构.drawio')
    expect(await readdir(store.directory)).toEqual([board.id])
    expect(await readFile(board.path, 'utf8')).toBe(BLANK_BOARD)
    await rename(board.path, join(store.directory, '系统架构.drawio'))
    expect((await store.list()).map(row => row.title)).toEqual(['系统架构'])
  })

  it('rejects duplicate and unsafe names without replacing files', async () => {
    const store = await fixture()
    const board = await store.create('系统架构')
    await expect(store.create('系统架构.drawio')).rejects.toThrow('WHITEBOARD_NAME_EXISTS')
    await expect(store.create('../outside')).rejects.toThrow('WHITEBOARD_INVALID_NAME')
    await expect(store.create('CON')).rejects.toThrow('WHITEBOARD_INVALID_NAME')
    expect(() => normalizeBoardName(' 白板.drawio ')).not.toThrow()
    expect(await readFile(board.path, 'utf8')).toBe(BLANK_BOARD)
    expect(await readdir(store.directory)).toEqual([board.id])
  })

  it('preserves and displays legacy diagrams with sidecar names', async () => {
    const store = await fixture()
    await writeFile(join(store.directory, 'old.drawio'), BLANK_BOARD)
    const id = '8e189224-40c0-41ab-b6be-49d238bc5b94'
    await writeFile(join(store.directory, `${id}.drawio`), BLANK_BOARD)
    await writeFile(join(store.directory, `${id}.json`), JSON.stringify({ id, title: '系统' }))
    expect((await store.list()).map(row => row.title)).toContain('系统')
    expect((await store.list()).map(row => row.title)).toContain('old')
  })

  it('loads existing diagram content and deletes only the selected current file', async () => {
    const store = await fixture()
    const first = await store.create('第一块')
    const second = await store.create('第二块')
    expect(await store.preview(first.id)).toBe(BLANK_BOARD)
    await expect(store.preview('../outside.drawio')).rejects.toThrow('WHITEBOARD_INVALID_ID')
    await expect(store.delete(first.id, first.updatedAt + 1)).rejects.toThrow('WHITEBOARD_MODIFIED')
    await store.delete(first.id, first.updatedAt)
    expect(await readdir(store.directory)).toEqual([second.id])
    expect(await readFile(second.path, 'utf8')).toBe(BLANK_BOARD)
  })

  it('removes a legacy sidecar with its diagram', async () => {
    const store = await fixture()
    const id = '8e189224-40c0-41ab-b6be-49d238bc5b94'
    await writeFile(join(store.directory, `${id}.drawio`), BLANK_BOARD)
    await writeFile(join(store.directory, `${id}.json`), JSON.stringify({ title: '系统' }))
    const board = (await store.list())[0]!
    await store.delete(board.id, board.updatedAt)
    expect(await readdir(store.directory)).toEqual([])
  })

  it('does not load oversized diagrams into the card gallery', async () => {
    const store = await fixture()
    await writeFile(join(store.directory, 'large.drawio'), Buffer.alloc(MAX_PREVIEW_BYTES + 1))
    expect(await store.preview('large.drawio')).toBeNull()
  })
})
