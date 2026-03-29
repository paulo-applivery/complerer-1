const ENCODING = '0123456789abcdefghjkmnpqrstvwxyz'

function encodeTime(now: number, len: number): string {
  let str = ''
  for (let i = len; i > 0; i--) {
    const mod = now % ENCODING.length
    str = ENCODING[mod] + str
    now = (now - mod) / ENCODING.length
  }
  return str
}

function encodeRandom(len: number): string {
  let str = ''
  for (let i = 0; i < len; i++) {
    str += ENCODING[Math.floor(Math.random() * ENCODING.length)]
  }
  return str
}

export function generateId(): string {
  const time = encodeTime(Date.now(), 10)
  const random = encodeRandom(16)
  return time + random
}
