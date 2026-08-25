"""Aggregates the bi_col (Colombia) and bi_latam (multi-country) reporting
tables into the shapes the "Reportes" frontend view renders.

bi_col and bi_latam are not owned by this app (they're populated by another
system sharing the same database) and carry messy free-text categories
(accent variants, near-duplicate labels), so the raw GROUP BY rows are
normalized/folded here in Python rather than in SQL.

bi_latam spans several countries with different local currencies, so its
monetary fields are only ever reported per-country (never summed across
countries) - see build_latam_report.
"""

from collections import defaultdict
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

MONTH_ORDER = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
]
MONTH_LABEL = {
    "ENERO": "ENE", "FEBRERO": "FEB", "MARZO": "MAR", "ABRIL": "ABR",
    "MAYO": "MAY", "JUNIO": "JUN", "JULIO": "JUL", "AGOSTO": "AGO",
    "SEPTIEMBRE": "SEP", "OCTUBRE": "OCT", "NOVIEMBRE": "NOV", "DICIEMBRE": "DIC",
}

# Folds free-text data-entry variants (typos, accent drift, near-duplicates)
# to one canonical label before grouping/ranking.
LINEA_ALIASES = {
    "CONGRESO": "CONGRESOS",
    "INTERMEDICATION": "INTERMEDIACIÓN",
    "INTERMEDICACION": "INTERMEDIACIÓN",
    "LICITACION": "LICITACIÓN",
    "SERVICIO": "SERVICIOS",
    "SERVIVIO": "SERVICIOS",
    "EVENTO (REGISTRO-PLENARIA-ACTIVIDAD)": "EVENTO (REGISTRO – PLENARIA – ACTIVIDAD)",
}


def _norm_linea(raw: Optional[str]) -> str:
    label = (raw or "").strip().upper()
    if not label or label == "N/A":
        return "SIN LÍNEA"
    return LINEA_ALIASES.get(label, label)


def _fold_top_n(rows: list[dict], n: int, other_label: str = "OTROS") -> list[dict]:
    """rows: [{label, count, value}], sorted by the caller's ranking key
    (already descending). Keeps the first n, sums the rest into one row."""
    if len(rows) <= n:
        return rows
    head, tail = rows[:n], rows[n:]
    other = {
        "label": other_label,
        "count": sum(r["count"] for r in tail),
        "value": sum(r["value"] for r in tail),
        "other": True,
    }
    return head + [other]


class BiReportService:
    def __init__(self, session: Session):
        self.session = session

    def _group(self, table: str, column: str, sum_column: Optional[str] = None) -> list[tuple]:
        sum_expr = f", COALESCE(SUM({sum_column}), 0)" if sum_column else ""
        sql = text(
            f'SELECT {column}, COUNT(*){sum_expr} FROM "{table}" GROUP BY {column}'
        )
        return list(self.session.execute(sql))

    def _totals(self, table: str) -> dict:
        sql = text(
            f"""
            SELECT
              COUNT(*),
              COALESCE(SUM(precio_proyecto), 0),
              COALESCE(SUM(valor_facturado), 0),
              COALESCE(SUM(saldo_facturar), 0),
              COUNT(*) FILTER (WHERE estado = 'CANCELADO')
            FROM "{table}"
            """
        )
        proyectos, valor, facturado, saldo, cancelados = self.session.execute(sql).one()
        return {
            "proyectos": proyectos,
            "valor": float(valor),
            "facturado": float(facturado),
            "saldo": float(saldo),
            "cancelados": cancelados,
        }

    def _facturado_pagado(self, table: str) -> tuple[list[dict], list[dict]]:
        def build(column: str, good_value: str, labels: dict) -> list[dict]:
            rows = self._group(table, column)
            counts: dict[str, int] = defaultdict(int)
            for value, count in rows:
                key = (value or "").strip().upper()
                if key not in ("SI", "NO"):
                    key = "OTRO"
                counts[key] += count
            return [
                {"label": labels["SI"], "value": counts.get("SI", 0), "colorVar": "--good"},
                {"label": labels["NO"], "value": counts.get("NO", 0), "colorVar": "--warning"},
                {"label": labels["OTRO"], "value": counts.get("OTRO", 0), "colorVar": "--series-other"},
            ]

        facturado = build(
            "facturado", "SI", {"SI": "Facturado", "NO": "No facturado", "OTRO": "No aplica / sin dato"}
        )
        pagado = build(
            "pagado", "SI", {"SI": "Pagado", "NO": "No pagado", "OTRO": "No aplica / sin dato"}
        )
        return facturado, pagado

    def _linea(self, table: str, top_n: int, rank_by: str = "value") -> list[dict]:
        rows = self._group(table, "linea", "precio_proyecto")
        merged: dict[str, dict] = {}
        for raw_label, count, value in rows:
            label = _norm_linea(raw_label)
            row = merged.setdefault(label, {"label": label, "count": 0, "value": 0.0})
            row["count"] += count
            row["value"] += float(value)
        ranked = sorted(merged.values(), key=lambda r: r[rank_by], reverse=True)
        return _fold_top_n(ranked, top_n)

    def _top_comercial(self, table: str, order_by: str, limit: int) -> list[dict]:
        col = "precio_proyecto" if order_by == "value" else None
        sum_expr = ", COALESCE(SUM(precio_proyecto), 0)" if col else ""
        sql = text(
            f"""
            SELECT comercial, COUNT(*){sum_expr}
            FROM "{table}"
            WHERE comercial IS NOT NULL AND comercial <> ''
            GROUP BY comercial
            ORDER BY {"3" if col else "2"} DESC
            LIMIT :limit
            """
        )
        rows = self.session.execute(sql, {"limit": limit})
        out = []
        for row in rows:
            if order_by == "value":
                comercial, count, value = row
                out.append({"label": comercial, "value": float(value), "count": count})
            else:
                comercial, count = row
                out.append({"label": comercial, "value": count})
        return out

    def build_colombia_report(self) -> dict:
        table = "bi_col"
        totals = self._totals(table)

        month_rows = self._group(table, "mes_venta", "precio_proyecto")
        by_month = {m: {"count": 0, "value": 0.0} for m in MONTH_ORDER}
        for raw_month, count, value in month_rows:
            month = (raw_month or "").strip().upper()
            if month in by_month:
                by_month[month]["count"] += count
                by_month[month]["value"] += float(value)
        monthly = [
            {"label": MONTH_LABEL[m], "count": by_month[m]["count"], "value": by_month[m]["value"]}
            for m in MONTH_ORDER
        ]

        estado_rows = self._group(table, "estado")
        estado = sorted(
            (
                {"label": (raw or "").strip() or "SIN ESTADO", "value": count}
                for raw, count in estado_rows
            ),
            key=lambda r: r["value"],
            reverse=True,
        )

        facturado, pagado = self._facturado_pagado(table)

        return {
            "kpis": totals,
            "monthly": monthly,
            "linea": self._linea(table, top_n=8),
            "estado": estado,
            "comercial": self._top_comercial(table, order_by="value", limit=6),
            "facturado": facturado,
            "pagado": pagado,
        }

    def build_latam_report(self) -> dict:
        table = "bi_latam"

        totals_sql = text(
            f"""
            SELECT
              COUNT(*),
              COUNT(*) FILTER (WHERE estado = 'CANCELADO'),
              COUNT(*) FILTER (WHERE UPPER(TRIM(facturado)) = 'SI'),
              COUNT(*) FILTER (WHERE UPPER(TRIM(pagado)) = 'SI')
            FROM "{table}"
            """
        )
        proyectos, cancelados, facturado_si, pagado_si = self.session.execute(totals_sql).one()

        pais_rows = self._group(table, "pais", "precio_proyecto")
        pais_facturado_sql = text(
            f'SELECT pais, COALESCE(SUM(valor_facturado), 0) FROM "{table}" GROUP BY pais'
        )
        facturado_by_pais = {p: float(v) for p, v in self.session.execute(pais_facturado_sql)}

        pais_list = sorted(
            (
                {
                    "label": (raw or "SIN PAÍS").strip(),
                    "count": count,
                    "value": float(value),
                    "facturado": facturado_by_pais.get(raw, 0.0),
                }
                for raw, count, value in pais_rows
            ),
            key=lambda r: r["count"],
            reverse=True,
        )

        facturado, pagado = self._facturado_pagado(table)

        return {
            "kpis": {
                "proyectos": proyectos,
                "cancelados": cancelados,
                "facturadoSi": facturado_si,
                "pagadoSi": pagado_si,
                "paises": len(pais_list),
            },
            "pais": [{"label": p["label"], "value": p["count"]} for p in pais_list],
            "paisTable": pais_list,
            "linea": self._linea(table, top_n=7, rank_by="count"),
            "comercial": self._top_comercial(table, order_by="count", limit=6),
            "facturado": facturado,
            "pagado": pagado,
        }
