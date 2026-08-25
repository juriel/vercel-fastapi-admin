"""Self-contained CREATE TABLE + INSERT script for migrating this app's data
to a brand new database.

Unlike backup_db.py (schema.sql + CSV, meant as a disaster-recovery backup
of the *current* shared DB), this produces one plain .sql file — table
DDL under the tables' original names, followed by their data as INSERT
statements — so it can be loaded into an empty target DB with a plain:

    psql "$NEW_DATABASE_URL" -f migration.sql

Only touches the 6 tables this backend actually uses (see
models/entities/*.py); it does not read from or write to the evoforma_*
tables created separately for the same-DB rename experiment.

Usage: python scripts/export_migration.py
"""

import os
from datetime import datetime

import psycopg
from dotenv import load_dotenv
from psycopg import sql

from backup_db import table_ddl

load_dotenv(override=True)

# Dependency order: parents before children, so FKs don't fail on insert.
TABLES = ["privilege", "profile", "users", "auth_token", "profile_x_privilege", "user_x_profile"]


def dump_table_inserts(cur, table: str, f):
    cur.execute(f'SELECT * FROM "{table}"')
    col_names = [d.name for d in cur.description]
    quoted_cols = ", ".join(f'"{c}"' for c in col_names)
    row_count = 0
    for row in cur:
        values = ", ".join("NULL" if v is None else sql.Literal(v).as_string(cur) for v in row)
        f.write(f'INSERT INTO "{table}" ({quoted_cols}) VALUES ({values});\n')
        row_count += 1
    return row_count


def main():
    dsn = os.environ["DATABASE_URL"].replace("postgresql+psycopg", "postgresql")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "backups", f"migration_{ts}")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "migration.sql")

    with psycopg.connect(dsn) as conn, conn.cursor() as cur, open(out_path, "w") as f:
        f.write("-- Schema + data for migrating this app to a new database.\n")
        f.write(f"-- Generated {datetime.now().isoformat()} from the current DATABASE_URL.\n\n")

        for table in TABLES:
            f.write(f"-- {table}\n")
            f.write(table_ddl(cur, table))
            f.write("\n\n")

        counts = {}
        for table in TABLES:
            f.write(f"-- data: {table}\n")
            counts[table] = dump_table_inserts(cur, table, f)
            f.write("\n")

    print(f"Migration script written to {os.path.abspath(out_path)}")
    for table, n in counts.items():
        print(f"  {table}: {n} rows")


if __name__ == "__main__":
    main()
