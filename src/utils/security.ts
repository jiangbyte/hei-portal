/** Author: Charlie */

import { authApi } from '@/api'
import { encryptFieldsWithPublicKey } from '@/utils/rsaEncrypt'

type PasswordKeyPayload = {
  key_id?: string
  keyId?: string
  public_key?: string
  publicKey?: string
}

function readPasswordKeyPayload(response: unknown): PasswordKeyPayload {
  const root = response as { data?: PasswordKeyPayload } | PasswordKeyPayload
  const payload = root && typeof root === 'object' && 'data' in root ? root.data : root
  return (payload ?? {}) as PasswordKeyPayload
}

export async function encryptPasswords<T extends Record<string, string | null | undefined>>(
  fields: T,
) {
  const response = await authApi.passwordKey()
  const payload = readPasswordKeyPayload(response)
  const keyId = payload.key_id ?? payload.keyId
  const publicKey = payload.public_key ?? payload.publicKey
  if (!keyId || !publicKey) {
    throw new Error('获取密码加密公钥失败')
  }
  return {
    password_key_id: keyId,
    values: await encryptFieldsWithPublicKey(publicKey, fields),
  }
}
