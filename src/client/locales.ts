export const NS = 'whiteboard'
export const zh = {
  nav: '白板', title: '白板', subtitle: '整理想法、流程和草图。',
  add: '新建白板',
  createTitle: '新建白板', createHint: '确认后创建文件，并在 draw.io 中打开。',
  nameLabel: '白板名称', defaultNamePrefix: '白板', cancel: '取消', confirmCreate: '确认创建', creating: '正在创建…',
  nameExists: '同名白板已存在，请修改名称。', invalidName: '名称不能包含文件路径或无效字符。',
  empty: '还没有白板', emptyHint: '创建一块白板，开始绘制。', loading: '正在加载白板…',
  refresh: '刷新', open: '打开白板', modified: '最近修改', error: '操作失败', retry: '重试',
  search: '搜索白板', clearSearch: '清空搜索', searchPlaceholder: '搜索白板名称…',
  searchNoResults: '没有匹配的白板', searchNoResultsHint: '换一个关键词，或清空搜索查看全部白板。',
  previewLoading: '正在生成预览…', previewEmpty: '空白白板', previewUnavailable: '无法预览',
  delete: '删除白板', deleteTitle: '删除白板', deleteHint: '确定删除这块白板吗？删除后无法恢复：',
  confirmDelete: '删除', deleting: '正在删除…', changed: '白板已被修改，请刷新后重试。',
  editorMissing: '请先安装并启用 dsh-drawioedit 插件。',
} satisfies Record<string, string>
export type WhiteboardKey = keyof typeof zh
export const en: Record<WhiteboardKey, string> = {
  nav: 'Whiteboards', title: 'Whiteboards', subtitle: 'Map ideas, flows, and sketches.',
  add: 'New whiteboard',
  createTitle: 'New whiteboard', createHint: 'Confirm to create the file and open it in draw.io.',
  nameLabel: 'Whiteboard name', defaultNamePrefix: 'Whiteboard', cancel: 'Cancel', confirmCreate: 'Create', creating: 'Creating…',
  nameExists: 'A whiteboard with this name already exists.', invalidName: 'The name contains invalid filename characters.',
  empty: 'No whiteboards yet', emptyHint: 'Create a whiteboard to start drawing.', loading: 'Loading whiteboards…',
  refresh: 'Refresh', open: 'Open whiteboard', modified: 'Last edited', error: 'Operation failed', retry: 'Retry',
  search: 'Search whiteboards', clearSearch: 'Clear search', searchPlaceholder: 'Search whiteboard names…',
  searchNoResults: 'No matching whiteboards', searchNoResultsHint: 'Try another keyword, or clear the search to see all whiteboards.',
  previewLoading: 'Generating preview…', previewEmpty: 'Blank whiteboard', previewUnavailable: 'Preview unavailable',
  delete: 'Delete whiteboard', deleteTitle: 'Delete whiteboard', deleteHint: 'Delete this whiteboard permanently?',
  confirmDelete: 'Delete', deleting: 'Deleting…', changed: 'This whiteboard changed. Refresh and try again.',
  editorMissing: 'Install and enable the dsh-drawioedit plugin first.',
}
