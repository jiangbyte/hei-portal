/** Author: Charlie — 操作审计字段展示 */

import { dictTypeData } from '@/utils/dict'

const AUDIT_ACTION_TYPE_DICT = 'AUDIT_ACTION_TYPE'

export function auditActionTypeLabel(type?: string | null) {
  if (!type) return '-'
  return dictTypeData(AUDIT_ACTION_TYPE_DICT, String(type)) || String(type)
}

export function auditModuleLabel(row: {
  module_label?: string | null
  module?: string | null
}) {
  return row.module_label || row.module || '-'
}

export function auditActionName(row: {
  action_name?: string | null
  action?: string | null
}) {
  return row.action_name || row.action || '-'
}

export function auditDurationText(ms?: number | string | null) {
  if (ms === undefined || ms === null || ms === '') return '-'
  const n = Number(ms)
  if (!Number.isFinite(n)) return '-'
  return `${n} ms`
}
