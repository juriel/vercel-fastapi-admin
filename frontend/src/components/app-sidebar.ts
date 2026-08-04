import { LitElement, html } from 'lit'
import { Privilege } from '../session/session'

export class AppSidebar extends LitElement {
  static properties = {
    privileges: { type: Array },
  }

  declare privileges: Privilege[]

  constructor() {
    super()
    this.privileges = []
  }

  createRenderRoot() {
    return this
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
      <aside class="w-56 shrink-0 border-r border-[var(--border-color)] p-4">
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
    `
  }
}

customElements.define('app-sidebar', AppSidebar)
