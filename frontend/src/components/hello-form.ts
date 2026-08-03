import { LitElement, html, css } from 'lit'
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
    .row {
      display: flex;
      gap: 0.5rem;
    }
    input {
      flex: 1;
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
    this.name = ''
    this.message = ''
    this.loading = false
    this.error = ''
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
        <div class="row">
          <input
            type="text"
            placeholder="Enter your name"
            .value=${this.name}
            @input=${this.onInput}
            @keydown=${(e: KeyboardEvent) =>
              e.key === 'Enter' && this.callHello()}
          />
          <button ?disabled=${this.loading} @click=${this.callHello}>
            ${this.loading ? 'Loading...' : 'Say Hello'}
          </button>
        </div>
        ${this.message ? html`<p>${this.message}</p>` : ''}
        ${this.error ? html`<p class="error">${this.error}</p>` : ''}
      </div>
    `
  }
}

customElements.define('hello-form', HelloForm)
