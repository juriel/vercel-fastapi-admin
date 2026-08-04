import { LitElement, html } from 'lit'
import { apiClient, ApiError } from '../../lib/api-client'
import '../common/icon'

interface UserRecord {
  login: string
  name?: string | null
  email?: string | null
  active?: number | null
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

export class UserManagement extends LitElement {
  static properties = {
    users: { type: Array },
    filter: { type: String },
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

  constructor() {
    super()
    this.users = []
    this.filter = ''
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

  private async loadUsers() {
    this.loading = true
    this.error = ''
    try {
      this.users = (await apiClient.get('/users')) as UserRecord[]
    } catch (err) {
      this.error = describeError(err, 'No se pudo cargar la lista de usuarios.')
    } finally {
      this.loading = false
    }
  }

  private get filteredUsers(): UserRecord[] {
    const q = this.filter.trim().toLowerCase()
    if (!q) return this.users
    return this.users.filter((u) =>
      [u.login, u.name, u.email].some((v) => (v ?? '').toLowerCase().includes(q))
    )
  }

  private onFilterInput(e: Event) {
    this.filter = (e.target as HTMLInputElement).value
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
      <main class="flex-1 p-6">
        <div class="flex items-center justify-between mb-4 gap-4">
          <h1 class="text-xl font-semibold m-0 text-[var(--primary-color2)]">Usuarios</h1>
          <div class="flex gap-2">
            <button class="btn-outline flex items-center gap-1.5" @click=${this.loadUsers}>
              <app-icon name="refresh"></app-icon>
              Actualizar
            </button>
            <button class="btn flex items-center gap-1.5" @click=${this.openCreate}>
              <app-icon name="user-plus"></app-icon>
              Crear usuario
            </button>
          </div>
        </div>

        <div class="relative w-full max-w-sm mb-4">
          <app-icon
            name="search"
            class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
          ></app-icon>
          <input
            type="text"
            placeholder="Filtrar por usuario, nombre o email..."
            class="field w-full pl-9"
            .value=${this.filter}
            @input=${this.onFilterInput}
          />
        </div>

        ${this.error ? html`<p class="error-text mb-2">${this.error}</p>` : ''}
        ${this.loading
          ? html`<p class="text-sm opacity-60">Cargando...</p>`
          : html`
              <div class="overflow-x-auto">
                <table class="w-full text-sm border-collapse">
                  <thead>
                    <tr class="text-left border-b" style="border-color: var(--border-color)">
                      <th class="py-2 pr-4">Usuario</th>
                      <th class="py-2 pr-4">Nombre</th>
                      <th class="py-2 pr-4">Email</th>
                      <th class="py-2 pr-4">Activo</th>
                      <th class="py-2 pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.filteredUsers.map(
                      (u) => html`
                        <tr class="border-b" style="border-color: var(--border-soft)">
                          <td class="py-2 pr-4">${u.login}</td>
                          <td class="py-2 pr-4">${u.name || '—'}</td>
                          <td class="py-2 pr-4">${u.email || '—'}</td>
                          <td class="py-2 pr-4">${u.active ? 'Sí' : 'No'}</td>
                          <td class="py-2 pr-4">
                            <div class="flex gap-2">
                              <button
                                class="btn-outline flex items-center gap-1.5"
                                @click=${() => this.openEdit(u)}
                              >
                                <app-icon name="edit"></app-icon>
                                Editar
                              </button>
                              <button
                                class="btn-outline flex items-center gap-1.5"
                                @click=${() => this.openDelete(u)}
                              >
                                <app-icon name="trash"></app-icon>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                    )}
                    ${this.filteredUsers.length === 0
                      ? html`<tr>
                          <td class="py-4 opacity-60" colspan="5">No hay usuarios para mostrar.</td>
                        </tr>`
                      : ''}
                  </tbody>
                </table>
              </div>
            `}
        ${this.modal === 'create' || this.modal === 'edit' ? this.renderFormModal() : ''}
        ${this.modal === 'delete' ? this.renderDeleteModal() : ''}
      </main>
    `
  }
}

customElements.define('user-management', UserManagement)
