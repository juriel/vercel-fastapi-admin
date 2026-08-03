import { API_BASE } from '../constants'
import { Session } from '../session/session'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request(path: string, options: RequestInit, auth: boolean) {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (auth) {
    const token = Session.getInstance().token
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (auth && (res.status === 401 || res.status === 403)) {
    Session.getInstance().clear()
    if (typeof window !== 'undefined') window.location.href = '/login'
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch {
      // response body wasn't JSON; keep statusText
    }
    throw new ApiError(res.status, detail)
  }

  return res.status === 204 ? null : res.json()
}

export const apiClient = {
  get: (path: string, auth = true) => request(path, { method: 'GET' }, auth),
  post: (path: string, body?: unknown, auth = true) =>
    request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, auth),
}
