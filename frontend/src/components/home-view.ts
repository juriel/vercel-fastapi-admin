import { LitElement, html } from 'lit'
import { Session, Privilege } from '../session/session'
import { apiClient } from '../lib/api-client'

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

  private get privilegesByCategory(): [string, Privilege[]][] {
    const groups = new Map<string, Privilege[]>()
    for (const p of this.privileges) {
      const list = groups.get(p.category) ?? []
      list.push(p)
      groups.set(p.category, list)
    }
    return [...groups.entries()]
  }

  render() {
    return html`
      <div class="flex flex-col min-h-screen">
        <header
          class="h-14 shrink-0 flex items-center justify-between px-4 border-b border-neutral-300 dark:border-neutral-600"
        >
          <span class="font-semibold text-lg">Hello World Admin</span>
          <div class="flex items-center gap-3">
            <span class="text-sm">${this.identity}</span>
            <button @click=${this.logout} class="btn-outline">Cerrar sesión</button>
          </div>
        </header>

        <div class="flex flex-1">
          <aside
            class="w-56 shrink-0 border-r border-neutral-300 dark:border-neutral-600 p-4"
          >
            <nav class="flex flex-col gap-4">
              <a href="/" class="font-medium text-sm">Inicio</a>
              ${this.privilegesByCategory.map(
                ([category, items]) => html`
                  <div>
                    <div class="text-xs uppercase opacity-60 mb-1">${category}</div>
                    <ul class="flex flex-col gap-1">
                      ${items.map((p) => html`<li class="text-sm">${p.name}</li>`)}
                    </ul>
                  </div>
                `
              )}
            </nav>
          </aside>

          <main class="flex-1 p-6">
            <div class="flex flex-col gap-4 max-w-2xl">
              <h1 class="text-xl font-semibold m-0">Bienvenido, ${this.identity}</h1>

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
            </div>
          </main>
        </div>

        <footer
          class="h-10 shrink-0 flex items-center justify-center text-xs border-t border-neutral-300 dark:border-neutral-600"
        >
          © 2026 Hello World
        </footer>
      </div>
    `
  }
}

customElements.define('home-view', HomeView)
