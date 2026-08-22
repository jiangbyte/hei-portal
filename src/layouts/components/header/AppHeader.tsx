/** Author: Charlie */

import { useState } from 'react'
import { Button, Flex, Grid, Space } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { MobileDrawer } from '../common/MobileDrawer'
import { Logo } from './Logo'
import { NavMenu } from './NavMenu'
import { ThemeSwitch } from './ThemeSwitch'
import { Notices } from './Notices'
import { UserCenter } from './UserCenter'
import { useAuthStore } from '@/stores/auth'
import './header.css'

const { useBreakpoint } = Grid

export const HEADER_HEIGHT = 64

export function AppHeader() {
  const screens = useBreakpoint()
  const location = useLocation()
  const isMobile = !screens.md
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pathname, setPathname] = useState(location.pathname)
  const isLogin = useAuthStore((s) => s.isLogin)
  const loggedIn = isLogin()

  if (location.pathname !== pathname) {
    setPathname(location.pathname)
    if (drawerOpen) setDrawerOpen(false)
  }

  return (
    <>
      <header className="app-header">
        <Flex align="center" justify="space-between" className="app-header__inner">
          <Flex align="center" gap={12} className="min-w-0 flex-1">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                aria-label="打开菜单"
                onClick={() => setDrawerOpen(true)}
              />
            ) : null}
            <Logo />
            {!isMobile ? (
              <div className="min-w-0 flex-1 ml-4">
                <NavMenu mode="horizontal" />
              </div>
            ) : null}
          </Flex>
          <Space size={4} align="center">
            <ThemeSwitch />
            {loggedIn ? <Notices /> : null}
            <UserCenter />
          </Space>
        </Flex>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <NavMenu mode="inline" onNavigate={() => setDrawerOpen(false)} />
      </MobileDrawer>
    </>
  )
}
