/** Author: Charlie */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  Result,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
  Upload,
  message,
} from 'antd'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  InboxOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { fileApi, realNameApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { normalizeUploadedFile } from '@/utils/file'
import { formatDateTime } from '@/utils/time'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  ID_CARD: '身份证',
  PASSPORT: '护照',
  EID: '电子身份证',
}

const STEP_ITEMS = [
  { title: '填写基本信息', description: '证件与姓名' },
  { title: '上传证件材料', description: '照片或说明' },
  { title: '认证结果', description: '等待或完成' },
]

type FlowPhase = 'form' | 'pending' | 'success' | 'failed' | 'revoked'

function labelOf(map: Record<string, string>, value?: string | null) {
  if (!value) return '-'
  return map[value] || value
}

type IdentityFormDraft = {
  document_type: string
  real_name: string
  document_no: string
  applicant_contact?: string
}

export function IdentityPanel() {
  const refreshUserInfo = useAuthStore((s) => s.refreshUserInfo)
  const forceBindIdentity = useAuthStore((s) => Boolean(s.userInfo?.forceBindIdentity))
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [options, setOptions] = useState<any>(null)
  const [latestReject, setLatestReject] = useState<any>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [formDraft, setFormDraft] = useState<IdentityFormDraft | null>(null)
  const [wizardStep, setWizardStep] = useState(0)
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('form')
  const pollTimerRef = useRef<number | null>(null)
  const wizardRef = useRef<HTMLDivElement>(null)
  const [wizardWidth, setWizardWidth] = useState(0)

  useEffect(() => {
    const el = wizardRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const updateWidth = (width: number) => {
      setWizardWidth(width)
    }

    const observer = new ResizeObserver(([entry]) => {
      updateWidth(entry.contentRect.width)
    })
    observer.observe(el)
    updateWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  const stepsVertical = wizardWidth > 0 && wizardWidth < 560
  const stepsCompact = wizardWidth > 0 && wizardWidth < 680

  const businessType = useMemo(() => {
    const items = options?.business_types ?? options?.businessTypes ?? []
    return items[0]?.business_type ?? items[0]?.businessType ?? 'ACCOUNT_VERIFY'
  }, [options])

  const thirdPartyAvailable = useMemo(() => {
    const items = options?.business_types ?? options?.businessTypes ?? []
    const current = items.find(
      (item: any) => (item.business_type ?? item.businessType) === businessType,
    )
    const channels: string[] = current?.channels ?? []
    return channels.includes('THIRD_PARTY')
  }, [businessType, options])

  const documentTypeOptions = useMemo(() => {
    const types: string[] = options?.document_types ?? options?.documentTypes ?? []
    return types.map((value) => ({
      label: labelOf(DOCUMENT_TYPE_LABELS, value),
      value,
    }))
  }, [options])

  const pendingCase = status?.pending_case ?? status?.pendingCase

  const stepCurrent = useMemo(() => {
    if (flowPhase === 'form') return wizardStep
    return 2
  }, [flowPhase, wizardStep])

  const stepItems = useMemo(() => {
    type StepStatus = 'wait' | 'process' | 'finish' | 'error'
    return STEP_ITEMS.map((item, index) => {
      let status: StepStatus = 'wait'
      if (flowPhase === 'success') {
        status = 'finish'
      } else if (flowPhase === 'failed') {
        status = index < 2 ? 'finish' : index === 2 ? 'error' : 'wait'
      } else if (flowPhase === 'pending' || flowPhase === 'revoked') {
        status = index < 2 ? 'finish' : index === 2 ? 'process' : 'wait'
      } else if (index < wizardStep) {
        status = 'finish'
      } else if (index === wizardStep) {
        status = 'process'
      }
      return {
        ...item,
        status,
        description: stepsCompact && !stepsVertical ? undefined : item.description,
      }
    })
  }, [flowPhase, wizardStep, stepsCompact, stepsVertical])

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const applyFlowPhase = useCallback((nextStatus: any, rejectRow: any | null) => {
    const identityStatus = nextStatus?.status
    const pending = nextStatus?.pending_case ?? nextStatus?.pendingCase
    if (identityStatus === 'VERIFIED') {
      setFlowPhase('success')
      return
    }
    if (identityStatus === 'REVOKED') {
      setFlowPhase('revoked')
      return
    }
    if (pending?.status === 'PENDING') {
      setFlowPhase('pending')
      return
    }
    if (rejectRow?.status === 'REJECTED') {
      setFlowPhase('failed')
      return
    }
    setFlowPhase('form')
  }, [])

  const loadStatus = useCallback(async () => {
    const response = await realNameApi.getIdentityStatus()
    setStatus(response.data)
    return response.data
  }, [])

  const loadLatestCase = useCallback(async () => {
    const response = await realNameApi.myCasePage({ current: 1, size: 1 })
    const page = response.data
    const rows = page?.records ?? page?.items ?? []
    const latest = rows[0] ?? null
    setLatestReject(latest?.status === 'REJECTED' ? latest : null)
    return latest
  }, [])

  const startPolling = useCallback(() => {
    clearPollTimer()
    let attempts = 0
    pollTimerRef.current = window.setInterval(() => {
      attempts += 1
      void (async () => {
        const next = await loadStatus()
        const latest = await loadLatestCase()
        await refreshUserInfo()
        applyFlowPhase(next, latest?.status === 'REJECTED' ? latest : null)
        const pending = next?.pending_case ?? next?.pendingCase
        const identityStatus = next?.status
        if (!pending && identityStatus !== 'UNVERIFIED') {
          clearPollTimer()
        }
        if (attempts >= 40) {
          clearPollTimer()
        }
      })()
    }, 3000)
  }, [applyFlowPhase, clearPollTimer, loadLatestCase, loadStatus, refreshUserInfo])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const optionsResponse = await realNameApi.getCaseOptions()
        if (!cancelled) {
          setOptions(optionsResponse.data)
          const types: string[] =
            optionsResponse.data?.document_types ?? optionsResponse.data?.documentTypes ?? []
          if (types.length) {
            form.setFieldsValue({ document_type: types[0] })
          }
        }
        const nextStatus = await loadStatus()
        const latest = await loadLatestCase()
        if (!cancelled) {
          applyFlowPhase(nextStatus, latest?.status === 'REJECTED' ? latest : null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      clearPollTimer()
    }
  }, [applyFlowPhase, clearPollTimer, form, loadLatestCase, loadStatus])

  useEffect(() => {
    if (flowPhase === 'pending') {
      startPolling()
      return () => clearPollTimer()
    }
    clearPollTimer()
    return undefined
  }, [clearPollTimer, flowPhase, startPolling])

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options
    try {
      const res = await fileApi.uploadFile(file as File)
      const normalized = normalizeUploadedFile(res.data, file as File, 'object_name')
      onSuccess?.(
        {
          ...res.data,
          object_name: normalized.objectName,
          url: normalized.url,
          name: normalized.name,
        },
        file as any,
      )
    } catch (error) {
      onError?.(error as Error)
    }
  }

  async function handleNextStep() {
    const values = await form.validateFields([
      'document_type',
      'real_name',
      'document_no',
      'applicant_contact',
    ])
    setFormDraft({
      document_type: String(values.document_type),
      real_name: String(values.real_name).trim(),
      document_no: String(values.document_no).trim(),
      applicant_contact: values.applicant_contact?.trim() || undefined,
    })
    setWizardStep(1)
  }

  function handleBackToBasicStep() {
    setWizardStep(0)
    if (formDraft) {
      form.setFieldsValue(formDraft)
    }
  }

  function handleRestart() {
    setWizardStep(0)
    setFileList([])
    setFormDraft(null)
    form.resetFields()
    setFlowPhase('form')
    setLatestReject(null)
  }

  async function handleSubmitVerification() {
    if (submitting) {
      return
    }
    const values = formDraft
    if (!values?.document_type || !values.real_name || !values.document_no) {
      message.warning('请完整填写证件信息')
      setWizardStep(0)
      return
    }
    if (fileList.some((item) => item.status === 'uploading')) {
      message.warning('请等待附件上传完成')
      return
    }
    if (fileList.some((item) => item.status === 'error')) {
      message.warning('请移除上传失败的附件后再提交')
      return
    }

    if (thirdPartyAvailable && fileList.length === 0) {
      setSubmitting(true)
      try {
        const response = await realNameApi.initThirdParty({
          business_type: businessType,
          document_type: values.document_type,
          real_name: values.real_name,
          document_no: values.document_no,
        })
        const redirectUrl = response.data?.redirect_url ?? response.data?.redirectUrl
        if (redirectUrl) {
          window.location.assign(String(redirectUrl))
          return
        }
      } finally {
        setSubmitting(false)
      }
    }

    const attachmentIds = fileList
      .map((item) => {
        const response = item.response as { object_name?: string } | undefined
        return response?.object_name || ''
      })
      .filter(Boolean)

    if (!attachmentIds.length) {
      message.warning('请至少上传一张证件照片')
      return
    }

    setSubmitting(true)
    try {
      await realNameApi.submitCase({
        business_type: businessType,
        document_type: values.document_type,
        real_name: values.real_name,
        document_no: values.document_no,
        attachment_ids: attachmentIds,
        applicant_contact: values.applicant_contact || null,
      })
      message.success('实名认证申请已提交')
      setFileList([])
      setFormDraft(null)
      form.resetFields()
      setWizardStep(0)
      const nextStatus = await loadStatus()
      applyFlowPhase(nextStatus, null)
      await refreshUserInfo()
    } finally {
      setSubmitting(false)
    }
  }

  const rejectReason =
    latestReject?.reject_reason ??
    latestReject?.rejectReason ??
    pendingCase?.reject_reason ??
    pendingCase?.rejectReason

  return (
    <Spin spinning={loading}>
      <div
        ref={wizardRef}
        className="identity-wizard"
        style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}
      >
        {forceBindIdentity ? (
          <Alert
            type="warning"
            showIcon
            message="请先完成实名认证后再使用其他功能。"
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          个人实名认证
        </Typography.Title>

        <Steps
          className={`identity-wizard__steps${stepsVertical ? ' identity-wizard__steps--vertical' : ''}`}
          current={stepCurrent}
          direction={stepsVertical ? 'vertical' : 'horizontal'}
          labelPlacement="horizontal"
          size="small"
          items={stepItems}
          style={{ marginBottom: 8 }}
        />
        <Divider style={{ margin: '16px 0 24px' }} />

        {flowPhase === 'form' && wizardStep === 0 ? (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <Typography.Title level={5} style={{ color: 'var(--ant-color-primary)', marginTop: 0 }}>
              填写基本信息
            </Typography.Title>
            <Form form={form} layout="vertical">
              <Form.Item
                name="document_type"
                label="证件类型"
                rules={[{ required: true, message: '请选择证件类型' }]}
              >
                <Select options={documentTypeOptions} placeholder="请选择证件类型" />
              </Form.Item>
              <Form.Item
                name="real_name"
                label="真实姓名"
                rules={[
                  { required: true, message: '请输入真实姓名' },
                  { max: 64, message: '姓名最多 64 个字符' },
                ]}
              >
                <Input allowClear placeholder="请输入与证件一致的姓名" />
              </Form.Item>
              <Form.Item
                name="document_no"
                label="证件号码"
                rules={[{ required: true, message: '请输入证件号码' }]}
              >
                <Input allowClear placeholder="请输入证件号码" />
              </Form.Item>
              <Form.Item name="applicant_contact" label="补充说明">
                <Input allowClear placeholder="可选，便于审核沟通" />
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Button type="primary" size="large" onClick={() => void handleNextStep()}>
                下一步
              </Button>
            </div>
          </div>
        ) : null}

        {flowPhase === 'form' && wizardStep === 1 ? (
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <Typography.Title level={5} style={{ color: 'var(--ant-color-primary)', marginTop: 0 }}>
              上传证件材料
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              请上传证件正反面或手持证件照，照片需完整清晰。支持 JPG、PNG，单张不超过 5MB。
              {thirdPartyAvailable
                ? ' 未上传材料时将尝试在线核验。'
                : ' 请至少上传一张证件照片。'}
            </Typography.Paragraph>
            <Upload.Dragger
              multiple
              fileList={fileList}
              customRequest={customRequest}
              onChange={({ fileList: next }) => setFileList(next)}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((item) => item.uid !== file.uid))
                return true
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽上传证件照片</p>
            </Upload.Dragger>
            <Space style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
              <Button size="large" onClick={handleBackToBasicStep}>
                上一步
              </Button>
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={() => void handleSubmitVerification()}
              >
                提交认证
              </Button>
            </Space>
            <Typography.Paragraph
              type="secondary"
              style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}
            >
              提交即表示同意平台实名认证与隐私相关协议
            </Typography.Paragraph>
          </div>
        ) : null}

        {flowPhase === 'pending' ? (
          <Result
            icon={<SyncOutlined spin style={{ color: 'var(--ant-color-primary)' }} />}
            title="实名认证审核中"
            subTitle={
              <Space direction="vertical" size={4}>
                <span>您的申请已提交，请耐心等待审核结果。</span>
                {pendingCase ? (
                  <span>
                    提交时间：{formatDateTime(pendingCase.created_at ?? pendingCase.createdAt)}
                  </span>
                ) : null}
              </Space>
            }
          />
        ) : null}

        {flowPhase === 'success' ? (
          <Result
            icon={<CheckCircleFilled style={{ color: 'var(--ant-color-success)' }} />}
            status="success"
            title="实名认证成功"
            subTitle={
              <Space direction="vertical" size={6} style={{ textAlign: 'left' }}>
                <span>
                  证件类型：
                  {labelOf(DOCUMENT_TYPE_LABELS, status?.document_type ?? status?.documentType)}
                </span>
                <span>姓名：{status?.real_name_masked ?? status?.realNameMasked ?? '-'}</span>
                <span>
                  证件号码：{status?.document_no_masked ?? status?.documentNoMasked ?? '-'}
                </span>
                <span>
                  认证时间：{formatDateTime(status?.verified_at ?? status?.verifiedAt)}
                </span>
              </Space>
            }
          />
        ) : null}

        {flowPhase === 'failed' ? (
          <Result
            icon={<CloseCircleFilled style={{ color: 'var(--ant-color-error)' }} />}
            status="error"
            title="实名认证未通过"
            subTitle={
              <Space direction="vertical" size={8}>
                <Typography.Text type="danger">对不起，本次实名认证未通过审核。</Typography.Text>
                {rejectReason ? (
                  <Typography.Paragraph
                    style={{
                      margin: 0,
                      padding: '12px 16px',
                      background: 'var(--ant-color-error-bg)',
                      borderRadius: 8,
                      textAlign: 'left',
                    }}
                  >
                    失败原因：{rejectReason}
                  </Typography.Paragraph>
                ) : (
                  <Typography.Text type="secondary">请核对信息后重新提交。</Typography.Text>
                )}
                {latestReject ? (
                  <Typography.Text type="secondary">
                    审核时间：
                    {formatDateTime(latestReject.reviewed_at ?? latestReject.reviewedAt ??
                      latestReject.created_at ?? latestReject.createdAt)}
                  </Typography.Text>
                ) : null}
              </Space>
            }
            extra={
              <Button type="primary" size="large" onClick={handleRestart}>
                重新认证
              </Button>
            }
          />
        ) : null}

        {flowPhase === 'revoked' ? (
          <Result
            status="warning"
            title="实名认证已撤销"
            subTitle="您的实名状态已被撤销，如需继续使用相关功能，请重新完成认证。"
            extra={
              <Button type="primary" size="large" onClick={handleRestart}>
                重新认证
              </Button>
            }
          />
        ) : null}
      </div>
    </Spin>
  )
}
