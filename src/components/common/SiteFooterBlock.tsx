/** Author: Charlie */

import type { ReactNode } from 'react'
import { externalHref, type SiteFooterInfo } from '@/utils/siteFooter'

type Props = {
  footer: SiteFooterInfo
  compact?: boolean
  className?: string
}

export function SiteFooterBlock({ footer, compact = false, className = '' }: Props) {
  const copyrightHref = externalHref(footer.copyrightUrl)
  const icpHref = externalHref(footer.icpUrl)
  const psbHref = externalHref(footer.psbUrl)

  const parts: ReactNode[] = []

  if (footer.copyrightText) {
    parts.push(
      copyrightHref ? (
        <a
          key="copyright"
          className="site-footer-block__link"
          href={copyrightHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {footer.copyrightText}
        </a>
      ) : (
        <span key="copyright" className="site-footer-block__text">
          {footer.copyrightText}
        </span>
      ),
    )
  }

  if (footer.icpNumber) {
    if (parts.length) parts.push(<span key="sep-icp" className="site-footer-block__sep">·</span>)
    parts.push(
      icpHref ? (
        <a
          key="icp"
          className="site-footer-block__link"
          href={icpHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {footer.icpNumber}
        </a>
      ) : (
        <span key="icp" className="site-footer-block__text">
          {footer.icpNumber}
        </span>
      ),
    )
  }

  if (footer.psbNumber) {
    if (parts.length) parts.push(<span key="sep-psb" className="site-footer-block__sep">·</span>)
    parts.push(
      psbHref ? (
        <a
          key="psb"
          className="site-footer-block__link"
          href={psbHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {footer.psbNumber}
        </a>
      ) : (
        <span key="psb" className="site-footer-block__text">
          {footer.psbNumber}
        </span>
      ),
    )
  }

  if (!parts.length) return null

  return (
    <div
      className={`site-footer-block${compact ? ' site-footer-block--compact' : ''}${className ? ` ${className}` : ''}`}
    >
      {parts}
    </div>
  )
}
