import { LitElement, html } from 'lit'
import { apiClient, ApiError } from '../lib/api-client'

export class RegisterForm extends LitElement {
  static properties = {
    login: { type: String },
    password: { type: String },
    name: { type: String },
    error: { type: String },
    loading: { type: Boolean },
    success: { type: Boolean },
  }

  declare login: string
  declare password: string
  declare name: string
  declare error: string
  declare loading: boolean
  declare success: boolean

  constructor() {
    super()
    this.login = ''
    this.password = ''
    this.name = ''
    this.error = ''
    this.loading = false
    this.success = false
  }

  createRenderRoot() {
    return this
  }

  private onLoginInput(e: Event) {
    this.login = (e.target as HTMLInputElement).value
  }

  private onNameInput(e: Event) {
    this.name = (e.target as HTMLInputElement).value
  }

  private onPasswordInput(e: Event) {
    this.password = (e.target as HTMLInputElement).value
  }

  private async submit(e: Event) {
    e.preventDefault()
    this.error = ''

    if (!this.login || !this.password) {
      this.error = 'Ingresa usuario y contraseña.'
      return
    }

    this.loading = true
    try {
      await apiClient.post(
        '/users',
        { login: this.login, password: this.password, name: this.name || undefined },
        false
      )
      this.success = true
    } catch (err) {
      this.error =
        err instanceof ApiError && err.status === 400
          ? 'Ese usuario ya existe.'
          : 'No se pudo crear la cuenta.'
    } finally {
      this.loading = false
    }
  }

  render() {
    if (this.success) {
      return html`
        <div class="card">
          <img src="/aixa-logo.svg" alt="Aixa" class="w-24 mx-auto mb-2" />
          <h1 class="text-xl font-semibold m-0 mb-2 text-[var(--primary-color2)]">
            Cuenta creada
          </h1>
          <p>Ya puedes <a href="/login" class="text-[var(--clr-link)]">iniciar sesión</a>.</p>
        </div>
      `
    }

    return html`
      <form class="card" @submit=${this.submit}>
        <img src="/aixa-logo.svg" alt="Aixa" class="w-24 mx-auto mb-2" />
        <h1 class="text-xl font-semibold m-0 mb-2 text-[var(--primary-color2)]">Crear cuenta</h1>
        <input
          type="text"
          placeholder="Usuario"
          autocomplete="username"
          class="field"
          .value=${this.login}
          @input=${this.onLoginInput}
        />
        <input
          type="text"
          placeholder="Nombre (opcional)"
          class="field"
          .value=${this.name}
          @input=${this.onNameInput}
        />
        <input
          type="password"
          placeholder="Contraseña"
          autocomplete="new-password"
          class="field"
          .value=${this.password}
          @input=${this.onPasswordInput}
        />
        <button type="submit" ?disabled=${this.loading} class="btn">
          ${this.loading ? 'Creando...' : 'Registrarme'}
        </button>
        ${this.error ? html`<p class="error-text">${this.error}</p>` : ''}
        <a href="/login" class="text-sm text-[var(--clr-link)]">Ya tengo cuenta</a>
      </form>
    `
  }
}

customElements.define('register-form', RegisterForm)
