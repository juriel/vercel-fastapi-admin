import { LitElement, html, css } from 'lit'
import { Session, Privilege } from '../session/session'
import { apiClient } from '../lib/api-client'
import './hello-form'

export class HomeView extends LitElement {
  static properties = {
    identity: { type: String },
    privileges: { type: Array },
  }

  declare identity: string
  declare privileges: Privilege[]

  static styles = css`
    :host {
      display: block;
      font-family: inherit;
    }
    .card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 24rem;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    h1 {
      font-size: 1.25rem;
      margin: 0;
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 0.5rem 0;
    }
    button {
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #3a3a3a;
      background: transparent;
      color: inherit;
      font-size: 0.875rem;
      cursor: pointer;
    }
    ul {
      margin: 0;
      padding-left: 1.25rem;
    }
    .code {
      opacity: 0.6;
      font-size: 0.85em;
    }
    hr {
      border: none;
      border-top: 1px solid #3a3a3a;
      width: 100%;
    }
  `

  constructor() {
    super()
    const session = Session.getInstance()
    this.identity = session.identity ?? ''
    this.privileges = session.privileges
  }

  private async logout() {
    try {
      await apiClient.post('/logout')
    } catch {
      // ignore network errors on logout; clear the local session regardless
    }
    Session.getInstance().clear()
    window.location.href = '/login'
  }

  render() {
    return html`
      <div class="card">
        <div class="header">
          <h1>Bienvenido, ${this.identity}</h1>
          <button @click=${this.logout}>Cerrar sesión</button>
        </div>

        <div>
          <h2>Privilegios</h2>
          ${this.privileges.length
            ? html`
                <ul>
                  ${this.privileges.map(
                    (p) => html`<li>${p.name} <span class="code">(${p.code})</span></li>`
                  )}
                </ul>
              `
            : html`<p>No tienes privilegios asignados.</p>`}
        </div>

        <hr />
        <hello-form></hello-form>
      </div>
    `
  }
}

customElements.define('home-view', HomeView)
