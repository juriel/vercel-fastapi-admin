import { LitElement, html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

import iconHome from 'lucide-static/icons/home.svg?raw'
import iconBuilding2 from 'lucide-static/icons/building-2.svg?raw'
import iconUsers from 'lucide-static/icons/users.svg?raw'
import iconSettings from 'lucide-static/icons/settings.svg?raw'
import iconIdCard from 'lucide-static/icons/id-card.svg?raw'
import iconPanelLeft from 'lucide-static/icons/panel-left.svg?raw'
import iconLogOut from 'lucide-static/icons/log-out.svg?raw'
import iconBell from 'lucide-static/icons/bell.svg?raw'
import iconCircleHelp from 'lucide-static/icons/circle-help.svg?raw'
import iconSearch from 'lucide-static/icons/search.svg?raw'
import iconChevronDown from 'lucide-static/icons/chevron-down.svg?raw'
import iconUser from 'lucide-static/icons/user.svg?raw'
import iconRefreshCw from 'lucide-static/icons/refresh-cw.svg?raw'
import iconUserPlus from 'lucide-static/icons/user-plus.svg?raw'
import iconMoreHorizontal from 'lucide-static/icons/more-horizontal.svg?raw'
import iconBot from 'lucide-static/icons/bot.svg?raw'
import iconZap from 'lucide-static/icons/zap.svg?raw'
import iconBookOpen from 'lucide-static/icons/book-open.svg?raw'
import iconPlug2 from 'lucide-static/icons/plug-2.svg?raw'
import iconArrowRight from 'lucide-static/icons/arrow-right.svg?raw'
import iconPlus from 'lucide-static/icons/plus.svg?raw'
import iconReceipt from 'lucide-static/icons/receipt.svg?raw'
import iconEye from 'lucide-static/icons/eye.svg?raw'
import iconPencil from 'lucide-static/icons/pencil.svg?raw'
import iconTrash2 from 'lucide-static/icons/trash-2.svg?raw'
import iconPaperclip from 'lucide-static/icons/paperclip.svg?raw'
import iconX from 'lucide-static/icons/x.svg?raw'
import iconEyeOff from 'lucide-static/icons/eye-off.svg?raw'
import iconLock from 'lucide-static/icons/lock.svg?raw'
import iconCircleCheck from 'lucide-static/icons/check-circle-2.svg?raw'
import iconCircleAlert from 'lucide-static/icons/circle-alert.svg?raw'
import iconMenu from 'lucide-static/icons/menu.svg?raw'

const ICONS = {
  home: iconHome,
  'building-2': iconBuilding2,
  users: iconUsers,
  settings: iconSettings,
  'id-card': iconIdCard,
  bell: iconBell,
  'circle-help': iconCircleHelp,
  search: iconSearch,
  'chevron-down': iconChevronDown,
  user: iconUser,
  'refresh-cw': iconRefreshCw,
  'user-plus': iconUserPlus,
  'more-horizontal': iconMoreHorizontal,
  'panel-left': iconPanelLeft,
  'log-out': iconLogOut,
  bot: iconBot,
  zap: iconZap,
  'book-open': iconBookOpen,
  'plug-2': iconPlug2,
  'arrow-right': iconArrowRight,
  plus: iconPlus,
  receipt: iconReceipt,
  eye: iconEye,
  pencil: iconPencil,
  'trash-2': iconTrash2,
  paperclip: iconPaperclip,
  x: iconX,
  'eye-off': iconEyeOff,
  lock: iconLock,
  'circle-check': iconCircleCheck,
  'circle-alert': iconCircleAlert,
  menu: iconMenu,
} satisfies Record<string, string>

export type LucideIconName = keyof typeof ICONS

export class LucideIcon extends LitElement {
  static properties = {
    name: { type: String },
  }

  declare name: string

  createRenderRoot() {
    return this
  }

  render() {
    const svg = ICONS[this.name as LucideIconName]
    return svg ? html`${unsafeSVG(svg)}` : html``
  }
}

customElements.define('lucide-icon', LucideIcon)
