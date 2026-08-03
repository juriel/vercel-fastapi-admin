import { Session } from './session/session'

if (!Session.getInstance().isAuthenticated()) {
  window.location.href = '/login'
} else {
  import('./components/home-view')
}
