import { LitElement, html, nothing } from 'lit'
import { apiClient, ApiError } from '../../lib/api-client'
import { initialsFromIdentity, displayNameFromIdentity } from '../../lib/identity'
import '../common/lucide-icon'

interface MeResponse {
  login: string
  name?: string | null
  email?: string | null
  active?: number | null
}

const MIN_PASSWORD_LENGTH = 8

function describePasswordError(err: unknown): string {
  if (err instanceof ApiError && err.status === 400) {
    return err.message || 'No se pudo actualizar la contraseña.'
  }
  return 'No se pudo actualizar la contraseña. Inténtalo nuevamente.'
}

export class AccountSettings extends LitElement {
  static properties = {
    me: { type: Object },
    loading: { type: Boolean },
    currentPassword: { type: String },
    newPassword: { type: String },
    confirmPassword: { type: String },
    showPassword: { type: Boolean },
    passwordError: { type: String },
    passwordSuccess: { type: Boolean },
    submitting: { type: Boolean },
  }

  declare me: MeResponse | null
  declare loading: boolean
  declare currentPassword: string
  declare newPassword: string
  declare confirmPassword: string
  declare showPassword: boolean
  declare passwordError: string
  declare passwordSuccess: boolean
  declare submitting: boolean

  constructor() {
    super()
    this.me = null
    this.loading = false
    this.currentPassword = ''
    this.newPassword = ''
    this.confirmPassword = ''
    this.showPassword = false
    this.passwordError = ''
    this.passwordSuccess = false
    this.submitting = false
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    this.loadMe()
  }

  private async loadMe() {
    this.loading = true
    try {
      this.me = (await apiClient.get('/me')) as MeResponse
    } catch {
      this.me = null
    } finally {
      this.loading = false
    }
  }

  private async submitPasswordChange(e: Event) {
    e.preventDefault()
    this.passwordError = ''
    this.passwordSuccess = false

    if (this.newPassword.length < MIN_PASSWORD_LENGTH) {
      this.passwordError = `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      return
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden.'
      return
    }
    if (this.newPassword === this.currentPassword) {
      this.passwordError = 'La nueva contraseña debe ser distinta a la actual.'
      return
    }

    this.submitting = true
    try {
      await apiClient.put('/me/password', {
        current_password: this.currentPassword,
        new_password: this.newPassword,
      })
      this.passwordSuccess = true
      this.currentPassword = ''
      this.newPassword = ''
      this.confirmPassword = ''
      this.showPassword = false
    } catch (err) {
      this.passwordError = describePasswordError(err)
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
        <lucide-icon
          name="lock"
          class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        ></lucide-icon>
        <input
          type=${this.showPassword ? 'text' : 'password'}
          placeholder=${opts.placeholder}
          autocomplete=${opts.autocomplete}
          required
          class="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-11 text-sm font-medium text-[#0F172A] outline-none transition-colors duration-150 ease-out placeholder:font-normal placeholder:text-[#94A3B8] focus:border-[#0B3B78] focus:ring-4 focus:ring-[#0B3B78]/10"
          .value=${opts.value}
          @input=${(e: Event) => opts.onInput((e.target as HTMLInputElement).value)}
        />
        <button
          type="button"
          tabindex="-1"
          aria-label=${this.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
          @click=${() => (this.showPassword = !this.showPassword)}
        >
          <lucide-icon name=${this.showPassword ? 'eye-off' : 'eye'}></lucide-icon>
        </button>
      </div>
    `
  }

  private renderAccountCard() {
    const name = this.me ? displayNameFromIdentity(this.me.name || this.me.login) : ''
    return html`
      <div class="flex flex-col gap-6 rounded-2xl border border-[#E2E8F0] bg-white p-6">
        <h2 class="text-base font-semibold text-[#0F172A]">Información de la cuenta</h2>
        ${this.loading
          ? html`<p class="text-sm text-[#64748B]">Cargando...</p>`
          : this.me
            ? html`
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-lg font-semibold text-[#0B3B78]"
                  >
                    ${initialsFromIdentity(this.me.name || this.me.login)}
                  </div>
                  <div class="flex min-w-0 flex-col">
                    <span class="truncate text-base font-semibold text-[#0F172A]">${name}</span>
                    <span class="truncate text-sm text-[#64748B]">@${this.me.login}</span>
                  </div>
                </div>
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="flex flex-col gap-1">
                    <dt class="text-xs font-medium text-[#94A3B8]">Email</dt>
                    <dd class="text-sm font-medium text-[#0F172A]">${this.me.email || '—'}</dd>
                  </div>
                  <div class="flex flex-col gap-1">
                    <dt class="text-xs font-medium text-[#94A3B8]">Estado</dt>
                    <dd>
                      ${this.me.active
                        ? html`<span
                            class="inline-flex items-center rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-medium text-[#059669]"
                            >Activo</span
                          >`
                        : html`<span
                            class="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#64748B]"
                            >Inactivo</span
                          >`}
                    </dd>
                  </div>
                </dl>
              `
            : html`<p class="error-text">No se pudo cargar la información de la cuenta.</p>`}
      </div>
    `
  }

  private renderPasswordCard() {
    return html`
      <div class="flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-6">
        <div class="flex flex-col gap-1">
          <h2 class="text-base font-semibold text-[#0F172A]">Cambiar contraseña</h2>
          <p class="text-sm text-[#64748B]">
            Usa una contraseña de al menos ${MIN_PASSWORD_LENGTH} caracteres que no utilices en
            otros sitios.
          </p>
        </div>

        <form class="flex max-w-md flex-col gap-3" @submit=${this.submitPasswordChange}>
          ${this.renderPasswordField({
            value: this.currentPassword,
            placeholder: 'Contraseña actual',
            autocomplete: 'current-password',
            onInput: (v) => (this.currentPassword = v),
          })}
          ${this.renderPasswordField({
            value: this.newPassword,
            placeholder: 'Nueva contraseña',
            autocomplete: 'new-password',
            onInput: (v) => (this.newPassword = v),
          })}
          ${this.renderPasswordField({
            value: this.confirmPassword,
            placeholder: 'Confirmar nueva contraseña',
            autocomplete: 'new-password',
            onInput: (v) => (this.confirmPassword = v),
          })}

          ${this.passwordError
            ? html`
                <p
                  class="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  <lucide-icon name="circle-alert" class="shrink-0"></lucide-icon>
                  ${this.passwordError}
                </p>
              `
            : nothing}
          ${this.passwordSuccess
            ? html`
                <p
                  class="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                >
                  <lucide-icon name="circle-check" class="shrink-0"></lucide-icon>
                  Contraseña actualizada correctamente.
                </p>
              `
            : nothing}

          <div class="mt-1 flex justify-end">
            <button
              type="submit"
              class="flex h-11 items-center rounded-xl bg-[#0B3B78] px-5 text-sm font-semibold text-white transition-opacity duration-150 ease-out hover:opacity-90 disabled:cursor-default disabled:opacity-60"
              ?disabled=${this.submitting}
            >
              ${this.submitting ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    `
  }

  render() {
    return html`
      <main class="flex-1 min-h-100 bg-[#F8FAFC] p-8">
        <div class="mx-auto flex max-w-3xl flex-col gap-6">
          ${this.renderAccountCard()} ${this.renderPasswordCard()}
        </div>
      </main>
    `
  }
}

customElements.define('account-settings', AccountSettings)
