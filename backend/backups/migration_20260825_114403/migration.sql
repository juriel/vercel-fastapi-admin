-- Schema + data for migrating this app to a new database.
-- Generated 2026-08-25T11:44:03.781693 from the current DATABASE_URL.

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

-- data: privilege
INSERT INTO "privilege" ("code", "name", "category") VALUES ('users.read', 'Read users', 'users');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('users.write', 'Write users', 'users');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('dashboard.view', 'Ver dashboard', 'dashboard');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('users.add', 'Add users', 'users');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('users.edit', 'Edit users', 'users');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('users.view', 'View users', 'users');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('users.delete', 'Delete users', 'users');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('users.list', 'List users', 'users');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('profiles.read', 'Read profiles', 'profiles');
INSERT INTO "privilege" ("code", "name", "category") VALUES ('profiles.write', 'Write profiles', 'profiles');

-- data: profile
INSERT INTO "profile" ("code", "name", "editable") VALUES ('admin', 'Administrator', 1);
INSERT INTO "profile" ("code", "name", "editable") VALUES ('pepe', 'Pepe', 1);
INSERT INTO "profile" ("code", "name", "editable") VALUES ('viewer', 'Visualizador', 1);
INSERT INTO "profile" ("code", "name", "editable") VALUES ('chao', 'cccc', 1);

-- data: users
INSERT INTO "users" ("login", "password", "category", "name", "email", "phone", "salt", "active", "profile_picture") VALUES ('jaime', 'a25f0a6e354968b53edde26ea93d3f01abcaad80cc87dc6b1a793c31c3432a43', NULL, 'Jaime', NULL, NULL, '76cfe0eea693dd15e5344d9d2ad8a7c2', 1, NULL);
INSERT INTO "users" ("login", "password", "category", "name", "email", "phone", "salt", "active", "profile_picture") VALUES ('pepe', '4bc48a8002321de69e98ba0a007b1f51cff0a4876ce79574cc60018f72dee754', NULL, 'Jose', NULL, NULL, '46e6fc116eb67aab11e7c359f1c90b50', 1, NULL);
INSERT INTO "users" ("login", "password", "category", "name", "email", "phone", "salt", "active", "profile_picture") VALUES ('demo', 'dd8edc6dc74c370d19a189d401bcc65982cc23d36fdd50d46ca4585d25dc433b', NULL, 'Usuario Demo', NULL, NULL, '770533145089c0c6d020bb97d399307e', 1, NULL);
INSERT INTO "users" ("login", "password", "category", "name", "email", "phone", "salt", "active", "profile_picture") VALUES ('juriel', 'c5e03e4a50a4d0bbab4201eefb47f7f2990daa1dd8777f1d524b00ea4ccf685b', NULL, 'Jaime Uriel Torres', 'juriel@comtor.net', NULL, '9ded4632dce17417b177d2b7973e2f93', 1, NULL);
INSERT INTO "users" ("login", "password", "category", "name", "email", "phone", "salt", "active", "profile_picture") VALUES ('Kevin', 'e68c8937b62e57a3a8f022b9ab640996feb934fde940472aaba2fab0711b3f45', NULL, 'Kevin Caicedooo', 'kevin@comtor.net', NULL, '104af6dc3a39bb35b982a09de4018100', 1, NULL);
INSERT INTO "users" ("login", "password", "category", "name", "email", "phone", "salt", "active", "profile_picture") VALUES ('Junior', '9e8820df589ba093e840416fe666c7b683f27a899141e943106677d4fd213f3b', NULL, 'junior', 'junior@comtor.com', NULL, 'a616d45575d1895936a0068f6268359e', 1, NULL);
INSERT INTO "users" ("login", "password", "category", "name", "email", "phone", "salt", "active", "profile_picture") VALUES ('paola', '164d215a7e3361228e677fcf51ae5bec03c72e311cbf8341b651cbc2bb63ba7c', NULL, 'Paola', 'paola@comtor.net', NULL, '6bb172ece3fa4b11530eb4c39fba68fa', 1, NULL);

-- data: 
-- data: profile_x_privilege
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'dashboard.view');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'profiles.read');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'profiles.write');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'users.add');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'users.delete');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'users.edit');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'users.list');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'users.read');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'users.write');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('admin', 'users.view');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('pepe', 'users.edit');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('pepe', 'users.read');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('pepe', 'profiles.read');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('viewer', 'profiles.read');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('viewer', 'users.list');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('viewer', 'users.read');
INSERT INTO "profile_x_privilege" ("profile_code", "privilege_code") VALUES ('viewer', 'users.view');

-- data: user_x_profile
INSERT INTO "user_x_profile" ("login", "profile") VALUES ('jaime', 'admin');
INSERT INTO "user_x_profile" ("login", "profile") VALUES ('demo', 'admin');
INSERT INTO "user_x_profile" ("login", "profile") VALUES ('juriel', 'admin');
INSERT INTO "user_x_profile" ("login", "profile") VALUES ('Kevin', 'admin');
INSERT INTO "user_x_profile" ("login", "profile") VALUES ('Junior', 'admin');
INSERT INTO "user_x_profile" ("login", "profile") VALUES ('paola', 'admin');

