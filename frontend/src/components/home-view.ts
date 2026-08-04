import { LitElement, html } from 'lit'
import { Session, Privilege } from '../session/session'
import './app-header'
import './app-sidebar'
import './app-content'
import './app-footer'

export class HomeView extends LitElement {
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

  render() {
    return html`
      <div class="flex flex-col min-h-screen">
        <app-header .identity=${this.identity}></app-header>
        <div class="flex flex-1">
          <app-sidebar .privileges=${this.privileges}></app-sidebar>
          <app-content .identity=${this.identity} .privileges=${this.privileges}></app-content>
        </div>
        <app-footer></app-footer>
      </div>
    `
  }
}

customElements.define('home-view', HomeView)
