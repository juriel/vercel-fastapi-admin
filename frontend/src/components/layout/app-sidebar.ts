import { LitElement, html, nothing } from 'lit'
import { Session } from '../../session/session'
import { initialsFromIdentity, displayNameFromIdentity } from '../../lib/identity'
import '../common/lucide-icon'
import type { LucideIconName } from '../common/lucide-icon'

interface NavItem {
  label: string
  href: string
  icon: LucideIconName
  visible?: boolean
}

const COLLAPSE_STORAGE_KEY = 'AIXA_SIDEBAR_COLLAPSED'

export class AppSidebar extends LitElement {
  static properties = {
    privileges: { type: Array },
    company: { type: String },
    collapsed: { type: Boolean, state: true },
    currentPath: { type: String, state: true },
    tooltip: { state: true },
  }

  declare privileges: import('../../session/session').Privilege[]
  declare company: string
  declare collapsed: boolean
  declare currentPath: string
  declare tooltip: { label: string; top: number } | null

  private onLocationChanged = () => {
    this.currentPath = window.location.pathname
  }

  constructor() {
    super()
    this.privileges = []
    this.company = ''
    this.collapsed = localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1'
    this.currentPath = window.location.pathname
    this.tooltip = null
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('vaadin-router-location-changed', this.onLocationChanged)
  }

  disconnectedCallback() {
    window.removeEventListener('vaadin-router-location-changed', this.onLocationChanged)
    super.disconnectedCallback()
  }

  private toggleCollapsed() {
    this.collapsed = !this.collapsed
    localStorage.setItem(COLLAPSE_STORAGE_KEY, this.collapsed ? '1' : '0')
    this.tooltip = null
  }

  private showTooltip(e: MouseEvent, label: string) {
    if (!this.collapsed) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    this.tooltip = { label, top: rect.top + rect.height / 2 }
  }

  private hideTooltip() {
    this.tooltip = null
  }

  private get settingsNav(): NavItem[] {
    const session = Session.getInstance()
    return [
      { label: 'Perfiles', href: '/profiles', icon: 'id-card', visible: session.can('profiles.read') },
    ]
  }

  private get primaryNav(): NavItem[] {
    const session = Session.getInstance()
    return [
      { label: 'Inicio', href: '/', icon: 'home' },
      { label: 'Usuarios', href: '/users', icon: 'users', visible: session.can('users.read') },
    ]
  }

  private get initials(): string {
    return initialsFromIdentity(Session.getInstance().identity ?? '')
  }

  private get displayName(): string {
    return displayNameFromIdentity(Session.getInstance().identity ?? '')
  }

  private get userRole(): string {
    const session = Session.getInstance()
    if (session.can('ALL')) return 'Administrador'
    return this.privileges[0]?.name ?? 'Miembro'
  }

  private isActive(href: string): boolean {
    return href === '/' ? this.currentPath === '/' : this.currentPath.startsWith(href)
  }

  private renderNavItem(item: NavItem) {
    if (item.visible === false) return nothing
    const active = this.isActive(item.href)
    return html`
      <li class="relative group/item">
        <a
          href=${item.href}
          aria-current=${active ? 'page' : nothing}
          @mouseenter=${(e: MouseEvent) => this.showTooltip(e, item.label)}
          @mouseleave=${() => this.hideTooltip()}
          class="relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ease-out
            ${active
            ? 'bg-blue-50 text-blue-900'
            : 'text-[#0F172A] hover:bg-slate-50 hover:font-semibold'}
            ${this.collapsed ? 'justify-center px-0 py-2.5' : ''}"
        >
          ${active
            ? html`<span
                class="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-blue-600"
              ></span>`
            : nothing}
          <lucide-icon
            name=${item.icon}
            class="shrink-0 transition-colors duration-150 ease-out ${active
              ? 'text-blue-600'
              : 'text-[#64748B] group-hover/item:text-[#0F172A]'}"
          ></lucide-icon>
          ${this.collapsed ? nothing : html`<span class="truncate">${item.label}</span>`}
        </a>
      </li>
    `
  }

  render() {
    return html`
      <aside
        class="flex shrink-0 flex-col border-r border-slate-100 bg-white transition-[width] duration-150 ease-out"
        style="width: ${this.collapsed ? '72px' : '260px'}"
      >
        <div class="flex items-center ${this.collapsed ? 'justify-center' : 'justify-between'} px-4 py-5">
          <a href="/" class="flex items-center gap-2.5 overflow-hidden">
            <img src="/aixa-logo.svg" alt="AIXA" class="h-7 w-7 shrink-0" />
            ${this.collapsed
              ? nothing
              : html`<span class="text-lg font-bold tracking-tight text-[#0F172A]">AIXA</span>`}
          </a>
        </div>

        <div class="mx-4 border-t border-slate-100"></div>

        <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <ul class="flex flex-col gap-1">
            ${this.primaryNav.map((item) => this.renderNavItem(item))}
          </ul>
        </nav>

        <div class="mx-4 border-t border-slate-100"></div>

        <ul class="flex flex-col gap-1 px-3 py-4">
          ${this.settingsNav.map((item) => this.renderNavItem(item))}
        </ul>

        <div class="mx-4 border-t border-slate-100"></div>

        <div class="px-3 py-4">
          <button
            @click=${this.toggleCollapsed}
            aria-label=${this.collapsed ? 'Expandir menú' : 'Colapsar menú'}
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] transition-colors duration-150 ease-out hover:bg-slate-50 hover:text-[#0F172A] ${this
              .collapsed
              ? 'justify-center px-0'
              : ''}"
          >
            <lucide-icon
              name="panel-left"
              class="shrink-0 transition-transform duration-150 ease-out ${this.collapsed ? '' : 'rotate-180'}"
            ></lucide-icon>
            ${this.collapsed ? nothing : html`<span>Colapsar</span>`}
          </button>
        </div>

        <div class="mx-4 border-t border-slate-100"></div>

        <div
          class="relative px-3 py-4"
          @mouseenter=${(e: MouseEvent) => this.showTooltip(e, this.displayName)}
          @mouseleave=${() => this.hideTooltip()}
        >
          <div class="flex items-center gap-3 rounded-xl px-1 py-1 ${this.collapsed ? 'justify-center' : ''}">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700"
            >
              ${this.initials}
            </div>
            ${this.collapsed
              ? nothing
              : html`
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-[#0F172A]">${this.displayName}</p>
                    <p class="truncate text-xs text-[#64748B]">
                      ${this.company ? html`${this.company} · ${this.userRole}` : this.userRole}
                    </p>
                  </div>
                `}
          </div>
        </div>
      </aside>

      ${this.tooltip
        ? html`
            <span
              class="pointer-events-none fixed z-50 whitespace-nowrap rounded-lg bg-[#0F172A] px-2.5 py-1.5 text-xs font-medium text-white shadow-sm"
              style="left: 80px; top: ${this.tooltip.top}px; transform: translateY(-50%)"
            >
              ${this.tooltip.label}
            </span>
          `
        : nothing}
    `
  }
}

customElements.define('app-sidebar', AppSidebar)
