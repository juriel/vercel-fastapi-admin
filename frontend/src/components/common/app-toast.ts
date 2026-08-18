import { LitElement, html, nothing } from 'lit'
import { TOAST_EVENT, type ToastDetail, type ToastType } from '../../lib/toast'
import './lucide-icon'

interface ToastItem extends ToastDetail {
  id: number
}

const AUTO_DISMISS_MS = 5000

const STYLES: Record<
  ToastType,
  { icon: 'circle-check' | 'circle-alert'; iconColor: string; badgeBg: string; border: string }
> = {
  success: {
    icon: 'circle-check',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    border: 'border-emerald-200',
  },
  error: {
    icon: 'circle-alert',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100',
    border: 'border-red-200',
  },
}

export class AppToast extends LitElement {
  static properties = {
    items: { state: true },
  }

  declare items: ToastItem[]

  private nextId = 1

  private onToast = (e: Event) => {
    const { message, type } = (e as CustomEvent<ToastDetail>).detail
    const id = this.nextId++
    this.items = [...this.items, { id, message, type }]
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS)
  }

  constructor() {
    super()
    this.items = []
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener(TOAST_EVENT, this.onToast)
  }

  disconnectedCallback() {
    window.removeEventListener(TOAST_EVENT, this.onToast)
    super.disconnectedCallback()
  }

  private dismiss(id: number) {
    this.items = this.items.filter((item) => item.id !== id)
  }

  render() {
    if (this.items.length === 0) return nothing
    return html`
      <div class="fixed bottom-6 right-6 z-[60] flex w-full max-w-md flex-col gap-3">
        ${this.items.map((item) => {
          const { icon, iconColor, badgeBg, border } = STYLES[item.type]
          return html`
            <div
              class="flex items-center gap-4 rounded-2xl border-2 ${border} bg-white p-5 shadow-2xl"
              role="status"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${badgeBg}">
                <lucide-icon name=${icon} class="h-6 w-6 ${iconColor}"></lucide-icon>
              </div>
              <p class="min-w-0 flex-1 text-base font-semibold leading-snug text-[#0F172A]">
                ${item.message}
              </p>
              <button
                aria-label="Cerrar notificación"
                class="shrink-0 rounded-lg p-1.5 text-[#94A3B8] transition-colors duration-150 ease-out hover:bg-black/5 hover:text-[#0F172A]"
                @click=${() => this.dismiss(item.id)}
              >
                <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
              </button>
            </div>
          `
        })}
      </div>
    `
  }
}

customElements.define('app-toast', AppToast)
