/** Author: Charlie */

import { useCallback, useEffect, useState } from 'react'
import { Button, Form, Input, Spin, Typography, message } from 'antd'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

export function BasicInfoPanel() {
  const refreshUserInfo = useAuthStore((s) => s.refreshUserInfo)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [me, setMe] = useState<any>(null)
  const [profileForm] = Form.useForm()

  const applyMe = useCallback(
    (data: any) => {
      setMe(data)
      const currentProfile = data?.profile ?? {}
      profileForm.setFieldsValue({
        nickname: data?.nickname ?? currentProfile.nickname ?? '',
        signature: currentProfile.signature ?? '',
        remark: currentProfile.remark ?? '',
      })
    },
    [profileForm],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      applyMe(await refreshUserInfo())
    } finally {
      setLoading(false)
    }
  }, [applyMe, refreshUserInfo])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await refreshUserInfo()
        if (!cancelled) applyMe(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applyMe, refreshUserInfo])

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const values = await profileForm.validateFields()
      await authApi.updateProfile({
        nickname: values.nickname || null,
        signature: values.signature || null,
        remark: values.remark || null,
      })
      await refresh()
      message.success('保存成功')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <Spin spinning={loading}>
      <Form
        form={profileForm}
        layout="vertical"
        style={{ width: '100%', maxWidth: 560 }}
      >
        <Form.Item
          label="账号"
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              登录账号不可修改。
            </Typography.Text>
          }
        >
          <Input value={me?.account} disabled />
        </Form.Item>
        <Form.Item
          name="nickname"
          label="昵称"
          rules={[{ max: 64, message: '昵称最多 64 个字符' }]}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item name="signature" label="个性签名">
          <Input.TextArea rows={3} placeholder="一句话介绍自己" allowClear />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} allowClear />
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={savingProfile} onClick={() => void saveProfile()}>
            更新资料
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  )
}
