"""Logical backup of the Postgres database used by this app.

Writes a schema.sql (CREATE TABLE/constraints/indexes, reconstructed via
catalog introspection) plus one CSV per table into backend/backups/<timestamp>/.

Exists as a workaround for local pg_dump (16.x) refusing to talk to a newer
server (18.x) — pg_dump aborts on that version mismatch, so this reconstructs
an equivalent logical dump over a plain psycopg connection instead.

Usage: python scripts/backup_db.py [table1 table2 ...]
       (with no args, backs up every table in the public schema)
"""

import csv
import os
import sys
from datetime import datetime

import psycopg
from dotenv import load_dotenv

load_dotenv(override=True)

PG_TYPE_MAP_SUFFIXES = {"character varying": "varchar", "character": "char"}


def qualified_type(row):
    data_type = row["data_type"]
    if data_type in ("character varying", "character") and row["character_maximum_length"]:
        return f"{PG_TYPE_MAP_SUFFIXES[data_type]}({row['character_maximum_length']})"
    if data_type == "numeric" and row["numeric_precision"]:
        scale = row["numeric_scale"] or 0
        return f"numeric({row['numeric_precision']},{scale})"
    return data_type


def table_ddl(cur, table: str) -> str:
    cur.execute(
        """
        select column_name, data_type, character_maximum_length,
               numeric_precision, numeric_scale, is_nullable, column_default
        from information_schema.columns
        where table_schema = 'public' and table_name = %s
        order by ordinal_position
        """,
        (table,),
    )
    cols = cur.fetchall()
    col_names = [d.name for d in cur.description]
    col_lines = []
    for row in cols:
        row = dict(zip(col_names, row))
        line = f'    "{row["column_name"]}" {qualified_type(row)}'
        if row["is_nullable"] == "NO":
            line += " NOT NULL"
        if row["column_default"] is not None:
            line += f' DEFAULT {row["column_default"]}'
        col_lines.append(line)

    cur.execute(
        """
        select kcu.column_name
        from information_schema.table_constraints tc
        join information_schema.key_column_usage kcu
          on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
        where tc.table_schema = 'public' and tc.table_name = %s and tc.constraint_type = 'PRIMARY KEY'
        order by kcu.ordinal_position
        """,
        (table,),
    )
    pk_cols = [r[0] for r in cur.fetchall()]
    if pk_cols:
        quoted_pk_cols = ", ".join(f'"{c}"' for c in pk_cols)
        col_lines.append(f"    PRIMARY KEY ({quoted_pk_cols})")

    ddl = f'CREATE TABLE "{table}" (\n' + ",\n".join(col_lines) + "\n);"

    cur.execute(
        """
        select
          tc.constraint_name, kcu.column_name, ccu.table_name as ref_table,
          ccu.column_name as ref_column, rc.delete_rule
        from information_schema.table_constraints tc
        join information_schema.key_column_usage kcu
          on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
        join information_schema.referential_constraints rc
          on tc.constraint_name = rc.constraint_name and tc.table_schema = rc.constraint_schema
        join information_schema.constraint_column_usage ccu
          on rc.unique_constraint_name = ccu.constraint_name
        where tc.table_schema = 'public' and tc.table_name = %s and tc.constraint_type = 'FOREIGN KEY'
        """,
        (table,),
    )
    fks = cur.fetchall()
    fk_stmts = []
    for name, col, ref_table, ref_col, delete_rule in fks:
        stmt = (
            f'ALTER TABLE "{table}" ADD CONSTRAINT "{name}" '
            f'FOREIGN KEY ("{col}") REFERENCES "{ref_table}" ("{ref_col}")'
        )
        if delete_rule and delete_rule != "NO ACTION":
            stmt += f" ON DELETE {delete_rule}"
        fk_stmts.append(stmt + ";")

    cur.execute(
        """
        select indexname, indexdef from pg_indexes
        where schemaname = 'public' and tablename = %s and indexname not like '%%_pkey'
        """,
        (table,),
    )
    index_stmts = [f"{row[1]};" for row in cur.fetchall()]

    parts = [ddl]
    if fk_stmts:
        parts.append("\n".join(fk_stmts))
    if index_stmts:
        parts.append("\n".join(index_stmts))
    return "\n\n".join(parts)


def dump_table_csv(conn, table: str, path: str):
    with open(path, "w", newline="") as f, conn.cursor() as cur:
        with cur.copy(f'COPY (SELECT * FROM "{table}") TO STDOUT WITH (FORMAT csv, HEADER true)') as copy:
            for data in copy:
                f.write(bytes(data).decode("utf-8"))


def main():
    tables = sys.argv[1:]
    dsn = os.environ["DATABASE_URL"].replace("postgresql+psycopg", "postgresql")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "backups", ts)
    os.makedirs(out_dir, exist_ok=True)

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            if not tables:
                cur.execute(
                    "select tablename from pg_tables where schemaname = 'public' order by tablename"
                )
                tables = [r[0] for r in cur.fetchall()]

            schema_sql = []
            for table in tables:
                schema_sql.append(f"-- {table}")
                schema_sql.append(table_ddl(cur, table))

        with open(os.path.join(out_dir, "schema.sql"), "w") as f:
            f.write("\n\n".join(schema_sql) + "\n")

        for table in tables:
            dump_table_csv(conn, table, os.path.join(out_dir, f"{table}.csv"))

    print(f"Backup written to {os.path.abspath(out_dir)}")
    print(f"Tables: {', '.join(tables)}")


if __name__ == "__main__":
    main()
