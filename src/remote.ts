import type { InvocationDescriptor, TypertCodec, TypertRemoteContribution, TypertSchema } from '@deepseek-ai/dsh-typert-protocol'

export const REMOTE_NAMESPACE = 'whiteboard'
const passthrough: TypertSchema<unknown> = { parse: value => value }
function codec(typeSymbol: string): TypertCodec {
  return { mode: 'strict', typeSymbol, schema: passthrough, create: () => passthrough } as TypertCodec
}
function descriptor(method: string): InvocationDescriptor {
  const owner = `@guowenzhang/dsh-whiteboard#${REMOTE_NAMESPACE}/${method}`
  return {
    id: owner, service: REMOTE_NAMESPACE, namespace: REMOTE_NAMESPACE, method,
    invocation: { kind: 'direct' },
    parameters: method === 'listBoards' ? []
      : [{ name: 'request', wire: 'request', source: 'json', codec: codec(`${owner}:request`) }],
    result: codec(`${owner}:result`),
  }
}
export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: '@guowenzhang/dsh-whiteboard',
  descriptors: ['listBoards', 'createBoard', 'previewBoard', 'deleteBoard', 'grantBoardSession'].map(descriptor),
}
