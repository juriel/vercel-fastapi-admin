import { LitElement, html } from 'lit'
import { displayNameFromIdentity } from '../../lib/identity'
import '../common/lucide-icon'
import type { LucideIconName } from '../common/lucide-icon'

interface FeatureCard {
  icon: LucideIconName
  title: string
  description: string
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: 'bot',
    title: 'Agentes IA',
    description: 'Crea asistentes inteligentes entrenados con el conocimiento de tu empresa.',
  },
  {
    icon: 'zap',
    title: 'Automatizaciones',
    description: 'Diseña flujos automáticos para eliminar tareas repetitivas.',
  },
  {
    icon: 'book-open',
    title: 'Base de conocimiento',
    description: 'Centraliza documentos, procesos y respuestas para tus asistentes.',
  },
  {
    icon: 'plug-2',
    title: 'Integraciones',
    description: 'Conecta WhatsApp, ERP, CRM y APIs.',
  },
]

const RECENT_ACTIVITY: { title: string; time: string }[] = [
  { title: 'Nuevo usuario creado', time: 'Hace 5 minutos' },
  { title: 'Empresa Demo actualizada', time: 'Hace 20 minutos' },
  { title: 'Agente Comercial publicado', time: 'Hace 1 hora' },
  { title: 'Nueva integración agregada', time: 'Hace 3 horas' },
]

export class AppContent extends LitElement {
  static properties = {
    identity: { type: String },
  }

  declare identity: string

  constructor() {
    super()
    this.identity = ''
  }

  createRenderRoot() {
    return this
  }

  private renderFeatureCard(card: FeatureCard) {
    return html`
      <div
        class="flex flex-col gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      >
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-accent-light)] text-[var(--primary-color)]">
          <lucide-icon name=${card.icon}></lucide-icon>
        </div>
        <div class="flex flex-col gap-1.5">
          <h3 class="text-base font-subheading text-[var(--text-dark)]">${card.title}</h3>
          <p class="text-sm leading-relaxed text-[var(--text-muted)]">${card.description}</p>
        </div>
      </div>
    `
  }

  render() {
    const name = displayNameFromIdentity(this.identity)
    return html`
      <main class="flex-1 bg-[var(--bg-hover-light)] p-4 sm:p-8">
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-1.5">
            <h1 class="text-2xl font-heading text-[var(--text-dark)]">Buenos días, ${name}</h1>
            <p class="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              Bienvenido nuevamente a Evoforma. Desde aquí puedes administrar tus asistentes,
              automatizaciones y toda tu organización.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            ${FEATURE_CARDS.map((card) => this.renderFeatureCard(card))}
          </div>

          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6">
            <h2 class="mb-5 text-base font-subheading text-[var(--text-dark)]">Actividad reciente</h2>
            <ul class="flex flex-col">
              ${RECENT_ACTIVITY.map(
                (item, i) => html`
                  <li
                    class="flex items-center gap-3 py-3.5 ${i < RECENT_ACTIVITY.length - 1
                      ? 'border-b border-[var(--bg-neutral)]'
                      : ''}"
                  >
                    <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary-color)]"></span>
                    <span class="text-sm font-medium text-[var(--text-dark)]">${item.title}</span>
                    <span class="ml-auto shrink-0 text-xs text-[var(--text-muted)]">${item.time}</span>
                  </li>
                `
              )}
            </ul>
          </div>

          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6">
            <h2 class="mb-5 text-base font-subheading text-[var(--text-dark)]">Estado del sistema</h2>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                  <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                  <span class="text-sm font-semibold text-[var(--text-dark)]">Sistema operativo</span>
                </div>
                <p class="text-xs text-[var(--text-muted)]">Todos los servicios funcionando correctamente.</p>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-sm font-semibold text-[var(--text-dark)]">Última sincronización</span>
                <p class="text-xs text-[var(--text-muted)]">Hace unos segundos.</p>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-sm font-semibold text-[var(--text-dark)]">Versión</span>
                <p class="text-xs text-[var(--text-muted)]">Evoforma Cloud 1.0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    `
  }
}

customElements.define('app-content', AppContent)
