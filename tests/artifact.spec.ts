import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import * as React from 'react'
import * as JSX from 'react/jsx-runtime'

describe('browser handoff artifact', () => {
  it('loads with only the browser React modules', async () => {
    const code = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    let handoff: { id: string; factory: (require: (id: string) => unknown) => { apply?: unknown } } | undefined
    const sandbox: { window?: { __ModuleLoader__: { load: (item: typeof handoff) => void } }; navigator: { userAgent: string } } = {
      navigator: { userAgent: '' },
      window: { __ModuleLoader__: { load: (item: typeof handoff) => { handoff = item } } },
    }
    runInNewContext(code, sandbox)
    expect(handoff?.id).toBe('@guowenzhang/dsh-whiteboard')
    // The handoff factory only needs browser globals when it actually renders.
    delete sandbox.window
    const exports = handoff!.factory(id => {
      if (id === 'react') return React
      if (id === 'react/jsx-runtime') return JSX
      throw new Error(`Unexpected browser dependency: ${id}`)
    })
    expect(typeof exports.apply).toBe('function')
  })
})
