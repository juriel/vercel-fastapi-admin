import { LitElement, html } from 'lit'
import { Session } from '../../session/session'
import '../layout/app-header'
import '../layout/app-sidebar'
import '../account/account-settings'
import '../layout/app-footer'

export class MyProfileView extends LitElement {
  static properties = {
    identity: { type: String },
    privileges: { type: Array },
  }

  declare identity: string
  declare privileges: import('../../session/session').Privilege[]

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
    document.title = 'Mi perfil - Hello World'
    if (!Session.getInstance().isAuthenticated()) {
      window.location.href = '/login'
    }
  }

  render() {
    return html`
      <div class="flex flex-col min-h-screen">
        <app-header
          .identity=${this.identity}
          pageTitle="Mi perfil"
          pageSubtitle="Administra tu información y tu contraseña."
        ></app-header>
        <div class="flex flex-1">
          <app-sidebar .privileges=${this.privileges}></app-sidebar>
          <account-settings></account-settings>
        </div>
        <app-footer></app-footer>
      </div>
    `
  }
}

customElements.define('my-profile-view', MyProfileView)
