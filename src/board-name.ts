/** Default filename stem shown before a whiteboard is created. */
export function timestampName(date: Date, prefix: string): string {
  const part = (value: number, width = 2) => String(value).padStart(width, '0')
  return `${prefix}-${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`
    + `_${part(date.getHours())}-${part(date.getMinutes())}-${part(date.getSeconds())}-${part(date.getMilliseconds(), 3)}`
}

/** Validate a single filename stem. The extension is managed by the plugin. */
export function normalizeBoardName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('WHITEBOARD_INVALID_NAME')
  const name = value.trim().replace(/\.drawio$/iu, '')
  if (!name || name.length > 100 || /[<>:"/\\|?*\x00-\x1f]/u.test(name)
    || /[. ]$/u.test(name) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu.test(name)) {
    throw new Error('WHITEBOARD_INVALID_NAME')
  }
  return name
}
