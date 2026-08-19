import { apiClient } from './api-client'
import { Session, SessionData } from '../session/session'

// Auth tokens are short-lived (30 min server-side, see AuthTokenService).
// Nothing on the frontend renewed them, so an active user got silently
// logged out mid-session once the token aged out. This keeps the session
// alive by refreshing shortly before expiry, for as long as the tab stays
// open — the token still hard-expires if the tab is closed or genuinely idle
// past its lifetime.
const REFRESH_MARGIN_MS = 5 * 60 * 1000

let refreshTimer: ReturnType<typeof setTimeout> | undefined
let started = false

function msUntilRefresh(): number {
  const expiresAt = Session.getInstance().expiresAt
  if (!expiresAt) return 0
  return new Date(expiresAt).getTime() - Date.now() - REFRESH_MARGIN_MS
}

async function refresh() {
  const session = Session.getInstance()
  if (!session.isAuthenticated()) return

  try {
    const data = (await apiClient.post('/session_refresh')) as SessionData
    session.set(data)
  } catch {
    // Token already invalid/expired (e.g. the tab was backgrounded past its
    // lifetime): the next authenticated request's 401 handling in
    // api-client.ts clears the session and redirects to /login.
  }
  scheduleNext()
}

function scheduleNext() {
  clearTimeout(refreshTimer)
  if (!Session.getInstance().isAuthenticated()) return
  refreshTimer = setTimeout(refresh, Math.max(msUntilRefresh(), 0))
}

function onVisible() {
  if (document.visibilityState !== 'visible') return
  // Background tabs can have their timers throttled for minutes; if we're
  // already due (or overdue) by the time the tab is foregrounded again,
  // refresh right away instead of waiting for the stale timer.
  if (msUntilRefresh() <= 0) refresh()
}

export function startSessionRefresh() {
  if (started || typeof window === 'undefined') return
  started = true
  scheduleNext()
  document.addEventListener('visibilitychange', onVisible)
}
