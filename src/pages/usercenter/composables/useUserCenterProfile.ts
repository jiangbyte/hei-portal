/** Author: Charlie */

export function mapNames(items?: { id: string; name: string }[]) {
  return (items ?? [])
    .map((item) => item.name)
    .filter(Boolean)
    .join(' / ')
}

export function displayValue(value?: unknown) {
  const text = String(value ?? '').trim()
  return text || '未设置'
}
