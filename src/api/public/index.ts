/** Author: Charlie */

import { API_ROOT, API_VERSION } from '@/constants/api'
import { http } from '@/utils'

const publicPrefix = `${API_ROOT}/${API_VERSION}/public`

/** 站点页脚：版权与备案（Admin / Portal 共用）。 */
export function siteFooter() {
  return http.get<any>(`${publicPrefix}/site-footer`, { public: true })
}
