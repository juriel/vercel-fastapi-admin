import { LitElement, html } from 'lit'
import { Session, Privilege } from '../../session/session'
import '../layout/app-header'
import '../layout/app-sidebar'
import '../users/user-management'
import '../layout/app-footer'

export class UsersView extends LitElement {
  static properties = {
    identity: { type: String },
    privileges: { type: Array },
  }

  declare identity: string
  declare privileges: Privilege[]

  constructor() {
    super()
    const session = Session.getInstance()
    this.identity = session.identity ?? ''
    this.privileges = session.privileges
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    document.title = 'Usuarios - Hello World'
    if (!Session.getInstance().isAuthenticated()) {
      window.location.href = '/login'
    }
  }

  render() {
    return html`
      <div class="flex flex-col min-h-screen">
        <app-header
          .identity=${this.identity}
          pageTitle="Usuarios"
          pageSubtitle="Administra los usuarios y permisos de la organización."
        ></app-header>
        <div class="flex flex-1">
          <app-sidebar .privileges=${this.privileges}></app-sidebar>
          <user-management></user-management>
        </div>
        <app-footer></app-footer>
      </div>
    `
  }
}

customElements.define('users-view', UsersView)
