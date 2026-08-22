/** Author: Charlie */

import { useEffect, useMemo, useState } from 'react'
import { Descriptions, Modal, Spin, Typography } from 'antd'
import { auditApi } from '@/api'
import {
  auditActionName,
  auditActionTypeLabel,
  auditDurationText,
  auditModuleLabel,
} from '@/utils/audit'
import { displayValue, formatDateTime } from '@/utils'
import { wireBool } from '@/utils/wire'

type Props = {
  open: boolean
  id: string | null
  onClose: () => void
}

function formatJson(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function AuditDetailModal({ open, id, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<any>({})

  useEffect(() => {
    if (!open || !id) {
      setRecord({})
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const response = await auditApi.myDetail(id)
        if (!cancelled) {
          setRecord(response.data ?? {})
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, open])

  const successText = useMemo(() => {
    if (record?.success === undefined || record?.success === null) {
      return '-'
    }
    return wireBool(record.success) ? '成功' : '失败'
  }, [record?.success])

  return (
    <Modal
      title="审计详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Descriptions bordered column={1} size="small" labelStyle={{ minWidth: 120 }}>
          <Descriptions.Item label="日志编号">{displayValue(record.id)}</Descriptions.Item>
          <Descriptions.Item label="操作模块">{auditModuleLabel(record)}</Descriptions.Item>
          <Descriptions.Item label="操作名">{auditActionName(record)}</Descriptions.Item>
          <Descriptions.Item label="操作类型">
            {auditActionTypeLabel(record.action_type)}
          </Descriptions.Item>
          <Descriptions.Item label="操作内容">
            <Typography.Paragraph className="!mb-0 whitespace-pre-wrap break-all">
              {displayValue(record.summary)}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="操作结果">{successText}</Descriptions.Item>
          <Descriptions.Item label="操作时间">
            {formatDateTime(record.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="执行时长">
            {auditDurationText(record.duration_ms)}
          </Descriptions.Item>
          <Descriptions.Item label="业务编号">{displayValue(record.resource_id)}</Descriptions.Item>
          <Descriptions.Item label="请求 ID">{displayValue(record.request_id)}</Descriptions.Item>
          <Descriptions.Item label="IP">{displayValue(record.ip)}</Descriptions.Item>
          <Descriptions.Item label="User-Agent">
            <Typography.Paragraph className="!mb-0 whitespace-pre-wrap break-all font-mono text-xs">
              {displayValue(record.user_agent)}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="错误信息">
            <Typography.Paragraph className="!mb-0 whitespace-pre-wrap break-all font-mono text-xs">
              {displayValue(record.error_message)}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="变更前">
            <Typography.Paragraph className="!mb-0 whitespace-pre-wrap break-all font-mono text-xs">
              {formatJson(record.before_data)}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="变更后">
            <Typography.Paragraph className="!mb-0 whitespace-pre-wrap break-all font-mono text-xs">
              {formatJson(record.after_data)}
            </Typography.Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Spin>
    </Modal>
  )
}
