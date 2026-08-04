import { LitElement, html } from 'lit'
import { Privilege } from '../session/session'

export class AppContent extends LitElement {
  static properties = {
    identity: { type: String },
    privileges: { type: Array },
  }

  declare identity: string
  declare privileges: Privilege[]

  constructor() {
    super()
    this.identity = ''
    this.privileges = []
  }

  createRenderRoot() {
    return this
  }

  render() {
    return html`
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
    `
  }
}

customElements.define('app-content', AppContent)
