import { Graph, ModelXmlSerializer, Stylesheet } from '@maxgraph/core'
import { inflateSync, strFromU8 } from 'fflate'

const PADDING = 12
const MAX_XML_LENGTH = 8 * 1024 * 1024

function modelXml(source: string): string {
  const document = new DOMParser().parseFromString(source, 'application/xml')
  if (document.querySelector('parsererror')) throw new Error('Invalid draw.io XML')
  const root = document.documentElement
  if (root.localName === 'mxGraphModel') return new XMLSerializer().serializeToString(root)
  if (root.localName !== 'mxfile') throw new Error('Invalid draw.io file')
  const diagram = root.querySelector('diagram')
  if (!diagram) throw new Error('Draw.io file has no page')
  const model = diagram.querySelector('mxGraphModel')
  if (model) return new XMLSerializer().serializeToString(model)
  const payload = diagram.textContent?.trim() ?? ''
  if (!/^[A-Za-z\d+/]+={0,2}$/u.test(payload)) throw new Error('Invalid draw.io page')
  const bytes = Uint8Array.from(atob(payload), character => character.charCodeAt(0))
  const escaped = strFromU8(inflateSync(bytes), true)
  let xml: string
  try { xml = decodeURIComponent(escaped) }
  catch { xml = escaped }
  if (xml.length > MAX_XML_LENGTH) throw new Error('Draw.io page is too large to preview')
  return modelXml(xml)
}

function stylesheet(): Stylesheet {
  const sheet = new Stylesheet()
  const vertex = sheet.getDefaultVertexStyle()
  vertex.fillColor = '#dae8fc'
  vertex.strokeColor = '#6c8ebf'
  vertex.fontColor = '#333333'
  vertex.fontSize = 12
  sheet.putDefaultVertexStyle(vertex)
  const edge = sheet.getDefaultEdgeStyle()
  edge.strokeColor = '#6c8ebf'
  edge.fontColor = '#333333'
  edge.fontSize = 11
  edge.endArrow = 'block'
  sheet.putDefaultEdgeStyle(edge)
  return sheet
}

/** Render the first page to a self-contained image URL; an empty board has no image. */
export function renderBoardPreview(source: string): string | null {
  const xml = modelXml(source)
  const model = new DOMParser().parseFromString(xml, 'application/xml')
  if (!model.querySelector('mxCell[vertex], mxCell[edge]')) return null
  const container = document.createElement('div')
  document.body.appendChild(container)
  let graph: Graph | undefined
  try {
    graph = new Graph(container, undefined, undefined, stylesheet())
    graph.setEnabled(false)
    new ModelXmlSerializer(graph.getDataModel()).import(xml)
    graph.getView().validate()
    graph.refresh()
    const svg = container.querySelector('svg')
    if (!svg) throw new Error('Diagram renderer produced no image')
    const bounds = graph.getView().getGraphBounds()
    const width = Math.max(1, Math.ceil(bounds.width + PADDING * 2))
    const height = Math.max(1, Math.ceil(bounds.height + PADDING * 2))
    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(height))
    svg.setAttribute('viewBox', `${bounds.x - PADDING} ${bounds.y - PADDING} ${width} ${height}`)
    svg.removeAttribute('style')
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
  } finally {
    graph?.destroy()
    container.remove()
  }
}
