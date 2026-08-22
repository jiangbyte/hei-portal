/** Author: Charlie */

import { API_PREFIX } from '@/constants/api'
import { http } from '@/utils'

const prefix = `${API_PREFIX}/sys/audit`

/** 当前登录用户本人审计分页。 */
export function myPage(params?: {
  current?: number
  size?: number
  module?: string
  action?: string
  exclude_action?: string
  success?: boolean
}) {
  return http.get<any>(`${prefix}/my-page`, { params })
}

export function myDetail(id: string) {
  return http.get<any>(`${prefix}/my-detail`, { params: { id } })
}
