declare const process: { env: Record<string, string | undefined> }
const env = process.env

// Normalize API base: supports env with or without '/api' suffix.
// If absolute and path empty -> '<origin>/api'; otherwise preserve path; trims trailing slashes.
export const API_BASE = (() => {
  const raw = (
    env.NEXT_PUBLIC_API_URL ||
    env.NEXT_PUBLIC_API_BASE_URL ||
    ''
  ).trim()
  if (!raw) return '/api'
  try {
    const u = new URL(raw)
    const pathname = u.pathname.replace(/\/+$/, '')
    if (pathname === '' || pathname === '/') return `${u.origin}/api`
    return `${u.origin}${pathname}`
  } catch {
    const trimmed = raw.replace(/\/+$/, '')
    if (trimmed === '' || trimmed === '/') return '/api'
    if (/^\/api(\/|$)/.test(trimmed)) return trimmed
    return trimmed
  }
})()
