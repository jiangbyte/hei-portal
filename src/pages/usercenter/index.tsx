/** Author: Charlie */

import { useCallback, useMemo, type ReactNode } from 'react'
import { Card, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { BasicInfoPanel } from './components/BasicInfoPanel'
import { CancelAccountPanel } from './components/CancelAccountPanel'
import { EmailPanel } from './components/EmailPanel'
import { IdentityPanel } from './components/IdentityPanel'
import { MyLoginLogPanel } from './components/MyLoginLogPanel'
import { MyMessagesPanel } from './components/MyMessagesPanel'
import { OauthPanel } from './components/OauthPanel'
import { PasswordPanel } from './components/PasswordPanel'
import { PhonePanel } from './components/PhonePanel'
import { ProfileSummary } from './components/ProfileSummary'

const PRIMARY_NAV = [
  { key: 'basic_info', label: '公开资料' },
  { key: 'my_messages', label: '我的消息' },
  { key: 'my_logins', label: '我的登录日志' },
] as const

const SECURITY_NAV = [
  { key: 'password', label: '密码' },
  { key: 'identity', label: '实名认证' },
  { key: 'phone', label: '手机号' },
  { key: 'email', label: '邮箱' },
  { key: 'oauth', label: '三方账号' },
  { key: 'cancel_account', label: '账号注销' },
] as const

const SECURITY_KEYS = new Set<string>(SECURITY_NAV.map((item) => item.key))

type PrimaryKey = (typeof PRIMARY_NAV)[number]['key']
type SecurityKey = (typeof SECURITY_NAV)[number]['key']
type TabKey = PrimaryKey | SecurityKey

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

const ALL_TAB_KEYS = [...PRIMARY_NAV.map((item) => item.key), ...SECURITY_NAV.map((item) => item.key)]

function resolveTab(tab: string | null): TabKey {
  if (tab && ALL_TAB_KEYS.includes(tab as TabKey)) {
    return tab as TabKey
  }
  return 'basic_info'
}

export function UserCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const userInfo = useAuthStore((s) => s.userInfo)
  const activeTab = resolveTab(searchParams.get('tab'))
  const activeMainKey = SECURITY_KEYS.has(activeTab) ? 'security' : activeTab

  const lockedTabs = useMemo(() => {
    if (userInfo?.passwordExpired) return new Set<TabKey>(['password'])
    const allowed = new Set<TabKey>()
    if (userInfo?.forceBindEmail) allowed.add('email')
    if (userInfo?.forceBindPhone) allowed.add('phone')
    if (userInfo?.forceBindIdentity) allowed.add('identity')
    return allowed.size > 0 ? allowed : null
  }, [userInfo])

  const selectTab = useCallback(
    (key: string) => {
      if (!key || activeTab === key) return
      if (!ALL_TAB_KEYS.includes(key as TabKey)) return
      if (lockedTabs && !lockedTabs.has(key as TabKey)) return
      const next = new URLSearchParams(searchParams)
      next.set('tab', key)
      setSearchParams(next, { replace: true })
    },
    [activeTab, lockedTabs, searchParams, setSearchParams],
  )

  const onMainChange = useCallback(
    (key: string) => {
      if (key === 'security') {
        selectTab(SECURITY_KEYS.has(activeTab) ? activeTab : 'password')
        return
      }
      selectTab(key)
    },
    [activeTab, selectTab],
  )

  const securityTabItems: TabsProps['items'] = useMemo(
    () =>
      SECURITY_NAV.map((item) => ({
        key: item.key,
        label: item.label,
        disabled: Boolean(lockedTabs && !lockedTabs.has(item.key)),
        children: PANEL_MAP[item.key],
      })),
    [lockedTabs],
  )

  const mainTabItems: TabsProps['items'] = useMemo(
    () => [
      ...PRIMARY_NAV.map((item) => ({
        key: item.key,
        label: item.label,
        disabled: Boolean(lockedTabs && !lockedTabs.has(item.key)),
        children: PANEL_MAP[item.key],
      })),
      {
        key: 'security',
        label: '访问与安全',
        disabled: Boolean(
          lockedTabs && !SECURITY_NAV.some((item) => lockedTabs.has(item.key)),
        ),
        children: (
          <Tabs
            className="usercenter-security-tabs"
            tabPosition="left"
            activeKey={SECURITY_KEYS.has(activeTab) ? activeTab : 'password'}
            items={securityTabItems}
            destroyInactiveTabPane={false}
            onChange={(key) => selectTab(key)}
          />
        ),
      },
    ],
    [activeTab, lockedTabs, securityTabItems, selectTab],
  )

  return (
    <div className="page-shell usercenter-page w-full min-w-0">
      <div className="usercenter-layout">
        <Card
          className="usercenter-summary-card"
          styles={{ body: { padding: '24px 20px' } }}
          style={{ minHeight: 'min(720px, calc(100vh - 160px))' }}
        >
          <ProfileSummary />
        </Card>

        <Card
          className="usercenter-content-card"
          styles={{ body: { padding: '12px 16px 16px', overflow: 'auto' } }}
          style={{ minHeight: 'min(720px, calc(100vh - 160px))' }}
        >
          <Tabs
            className="usercenter-main-tabs"
            activeKey={activeMainKey}
            items={mainTabItems}
            destroyInactiveTabPane={false}
            onChange={onMainChange}
          />
        </Card>
      </div>
    </div>
  )
}
