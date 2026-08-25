"""Copies current data from the 6 original tables into their evoforma_*
counterparts (already created by create_evoforma_tables.sql), in the same
database. Schema-only was handled separately — this is data-only.

Writes the generated INSERT statements to backend/backups/populate_evoforma_<ts>/
data.sql for the record, then executes them against DATABASE_URL.

Usage: python scripts/populate_evoforma_tables.py
"""

import os
from datetime import datetime

import psycopg
from dotenv import load_dotenv
from psycopg import sql

load_dotenv(override=True)

# Dependency order: parents before children.
SOURCE_TO_TARGET = [
    ("privilege", "evoforma_privilege"),
    ("profile", "evoforma_profile"),
    ("users", "evoforma_users"),
    ("auth_token", "evoforma_auth_token"),
    ("profile_x_privilege", "evoforma_profile_x_privilege"),
    ("user_x_profile", "evoforma_user_x_profile"),
]


def dump_table_inserts(cur, source: str, target: str, f):
    cur.execute(f'SELECT * FROM "{source}"')
    col_names = [d.name for d in cur.description]
    quoted_cols = ", ".join(f'"{c}"' for c in col_names)
    row_count = 0
    for row in cur:
        values = ", ".join("NULL" if v is None else sql.Literal(v).as_string(cur) for v in row)
        f.write(f'INSERT INTO "{target}" ({quoted_cols}) VALUES ({values});\n')
        row_count += 1
    return row_count


def main():
    dsn = os.environ["DATABASE_URL"].replace("postgresql+psycopg", "postgresql")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "backups", f"populate_evoforma_{ts}")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "data.sql")

    with psycopg.connect(dsn) as conn, conn.cursor() as cur, open(out_path, "w") as f:
        counts = {}
        for source, target in SOURCE_TO_TARGET:
            f.write(f"-- {source} -> {target}\n")
            counts[target] = dump_table_inserts(cur, source, target, f)
            f.write("\n")

        with conn.transaction():
            for source, target in SOURCE_TO_TARGET:
                cur.execute(f'TRUNCATE TABLE "{target}" CASCADE')
            for source, target in SOURCE_TO_TARGET:
                cur.execute(f'SELECT * FROM "{source}"')
                col_names = [d.name for d in cur.description]
                quoted_cols = ", ".join(f'"{c}"' for c in col_names)
                placeholders = ", ".join(["%s"] * len(col_names))
                rows = cur.fetchall()
                if rows:
                    cur.executemany(
                        f'INSERT INTO "{target}" ({quoted_cols}) VALUES ({placeholders})', rows
                    )

    print(f"Data script written to {os.path.abspath(out_path)}")
    for target, n in counts.items():
        print(f"  {target}: {n} rows")


if __name__ == "__main__":
    main()
