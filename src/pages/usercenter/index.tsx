/** Author: Charlie */

import { useMemo, type ReactNode } from 'react'
import { Card, Col, Menu, Row } from 'antd'
import type { MenuProps } from 'antd'
import {
  DeleteOutlined,
  HistoryOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  MessageOutlined,
  MobileOutlined,
  UserOutlined,
  ApiOutlined,
} from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { BasicInfoPanel } from './components/BasicInfoPanel'
import { CancelAccountPanel } from './components/CancelAccountPanel'
import { EmailPanel } from './components/EmailPanel'
import { IdentityPanel } from './components/IdentityPanel'
import { MyLoginLogPanel } from './components/MyLoginLogPanel'
import { MyMessagesPanel } from './components/MyMessagesPanel'
import { OauthPanel } from './components/OauthPanel'
import { PanelActionsProvider, usePanelActionsContext } from './components/PanelActionsContext'
import { PasswordPanel } from './components/PasswordPanel'
import { PhonePanel } from './components/PhonePanel'

const NAV_ITEMS = [
  { key: 'basic_info', label: '公开资料' },
  { key: 'identity', label: '实名认证' },
  { key: 'my_messages', label: '我的消息' },
  { key: 'my_logins', label: '我的登录日志' },
  { key: 'password', label: '密码' },
  { key: 'phone', label: '手机号' },
  { key: 'email', label: '邮箱' },
  { key: 'oauth', label: '三方账号' },
  { key: 'cancel_account', label: '账号注销' },
] as const

type TabKey = (typeof NAV_ITEMS)[number]['key']

const PANEL_MAP: Record<TabKey, ReactNode> = {
  basic_info: <BasicInfoPanel />,
  identity: <IdentityPanel />,
  my_messages: <MyMessagesPanel />,
  my_logins: <MyLoginLogPanel />,
  password: <PasswordPanel />,
  phone: <PhonePanel />,
  email: <EmailPanel />,
  oauth: <OauthPanel />,
  cancel_account: <CancelAccountPanel />,
}

function resolveTab(tab: string | null): TabKey {
  if (tab && NAV_ITEMS.some((item) => item.key === tab)) {
    return tab as TabKey
  }
  return 'basic_info'
}

function UserCenterContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const userInfo = useAuthStore((s) => s.userInfo)
  const { extra } = usePanelActionsContext()
  const activeTab = resolveTab(searchParams.get('tab'))
  const activeNav = NAV_ITEMS.find((item) => item.key === activeTab) ?? NAV_ITEMS[0]

  const lockedTabs = useMemo(() => {
    if (userInfo?.passwordExpired) return new Set<TabKey>(['password'])
    const allowed = new Set<TabKey>()
    if (userInfo?.forceBindEmail) allowed.add('email')
    if (userInfo?.forceBindPhone) allowed.add('phone')
    if (userInfo?.forceBindIdentity) allowed.add('identity')
    return allowed.size > 0 ? allowed : null
  }, [userInfo])

  const menuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'basic_info',
        icon: <UserOutlined />,
        label: '公开资料',
        disabled: Boolean(lockedTabs && !lockedTabs.has('basic_info')),
      },
      {
        key: 'identity',
        icon: <IdcardOutlined />,
        label: '实名认证',
        disabled: Boolean(lockedTabs && !lockedTabs.has('identity')),
      },
      {
        type: 'group',
        label: '消息与日志',
        children: [
          {
            key: 'my_messages',
            icon: <MessageOutlined />,
            label: '我的消息',
            disabled: Boolean(lockedTabs && !lockedTabs.has('my_messages')),
          },
          {
            key: 'my_logins',
            icon: <HistoryOutlined />,
            label: '我的登录日志',
            disabled: Boolean(lockedTabs && !lockedTabs.has('my_logins')),
          },
        ],
      },
      {
        type: 'group',
        label: '访问与安全',
        children: [
          {
            key: 'password',
            icon: <LockOutlined />,
            label: '密码',
            disabled: Boolean(lockedTabs && !lockedTabs.has('password')),
          },
          {
            key: 'phone',
            icon: <MobileOutlined />,
            label: '手机号',
            disabled: Boolean(lockedTabs && !lockedTabs.has('phone')),
          },
          {
            key: 'email',
            icon: <MailOutlined />,
            label: '邮箱',
            disabled: Boolean(lockedTabs && !lockedTabs.has('email')),
          },
          {
            key: 'oauth',
            icon: <ApiOutlined />,
            label: '三方账号',
            disabled: Boolean(lockedTabs && !lockedTabs.has('oauth')),
          },
          {
            key: 'cancel_account',
            icon: <DeleteOutlined />,
            label: '账号注销',
            danger: true,
            disabled: Boolean(lockedTabs && !lockedTabs.has('cancel_account')),
          },
        ],
      },
    ],
    [lockedTabs],
  )

  function selectTab(key: string) {
    if (!key || activeTab === key) return
    if (!NAV_ITEMS.some((item) => item.key === key)) return
    if (lockedTabs && !lockedTabs.has(key as TabKey)) return
    const next = new URLSearchParams(searchParams)
    next.set('tab', key)
    setSearchParams(next, { replace: true })
  }

  return (
    <Row gutter={8} style={{ minHeight: 'min(720px, calc(100vh - 160px))' }}>
      <Col xs={24} lg={{ flex: '220px' }}>
        <Card
          styles={{ body: { padding: '8px 4px', height: '100%' } }}
          style={{ height: '100%' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => selectTab(String(key))}
          />
        </Card>
      </Col>
      <Col xs={24} lg={{ flex: 'auto' }} style={{ minWidth: 0 }}>
        <Card
          title={activeNav.label}
          extra={extra}
          styles={{ body: { overflow: 'auto', paddingBottom: 12 } }}
          style={{ height: '100%' }}
        >
          {PANEL_MAP[activeTab]}
        </Card>
      </Col>
    </Row>
  )
}

export function UserCenterPage() {
  return (
    <div className="page-shell w-full min-w-0">
      <PanelActionsProvider>
        <UserCenterContent />
      </PanelActionsProvider>
    </div>
  )
}
