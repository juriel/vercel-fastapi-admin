import { LitElement, html } from 'lit'
import { Session, Privilege } from '../session/session'
import { apiClient } from '../lib/api-client'
import './hello-form'

export class HomeView extends LitElement {
  static properties = {
    identity: { type: String },
    privileges: { type: Array },
  }

  declare identity: string
  declare privileges: Privilege[]

  constructor() {
    super()
    const session = Session.getInstance()
    this.identity = session.identity ?? ''
    this.privileges = session.privileges
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
      <div class="card w-96">
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-xl font-semibold m-0">Bienvenido, ${this.identity}</h1>
          <button @click=${this.logout} class="btn-outline">Cerrar sesión</button>
        </div>

        <div>
          <h2 class="text-base font-semibold m-0 mb-2">Privilegios</h2>
          ${this.privileges.length
            ? html`
                <ul class="m-0 pl-5 list-disc">
                  ${this.privileges.map(
                    (p) =>
                      html`<li>${p.name} <span class="opacity-60 text-[0.85em]">(${p.code})</span></li>`
                  )}
                </ul>
              `
            : html`<p>No tienes privilegios asignados.</p>`}
        </div>

        <hr class="border-t border-neutral-300 dark:border-neutral-600 w-full m-0" />
        <hello-form></hello-form>
      </div>
    `
  }
}

customElements.define('home-view', HomeView)
