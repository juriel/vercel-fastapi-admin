import { LitElement, html } from 'lit'
import { Session, Privilege } from '../../session/session'
import '../layout/app-header'
import '../layout/app-sidebar'
import '../profiles/profile-management'
import '../layout/app-footer'

export class ProfilesView extends LitElement {
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
    document.title = 'Perfiles - Hello World'
    if (!Session.getInstance().isAuthenticated()) {
      window.location.href = '/login'
    }
  }

  render() {
    return html`
      <div class="flex flex-col min-h-screen">
        <app-header
          .identity=${this.identity}
          pageTitle="Perfiles"
          pageSubtitle="Define roles y privilegios para los usuarios de la organización."
        ></app-header>
        <div class="flex flex-1">
          <app-sidebar .privileges=${this.privileges}></app-sidebar>
          <profile-management></profile-management>
        </div>
        <app-footer></app-footer>
      </div>
    `
  }
}

customElements.define('profiles-view', ProfilesView)
