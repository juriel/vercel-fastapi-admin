-- Creates evoforma_-prefixed copies of the 6 tables this backend actually
-- uses (auth_token, privilege, profile, profile_x_privilege, user_x_profile,
-- users). Schema-only, no data — mirrors the structure in
-- backend/models/entities/*.py exactly, including primary keys, foreign
-- keys (ON DELETE CASCADE) and the one extra index on auth_token.
--
-- Run with: psql "$DATABASE_URL" -f scripts/create_evoforma_tables.sql
-- (or: python scripts/run_sql.py scripts/create_evoforma_tables.sql)

CREATE TABLE "evoforma_users" (
    "login" varchar(64) NOT NULL,
    "password" varchar(255),
    "category" varchar(32),
    "name" varchar(32),
    "email" varchar(32),
    "phone" varchar(16),
    "salt" varchar(128),
    "active" integer,
    "profile_picture" text,
    PRIMARY KEY ("login")
);

CREATE TABLE "evoforma_privilege" (
    "code" varchar(32) NOT NULL,
    "name" varchar(255) NOT NULL,
    "category" varchar(255) NOT NULL,
    PRIMARY KEY ("code")
);

CREATE TABLE "evoforma_profile" (
    "code" varchar(32) NOT NULL,
    "name" varchar(64) NOT NULL,
    "editable" integer NOT NULL DEFAULT 1,
    PRIMARY KEY ("code")
);

CREATE TABLE "evoforma_profile_x_privilege" (
    "profile_code" varchar(32) NOT NULL,
    "privilege_code" varchar(32) NOT NULL,
    PRIMARY KEY ("profile_code", "privilege_code"),
    CONSTRAINT "evoforma_profile_x_privilege_profile_code_fkey"
        FOREIGN KEY ("profile_code") REFERENCES "evoforma_profile" ("code") ON DELETE CASCADE,
    CONSTRAINT "evoforma_profile_x_privilege_privilege_code_fkey"
        FOREIGN KEY ("privilege_code") REFERENCES "evoforma_privilege" ("code") ON DELETE CASCADE
);

CREATE TABLE "evoforma_user_x_profile" (
    "login" varchar NOT NULL,
    "profile" varchar NOT NULL,
    PRIMARY KEY ("login", "profile"),
    CONSTRAINT "evoforma_user_x_profile_login_fkey"
        FOREIGN KEY ("login") REFERENCES "evoforma_users" ("login") ON DELETE CASCADE,
    CONSTRAINT "evoforma_user_x_profile_profile_fkey"
        FOREIGN KEY ("profile") REFERENCES "evoforma_profile" ("code") ON DELETE CASCADE
);

CREATE TABLE "evoforma_auth_token" (
    "code" varchar(1024) NOT NULL,
    "users" varchar(64),
    "created_at" bigint,
    "expires_at" bigint,
    "profiles" text,
    "privileges" text,
    PRIMARY KEY ("code")
);

CREATE INDEX "evoforma_auth_token_users_idx" ON "evoforma_auth_token" USING btree ("users");
