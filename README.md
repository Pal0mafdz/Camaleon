# camaleon

This project was created with [Better Fullstack](https://github.com/Marve10s/Better-Fullstack) using the multi-ecosystem project graph.

## Stack

- Frontend: react-vite (typescript)
- Backend: not selected

## Project Structure

```text
camaleon/
├── apps/
│   ├── web/         # Frontend application
└── package.json     # Root scripts for the generated graph
```

## Local Development

Install the JavaScript workspace dependencies first. If you created the project with `--no-install`, this step has not run yet.

```sh
pnpm install
```

Database-backed backend selections expect a local sqlite database or a matching `DATABASE_URL` in the backend environment before you start the server. Copy the backend `.env.example` to `.env` and adjust it for your machine.

Run the generated apps in separate terminals so each ecosystem keeps its native watcher and logs.

```sh
pnpm dev:web
```

### Base de datos compartida (Docker)

Para que todo el equipo arranque con exactamente los mismos datos (Karla,
Roberto, catálogo de productos, población sintética de peers — ver
`packages/db/src/seed.ts`) sin instalar bun/pnpm/sqlite, hay una imagen que
siembra la base y la sirve con `sqld`:

```sh
pnpm db:docker:up
```

Luego, en `apps/server/.env`:

```
DATABASE_URL=http://localhost:8080
```

- `pnpm db:docker:down` — apaga el contenedor (los datos quedan en el volumen de Docker).
- `pnpm db:docker:reset` — borra el volumen y reconstruye la imagen, para volver a los datos originales de fábrica.

Si prefieres una sqlite local propia en vez de la compartida, deja
`DATABASE_URL=file:../../packages/db/local.db` y corre
`pnpm db:push && pnpm -F @camaleon/db db:seed` una vez.

## Root Scripts

- `dev` starts the primary generated workspace for graph projects.
- `dev:web` starts the frontend workspace.

## Compatibility Notes

- TypeScript frontends can be generated with Elixir Phoenix backends; Phoenix runs on port 4000 and exposes `/api/health`.
- Astro frontends can be generated with Rust backends; Rust web servers run on port 3000 and expose `/health`.
- Cross-ecosystem graph projects share an HTTP boundary. Framework-specific API clients such as tRPC are not assumed across language boundaries; the scaffold wires the frontend to the backend base URL and health endpoint.
