export interface Privilege {
  code: string
  name: string
  category: string
}

export interface SessionData {
  token: string
  expires_at: string
  identity: string
  privileges: Privilege[]
}

const STORAGE_KEY = 'SESSION'

export class Session {
  private static instance: Session

  static getInstance(): Session {
    if (!Session.instance) Session.instance = new Session()
    return Session.instance
  }

  private read(): SessionData | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as SessionData
    } catch {
      return null
    }
  }

  set(data: SessionData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY)
  }

  get token(): string | null {
    return this.read()?.token ?? null
  }

  get identity(): string | null {
    return this.read()?.identity ?? null
  }

  get expiresAt(): string | null {
    return this.read()?.expires_at ?? null
  }

  get privileges(): Privilege[] {
    return this.read()?.privileges ?? []
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  hasPrivilege(code: string): boolean {
    return this.privileges.some((p) => p.code === code)
  }

  can(code: string): boolean {
    return this.hasPrivilege(code) || this.hasPrivilege('ALL')
  }
}
