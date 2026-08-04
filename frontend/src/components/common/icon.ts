import { LitElement, html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

import iconHome from '@tabler/icons/outline/home.svg?raw'
import iconUsers from '@tabler/icons/outline/users.svg?raw'
import iconUserPlus from '@tabler/icons/outline/user-plus.svg?raw'
import iconEdit from '@tabler/icons/outline/edit.svg?raw'
import iconTrash from '@tabler/icons/outline/trash.svg?raw'
import iconLogout from '@tabler/icons/outline/logout.svg?raw'
import iconDashboard from '@tabler/icons/outline/layout-dashboard.svg?raw'
import iconRefresh from '@tabler/icons/outline/refresh.svg?raw'
import iconShield from '@tabler/icons/outline/shield.svg?raw'
import iconSearch from '@tabler/icons/outline/search.svg?raw'
import iconUser from '@tabler/icons/outline/user.svg?raw'
import iconLock from '@tabler/icons/outline/lock.svg?raw'
import iconIdBadge from '@tabler/icons/outline/id-badge.svg?raw'
import iconPlus from '@tabler/icons/outline/plus.svg?raw'

const ICONS: Record<string, string> = {
  home: iconHome,
  users: iconUsers,
  'user-plus': iconUserPlus,
  edit: iconEdit,
  trash: iconTrash,
  logout: iconLogout,
  dashboard: iconDashboard,
  refresh: iconRefresh,
  shield: iconShield,
  search: iconSearch,
  user: iconUser,
  lock: iconLock,
  'id-badge': iconIdBadge,
  plus: iconPlus,
}

export type IconName = keyof typeof ICONS

export class AppIcon extends LitElement {
  static properties = {
    name: { type: String },
  }

  declare name: string

  createRenderRoot() {
    return this
  }

  render() {
    const svg = ICONS[this.name]
    return svg ? html`${unsafeSVG(svg)}` : html``
  }
}

customElements.define('app-icon', AppIcon)
