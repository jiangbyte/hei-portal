/** Author: Charlie */

import { API_PREFIX } from '@/constants/api'
import { http } from '@/utils'

export function getIdentityStatus() {
  return http.get<any>(`${API_PREFIX}/profile/identity/status`)
}

export function getCaseOptions() {
  return http.get<any>(`${API_PREFIX}/real-name/case/options`)
}

export function submitCase(data: {
  business_type?: string
  document_type: string
  real_name: string
  document_no: string
  attachment_ids?: string[]
  applicant_contact?: string | null
}) {
  return http.post<any>(`${API_PREFIX}/real-name/case/submit`, data)
}

export function initThirdParty(data: {
  business_type?: string
  document_type: string
  real_name: string
  document_no: string
  provider?: string | null
}) {
  return http.post<any>(`${API_PREFIX}/real-name/case/init-third-party`, data)
}

export function myCasePage(params?: { current?: number; size?: number }) {
  return http.get<any>(`${API_PREFIX}/real-name/case/my-page`, { params })
}
