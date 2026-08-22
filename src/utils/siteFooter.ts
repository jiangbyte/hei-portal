/** Author: Charlie */

export type SiteFooterInfo = {
  copyrightText: string
  copyrightUrl: string
  icpNumber: string
  icpUrl: string
  psbNumber: string
  psbUrl: string
}

export const emptySiteFooter = (): SiteFooterInfo => ({
  copyrightText: '',
  copyrightUrl: '',
  icpNumber: '',
  icpUrl: '',
  psbNumber: '',
  psbUrl: '',
})

export function externalHref(url: string): string {
  const value = (url || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export function parseSiteFooter(data: Record<string, unknown> | null | undefined): SiteFooterInfo {
  if (!data) return emptySiteFooter()
  const nested = (data.site_footer ?? data.siteFooter) as Record<string, unknown> | undefined
  const source = nested && typeof nested === 'object' ? nested : data
  return {
    copyrightText: String(source.copyright_text ?? source.copyrightText ?? '').trim(),
    copyrightUrl: String(source.copyright_url ?? source.copyrightUrl ?? '').trim(),
    icpNumber: String(source.icp_number ?? source.icpNumber ?? '').trim(),
    icpUrl: String(source.icp_url ?? source.icpUrl ?? '').trim(),
    psbNumber: String(source.psb_number ?? source.psbNumber ?? '').trim(),
    psbUrl: String(source.psb_url ?? source.psbUrl ?? '').trim(),
  }
}

export function hasSiteFooterContent(footer: SiteFooterInfo): boolean {
  return Boolean(footer.copyrightText || footer.icpNumber || footer.psbNumber)
}
