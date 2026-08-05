import { LitElement, html } from 'lit'
import { apiClient, ApiError } from '../../lib/api-client'
import '../common/lucide-icon'

interface UserRecord {
  login: string
  name?: string | null
  email?: string | null
  active?: number | null
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

type Modal = 'none' | 'create' | 'edit' | 'delete'

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 403) {
    return 'No tienes permiso para realizar esta acción.'
  }
  if (err instanceof ApiError && err.status === 400) {
    return 'Ese usuario ya existe.'
  }
  return fallback
}

const PAGE_SIZE = 10

interface UserPageResponse {
  items: UserRecord[]
  total: number
  page: number
  page_size: number
}

export class UserManagement extends LitElement {
  static properties = {
    users: { type: Array },
    filter: { type: String },
    page: { type: Number },
    total: { type: Number },
    loading: { type: Boolean },
    error: { type: String },
    modal: { type: String },
    target: { type: Object },
    formLogin: { type: String },
    formName: { type: String },
    formEmail: { type: String },
    formPassword: { type: String },
    formActive: { type: Boolean },
    formError: { type: String },
    submitting: { type: Boolean },
  }

  declare users: UserRecord[]
  declare filter: string
  declare page: number
  declare total: number
  declare loading: boolean
  declare error: string
  declare modal: Modal
  declare target: UserRecord | null
  declare formLogin: string
  declare formName: string
  declare formEmail: string
  declare formPassword: string
  declare formActive: boolean
  declare formError: string
  declare submitting: boolean

  private filterDebounce?: ReturnType<typeof setTimeout>

  constructor() {
    super()
    this.users = []
    this.filter = ''
    this.page = 1
    this.total = 0
    this.loading = false
    this.error = ''
    this.modal = 'none'
    this.target = null
    this.formLogin = ''
    this.formName = ''
    this.formEmail = ''
    this.formPassword = ''
    this.formActive = true
    this.formError = ''
    this.submitting = false
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    this.loadUsers()
  }

  private get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / PAGE_SIZE))
  }

  private async loadUsers() {
    this.loading = true
    this.error = ''
    try {
      const params = new URLSearchParams({
        page: String(this.page),
        page_size: String(PAGE_SIZE),
      })
      if (this.filter.trim()) params.set('search', this.filter.trim())

      const data = (await apiClient.get(`/users?${params}`)) as UserPageResponse
      this.users = data.items
      this.total = data.total
    } catch (err) {
      this.error = describeError(err, 'No se pudo cargar la lista de usuarios.')
    } finally {
      this.loading = false
    }
  }

  private onFilterInput(e: Event) {
    this.filter = (e.target as HTMLInputElement).value
    this.page = 1
    clearTimeout(this.filterDebounce)
    this.filterDebounce = setTimeout(() => this.loadUsers(), 300)
  }

  private goToPage(page: number) {
    if (page < 1 || page > this.pageCount) return
    this.page = page
    this.loadUsers()
  }

  private openCreate() {
    this.formLogin = ''
    this.formName = ''
    this.formEmail = ''
    this.formPassword = ''
    this.formActive = true
    this.formError = ''
    this.modal = 'create'
  }

  private openEdit(user: UserRecord) {
    this.target = user
    this.formLogin = user.login
    this.formName = user.name ?? ''
    this.formEmail = user.email ?? ''
    this.formPassword = ''
    this.formActive = (user.active ?? 1) === 1
    this.formError = ''
    this.modal = 'edit'
  }

  private openDelete(user: UserRecord) {
    this.target = user
    this.modal = 'delete'
  }

  private closeModal() {
    this.modal = 'none'
    this.target = null
  }

  private async submitForm(e: Event) {
    e.preventDefault()
    this.formError = ''

    if (this.modal === 'create' && (!this.formLogin || !this.formPassword)) {
      this.formError = 'Usuario y contraseña son obligatorios.'
      return
    }

    this.submitting = true
    try {
      if (this.modal === 'create') {
        await apiClient.post('/users', {
          login: this.formLogin,
          name: this.formName || undefined,
          email: this.formEmail || undefined,
          password: this.formPassword,
          active: this.formActive ? 1 : 0,
        })
      } else if (this.modal === 'edit' && this.target) {
        const payload: Record<string, unknown> = {
          name: this.formName || undefined,
          email: this.formEmail || undefined,
          active: this.formActive ? 1 : 0,
        }
        if (this.formPassword) payload.password = this.formPassword
        await apiClient.put(`/users/${encodeURIComponent(this.target.login)}`, payload)
      }
      this.closeModal()
      await this.loadUsers()
    } catch (err) {
      this.formError = describeError(err, 'No se pudo guardar el usuario.')
    } finally {
      this.submitting = false
    }
  }

  private async confirmDelete() {
    if (!this.target) return
    this.submitting = true
    try {
      await apiClient.delete(`/users/${encodeURIComponent(this.target.login)}`)
      this.closeModal()
      if (this.users.length === 1 && this.page > 1) this.page -= 1
      await this.loadUsers()
    } catch (err) {
      this.error = describeError(err, 'No se pudo eliminar el usuario.')
      this.closeModal()
    } finally {
      this.submitting = false
    }
  }

  private renderFormModal() {
    const isEdit = this.modal === 'edit'
    return html`
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <form
          class="card bg-white p-6 rounded-lg shadow-lg w-full max-w-sm"
          @submit=${this.submitForm}
        >
          <h2 class="text-lg font-semibold m-0 mb-1 text-[var(--primary-color2)]">
            ${isEdit ? 'Editar usuario' : 'Crear usuario'}
          </h2>
          <input
            type="text"
            placeholder="Usuario"
            class="field"
            .value=${this.formLogin}
            ?disabled=${isEdit}
            @input=${(e: Event) => (this.formLogin = (e.target as HTMLInputElement).value)}
          />
          <input
            type="text"
            placeholder="Nombre"
            class="field"
            .value=${this.formName}
            @input=${(e: Event) => (this.formName = (e.target as HTMLInputElement).value)}
          />
          <input
            type="email"
            placeholder="Email"
            class="field"
            .value=${this.formEmail}
            @input=${(e: Event) => (this.formEmail = (e.target as HTMLInputElement).value)}
          />
          <input
            type="password"
            placeholder=${isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            class="field"
            autocomplete="new-password"
            .value=${this.formPassword}
            @input=${(e: Event) => (this.formPassword = (e.target as HTMLInputElement).value)}
          />
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              .checked=${this.formActive}
              @change=${(e: Event) => (this.formActive = (e.target as HTMLInputElement).checked)}
            />
            Activo
          </label>
          ${this.formError ? html`<p class="error-text">${this.formError}</p>` : ''}
          <div class="flex gap-2 justify-end mt-2">
            <button type="button" class="btn-outline" @click=${this.closeModal}>Cancelar</button>
            <button type="submit" class="btn" ?disabled=${this.submitting}>
              ${this.submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    `
  }

  private renderDeleteModal() {
    return html`
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="card bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
          <h2 class="text-lg font-semibold m-0 mb-1 text-[var(--primary-color2)]">
            Eliminar usuario
          </h2>
          <p class="text-sm">
            ¿Seguro que quieres eliminar a <strong>${this.target?.login}</strong>? Esta acción no
            se puede deshacer.
          </p>
          <div class="flex gap-2 justify-end mt-2">
            <button class="btn-outline" @click=${this.closeModal}>Cancelar</button>
            <button class="btn" ?disabled=${this.submitting} @click=${this.confirmDelete}>
              ${this.submitting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    `
  }

  render() {
    return html`
      <main class="flex-1 bg-[#F8FAFC] p-8">
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="relative w-full max-w-[420px]">
              <lucide-icon
                name="search"
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              ></lucide-icon>
              <input
                type="text"
                placeholder="Buscar por usuario, nombre o email..."
                class="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm font-medium text-[#0F172A] outline-none transition-colors duration-150 ease-out placeholder:font-normal placeholder:text-[#94A3B8] focus:border-[#0B3B78] focus:ring-4 focus:ring-[#0B3B78]/10"
                .value=${this.filter}
                @input=${this.onFilterInput}
              />
            </div>
            <div class="flex items-center gap-3">
              <button
                class="flex h-12 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] transition-colors duration-150 ease-out hover:bg-[#EFF6FF]"
                @click=${this.loadUsers}
              >
                <lucide-icon name="refresh-cw"></lucide-icon>
                Actualizar
              </button>
              <button
                class="flex h-12 items-center gap-2 rounded-xl bg-[#0B3B78] px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90"
                @click=${this.openCreate}
              >
                <lucide-icon name="user-plus"></lucide-icon>
                Crear usuario
              </button>
            </div>
          </div>

          ${this.error ? html`<p class="error-text">${this.error}</p>` : ''}

          ${this.loading
            ? html`<p class="text-sm text-[#64748B]">Cargando...</p>`
            : html`
                <div class="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
                  <div class="overflow-x-auto">
                    <table class="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr>
                          <th class="px-6 py-4 font-semibold text-[#334155]">Usuario</th>
                          <th class="px-6 py-4 font-semibold text-[#334155]">Nombre</th>
                          <th class="px-6 py-4 font-semibold text-[#334155]">Email</th>
                          <th class="px-6 py-4 font-semibold text-[#334155]">Activo</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this.users.map(
                          (u) => html`
                            <tr
                              class="border-t border-[#F1F5F9] transition-colors duration-150 ease-out hover:bg-[#EFF6FF]"
                            >
                              <td class="h-[60px] px-6">
                                <div class="flex items-center gap-3">
                                  <div
                                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-semibold text-[#0B3B78]"
                                  >
                                    ${initials(u.name || u.login)}
                                  </div>
                                  <span class="font-medium text-[#0F172A]">${u.login}</span>
                                </div>
                              </td>
                              <td class="h-[60px] px-6 text-[#0F172A]">${u.name || '—'}</td>
                              <td class="h-[60px] px-6 text-[#64748B]">${u.email || '—'}</td>
                              <td class="h-[60px] px-6">
                                ${u.active
                                  ? html`<span
                                      class="inline-flex items-center rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-medium text-[#059669]"
                                      >Activo</span
                                    >`
                                  : html`<span
                                      class="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#64748B]"
                                      >Inactivo</span
                                    >`}
                              </td>
                            </tr>
                          `
                        )}
                        ${this.users.length === 0
                          ? html`<tr>
                              <td class="px-6 py-12 text-center text-sm text-[#64748B]" colspan="4">
                                No hay usuarios para mostrar.
                              </td>
                            </tr>`
                          : ''}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm text-[#64748B]"
                    >${this.total} usuario${this.total === 1 ? '' : 's'} en total</span
                  >
                  <div class="flex items-center gap-3">
                    <button
                      class="flex h-10 items-center rounded-full border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors duration-150 ease-out hover:bg-[#EFF6FF] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
                      ?disabled=${this.page <= 1}
                      @click=${() => this.goToPage(this.page - 1)}
                    >
                      Anterior
                    </button>
                    <span class="flex items-center gap-1.5 text-sm text-[#64748B]">
                      Página
                      <span
                        class="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#0B3B78] px-2 text-xs font-semibold text-white"
                        >${this.page}</span
                      >
                      de ${this.pageCount}
                    </span>
                    <button
                      class="flex h-10 items-center rounded-full border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors duration-150 ease-out hover:bg-[#EFF6FF] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
                      ?disabled=${this.page >= this.pageCount}
                      @click=${() => this.goToPage(this.page + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              `}
        </div>
        ${this.modal === 'create' || this.modal === 'edit' ? this.renderFormModal() : ''}
        ${this.modal === 'delete' ? this.renderDeleteModal() : ''}
      </main>
    `
  }
}

customElements.define('user-management', UserManagement)
