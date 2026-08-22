/** Author: Charlie */

import { useCallback, useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  Row,
  Spin,
  Typography,
  message,
} from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { displayValue, mapNames } from '../composables/useUserCenterProfile'
import { AvatarUploadModal } from './AvatarUploadModal'

export function BasicInfoPanel() {
  const refreshUserInfo = useAuthStore((s) => s.refreshUserInfo)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarModalShow, setAvatarModalShow] = useState(false)
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

  const profile = (me?.profile ?? {}) as any
  const avatarUrl = me?.avatar || profile.avatar || undefined
  const nickname = String(me?.nickname ?? '').trim()
  const displayName = nickname || '-'

  return (
    <>
      <Spin spinning={loading}>
        <Row gutter={[32, 24]} align="top">
          <Col xs={24} lg={{ flex: '0 0 280px' }} style={{ minWidth: 0, maxWidth: 280 }}>
            <Flex vertical align="center" gap={10} style={{ padding: '8px 0' }}>
              <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
                <Avatar
                  size={160}
                  src={avatarUrl}
                  icon={<UserOutlined />}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setAvatarModalShow(true)}
                />
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  style={{ position: 'absolute', left: 10, bottom: 10 }}
                  onClick={() => setAvatarModalShow(true)}
                >
                  编辑
                </Button>
              </div>
              <Typography.Text strong style={{ fontSize: 16, textAlign: 'center' }}>
                {displayName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ marginTop: -4, textAlign: 'center' }}>
                {me?.account || '-'}
              </Typography.Text>
              <Descriptions column={1} size="small" style={{ width: '100%', marginTop: 4 }}>
                <Descriptions.Item label="部门">
                  {displayValue(mapNames(me?.dept_id_names))}
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  {displayValue(mapNames(me?.role_id_names))}
                </Descriptions.Item>
                <Descriptions.Item label="用户组">
                  {displayValue(mapNames(me?.group_id_names))}
                </Descriptions.Item>
              </Descriptions>
            </Flex>
          </Col>

          <Col xs={24} lg={{ flex: 'auto' }} style={{ minWidth: 0, maxWidth: 560 }}>
            <Form form={profileForm} layout="vertical" style={{ width: '100%' }}>
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
          </Col>
        </Row>
      </Spin>

      <AvatarUploadModal
        open={avatarModalShow}
        avatar={avatarUrl}
        onClose={() => setAvatarModalShow(false)}
        onUploaded={() => void refresh()}
      />
    </>
  )
}
