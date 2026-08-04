import { LitElement, html } from 'lit'
import { Session } from '../../session/session'
import { apiClient } from '../../lib/api-client'
import '../common/icon'

export class AppHeader extends LitElement {
  static properties = {
    identity: { type: String },
  }

  declare identity: string

  constructor() {
    super()
    this.identity = ''
  }

  createRenderRoot() {
    return this
  }

  private async logout() {
    try {
      await apiClient.post('/logout')
    } catch {
      // ignore network errors on logout; clear the local session regardless
    }
    Session.getInstance().clear()
    window.location.href = '/login'
  }

  render() {
    return html`
      <header
        class="h-14 shrink-0 flex items-center justify-between px-4 border-b border-[var(--border-color)]"
      >
        <span class="font-semibold text-lg">Hello World Admin</span>
        <div class="flex items-center gap-3">
          <span class="text-sm">${this.identity}</span>
          <button @click=${this.logout} class="btn-outline flex items-center gap-1.5">
            <app-icon name="logout"></app-icon>
            Cerrar sesión
          </button>
        </div>
      </header>
    `
  }
}

customElements.define('app-header', AppHeader)
