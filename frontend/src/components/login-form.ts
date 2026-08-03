import { LitElement, html, css } from 'lit'
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

  static styles = css`
    :host {
      display: block;
      font-family: inherit;
    }
    .card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 20rem;
    }
    h1 {
      font-size: 1.25rem;
      margin: 0 0 0.5rem 0;
    }
    input {
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #3a3a3a;
      background: transparent;
      color: inherit;
      font-size: 1rem;
    }
    button {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      background: #0070f3;
      color: white;
      font-size: 1rem;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
    p {
      margin: 0;
    }
    .error {
      color: #ef4444;
    }
  `

  constructor() {
    super()
    this.login = ''
    this.password = ''
    this.error = ''
    this.loading = false
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
        <h1>Iniciar sesión</h1>
        <input
          type="text"
          placeholder="Usuario"
          autocomplete="username"
          .value=${this.login}
          @input=${this.onLoginInput}
        />
        <input
          type="password"
          placeholder="Contraseña"
          autocomplete="current-password"
          .value=${this.password}
          @input=${this.onPasswordInput}
        />
        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      </form>
    `
  }
}

customElements.define('login-form', LoginForm)
