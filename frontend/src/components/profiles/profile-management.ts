import { LitElement, html } from 'lit'
import { apiClient, ApiError } from '../../lib/api-client'
import '../common/lucide-icon'

interface Privilege {
  code: string
  name: string
  category: string
}

interface ProfileRecord {
  code: string
  name: string
  editable: number
  privileges: Privilege[]
}

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: 'Acceso completo al sistema',
  ADMINISTRADOR: 'Acceso completo al sistema',
  SUPERVISOR: 'Gestiona equipos y usuarios',
  OPERADOR: 'Acceso operativo',
  VENTAS: 'Acceso al módulo comercial',
}

function describeProfile(code: string): string {
  return PROFILE_DESCRIPTIONS[code.toUpperCase()] ?? 'Perfil personalizado de la organización'
}

type Modal = 'none' | 'create' | 'edit' | 'delete'

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 403) {
    return 'No tienes permiso para realizar esta acción.'
  }
  if (err instanceof ApiError && err.status === 400) {
    return err.message || 'Solicitud inválida.'
  }
  return fallback
}

export class ProfileManagement extends LitElement {
  static properties = {
    profiles: { type: Array },
    allPrivileges: { type: Array },
    loading: { type: Boolean },
    error: { type: String },
    modal: { type: String },
    target: { type: Object },
    formCode: { type: String },
    formName: { type: String },
    formPrivilegeCodes: { type: Object },
    formError: { type: String },
    submitting: { type: Boolean },
  }

  declare profiles: ProfileRecord[]
  declare allPrivileges: Privilege[]
  declare loading: boolean
  declare error: string
  declare modal: Modal
  declare target: ProfileRecord | null
  declare formCode: string
  declare formName: string
  declare formPrivilegeCodes: Set<string>
  declare formError: string
  declare submitting: boolean

  constructor() {
    super()
    this.profiles = []
    this.allPrivileges = []
    this.loading = false
    this.error = ''
    this.modal = 'none'
    this.target = null
    this.formCode = ''
    this.formName = ''
    this.formPrivilegeCodes = new Set()
    this.formError = ''
    this.submitting = false
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    this.loadProfiles()
    this.loadPrivileges()
  }

  private get groupedPrivileges(): [string, Privilege[]][] {
    const groups = new Map<string, Privilege[]>()
    for (const p of this.allPrivileges) {
      const list = groups.get(p.category) ?? []
      list.push(p)
      groups.set(p.category, list)
    }
    return [...groups.entries()]
  }

  private async loadProfiles() {
    this.loading = true
    this.error = ''
    try {
      this.profiles = (await apiClient.get('/profiles')) as ProfileRecord[]
    } catch (err) {
      this.error = describeError(err, 'No se pudo cargar la lista de perfiles.')
    } finally {
      this.loading = false
    }
  }

  private async loadPrivileges() {
    try {
      this.allPrivileges = (await apiClient.get('/privileges')) as Privilege[]
    } catch {
      // The privilege catalog is only needed to build the switches; a
      // failure here shouldn't block viewing the profile list itself.
    }
  }

  private openCreate() {
    this.formCode = ''
    this.formName = ''
    this.formPrivilegeCodes = new Set()
    this.formError = ''
    this.modal = 'create'
  }

  private openEdit(profile: ProfileRecord) {
    this.target = profile
    this.formCode = profile.code
    this.formName = profile.name
    this.formPrivilegeCodes = new Set(profile.privileges.map((p) => p.code))
    this.formError = ''
    this.modal = 'edit'
  }

  private openDelete(profile: ProfileRecord) {
    this.target = profile
    this.modal = 'delete'
  }

  private closeModal() {
    this.modal = 'none'
    this.target = null
  }

  private togglePrivilege(code: string) {
    const next = new Set(this.formPrivilegeCodes)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    this.formPrivilegeCodes = next
  }

  private async submitForm(e: Event) {
    e.preventDefault()
    this.formError = ''

    if (this.modal === 'create' && !this.formCode) {
      this.formError = 'El código del perfil es obligatorio.'
      return
    }

    this.submitting = true
    try {
      if (this.modal === 'create') {
        await apiClient.post('/profiles', {
          code: this.formCode,
          name: this.formName,
          privilege_codes: [...this.formPrivilegeCodes],
        })
      } else if (this.modal === 'edit' && this.target) {
        await apiClient.put(`/profiles/${encodeURIComponent(this.target.code)}`, {
          name: this.formName,
          privilege_codes: [...this.formPrivilegeCodes],
        })
      }
      this.closeModal()
      await this.loadProfiles()
    } catch (err) {
      this.formError = describeError(err, 'No se pudo guardar el perfil.')
    } finally {
      this.submitting = false
    }
  }

  private async confirmDelete() {
    if (!this.target) return
    this.submitting = true
    try {
      await apiClient.delete(`/profiles/${encodeURIComponent(this.target.code)}`)
      this.closeModal()
      await this.loadProfiles()
    } catch (err) {
      this.error = describeError(err, 'No se pudo eliminar el perfil.')
      this.closeModal()
    } finally {
      this.submitting = false
    }
  }

  private renderSwitch(privilege: Privilege) {
    const checked = this.formPrivilegeCodes.has(privilege.code)
    return html`
      <label class="flex items-center gap-2 cursor-pointer text-sm py-1">
        <input
          type="checkbox"
          class="sr-only"
          .checked=${checked}
          @change=${() => this.togglePrivilege(privilege.code)}
        />
        <span
          class="w-9 h-5 shrink-0 rounded-full relative transition-colors ${checked
            ? 'bg-[var(--primary-color2)]'
            : 'bg-[var(--border-input)]'}"
        >
          <span
            class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked
              ? 'translate-x-[18px]'
              : 'translate-x-0.5'}"
          ></span>
        </span>
        ${privilege.name}
      </label>
    `
  }

  private renderFormModal() {
    const isEdit = this.modal === 'edit'
    return html`
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <form
          class="card bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
          @submit=${this.submitForm}
        >
          <h2 class="text-lg font-semibold m-0 mb-1 text-[var(--primary-color2)]">
            ${isEdit ? 'Editar perfil' : 'Crear perfil'}
          </h2>
          <input
            type="text"
            placeholder="Código"
            class="field"
            .value=${this.formCode}
            ?disabled=${isEdit}
            @input=${(e: Event) => (this.formCode = (e.target as HTMLInputElement).value)}
          />
          <input
            type="text"
            placeholder="Nombre"
            class="field"
            .value=${this.formName}
            @input=${(e: Event) => (this.formName = (e.target as HTMLInputElement).value)}
          />
          <div>
            <div class="text-sm font-semibold mb-2">Privilegios</div>
            <div class="flex flex-col gap-3">
              ${this.groupedPrivileges.map(
                ([category, items]) => html`
                  <div>
                    <div class="text-xs uppercase opacity-60 mb-1">${category}</div>
                    <div class="grid grid-cols-2 gap-x-4">
                      ${items.map((p) => this.renderSwitch(p))}
                    </div>
                  </div>
                `
              )}
            </div>
          </div>
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
            Eliminar perfil
          </h2>
          <p class="text-sm">
            ¿Seguro que quieres eliminar el perfil <strong>${this.target?.name}</strong>? Esta
            acción no se puede deshacer.
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
          <div class="flex items-center justify-end gap-3">
            <button
              class="flex h-12 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] transition-colors duration-150 ease-out hover:bg-[#EFF6FF]"
              @click=${this.loadProfiles}
            >
              <lucide-icon name="refresh-cw"></lucide-icon>
              Actualizar
            </button>
            <button
              class="flex h-12 items-center gap-2 rounded-xl bg-[#0B3B78] px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90"
              @click=${this.openCreate}
            >
              <lucide-icon name="plus"></lucide-icon>
              Crear perfil
            </button>
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
                          <th class="px-6 py-4 font-semibold text-[#334155]">Código</th>
                          <th class="px-6 py-4 font-semibold text-[#334155]">Nombre</th>
                          <th class="px-6 py-4 font-semibold text-[#334155]">Privilegios</th>
                          <th class="px-6 py-4 text-right font-semibold text-[#334155]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this.profiles.map(
                          (p) => html`
                            <tr
                              class="border-t border-[#F1F5F9] transition-colors duration-150 ease-out hover:bg-[#EFF6FF]"
                            >
                              <td class="h-[60px] px-6">
                                <span
                                  class="inline-flex items-center rounded-md bg-[#F1F5F9] px-2 py-1 font-mono text-xs text-[#334155]"
                                  >${p.code}</span
                                >
                              </td>
                              <td class="h-[60px] px-6">
                                <div class="flex flex-col">
                                  <span class="font-semibold text-[#0F172A]">${p.name}</span>
                                  <span class="text-xs text-[#64748B]">${describeProfile(p.code)}</span>
                                </div>
                              </td>
                              <td class="h-[60px] px-6">
                                <span
                                  class="inline-flex items-center rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-medium text-[#0B3B78]"
                                >
                                  ${p.privileges.length} privilegio${p.privileges.length === 1 ? '' : 's'}
                                </span>
                              </td>
                              <td class="h-[60px] px-6 text-right">
                                <button
                                  aria-label="Más acciones"
                                  title=${p.editable ? '' : 'No editable'}
                                  ?disabled=${!p.editable}
                                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors duration-150 ease-out hover:bg-[#EFF6FF] hover:text-[#0B3B78] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#64748B]"
                                >
                                  <lucide-icon name="more-horizontal"></lucide-icon>
                                </button>
                              </td>
                            </tr>
                          `
                        )}
                        ${this.profiles.length === 0
                          ? html`<tr>
                              <td class="px-6 py-12 text-center text-sm text-[#64748B]" colspan="4">
                                No hay perfiles para mostrar.
                              </td>
                            </tr>`
                          : ''}
                      </tbody>
                    </table>
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

customElements.define('profile-management', ProfileManagement)
