import { LitElement, html } from 'lit'
import { apiClient, ApiError } from '../lib/api-client'
import { Session, SessionData } from '../session/session'

export class LoginForm extends LitElement {
  static properties = {
    login: { type: String },
    password: { type: String },
    error: { type: String },
    loading: { type: Boolean },
  }

  declare login: string
  declare password: string
  declare error: string
  declare loading: boolean

  constructor() {
    super()
    this.login = ''
    this.password = ''
    this.error = ''
    this.loading = false
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    // Landing on the login page always starts a fresh session.
    Session.getInstance().clear()
  }

  private onLoginInput(e: Event) {
    this.login = (e.target as HTMLInputElement).value
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
      const data = (await apiClient.post(
        '/login',
        { login: this.login, password: this.password },
        false
      )) as SessionData
      Session.getInstance().set(data)
      window.location.href = '/'
    } catch (err) {
      this.error =
        err instanceof ApiError && err.status === 401
          ? 'Usuario o contraseña incorrectos.'
          : 'No se pudo contactar al servidor.'
    } finally {
      this.loading = false
    }
  }

  render() {
    return html`
      <form class="card" @submit=${this.submit}>
        <h1 class="text-xl font-semibold m-0 mb-2">Iniciar sesión</h1>
        <input
          type="text"
          placeholder="Usuario"
          autocomplete="username"
          class="field"
          .value=${this.login}
          @input=${this.onLoginInput}
        />
        <input
          type="password"
          placeholder="Contraseña"
          autocomplete="current-password"
          class="field"
          .value=${this.password}
          @input=${this.onPasswordInput}
        />
        <button type="submit" ?disabled=${this.loading} class="btn">
          ${this.loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        ${this.error ? html`<p class="error-text">${this.error}</p>` : ''}
      </form>
    `
  }
}

customElements.define('login-form', LoginForm)
