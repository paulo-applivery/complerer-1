/**
 * AES-GCM encryption/decryption using the Web Crypto API
 * Works natively in Cloudflare Workers (no external deps needed)
 */

const KEY_ALGO = { name: 'AES-GCM', length: 256 } as const

async function importKey(rawKey: string): Promise<CryptoKey> {
  // Pad or truncate key to exactly 32 bytes (256 bits)
  const keyBytes = new TextEncoder().encode(rawKey.padEnd(32, '0').slice(0, 32))
  return crypto.subtle.importKey('raw', keyBytes, KEY_ALGO, false, ['encrypt', 'decrypt'])
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

/**
 * Encrypt plaintext with AES-GCM.
 * Returns base64-encoded string: iv (12 bytes) + ciphertext
 */
export async function encrypt(plaintext: string, keyStr: string): Promise<string> {
  const key = await importKey(keyStr)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

  const combined = new Uint8Array(iv.length + cipherBuf.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(cipherBuf), iv.length)

  return toBase64(combined.buffer)
}

/**
 * Decrypt an AES-GCM ciphertext produced by `encrypt`.
 */
export async function decrypt(ciphertext: string, keyStr: string): Promise<string> {
  const key = await importKey(keyStr)
  const combined = fromBase64(ciphertext)
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plainBuf)
}
