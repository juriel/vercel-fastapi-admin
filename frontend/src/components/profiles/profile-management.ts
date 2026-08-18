import { LitElement, html, nothing } from 'lit'
import { apiClient, ApiError } from '../../lib/api-client'
import { Session } from '../../session/session'
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

  private get canWrite(): boolean {
    return Session.getInstance().can('profiles.write')
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
      <label class="flex items-center gap-2 cursor-pointer text-sm py-1 text-[#0F172A]">
        <input
          type="checkbox"
          class="sr-only"
          .checked=${checked}
          @change=${() => this.togglePrivilege(privilege.code)}
        />
        <span
          class="w-9 h-5 shrink-0 rounded-full relative transition-colors ${checked
            ? 'bg-[#0B3B78]'
            : 'bg-[#E2E8F0]'}"
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

  private renderField(opts: {
    value: string
    placeholder: string
    disabled?: boolean
    onInput: (value: string) => void
  }) {
    return html`
      <input
        type="text"
        placeholder=${opts.placeholder}
        ?disabled=${opts.disabled}
        class="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] outline-none transition-colors duration-150 ease-out placeholder:font-normal placeholder:text-[#94A3B8] focus:border-[#0B3B78] focus:ring-4 focus:ring-[#0B3B78]/10 disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
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
          class="flex w-full max-w-lg max-h-[85vh] flex-col gap-4 overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-lg"
          @submit=${this.submitForm}
        >
          <h2 class="text-lg font-semibold text-[#0F172A]">
            ${isEdit ? 'Editar perfil' : 'Crear perfil'}
          </h2>

          <div class="flex flex-col gap-3">
            ${this.renderField({
              value: this.formCode,
              placeholder: 'Código',
              disabled: isEdit,
              onInput: (v) => (this.formCode = v),
            })}
            ${this.renderField({
              value: this.formName,
              placeholder: 'Nombre',
              onInput: (v) => (this.formName = v),
            })}
          </div>

          <div>
            <div class="mb-2 text-sm font-semibold text-[#0F172A]">Privilegios</div>
            <p class="mb-3 text-xs text-[#64748B]">
              Selecciona todos los privilegios que quieras asignar a este perfil.
            </p>
            <div class="flex flex-col gap-3">
              ${this.groupedPrivileges.map(
                ([category, items]) => html`
                  <div>
                    <div class="mb-1 text-xs font-semibold uppercase text-[#94A3B8]">${category}</div>
                    <div class="grid grid-cols-2 gap-x-4">${items.map((p) => this.renderSwitch(p))}</div>
                  </div>
                `
              )}
            </div>
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
              class="flex h-11 items-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] transition-colors duration-150 ease-out hover:bg-[#EFF6FF]"
              @click=${this.closeModal}
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex h-11 items-center rounded-xl bg-[#0B3B78] px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90 disabled:cursor-default disabled:opacity-60"
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
        <div class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-lg">
          <h2 class="text-lg font-semibold text-[#0F172A]">Eliminar perfil</h2>
          <p class="text-sm text-[#64748B]">
            ¿Seguro que quieres eliminar el perfil
            <strong class="text-[#0F172A]">${this.target?.name}</strong>? Esta acción no se puede
            deshacer.
          </p>
          <div class="flex justify-end gap-3">
            <button
              class="flex h-11 items-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] transition-colors duration-150 ease-out hover:bg-[#EFF6FF]"
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
      <main class="flex-1 min-h-100 bg-[#F8FAFC] p-8">
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-end gap-3">
            <button
              class="flex h-12 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] transition-colors duration-150 ease-out hover:bg-[#EFF6FF]"
              @click=${this.loadProfiles}
            >
              <lucide-icon name="refresh-cw"></lucide-icon>
              Actualizar
            </button>
            ${canWrite
              ? html`
                  <button
                    class="flex h-12 items-center gap-2 rounded-xl bg-[#0B3B78] px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90"
                    @click=${this.openCreate}
                  >
                    <lucide-icon name="plus"></lucide-icon>
                    Crear perfil
                  </button>
                `
              : nothing}
          </div>

          ${this.error ? html`<p class="error-text">${this.error}</p>` : nothing}

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
                          ${canWrite
                            ? html`<th class="px-6 py-4 font-semibold text-[#334155]">Acciones</th>`
                            : nothing}
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
                              ${canWrite
                                ? html`
                                    <td class="h-[60px] px-6">
                                      ${p.editable
                                        ? html`
                                            <div class="flex items-center gap-1">
                                              <button
                                                aria-label="Editar perfil"
                                                class="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors duration-150 ease-out hover:bg-[#EFF6FF] hover:text-[#0B3B78]"
                                                @click=${() => this.openEdit(p)}
                                              >
                                                <lucide-icon name="pencil"></lucide-icon>
                                              </button>
                                              <button
                                                aria-label="Eliminar perfil"
                                                class="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors duration-150 ease-out hover:bg-red-50 hover:text-red-600"
                                                @click=${() => this.openDelete(p)}
                                              >
                                                <lucide-icon name="trash-2"></lucide-icon>
                                              </button>
                                            </div>
                                          `
                                        : html`<span class="text-xs text-[#94A3B8]">Perfil de sistema</span>`}
                                    </td>
                                  `
                                : nothing}
                            </tr>
                          `
                        )}
                        ${this.profiles.length === 0
                          ? html`<tr>
                              <td
                                class="px-6 py-12 text-center text-sm text-[#64748B]"
                                colspan=${canWrite ? 4 : 3}
                              >
                                No hay perfiles para mostrar.
                              </td>
                            </tr>`
                          : nothing}
                      </tbody>
                    </table>
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

customElements.define('profile-management', ProfileManagement)
