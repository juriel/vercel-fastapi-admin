import { LitElement, html } from 'lit'
import './register-form'

export class RegisterPage extends LitElement {
  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    document.title = 'Crear cuenta - Hello World'
  }

  render() {
    return html`
      <div class="flex min-h-screen">
        <main class="flex-1 flex items-center justify-center p-4 sm:p-8">
          <register-form></register-form>
        </main>
      </div>
    `
  }
}

customElements.define('register-page', RegisterPage)
