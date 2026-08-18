import { LitElement, html } from 'lit'
import './login-form'

export class LoginPage extends LitElement {
  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    document.title = 'Iniciar sesión - Hello World'
  }

  render() {
    return html`
      <div class="flex min-h-screen">
        <div
          class="hidden md:block flex-1 bg-cover bg-center"
          style="background-image: url('/background-login.png')"
        ></div>
        <main class="flex-1 flex items-center justify-center p-4 sm:p-8">
          <login-form></login-form>
        </main>
      </div>
    `
  }
}

customElements.define('login-page', LoginPage)
