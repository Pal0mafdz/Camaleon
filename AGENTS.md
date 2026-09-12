# camaleon

This file provides context about the project for AI assistants.

## Project Overview

- **Ecosystem**: Typescript

## Tech Stack

- **Runtime**: bun
- **Package Manager**: pnpm

### Frontend

- Framework: react-vite
- UI Library: mui
- State: zustand

### Backend

- Framework: hono
- Validation: zod

### Database

- Database: sqlite
- ORM: drizzle

### Additional Features

- AI: vercel-ai

## Project Structure

```
camaleon/
├── apps/
│   ├── web/         # Frontend application
│   └── server/      # Backend API
├── packages/
│   └── db/          # Database schema
```

## Common Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm db:push` - Push database schema
- `pnpm db:studio` - Open database UI

Local development uses `http://localhost:5174` for the frontend and
`http://localhost:3000` for the API. Vite uses `strictPort` so an occupied 5174
fails explicitly instead of switching to an origin blocked by CORS. Keep
`apps/server/.env`'s `CORS_ORIGIN` aligned with the frontend origin and
`apps/web/.env`'s `VITE_SERVER_URL` aligned with the API URL.

## Better Fullstack project context

`bts.jsonc` is the authority for the current Stack Graph. Its `stackParts` array owns role selection and `ownerPartId` bindings. Top-level option fields are a compatibility projection and must not become a second mutation path.

### Stack Parts, ownership, and evidence

- `backend.ai:typescript:vercel-ai`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.orm:typescript:drizzle`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.runtime:typescript:bun`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.validation:typescript:zod`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend:typescript:hono`. Its generated target is `apps/server`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `codeQuality:universal:biome`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `database:universal:sqlite`. Its generated target is `packages/db`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `examples:universal:ai`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.animation:typescript:framer-motion`. It belongs to `frontend:typescript:react-vite`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.appPlatform:typescript:pwa`. It belongs to `frontend:typescript:react-vite`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.stateManagement:typescript:zustand`. It belongs to `frontend:typescript:react-vite`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.ui:typescript:mui`. It belongs to `frontend:typescript:react-vite`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend:typescript:react-vite`. Its generated target is `apps/web`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `workspaceRunner:universal:turborepo`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.

### Installed-version authority

Use `bts.jsonc` for the generator and schema version. Use local package manifests and lockfiles for installed dependency versions. Do not assume that documentation for a newer Better Fullstack release matches this project.

### Compatibility and lifecycle safety

Run `create-better-fullstack context --json` for bounded roles, capabilities, evidence, compatibility issues, and safe next actions. Run `create-better-fullstack doctor --json` before repairing graph drift. Existing-project writes must start with a plan and use the exact review token. Use `create-better-fullstack recipes check --json` before editing recipe-owned paths or managed regions, and use recipe history plus project recovery commands to undo a reviewed operation.

User code outside an explicit Better Fullstack managed region is not generator-owned. Missing or changed managed-region hashes stop recipe planning for manual review.

<!-- <better-fullstack:recipes sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855> -->

<!-- </better-fullstack:recipes> -->

## Maintenance

Keep AGENTS.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
