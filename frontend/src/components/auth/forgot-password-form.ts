import { LitElement, html } from 'lit'

export class ForgotPasswordForm extends LitElement {
  static properties = {
    login: { type: String },
    submitted: { type: Boolean },
  }

  declare login: string
  declare submitted: boolean

  constructor() {
    super()
    this.login = ''
    this.submitted = false
  }

  createRenderRoot() {
    return this
  }

  private onLoginInput(e: Event) {
    this.login = (e.target as HTMLInputElement).value
  }

  private submit(e: Event) {
    e.preventDefault()
    this.submitted = true
  }

  render() {
    if (this.submitted) {
      return html`
        <div class="card">
          <img src="/aixa-logo.svg" alt="Aixa" class="w-24 mx-auto mb-2" />
          <h1 class="text-xl font-semibold m-0 mb-2 text-[var(--primary-color2)]">
            Solicitud enviada
          </h1>
          <p>
            Si existe una cuenta con ese usuario, un administrador se pondrá en contacto para
            ayudarte a recuperar el acceso.
          </p>
          <a href="/login" class="text-sm text-[var(--clr-link)]">Volver a iniciar sesión</a>
        </div>
      `
    }

    return html`
      <form class="card" @submit=${this.submit}>
        <img src="/aixa-logo.svg" alt="Aixa" class="w-24 mx-auto mb-2" />
        <h1 class="text-xl font-semibold m-0 mb-2 text-[var(--primary-color2)]">
          Recuperar contraseña
        </h1>
        <p class="text-sm">
          Ingresa tu usuario y un administrador te ayudará a recuperar el acceso.
        </p>
        <input
          type="text"
          placeholder="Usuario"
          class="field"
          .value=${this.login}
          @input=${this.onLoginInput}
          required
        />
        <button type="submit" class="btn">Enviar solicitud</button>
        <a href="/login" class="text-sm text-[var(--clr-link)]">Volver a iniciar sesión</a>
      </form>
    `
  }
}

customElements.define('forgot-password-form', ForgotPasswordForm)
