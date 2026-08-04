import { LitElement, html } from 'lit'
import { Router } from '@vaadin/router'
import './views/home-view'
import './views/users-view'
import './views/profiles-view'
import './auth/login-page'
import './auth/register-page'
import './auth/forgot-password-page'

export class AppRoot extends LitElement {
  createRenderRoot() {
    return this
  }

  firstUpdated() {
    const router = new Router(this.querySelector('#outlet'))
    router.setRoutes([
      { path: '/', component: 'home-view' },
      { path: '/login', component: 'login-page' },
      { path: '/register', component: 'register-page' },
      { path: '/forgot-password', component: 'forgot-password-page' },
      { path: '/users', component: 'users-view' },
      { path: '/profiles', component: 'profiles-view' },
      { path: '(.*)', redirect: '/' },
    ])
  }

  render() {
    return html`<div id="outlet"></div>`
  }
}

customElements.define('app-root', AppRoot)
