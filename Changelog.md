# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.2.1 (2026-07-30)


### Features

*  admin routes 3a60534
* add better-auth and bump to 0.2.0 40c6ff9
* setup authentication flow with better auth b7e7fb5

## [0.2.0] - 2026-07-29

### Added

- Better Auth Fastify integration (`/api/auth/*` catch-all + `GET /api/me`)
- Admin plugin with access control (roles, ban/impersonate schema fields)
- Email + password auth with required verification, password reset, and welcome emails via nodemailer
- Rate limiting and 5-minute session cookie cache
- Invite-only signup (`disableSignUp`); users created via admin APIs
- Role helpers and Fastify guards (`requireAuth`, `requireAdmin`, `requireHeadOffice`)
- Drizzle migration for auth tables and `pnpm db:seed` role-ladder seeder
- `.env.example` documenting auth, CORS, SMTP, and seed overrides

### Changed

- Aligned `CORS_ORIGIN` / `CLIENT_ORIGIN` / `BETTER_AUTH_URL` defaults with the API port (`8080`) and Vite client (`5173`)

## [0.1.0] - Initial

### Added

- Initial backend setup with Fastify, Drizzle ORM, Biome, Docker, and Husky
