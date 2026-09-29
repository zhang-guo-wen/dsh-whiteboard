import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { TYPERT_REMOTE } from '../src/remote.ts'

describe('whiteboard RPC contract', () => {
  it('uses the same argument field in the client descriptor and built host methods', async () => {
    const host = await readFile(new URL('../lib/index.mjs', import.meta.url), 'utf8')
    for (const endpoint of TYPERT_REMOTE.descriptors) {
      const signature = host.match(new RegExp(`async ${endpoint.method}\\(([^)]*)\\)`))
      expect(signature, endpoint.method).not.toBeNull()
      const names = signature![1]!.split(',').map(name => name.trim()).filter(Boolean)
      expect(names, endpoint.method).toEqual(endpoint.parameters.map(parameter => parameter.wire))
    }
  })
})
