import { LitElement, html, nothing } from 'lit'
import { Session } from '../../session/session'
import { apiClient } from '../../lib/api-client'
import { initialsFromIdentity, displayNameFromIdentity } from '../../lib/identity'
import { SIDEBAR_TOGGLE_EVENT } from './app-sidebar'
import '../common/lucide-icon'
import type { LucideIconName } from '../common/lucide-icon'

const SEARCH_CATEGORIES: { label: string; icon: LucideIconName }[] = [{ label: 'Usuarios', icon: 'users' }]

type SyncStatus = 'synced' | 'syncing' | 'offline'

export class AppHeader extends LitElement {
  static properties = {
    identity: { type: String },
    pageTitle: { type: String },
    pageSubtitle: { type: String },
    company: { type: String },
    hasNotifications: { type: Boolean },
    syncStatus: { type: String },
    searchOpen: { state: true },
    searchQuery: { state: true },
    userMenuOpen: { state: true },
  }

  declare identity: string
  declare pageTitle: string
  declare pageSubtitle: string
  declare company: string
  declare hasNotifications: boolean
  declare syncStatus: SyncStatus
  declare searchOpen: boolean
  declare searchQuery: string
  declare userMenuOpen: boolean

  private onDocumentMouseDown = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.searchOpen = false
      this.userMenuOpen = false
    }
  }

  private onWindowKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      this.querySelector<HTMLInputElement>('#evoforma-global-search')?.focus()
    }
    if (e.key === 'Escape') {
      this.searchOpen = false
      this.userMenuOpen = false
    }
  }

  constructor() {
    super()
    this.identity = ''
    this.pageTitle = ''
    this.pageSubtitle = ''
    this.company = ''
    this.hasNotifications = false
    this.syncStatus = 'synced'
    this.searchOpen = false
    this.searchQuery = ''
    this.userMenuOpen = false
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('mousedown', this.onDocumentMouseDown)
    window.addEventListener('keydown', this.onWindowKeydown)
  }

  disconnectedCallback() {
    document.removeEventListener('mousedown', this.onDocumentMouseDown)
    window.removeEventListener('keydown', this.onWindowKeydown)
    super.disconnectedCallback()
  }

  private get initials(): string {
    return initialsFromIdentity(this.identity)
  }

  private get displayName(): string {
    return displayNameFromIdentity(this.identity)
  }

  private onSearchInput(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value
    this.dispatchEvent(
      new CustomEvent('evoforma-search', { detail: { query: this.searchQuery }, bubbles: true })
    )
  }

  private toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen
    this.searchOpen = false
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

  // private renderSyncStatus() {
  //   const config: Record<SyncStatus, { dot: string; label: string }> = {
  //     synced: { dot: 'bg-emerald-500', label: 'Todo guardado' },
  //     syncing: { dot: 'bg-amber-500', label: 'Sincronizando…' },
  //     offline: { dot: 'bg-slate-300', label: 'Sin conexión' },
  //   }
  //   const { dot, label } = config[this.syncStatus]
  //   return html`
  //     <div class="hidden items-center gap-2 md:flex" title=${label}>
  //       <span class="h-1.5 w-1.5 shrink-0 rounded-full ${dot}"></span>
  //       <span class="text-xs font-medium text-[var(--text-light)]">${label}</span>
  //     </div>
  //   `
  // }

/**   private renderSearch() {
    const query = this.searchQuery.trim()
    return html`
      <div class="relative hidden w-full sm:block sm:max-w-[240px] md:max-w-[320px] lg:max-w-[420px]">
        <!-- <lucide-icon
          name="search"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-light)]"
        ></lucide-icon> -->
        <!-- <input
          id="evoforma-global-search"
          type="text"
          placeholder="Buscar en Evoforma..."
          autocomplete="off"
          .value=${this.searchQuery}
          @focus=${() => (this.searchOpen = true)}
          @input=${this.onSearchInput}
          class="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover-light)] py-2 pl-10 pr-14 text-sm font-medium text-[var(--text-dark)] outline-none transition-colors duration-150 ease-out placeholder:text-[var(--text-light)] placeholder:font-normal focus:border-[var(--brand-orange-light)] focus:bg-white"
        /> -->

        ${this.searchOpen
          ? html`
              <div
                class="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-[var(--border-soft)] bg-white p-2 shadow-lg"
              >
                ${query
                  ? html`
                      <p class="px-2 py-6 text-center text-sm text-[var(--text-muted)]">
                        Sin resultados para “${query}”
                      </p>
                    `
                  : html`
                      <p class="px-2 pb-1.5 pt-1 text-xs font-medium text-[var(--text-light)]">Buscar en</p>
                      <ul class="flex flex-col">
                        ${SEARCH_CATEGORIES.map(
                          (c) => html`
                            <li
                              class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-dark)]"
                            >
                              <!-- <lucide-icon name=${c.icon} class="text-[var(--text-muted)]"></lucide-icon> -->
                              ${c.label}
                            </li>
                          `
                        )}
                      </ul>
                    `}
              </div>
            `
          : nothing}
      </div>
    `
  }
  */

  private renderUserMenu() {
    return html`
      <div class="relative">
        <button
          @click=${this.toggleUserMenu}
          class="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors duration-150 ease-out hover:bg-[var(--bg-hover-light)]"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-accent-light)] text-xs font-semibold text-[var(--primary-color)]"
          >
            ${this.initials}
          </div>
          <div class="hidden min-w-0 flex-col items-start lg:flex">
            <span class="max-w-[140px] truncate text-sm font-medium text-[var(--text-dark)]"
              >${this.displayName}</span
            >
            ${this.company
              ? html`<span class="max-w-[140px] truncate text-xs text-[var(--text-muted)]">${this.company}</span>`
              : nothing}
          </div>
          <lucide-icon
            name="chevron-down"
            class="text-[var(--text-light)] transition-transform duration-150 ease-out ${this.userMenuOpen
              ? 'rotate-180'
              : ''}"
          ></lucide-icon>
        </button>

        ${this.userMenuOpen
          ? html`
              <div
                class="absolute right-0 top-[calc(100%+8px)] z-30 w-56 rounded-xl border border-[var(--border-soft)] bg-white p-1.5 shadow-lg"
              >
                <a
                  href="/mi-perfil"
                  class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-hover-light)]"
                >
                  <lucide-icon name="user" class="text-[var(--text-muted)]"></lucide-icon>
                  Mi perfil
                </a>
                <!-- <a
                  href="/configuracion"
                  class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-hover-light)]"
                > -->
                  <lucide-icon name="settings" class="text-[var(--text-muted)]"></lucide-icon>
                  Configuración
                </a>
                <div class="my-1.5 border-t border-[var(--border-soft)]"></div>
                <button
                  class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-red-50 hover:text-red-600"
                  @click=${this.logout}
                >
                  <lucide-icon name="log-out"></lucide-icon>
                  Cerrar sesión
                </button>
              </div>
            `
          : nothing}
      </div>
    `
  }

  private toggleSidebar() {
    window.dispatchEvent(new CustomEvent(SIDEBAR_TOGGLE_EVENT))
  }

  render() {
    return html`
      <header
        class="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-white px-4 sm:gap-6 sm:px-6 lg:px-8"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <button
            aria-label="Abrir menú"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors duration-150 ease-out hover:bg-[var(--bg-hover-light)] hover:text-[var(--text-dark)] lg:hidden"
            @click=${this.toggleSidebar}
          >
            <lucide-icon name="menu"></lucide-icon>
          </button>

          <a href="/" class="flex shrink-0 items-center gap-2.5 overflow-hidden">
            <img src="/evoforma-logo.png" alt="Evoforma" class="h-7 w-auto shrink-0" />
          </a>

          <div class="hidden h-6 w-px shrink-0 bg-[var(--bg-neutral)] sm:block"></div>

          <div class="flex min-w-0 flex-col justify-center">
            <h1 class="truncate text-[17px] font-heading leading-tight text-[var(--text-dark)]">
              ${this.pageTitle}
            </h1>
            ${this.pageSubtitle
              ? html`<p class="truncate text-sm text-[var(--text-muted)]">${this.pageSubtitle}</p>`
              : nothing}
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-3 sm:gap-6">
          <div class="hidden h-6 w-px bg-[var(--bg-neutral)] sm:block"></div>

          ${this.renderUserMenu()}
        </div>
      </header>
    `
  }
}

customElements.define('app-header', AppHeader)
