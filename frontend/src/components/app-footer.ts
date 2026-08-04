import { LitElement, html } from 'lit'

export class AppFooter extends LitElement {
  createRenderRoot() {
    return this
  }

  render() {
    return html`
      <footer
        class="h-10 shrink-0 flex items-center justify-center text-xs border-t border-neutral-300 dark:border-neutral-600"
      >
        © 2026 Hello World
      </footer>
    `
  }
}

customElements.define('app-footer', AppFooter)
