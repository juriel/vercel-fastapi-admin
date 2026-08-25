import { LitElement, html, nothing } from 'lit'
import { apiClient, ApiError } from '../../lib/api-client'
import { Session } from '../../session/session'
import { toast } from '../../lib/toast'
import '../common/lucide-icon'

interface ProfileSummary {
  code: string
  name: string
}

interface UserRecord {
  login: string
  name?: string | null
  email?: string | null
  active?: number | null
  profiles?: ProfileSummary[]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

type Modal = 'none' | 'create' | 'edit' | 'delete'

const MIN_PASSWORD_LENGTH = 8

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 403) {
    return 'No tienes permiso para realizar esta acción.'
  }
  if (err instanceof ApiError && err.status === 400) {
    return err.message || 'Ese usuario ya existe.'
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
    allProfiles: { type: Array },
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
    formPasswordConfirm: { type: String },
    formActive: { type: Boolean },
    formProfileCode: { type: String },
    formError: { type: String },
    showPassword: { type: Boolean },
    submitting: { type: Boolean },
  }

  declare users: UserRecord[]
  declare allProfiles: ProfileSummary[]
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
  declare formPasswordConfirm: string
  declare formActive: boolean
  declare formProfileCode: string
  declare formError: string
  declare showPassword: boolean
  declare submitting: boolean

  private filterDebounce?: ReturnType<typeof setTimeout>

  constructor() {
    super()
    this.users = []
    this.allProfiles = []
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
    this.formPasswordConfirm = ''
    this.formActive = true
    this.formProfileCode = ''
    this.formError = ''
    this.showPassword = false
    this.submitting = false
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    this.loadUsers()
    this.loadProfiles()
  }

  private async loadProfiles() {
    try {
      this.allProfiles = (await apiClient.get('/profiles')) as ProfileSummary[]
    } catch {
      // The role picker is a nice-to-have on top of the user CRUD; if the
      // caller lacks profiles.read this just falls back to no role picker.
    }
  }

  private get canWrite(): boolean {
    return Session.getInstance().can('users.write')
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
    this.formPasswordConfirm = ''
    this.formActive = true
    this.formProfileCode = ''
    this.formError = ''
    this.showPassword = false
    this.modal = 'create'
  }

  private openEdit(user: UserRecord) {
    this.target = user
    this.formLogin = user.login
    this.formName = user.name ?? ''
    this.formEmail = user.email ?? ''
    // The current password is never fetched or shown; this field is only
    // populated if the admin chooses to set a new one.
    this.formPassword = ''
    this.formPasswordConfirm = ''
    this.formActive = (user.active ?? 1) === 1
    this.formProfileCode = user.profiles?.[0]?.code ?? ''
    this.formError = ''
    this.showPassword = false
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

    const isEdit = this.modal === 'edit'

    if (!isEdit && (!this.formLogin || !this.formPassword)) {
      this.formError = 'Usuario y contraseña son obligatorios.'
      return
    }
    if (!isEdit && this.allProfiles.length > 0 && !this.formProfileCode) {
      this.formError = 'Selecciona un rol para el usuario.'
      return
    }
    if (this.formPassword || !isEdit) {
      if (this.formPassword.length < MIN_PASSWORD_LENGTH) {
        this.formError = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
        return
      }
      if (this.formPassword !== this.formPasswordConfirm) {
        this.formError = 'Las contraseñas no coinciden.'
        return
      }
    }

    this.submitting = true
    try {
      const profileCodes = this.formProfileCode ? [this.formProfileCode] : []

      if (this.modal === 'create') {
        await apiClient.post('/users', {
          login: this.formLogin,
          name: this.formName || undefined,
          email: this.formEmail || undefined,
          password: this.formPassword,
          active: this.formActive ? 1 : 0,
        })
        // Role assignment is a public-registration concern the anonymous
        // /users endpoint deliberately can't grant; it's applied in a
        // second, privileged call right after the account is created.
        if (profileCodes.length > 0) {
          try {
            await apiClient.put(`/users/${encodeURIComponent(this.formLogin)}`, { profile_codes: profileCodes })
          } catch {
            this.closeModal()
            toast.error('Usuario creado, pero no se pudo asignar el rol. Edítalo para intentarlo de nuevo.')
            await this.loadUsers()
            return
          }
        }
        this.closeModal()
        toast.success('Usuario creado correctamente.')
      } else if (this.modal === 'edit' && this.target) {
        const payload: Record<string, unknown> = {
          name: this.formName || undefined,
          email: this.formEmail || undefined,
          active: this.formActive ? 1 : 0,
          profile_codes: profileCodes,
        }
        if (this.formPassword) payload.password = this.formPassword
        await apiClient.put(`/users/${encodeURIComponent(this.target.login)}`, payload)
        this.closeModal()
        toast.success('Usuario actualizado correctamente.')
      }
      await this.loadUsers()
    } catch (err) {
      this.formError = describeError(err, 'No se pudo guardar el usuario.')
    } finally {
      this.submitting = false
    }
  }

  private async confirmDelete() {
    if (!this.target) return
    const login = this.target.login
    this.submitting = true
    try {
      await apiClient.delete(`/users/${encodeURIComponent(login)}`)
      this.closeModal()
      toast.success('Usuario eliminado correctamente.')
      if (this.users.length === 1 && this.page > 1) this.page -= 1
      await this.loadUsers()
    } catch (err) {
      this.closeModal()
      toast.error(describeError(err, 'No se pudo eliminar el usuario.'))
    } finally {
      this.submitting = false
    }
  }

  private renderPasswordField(opts: {
    value: string
    placeholder: string
    autocomplete: 'new-password' | 'current-password'
    onInput: (value: string) => void
  }) {
    return html`
      <div class="relative">
        <input
          type=${this.showPassword ? 'text' : 'password'}
          placeholder=${opts.placeholder}
          autocomplete=${opts.autocomplete}
          class="h-11 w-full rounded-xl border border-[var(--border-color)] bg-white pl-4 pr-11 text-sm font-medium text-[var(--text-dark)] outline-none transition-colors duration-150 ease-out placeholder:font-normal placeholder:text-[var(--text-light)] focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[var(--primary-color)]/10"
          .value=${opts.value}
          @input=${(e: Event) => opts.onInput((e.target as HTMLInputElement).value)}
        />
        <button
          type="button"
          tabindex="-1"
          aria-label=${this.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-dark)]"
          @click=${() => (this.showPassword = !this.showPassword)}
        >
          <lucide-icon name=${this.showPassword ? 'eye-off' : 'eye'}></lucide-icon>
        </button>
      </div>
    `
  }

  private renderRoleField(isEdit: boolean) {
    if (this.allProfiles.length === 0) return nothing
    return html`
      <select
        class="h-11 w-full rounded-xl border border-[var(--border-color)] bg-white px-4 text-sm font-medium text-[var(--text-dark)] outline-none transition-colors duration-150 ease-out focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[var(--primary-color)]/10"
        .value=${this.formProfileCode}
        @change=${(e: Event) => (this.formProfileCode = (e.target as HTMLSelectElement).value)}
      >
        <option value="">${isEdit ? 'Sin rol' : 'Selecciona un rol...'}</option>
        ${this.allProfiles.map(
          (p) => html`<option value=${p.code}>${p.name}</option>`
        )}
      </select>
    `
  }

  private renderField(opts: {
    type: 'text' | 'email'
    value: string
    placeholder: string
    disabled?: boolean
    onInput: (value: string) => void
  }) {
    return html`
      <input
        type=${opts.type}
        placeholder=${opts.placeholder}
        ?disabled=${opts.disabled}
        class="h-11 w-full rounded-xl border border-[var(--border-color)] bg-white px-4 text-sm font-medium text-[var(--text-dark)] outline-none transition-colors duration-150 ease-out placeholder:font-normal placeholder:text-[var(--text-light)] focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[var(--primary-color)]/10 disabled:bg-[var(--bg-hover-light)] disabled:text-[var(--text-light)]"
        .value=${opts.value}
        @input=${(e: Event) => opts.onInput((e.target as HTMLInputElement).value)}
      />
    `
  }

  private renderFormModal() {
    const isEdit = this.modal === 'edit'
    return html`
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <form
          class="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-lg"
          @submit=${this.submitForm}
        >
          <h2 class="text-lg font-subheading text-[var(--text-dark)]">
            ${isEdit ? 'Editar usuario' : 'Crear usuario'}
          </h2>

          <div class="flex flex-col gap-3">
            ${this.renderField({
              type: 'text',
              value: this.formLogin,
              placeholder: 'Usuario',
              disabled: isEdit,
              onInput: (v) => (this.formLogin = v),
            })}
            ${this.renderField({
              type: 'text',
              value: this.formName,
              placeholder: 'Nombre',
              onInput: (v) => (this.formName = v),
            })}
            ${this.renderField({
              type: 'email',
              value: this.formEmail,
              placeholder: 'Email',
              onInput: (v) => (this.formEmail = v),
            })}
            ${this.renderPasswordField({
              value: this.formPassword,
              placeholder: isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña',
              autocomplete: 'new-password',
              onInput: (v) => (this.formPassword = v),
            })}
            ${this.renderPasswordField({
              value: this.formPasswordConfirm,
              placeholder: 'Confirmar contraseña',
              autocomplete: 'new-password',
              onInput: (v) => (this.formPasswordConfirm = v),
            })}
            <label class="flex items-center gap-2 text-sm font-medium text-[var(--text-dark)]">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-[var(--border-color)] text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                .checked=${this.formActive}
                @change=${(e: Event) => (this.formActive = (e.target as HTMLInputElement).checked)}
              />
              Activo
            </label>
            ${this.allProfiles.length > 0
              ? html`
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-[var(--text-light)]"
                      >Rol${isEdit ? '' : ' *'}</label
                    >
                    ${this.renderRoleField(isEdit)}
                  </div>
                `
              : nothing}
          </div>

          ${this.formError
            ? html`
                <p
                  class="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  <lucide-icon name="circle-alert" class="shrink-0"></lucide-icon>
                  ${this.formError}
                </p>
              `
            : nothing}

          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="flex h-11 items-center rounded-xl border border-[var(--border-color)] bg-white px-5 text-sm font-semibold text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)]"
              @click=${this.closeModal}
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex h-11 items-center rounded-xl bg-[var(--primary-color)] px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90 disabled:cursor-default disabled:opacity-60"
              ?disabled=${this.submitting}
            >
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
        <div class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-lg">
          <h2 class="text-lg font-subheading text-[var(--text-dark)]">Eliminar usuario</h2>
          <p class="text-sm text-[var(--text-muted)]">
            ¿Seguro que quieres eliminar a <strong class="text-[var(--text-dark)]">${this.target?.login}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3">
            <button
              class="flex h-11 items-center rounded-xl border border-[var(--border-color)] bg-white px-5 text-sm font-semibold text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)]"
              @click=${this.closeModal}
            >
              Cancelar
            </button>
            <button
              class="flex h-11 items-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90 disabled:cursor-default disabled:opacity-60"
              ?disabled=${this.submitting}
              @click=${this.confirmDelete}
            >
              ${this.submitting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    `
  }

  render() {
    const canWrite = this.canWrite
    return html`
      <main class="flex-1 min-h-100 bg-[var(--bg-hover-light)] p-4 sm:p-8">
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="relative w-full max-w-[420px]">
              <lucide-icon
                name="search"
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-light)]"
              ></lucide-icon>
              <input
                type="text"
                placeholder="Buscar por usuario, nombre o email..."
                class="h-12 w-full rounded-xl border border-[var(--border-color)] bg-white pl-11 pr-4 text-sm font-medium text-[var(--text-dark)] outline-none transition-colors duration-150 ease-out placeholder:font-normal placeholder:text-[var(--text-light)] focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[var(--primary-color)]/10"
                .value=${this.filter}
                @input=${this.onFilterInput}
              />
            </div>
            <div class="flex items-center gap-3">
              <button
                class="flex h-12 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-5 text-sm font-semibold text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)]"
                @click=${this.loadUsers}
              >
                <lucide-icon name="refresh-cw"></lucide-icon>
                Actualizar
              </button>
              ${canWrite
                ? html`
                    <button
                      class="flex h-12 items-center gap-2 rounded-xl bg-[var(--primary-color)] px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90"
                      @click=${this.openCreate}
                    >
                      <lucide-icon name="user-plus"></lucide-icon>
                      Crear usuario
                    </button>
                  `
                : nothing}
            </div>
          </div>

          ${this.error
            ? html`<p class="error-text">${this.error}</p>`
            : nothing}

          ${this.loading
            ? html`<p class="text-sm text-[var(--text-muted)]">Cargando...</p>`
            : html`
                <div class="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white">
                  <div class="overflow-x-auto">
                    <table class="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr>
                          <th class="px-6 py-4 font-semibold text-[var(--text-dark)]">Usuario</th>
                          <th class="px-6 py-4 font-semibold text-[var(--text-dark)]">Nombre</th>
                          <th class="px-6 py-4 font-semibold text-[var(--text-dark)]">Email</th>
                          <th class="px-6 py-4 font-semibold text-[var(--text-dark)]">Rol</th>
                          <th class="px-6 py-4 font-semibold text-[var(--text-dark)]">Activo</th>
                          ${canWrite
                            ? html`<th class="px-6 py-4 font-semibold text-[var(--text-dark)]">Acciones</th>`
                            : nothing}
                        </tr>
                      </thead>
                      <tbody>
                        ${this.users.map(
                          (u) => html`
                            <tr
                              class="border-t border-[var(--bg-neutral)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)]"
                            >
                              <td class="h-[60px] px-6">
                                <div class="flex items-center gap-3">
                                  <div
                                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-accent-light)] text-xs font-semibold text-[var(--primary-color)]"
                                  >
                                    ${initials(u.name || u.login)}
                                  </div>
                                  <span class="font-medium text-[var(--text-dark)]">${u.login}</span>
                                </div>
                              </td>
                              <td class="h-[60px] px-6 text-[var(--text-dark)]">${u.name || '—'}</td>
                              <td class="h-[60px] px-6 text-[var(--text-muted)]">${u.email || '—'}</td>
                              <td class="h-[60px] px-6">
                                ${u.profiles && u.profiles.length > 0
                                  ? html`<span
                                      class="inline-flex items-center rounded-full bg-[var(--bg-accent-light)] px-2.5 py-1 text-xs font-medium text-[var(--primary-color)]"
                                      >${u.profiles.map((p) => p.name).join(', ')}</span
                                    >`
                                  : html`<span class="text-xs text-[var(--text-light)]">Sin rol</span>`}
                              </td>
                              <td class="h-[60px] px-6">
                                ${u.active
                                  ? html`<span
                                      class="inline-flex items-center rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-medium text-[#059669]"
                                      >Activo</span
                                    >`
                                  : html`<span
                                      class="inline-flex items-center rounded-full bg-[var(--bg-neutral)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]"
                                      >Inactivo</span
                                    >`}
                              </td>
                              ${canWrite
                                ? html`
                                    <td class="h-[60px] px-6">
                                      <div class="flex items-center gap-1">
                                        <button
                                          aria-label="Editar usuario"
                                          class="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)] hover:text-[var(--primary-color)]"
                                          @click=${() => this.openEdit(u)}
                                        >
                                          <lucide-icon name="pencil"></lucide-icon>
                                        </button>
                                        <button
                                          aria-label="Eliminar usuario"
                                          class="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors duration-150 ease-out hover:bg-red-50 hover:text-red-600"
                                          @click=${() => this.openDelete(u)}
                                        >
                                          <lucide-icon name="trash-2"></lucide-icon>
                                        </button>
                                      </div>
                                    </td>
                                  `
                                : nothing}
                            </tr>
                          `
                        )}
                        ${this.users.length === 0
                          ? html`<tr>
                              <td
                                class="px-6 py-12 text-center text-sm text-[var(--text-muted)]"
                                colspan=${canWrite ? 6 : 5}
                              >
                                No hay usuarios para mostrar.
                              </td>
                            </tr>`
                          : nothing}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--text-muted)]"
                    >${this.total} usuario${this.total === 1 ? '' : 's'} en total</span
                  >
                  <div class="flex items-center gap-3">
                    <button
                      class="flex h-10 items-center rounded-full border border-[var(--border-color)] bg-white px-4 text-sm font-semibold text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
                      ?disabled=${this.page <= 1}
                      @click=${() => this.goToPage(this.page - 1)}
                    >
                      Anterior
                    </button>
                    <span class="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                      Página
                      <span
                        class="flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--primary-color)] px-2 text-xs font-semibold text-white"
                        >${this.page}</span
                      >
                      de ${this.pageCount}
                    </span>
                    <button
                      class="flex h-10 items-center rounded-full border border-[var(--border-color)] bg-white px-4 text-sm font-semibold text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white"
                      ?disabled=${this.page >= this.pageCount}
                      @click=${() => this.goToPage(this.page + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              `}
        </div>
        ${this.modal === 'create' || this.modal === 'edit' ? this.renderFormModal() : nothing}
        ${this.modal === 'delete' ? this.renderDeleteModal() : nothing}
      </main>
    `
  }
}

customElements.define('user-management', UserManagement)
