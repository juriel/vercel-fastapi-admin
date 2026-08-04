import { LitElement, html } from 'lit'
import { API_BASE } from '../constants'

export class HelloForm extends LitElement {
  static properties = {
    name: { type: String },
    message: { type: String },
    loading: { type: Boolean },
    error: { type: String },
  }

  declare name: string
  declare message: string
  declare loading: boolean
  declare error: string

  constructor() {
    super()
    this.name = ''
    this.message = ''
    this.loading = false
    this.error = ''
  }

  createRenderRoot() {
    return this
  }

  private onInput(e: Event) {
    this.name = (e.target as HTMLInputElement).value
  }

  private async callHello() {
    this.loading = true
    this.error = ''
    try {
      const res = await fetch(
        `${API_BASE}/hello?name=${encodeURIComponent(this.name)}`
      )
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      this.message = data.message
    } catch (err) {
      this.error = 'Could not reach the server. Please try again.'
      this.message = ''
    } finally {
      this.loading = false
    }
  }

  render() {
    return html`
      <div class="card">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Enter your name"
            class="field flex-1"
            .value=${this.name}
            @input=${this.onInput}
            @keydown=${(e: KeyboardEvent) =>
              e.key === 'Enter' && this.callHello()}
          />
          <button ?disabled=${this.loading} @click=${this.callHello} class="btn">
            ${this.loading ? 'Loading...' : 'Say Hello'}
          </button>
        </div>
        ${this.message ? html`<p class="m-0">${this.message}</p>` : ''}
        ${this.error ? html`<p class="error-text">${this.error}</p>` : ''}
      </div>
    `
  }
}

customElements.define('hello-form', HelloForm)
