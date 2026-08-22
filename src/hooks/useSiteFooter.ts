/** Author: Charlie */

import { useEffect, useState } from 'react'
import { publicApi } from '@/api'
import {
  emptySiteFooter,
  hasSiteFooterContent,
  parseSiteFooter,
  type SiteFooterInfo,
} from '@/utils/siteFooter'

let cachedFooter: SiteFooterInfo | null = null
let pending: Promise<SiteFooterInfo> | null = null

async function loadSiteFooter(): Promise<SiteFooterInfo> {
  if (cachedFooter) return cachedFooter
  if (pending) return pending
  pending = publicApi
    .siteFooter()
    .then((res) => {
      cachedFooter = parseSiteFooter(res?.data)
      return cachedFooter
    })
    .catch(() => emptySiteFooter())
    .finally(() => {
      pending = null
    })
  return pending
}

/** 拉取站点页脚（版权 + 备案），模块内缓存。 */
export function useSiteFooter() {
  const brand = import.meta.env.VITE_APP_TITLE || 'HEI'
  const fallback = import.meta.env.VITE_COPYRIGHT_INFO || `© ${new Date().getFullYear()} ${brand}`
  const [footer, setFooter] = useState<SiteFooterInfo>(() => ({
    ...emptySiteFooter(),
    copyrightText: fallback,
  }))

  useEffect(() => {
    let active = true
    void loadSiteFooter().then((data) => {
      if (!active) return
      if (hasSiteFooterContent(data)) {
        setFooter(data)
      }
    })
    return () => {
      active = false
    }
  }, [fallback])

  return footer
}
