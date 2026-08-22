/** Author: Charlie */

import { create } from 'zustand'
import { message } from 'antd'
import { authApi } from '@/api'
import { clearDict, refreshDict, syncDictTree } from '@/utils/dict'
import { clearToken, setToken } from '@/utils/session'
import { clearAuthStorage, getStoredUserInfo, setStoredUserInfo } from '@/utils/storage'
import { getSafeRedirect } from '@/utils/validate'
import { wireBool } from '@/utils/wire'

const userCenterPasswordPath = '/usercenter?tab=password'
const userCenterEmailPath = '/usercenter?tab=email'
const userCenterPhonePath = '/usercenter?tab=phone'
const userCenterIdentityPath = '/usercenter?tab=identity'

export interface IdentityStatus {
  status?: string | null
  documentType?: string | null
  realNameMasked?: string | null
  documentNoMasked?: string | null
  verifyChannel?: string | null
  provider?: string | null
  verifiedAt?: string | null
  revokedAt?: string | null
  pendingCase?: Record<string, unknown> | null
}

export interface AuthUserInfo {
  accountId: string
  account: string
  accountType: string
  nickname?: string | null
  avatar?: string | null
  identity?: IdentityStatus | null
  roleIds: string[]
  deptIds: string[]
  groupIds: string[]
  roleIdNames?: { id: string; name: string }[]
  deptIdNames?: { id: string; name: string }[]
  groupIdNames?: { id: string; name: string }[]
  profile?: Record<string, unknown> | null
  passwordExpired?: boolean
  forceBindEmail?: boolean
  forceBindPhone?: boolean
  forceBindIdentity?: boolean
  loginAt: number
}

interface AuthState {
  userInfo: AuthUserInfo | null
  sessionChecked: boolean
  /** 主动退出中：屏蔽并发请求的 401 提示 */
  loggingOut: boolean
  isLogin: () => boolean
  ensureSession: () => Promise<boolean>
  login: (
    account: string,
    password: string,
    redirect?: string,
    rememberMe?: boolean,
    identityType?: string,
    security?: {
      password_key_id?: string
      captcha_id: string
      captcha_value: string
      login_mode?: 'PASSWORD' | 'OTP'
      otp_code?: string
    },
  ) => Promise<string>
  refreshUserInfo: () => Promise<any>
  logout: (redirect?: string) => Promise<void>
  resetSession: () => void
  resolveSecurityRedirect: (fallback?: string) => string
}

function mapIdentity(data: any): IdentityStatus | null {
  if (!data || typeof data !== 'object') return null
  return {
    status: data.status ?? null,
    documentType: data.document_type ?? data.documentType ?? null,
    realNameMasked: data.real_name_masked ?? data.realNameMasked ?? null,
    documentNoMasked: data.document_no_masked ?? data.documentNoMasked ?? null,
    verifyChannel: data.verify_channel ?? data.verifyChannel ?? null,
    provider: data.provider ?? null,
    verifiedAt: data.verified_at ?? data.verifiedAt ?? null,
    revokedAt: data.revoked_at ?? data.revokedAt ?? null,
    pendingCase: data.pending_case ?? data.pendingCase ?? null,
  }
}

function mapMe(data: any, loginAt = Date.now()): AuthUserInfo {
  return {
    accountId: data.account_id,
    account: data.account,
    accountType: data.account_type,
    nickname: data.nickname,
    avatar: data.avatar,
    identity: mapIdentity(data.identity),
    roleIds: data.role_ids ?? [],
    deptIds: data.dept_ids ?? [],
    groupIds: data.group_ids ?? [],
    roleIdNames: data.role_id_names ?? [],
    deptIdNames: data.dept_id_names ?? [],
    groupIdNames: data.group_id_names ?? [],
    profile: data.profile ?? null,
    passwordExpired: wireBool(data.password_expired ?? false),
    forceBindEmail: wireBool(data.force_bind_email ?? false),
    forceBindPhone: wireBool(data.force_bind_phone ?? false),
    forceBindIdentity: wireBool(data.force_bind_identity ?? false),
    loginAt,
  }
}

export function resolveSecurityWallPath(user: AuthUserInfo | null | undefined): string | null {
  if (!user) return null
  if (user.passwordExpired) return userCenterPasswordPath
  if (user.forceBindEmail) return userCenterEmailPath
  if (user.forceBindPhone) return userCenterPhonePath
  if (user.forceBindIdentity) return userCenterIdentityPath
  return null
}

export function isAllowedUnderSecurityWall(
  pathname: string,
  search: string,
  user: AuthUserInfo | null | undefined,
): boolean {
  if (!user) return true
  if (user.passwordExpired) {
    return (
      pathname.startsWith('/usercenter') && new URLSearchParams(search).get('tab') === 'password'
    )
  }
  if (user.forceBindEmail || user.forceBindPhone || user.forceBindIdentity) {
    if (!pathname.startsWith('/usercenter')) return false
    const tab = new URLSearchParams(search).get('tab')
    if (user.forceBindEmail && tab === 'email') return true
    if (user.forceBindPhone && tab === 'phone') return true
    if (user.forceBindIdentity && tab === 'identity') return true
    return false
  }
  return true
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userInfo: getStoredUserInfo<AuthUserInfo>(),
  sessionChecked: false,
  loggingOut: false,

  isLogin: () => Boolean(get().userInfo?.accountId),

  resolveSecurityRedirect: (fallback) => {
    return resolveSecurityWallPath(get().userInfo) || getSafeRedirect(fallback)
  },

  ensureSession: async () => {
    if (get().sessionChecked) {
      return get().isLogin()
    }
    set({ sessionChecked: true })
    try {
      // 静默探测会话（Cookie 和/或本地 Authorization）；未登录时的 401 属预期
      const meResponse = await authApi.me({ probe: true })
      const userInfo = mapMe(meResponse.data, get().userInfo?.loginAt ?? Date.now())
      setStoredUserInfo(userInfo)
      set({ userInfo })
      return true
    } catch {
      clearToken()
      clearAuthStorage()
      set({ userInfo: null })
      return false
    }
  },

  login: async (
    account,
    password,
    redirect,
    rememberMe = true,
    identityType = 'ACCOUNT',
    security,
  ) => {
    const response = await authApi.login({
      account,
      password: password || undefined,
      identity_type: identityType,
      remember_me: rememberMe,
      password_key_id: security?.password_key_id,
      captcha_id: security?.captcha_id || '',
      captcha_value: security?.captcha_value || '',
      login_mode: security?.login_mode || 'PASSWORD',
      ...(security?.otp_code ? { otp_code: security.otp_code } : {}),
    })

    // Cookie 与 Header 双通道：本地持久化 opaque token，供无 Cookie 时鉴权。
    clearToken()
    clearAuthStorage()
    if (response.data.token) {
      setToken(String(response.data.token), rememberMe)
    }
    set({ sessionChecked: true })

    // WireBool 序列化为 "true"/"false" 字符串，不能直接当 JS 真值用
    const passwordExpired = wireBool(response.data.password_expired ?? false)
    const forceBindEmail = wireBool(response.data.force_bind_email ?? false)
    const forceBindPhone = wireBool(response.data.force_bind_phone ?? false)
    const forceBindIdentity = wireBool(response.data.force_bind_identity ?? false)
    const warningDays = response.data.password_expiry_warning_days
    if (passwordExpired) {
      message.warning('密码已过期，请先修改密码')
    } else if (forceBindEmail || forceBindPhone || forceBindIdentity) {
      message.warning(
        forceBindIdentity ? '请先完成实名认证' : '请先完成账号安全绑定',
      )
    } else if (typeof warningDays === 'number' && warningDays > 0) {
      message.warning(`密码将在 ${warningDays} 天后过期，请及时修改`)
    }

    await get().refreshUserInfo()

    syncDictTree()
    await refreshDict()

    return get().resolveSecurityRedirect(redirect)
  },

  refreshUserInfo: async () => {
    const meResponse = await authApi.me()
    const userInfo = mapMe(meResponse.data, get().userInfo?.loginAt ?? Date.now())
    setStoredUserInfo(userInfo)
    set({ userInfo })
    return meResponse.data
  },

  resetSession: () => {
    clearToken()
    clearAuthStorage()
    clearDict()
    set({ userInfo: null, sessionChecked: true })
  },

  logout: async (redirectTo) => {
    set({ loggingOut: true })
    try {
      await authApi.logout()
    } catch {
      // 忽略
    } finally {
      get().resetSession()
      set({ loggingOut: false })
    }

    const query =
      redirectTo && !redirectTo.startsWith('/auth')
        ? `?redirect=${encodeURIComponent(redirectTo)}`
        : ''
    window.location.assign(`/auth/login${query}`)
  },
}))
