-- auth_token

CREATE TABLE "auth_token" (
    "code" varchar(1024) NOT NULL,
    "users" varchar(64),
    "created_at" bigint,
    "expires_at" bigint,
    "profiles" text,
    "privileges" text,
    PRIMARY KEY ("code")
);

CREATE INDEX auth_token_users_idx ON public.auth_token USING btree (users);

-- charges

CREATE TABLE "charges" (
    "uuid" varchar(1024) NOT NULL,
    "document_type" varchar(1024),
    "document_number" varchar(1024),
    "customer_document_type" varchar(32),
    "customer_document_number" varchar(32),
    "customer_name" varchar(1024),
    "charge_details" varchar(2048),
    "sent_date" date,
    "delivery_status" varchar(64),
    "scheduled_date" varchar(255),
    "due_date" date,
    "discount_date" date,
    "late_fee_date" date,
    "amount" double precision,
    "discounted_amount" double precision,
    "tax" double precision,
    "is_read" smallint,
    "attachment_base64" text,
    "template" varchar(1024),
    "recipient" varchar(64),
    "status" varchar(64) DEFAULT 'pendiente'::character varying,
    PRIMARY KEY ("uuid")
);

-- payments

CREATE TABLE "payments" (
    "uuid" varchar(36) NOT NULL,
    "charge_uuid" varchar(1024) NOT NULL,
    "amount" double precision NOT NULL,
    "payment_date" date NOT NULL,
    "method" varchar(64),
    "reference" varchar(255),
    "notes" varchar(1024),
    "attachment_base64" varchar(1024),
    "status" varchar(64) DEFAULT 'pendiente'::character varying,
    PRIMARY KEY ("uuid")
);

CREATE INDEX ix_payments_charge_uuid ON public.payments USING btree (charge_uuid);

-- privilege

CREATE TABLE "privilege" (
    "code" varchar(32) NOT NULL,
    "name" varchar(255) NOT NULL,
    "category" varchar(255) NOT NULL,
    PRIMARY KEY ("code")
);

-- profile

CREATE TABLE "profile" (
    "code" varchar(32) NOT NULL,
    "name" varchar(64) NOT NULL,
    "editable" integer NOT NULL DEFAULT 1,
    PRIMARY KEY ("code")
);

-- profile_x_privilege

CREATE TABLE "profile_x_privilege" (
    "profile_code" varchar(32) NOT NULL,
    "privilege_code" varchar(32) NOT NULL,
    PRIMARY KEY ("profile_code", "privilege_code")
);

ALTER TABLE "profile_x_privilege" ADD CONSTRAINT "profile_x_privilege_profile_code_fkey" FOREIGN KEY ("profile_code") REFERENCES "profile" ("code") ON DELETE CASCADE;
ALTER TABLE "profile_x_privilege" ADD CONSTRAINT "profile_x_privilege_privilege_code_fkey" FOREIGN KEY ("privilege_code") REFERENCES "privilege" ("code") ON DELETE CASCADE;

-- user_x_profile

CREATE TABLE "user_x_profile" (
    "login" character varying NOT NULL,
    "profile" character varying NOT NULL,
    PRIMARY KEY ("login", "profile")
);

ALTER TABLE "user_x_profile" ADD CONSTRAINT "user_x_profile_login_fkey" FOREIGN KEY ("login") REFERENCES "users" ("login") ON DELETE CASCADE;
ALTER TABLE "user_x_profile" ADD CONSTRAINT "user_x_profile_profile_fkey" FOREIGN KEY ("profile") REFERENCES "profile" ("code") ON DELETE CASCADE;

-- users

CREATE TABLE "users" (
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

-- vfs

CREATE TABLE "vfs" (
    "uuid" varchar(36) NOT NULL,
    "filename" varchar(255) NOT NULL,
    "content_type" varchar(128) NOT NULL,
    "base64" text NOT NULL,
    PRIMARY KEY ("uuid")
);
