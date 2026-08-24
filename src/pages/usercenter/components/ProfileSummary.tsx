/** Author: Charlie */

import { useCallback, useEffect, useState } from 'react'
import { Avatar, Button, Descriptions, Flex, Spin, Typography } from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { displayValue, mapNames } from '../composables/useUserCenterProfile'
import { AvatarUploadModal } from './AvatarUploadModal'

export function ProfileSummary() {
  const refreshUserInfo = useAuthStore((s) => s.refreshUserInfo)
  const [loading, setLoading] = useState(true)
  const [avatarModalShow, setAvatarModalShow] = useState(false)
  const [me, setMe] = useState<any>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setMe(await refreshUserInfo())
    } finally {
      setLoading(false)
    }
  }, [refreshUserInfo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const profile = (me?.profile ?? {}) as any
  const avatarUrl = me?.avatar || profile.avatar || undefined
  const nickname = String(me?.nickname ?? '').trim()
  const displayName = nickname || '-'

  return (
    <>
      <Spin spinning={loading}>
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
