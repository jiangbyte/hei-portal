/** Author: Charlie */

type SearchValueNormalizer<T extends object> = Partial<{
  [K in keyof T]: (value: T[K]) => T[K]
}>

export function normalizeSearchValues<T extends object>(
  values: T,
  normalizers: SearchValueNormalizer<T> = {},
) {
  const result = {} as Partial<T>

  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return
    }

    const field = key as keyof T
    const normalizeValue = normalizers[field]
    const normalizedValue = normalizeValue
      ? normalizeValue(value as T[typeof field])
      : (value as T[typeof field])
    result[field] = normalizedValue
  })

  return result
}

export function toNullableString(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  const text = String(value).trim()
  return text || null
}

export function displayValue(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '-' : String(value)
}

/** 列表摘要：去 HTML/多余空白后截断 */
export function plainTextExcerpt(content: unknown, maxLength = 96): string {
  if (content === undefined || content === null) return ''
  const text = String(content)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}
