import { LitElement, html, nothing } from 'lit'
import { apiClient, ApiError } from '../../lib/api-client'
import '../common/lucide-icon'

interface HBarItem {
  label: string
  value: number
  count?: number
  other?: boolean
  tooltipLines?: string[]
}

interface StatusSegment {
  label: string
  value: number
  colorVar: '--good' | '--warning' | '--series-other'
}

interface ColombiaReport {
  kpis: {
    proyectos: number
    valor: number
    facturado: number
    saldo: number
    cancelados: number
    saldoCartera: number
  }
  monthly: { label: string; count: number; value: number }[]
  linea: HBarItem[]
  estado: HBarItem[]
  comercial: (HBarItem & { count?: number })[]
  facturado: StatusSegment[]
}

interface LatamReport {
  kpis: { proyectos: number; cancelados: number; facturadoSi: number; paises: number }
  pais: HBarItem[]
  paisTable: { label: string; count: number; value: number; facturado: number }[]
  linea: HBarItem[]
  comercial: HBarItem[]
  facturado: StatusSegment[]
}

interface ComercialReport {
  colombia: ColombiaReport
  latam: LatamReport
}

const STATUS_VAR_TO_COLOR: Record<string, string> = {
  '--good': 'var(--rpt-good)',
  '--warning': 'var(--rpt-warning)',
  '--series-other': 'var(--rpt-series-other)',
}

const CAT_COLORS = [
  'var(--rpt-series-1)',
  'var(--rpt-series-2)',
  'var(--rpt-series-3)',
  'var(--rpt-series-4)',
  'var(--rpt-series-5)',
  'var(--rpt-series-6)',
  'var(--rpt-series-7)',
  'var(--rpt-series-8)',
]

const fmtInt = new Intl.NumberFormat('es-CO')
function fmtCOP(v: number): string {
  return '$' + fmtInt.format(Math.round(v / 1e6)) + ' M'
}
function fmtLocal(v: number): string {
  return fmtInt.format(Math.round(v))
}
function fmtPct(v: number): string {
  return v.toFixed(1).replace('.', ',') + '%'
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 403) {
    return 'No tienes permiso para ver los reportes.'
  }
  return fallback
}

export class ReportManagement extends LitElement {
  static properties = {
    report: { type: Object, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    activeTab: { type: String, state: true },
  }

  declare report: ComercialReport | null
  declare loading: boolean
  declare error: string
  declare activeTab: 'col' | 'latam'

  private chartsBuilt = false
  private tooltipEl: HTMLElement | null = null

  constructor() {
    super()
    this.report = null
    this.loading = false
    this.error = ''
    this.activeTab = 'col'
  }

  createRenderRoot() {
    return this
  }

  connectedCallback() {
    super.connectedCallback()
    this.load()
  }

  private async load() {
    this.loading = true
    this.error = ''
    try {
      this.report = (await apiClient.get('/reports/comercial')) as ComercialReport
      this.chartsBuilt = false
    } catch (err) {
      this.error = describeError(err, 'No se pudo cargar el reporte comercial.')
    } finally {
      this.loading = false
    }
  }

  updated() {
    if (this.report && !this.chartsBuilt) {
      this.chartsBuilt = true
      const col = this.querySelector('#rpt-panel-col')
      const latam = this.querySelector('#rpt-panel-latam')
      if (col) col.innerHTML = ''
      if (latam) latam.innerHTML = ''
      this.buildCharts(this.report)
    }
  }

  // ---- tooltip ----
  private ensureTooltip(): HTMLElement {
    if (!this.tooltipEl) {
      let el = document.getElementById('rpt-tooltip')
      if (!el) {
        el = document.createElement('div')
        el.id = 'rpt-tooltip'
        document.body.appendChild(el)
      }
      this.tooltipEl = el
    }
    return this.tooltipEl
  }

  private showTip(evt: PointerEvent | FocusEvent, title: string, lines: string[]) {
    const tip = this.ensureTooltip()
    tip.innerHTML = ''
    const t = document.createElement('div')
    t.className = 'rpt-tt-title'
    t.textContent = title
    tip.appendChild(t)
    lines.forEach((l) => {
      const d = document.createElement('div')
      d.textContent = l
      tip.appendChild(d)
    })
    const point = evt as PointerEvent
    if (typeof point.clientX === 'number') {
      tip.style.left = point.clientX + 'px'
      tip.style.top = point.clientY - 12 + 'px'
    }
    tip.classList.add('show')
  }

  private hideTip() {
    this.tooltipEl?.classList.remove('show')
  }

  // ---- chart builders (imperative DOM, mirrors a static reference build) ----
  private renderHBars(
    container: HTMLElement,
    data: HBarItem[],
    opts: { valueFmt: (v: number) => string; colorFn?: (d: HBarItem, i: number) => string }
  ) {
    const max = Math.max(...data.map((d) => d.value), 0)
    const list = document.createElement('div')
    list.className = 'rpt-hbar-list'
    data.forEach((d, i) => {
      const row = document.createElement('div')
      row.className = 'rpt-hbar-row'

      const label = document.createElement('div')
      label.className = 'rpt-hbar-label'
      label.textContent = d.label
      label.title = d.label

      const track = document.createElement('div')
      track.className = 'rpt-hbar-track'
      const fill = document.createElement('div')
      fill.className = 'rpt-hbar-fill'
      const pct = max > 0 ? Math.max((d.value / max) * 100, 1.5) : 1.5
      fill.style.width = pct + '%'
      fill.style.background = opts.colorFn ? opts.colorFn(d, i) : 'var(--primary-color)'
      fill.tabIndex = 0
      const lines = d.tooltipLines ?? [opts.valueFmt(d.value)]
      fill.addEventListener('pointermove', (e) => this.showTip(e, d.label, lines))
      fill.addEventListener('focus', (e) => this.showTip(e, d.label, lines))
      fill.addEventListener('pointerleave', () => this.hideTip())
      fill.addEventListener('blur', () => this.hideTip())
      track.appendChild(fill)

      const value = document.createElement('div')
      value.className = 'rpt-hbar-value'
      value.textContent = opts.valueFmt(d.value)

      row.appendChild(label)
      row.appendChild(track)
      row.appendChild(value)
      list.appendChild(row)
    })
    container.appendChild(list)
  }

  private renderColumns(container: HTMLElement, data: { label: string; value: number }[], valueFmt: (v: number) => string) {
    const max = Math.max(...data.map((d) => d.value), 0)
    const chart = document.createElement('div')
    chart.className = 'rpt-col-chart'
    data.forEach((d) => {
      const col = document.createElement('div')
      col.className = 'rpt-col'
      const bar = document.createElement('div')
      bar.className = 'rpt-col-bar'
      const pct = max > 0 ? Math.max((d.value / max) * 100, 2) : 2
      bar.style.height = pct + '%'
      bar.style.background = 'var(--primary-color)'
      bar.tabIndex = 0
      bar.addEventListener('pointermove', (e) => this.showTip(e, d.label, [valueFmt(d.value)]))
      bar.addEventListener('focus', (e) => this.showTip(e, d.label, [valueFmt(d.value)]))
      bar.addEventListener('pointerleave', () => this.hideTip())
      bar.addEventListener('blur', () => this.hideTip())
      const xl = document.createElement('div')
      xl.className = 'rpt-col-x-label'
      xl.textContent = d.label
      col.appendChild(bar)
      col.appendChild(xl)
      chart.appendChild(col)
    })
    container.appendChild(chart)
  }

  private renderStatusBar(container: HTMLElement, segments: StatusSegment[], total: number) {
    const bar = document.createElement('div')
    bar.className = 'rpt-status-bar'
    segments.forEach((s) => {
      const seg = document.createElement('div')
      seg.className = 'rpt-status-seg'
      const pct = total > 0 ? (s.value / total) * 100 : 0
      seg.style.width = pct + '%'
      seg.style.background = STATUS_VAR_TO_COLOR[s.colorVar] ?? 'var(--rpt-series-other)'
      seg.tabIndex = 0
      const lines = [fmtInt.format(s.value) + ' proyectos (' + fmtPct(pct) + ')']
      seg.addEventListener('pointermove', (e) => this.showTip(e, s.label, lines))
      seg.addEventListener('focus', (e) => this.showTip(e, s.label, lines))
      seg.addEventListener('pointerleave', () => this.hideTip())
      seg.addEventListener('blur', () => this.hideTip())
      bar.appendChild(seg)
    })
    container.appendChild(bar)

    const legend = document.createElement('div')
    legend.className = 'rpt-status-legend'
    segments.forEach((s) => {
      const pct = total > 0 ? (s.value / total) * 100 : 0
      const item = document.createElement('div')
      item.className = 'rpt-status-legend-item'
      const dot = document.createElement('span')
      dot.className = 'rpt-status-dot'
      dot.style.background = STATUS_VAR_TO_COLOR[s.colorVar] ?? 'var(--rpt-series-other)'
      const txt = document.createElement('span')
      txt.textContent = `${s.label} — ${fmtInt.format(s.value)} (${fmtPct(pct)})`
      item.appendChild(dot)
      item.appendChild(txt)
      legend.appendChild(item)
    })
    container.appendChild(legend)
  }

  private renderTable(container: HTMLElement, headers: { label: string; num?: boolean }[], rows: (string | number)[][]) {
    const table = document.createElement('table')
    table.className = 'rpt-table'
    const thead = document.createElement('thead')
    const htr = document.createElement('tr')
    headers.forEach((h) => {
      const th = document.createElement('th')
      th.textContent = h.label
      if (h.num) th.className = 'num'
      htr.appendChild(th)
    })
    thead.appendChild(htr)
    table.appendChild(thead)
    const tbody = document.createElement('tbody')
    rows.forEach((r) => {
      const tr = document.createElement('tr')
      r.forEach((cell, i) => {
        const td = document.createElement('td')
        td.textContent = String(cell)
        if (headers[i]?.num) td.className = 'num'
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    container.appendChild(table)
  }

  private makeCard(
    parent: HTMLElement,
    title: string,
    caption: string | null,
    buildChart: (c: HTMLElement) => void,
    buildTable?: (c: HTMLElement) => void
  ) {
    const card = document.createElement('div')
    card.className = 'rpt-card'
    const head = document.createElement('div')
    head.className = 'rpt-card-head'
    const titleEl = document.createElement('div')
    titleEl.className = 'rpt-card-title'
    titleEl.textContent = title
    head.appendChild(titleEl)

    let btn: HTMLButtonElement | null = null
    if (buildTable) {
      btn = document.createElement('button')
      btn.className = 'rpt-table-toggle'
      btn.textContent = 'Ver tabla'
      btn.type = 'button'
      head.appendChild(btn)
    }
    card.appendChild(head)

    if (caption) {
      const cap = document.createElement('div')
      cap.className = 'rpt-card-caption'
      cap.textContent = caption
      card.appendChild(cap)
    }

    const chartView = document.createElement('div')
    chartView.className = 'rpt-chart-view'
    buildChart(chartView)
    card.appendChild(chartView)

    if (buildTable && btn) {
      const tableView = document.createElement('div')
      tableView.className = 'rpt-table-view'
      buildTable(tableView)
      card.appendChild(tableView)
      btn.addEventListener('click', () => {
        const showingTable = tableView.classList.toggle('active')
        chartView.classList.toggle('hidden', showingTable)
        btn!.textContent = showingTable ? 'Ver gráfico' : 'Ver tabla'
      })
    }
    parent.appendChild(card)
  }

  private kpiRow(
    parent: HTMLElement,
    items: { label: string; value: string; sub?: string; accent?: boolean; critical?: boolean }[]
  ) {
    const row = document.createElement('div')
    row.className = 'rpt-kpi-row'
    items.forEach((it) => {
      const k = document.createElement('div')
      k.className = 'rpt-kpi' + (it.accent ? ' accent' : '') + (it.critical ? ' critical' : '')
      const l = document.createElement('div')
      l.className = 'rpt-label'
      l.textContent = it.label
      const v = document.createElement('div')
      v.className = 'rpt-value'
      v.textContent = it.value
      k.appendChild(l)
      k.appendChild(v)
      if (it.sub) {
        const s = document.createElement('div')
        s.className = 'rpt-sub'
        s.textContent = it.sub
        k.appendChild(s)
      }
      row.appendChild(k)
    })
    parent.appendChild(row)
  }

  private note(parent: HTMLElement, text: string) {
    const n = document.createElement('div')
    n.className = 'rpt-note'
    n.textContent = text
    parent.appendChild(n)
  }

  private withOtherColors(items: HBarItem[]) {
    return (d: HBarItem, i: number) => (d.other ? 'var(--rpt-series-other)' : CAT_COLORS[i % CAT_COLORS.length])
  }

  private buildCharts(data: ComercialReport) {
    this.buildColombia(data.colombia)
    this.buildLatam(data.latam)
  }

  private buildColombia(col: ColombiaReport) {
    const root = this.querySelector('#rpt-panel-col') as HTMLElement | null
    if (!root) return

    this.kpiRow(root, [
      { label: 'Proyectos', value: fmtInt.format(col.kpis.proyectos) },
      { label: 'Valor total proyectos', value: fmtCOP(col.kpis.valor), accent: true },
      { label: 'Facturado', value: fmtCOP(col.kpis.facturado) },
      { label: 'Saldo por facturar', value: fmtCOP(col.kpis.saldo) },
      { label: 'Saldo de cartera', value: fmtCOP(col.kpis.saldoCartera) },
      {
        label: 'Cancelados',
        value: fmtInt.format(col.kpis.cancelados),
        sub: fmtPct((col.kpis.cancelados / col.kpis.proyectos) * 100) + ' del total',
        critical: true,
      },
    ])

    this.note(root, 'Cifras en pesos colombianos (COP), en millones.')

    const grid = document.createElement('div')
    grid.className = 'rpt-grid-2'
    root.appendChild(grid)

    this.makeCard(grid, 'Proyectos por mes', 'Cantidad de proyectos por mes de venta', (c) =>
      this.renderColumns(
        c,
        col.monthly.map((m) => ({ label: m.label, value: m.count })),
        (v) => fmtInt.format(v) + ' proyectos'
      )
    )
    this.makeCard(grid, 'Valor de venta por mes', 'Precio de proyecto por mes de venta', (c) =>
      this.renderColumns(
        c,
        col.monthly.map((m) => ({ label: m.label, value: m.value })),
        fmtCOP
      )
    )

    this.makeCard(
      root,
      'Línea de negocio',
      'Por valor de proyecto — principales líneas, resto agrupado en “Otros”',
      (c) => {
        this.renderHBars(c, col.linea, { valueFmt: fmtCOP, colorFn: this.withOtherColors(col.linea) })
      },
      (c) =>
        this.renderTable(
          c,
          [{ label: 'Línea' }, { label: 'Proyectos', num: true }, { label: 'Valor (COP)', num: true }],
          col.linea.map((l) => [l.label, fmtInt.format(l.count ?? 0), fmtInt.format(l.value)])
        )
    )

    this.makeCard(root, 'Proyectos por estado', 'Ordenado por cantidad de proyectos', (c) =>
      this.renderHBars(c, col.estado, { valueFmt: (v) => fmtInt.format(v) })
    )

    this.makeCard(root, 'Top comerciales', 'Por valor de proyecto, top 6', (c) =>
      this.renderHBars(
        c,
        col.comercial.map((r) => ({
          label: r.label,
          value: r.value,
          tooltipLines: [fmtCOP(r.value), fmtInt.format(r.count ?? 0) + ' proyectos'],
        })),
        { valueFmt: fmtCOP }
      )
    )

    this.makeCard(root, 'Estado de facturación', `Sobre ${fmtInt.format(col.kpis.proyectos)} proyectos`, (c) =>
      this.renderStatusBar(c, col.facturado, col.kpis.proyectos)
    )
  }

  private buildLatam(latam: LatamReport) {
    const root = this.querySelector('#rpt-panel-latam') as HTMLElement | null
    if (!root) return

    this.kpiRow(root, [
      { label: 'Proyectos', value: fmtInt.format(latam.kpis.proyectos) },
      { label: 'Países', value: String(latam.kpis.paises) },
      {
        label: 'Facturados',
        value: fmtInt.format(latam.kpis.facturadoSi),
        sub: fmtPct((latam.kpis.facturadoSi / latam.kpis.proyectos) * 100) + ' del total',
      },
      {
        label: 'Cancelados',
        value: fmtInt.format(latam.kpis.cancelados),
        sub: fmtPct((latam.kpis.cancelados / latam.kpis.proyectos) * 100) + ' del total',
        critical: true,
      },
    ])

    this.note(
      root,
      'bi_latam agrupa varios países con monedas locales distintas: los valores monetarios se muestran solo en la tabla por país (sin sumar entre monedas). Los conteos de proyectos sí son comparables entre países.'
    )

    this.makeCard(
      root,
      'Proyectos por país',
      'Cantidad de proyectos, todas las monedas',
      (c) => this.renderHBars(c, latam.pais, { valueFmt: (v) => fmtInt.format(v), colorFn: this.withOtherColors(latam.pais) }),
      (c) =>
        this.renderTable(
          c,
          [
            { label: 'País' },
            { label: 'Proyectos', num: true },
            { label: 'Valor proyecto (moneda local)', num: true },
            { label: 'Facturado (moneda local)', num: true },
          ],
          latam.paisTable.map((r) => [r.label, fmtInt.format(r.count), fmtLocal(r.value), fmtLocal(r.facturado)])
        )
    )

    this.makeCard(
      root,
      'Línea de negocio',
      'Cantidad de proyectos — principales líneas, resto agrupado en “Otros”',
      (c) =>
        this.renderHBars(
          c,
          latam.linea.map((l) => ({ label: l.label, value: l.count ?? l.value, other: l.other })),
          { valueFmt: (v) => fmtInt.format(v), colorFn: this.withOtherColors(latam.linea) }
        )
    )

    this.makeCard(root, 'Top comerciales', 'Por cantidad de proyectos, top 6', (c) =>
      this.renderHBars(c, latam.comercial, { valueFmt: (v) => fmtInt.format(v) + ' proy.' })
    )

    this.makeCard(root, 'Estado de facturación', `Sobre ${fmtInt.format(latam.kpis.proyectos)} proyectos`, (c) =>
      this.renderStatusBar(c, latam.facturado, latam.kpis.proyectos)
    )
  }

  private selectTab(tab: 'col' | 'latam') {
    this.activeTab = tab
  }

  render() {
    return html`
      <main class="flex-1 min-h-100 bg-[var(--bg-hover-light)] p-4 sm:p-8">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-end gap-3">
            <button
              class="flex h-12 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-5 text-sm font-semibold text-[var(--text-dark)] transition-colors duration-150 ease-out hover:bg-[var(--bg-accent-light)]"
              @click=${() => this.load()}
            >
              <lucide-icon name="refresh-cw"></lucide-icon>
              Actualizar
            </button>
          </div>

          ${this.error ? html`<p class="error-text">${this.error}</p>` : nothing}
          ${this.loading ? html`<p class="text-sm text-[var(--text-muted)]">Cargando...</p>` : nothing}

          <div class="rpt-tabs" style=${this.report ? '' : 'display:none'}>
            <button
              type="button"
              class="rpt-tab-btn ${this.activeTab === 'col' ? 'active' : ''}"
              @click=${() => this.selectTab('col')}
            >
              Colombia
            </button>
            <button
              type="button"
              class="rpt-tab-btn ${this.activeTab === 'latam' ? 'active' : ''}"
              @click=${() => this.selectTab('latam')}
            >
              LATAM
            </button>
          </div>

          <section id="rpt-panel-col" class="rpt-panel ${this.activeTab === 'col' ? 'active' : ''}"></section>
          <section id="rpt-panel-latam" class="rpt-panel ${this.activeTab === 'latam' ? 'active' : ''}"></section>
        </div>
      </main>
    `
  }
}

customElements.define('report-management', ReportManagement)
