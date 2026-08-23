/** Author: Charlie
 *
 * RSA-OAEP(SHA-256) 密码传输加密。使用 node-forge 纯 JS 实现，HTTP/HTTPS 均可（不依赖 crypto.subtle）。 */
import forge from 'node-forge'

type ForgePublicKey = ReturnType<typeof forge.pki.publicKeyFromAsn1>

function normalizePublicKeyBase64(publicKeyB64OrPem: string) {
  return publicKeyB64OrPem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')
}

function importSpkiPublicKey(publicKeyB64OrPem: string): ForgePublicKey {
  const der = forge.util.decode64(normalizePublicKeyBase64(publicKeyB64OrPem))
  const asn1 = forge.asn1.fromDer(der)
  return forge.pki.publicKeyFromAsn1(asn1)
}

/** 与后端 RSA/ECB/OAEPWithSHA-256AndMGF1Padding 一致 */
function encryptTextRsaOaep(publicKey: ForgePublicKey, value: string) {
  const encrypted = publicKey.encrypt(forge.util.encodeUtf8(value), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  })
  return forge.util.encode64(encrypted)
}

export async function encryptFieldsWithPublicKey<
  T extends Record<string, string | null | undefined>,
>(publicKeyB64OrPem: string, fields: T) {
  const publicKey = importSpkiPublicKey(publicKeyB64OrPem)
  const result: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(fields)) {
    result[key] = value ? encryptTextRsaOaep(publicKey, value) : null
  }
  return result as { [K in keyof T]: string | null }
}
