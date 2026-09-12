# Imagen de la base de datos de Camaleón para desarrollo en equipo.

# `sqld` no guarda un .sqlite suelto: administra su propio directorio de
# datos bajo --db-path (namespaces, WAL, metastore). Por eso el sembrado
# corre levantando `sqld` de verdad dentro del build (`docker-seed.sh`) y
# lo que se copia a la imagen final es ese directorio completo.
#
# Build (desde la raíz del repo, necesita el workspace completo de contexto):
#   docker compose build db
FROM oven/bun:1 AS seed
WORKDIR /repo

# Copiar primero solo los package.json de lo que necesita @camaleon/db
# para que el `pnpm install` se cachee si el código cambia pero las
# dependencias no.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/config/package.json packages/config/package.json

RUN bun install -g pnpm@10.34.5 \
  && pnpm install --frozen-lockfile --filter @camaleon/db...

# El binario de sqld, para levantarlo aquí mismo durante el build.
COPY --from=ghcr.io/tursodatabase/libsql-server:latest /bin/sqld /usr/local/bin/sqld

COPY packages/db packages/db
COPY packages/env packages/env

# @camaleon/env/server valida con zod que estas variables existan, aunque
# sembrar la base nunca llama al modelo de IA — son solo para pasar esa
# validación durante el build. DATABASE_URL apunta al sqld que levanta
# docker-seed.sh en localhost, no a un archivo.
ENV DATABASE_URL=http://127.0.0.1:8080
ENV CORS_ORIGIN=http://localhost:5174
ENV GOOGLE_GENERATIVE_AI_API_KEY=unused-during-seed
ENV NODE_ENV=development

RUN chmod +x packages/db/docker-seed.sh && packages/db/docker-seed.sh

FROM ghcr.io/tursodatabase/libsql-server:latest
COPY --from=seed /var/lib/sqld /var/lib/sqld
# La imagen base baja privilegios a un usuario "sqld" no-root vía gosu
# (ver /usr/local/bin/docker-wrapper.sh); sin este chown, los datos
# sembrados (copiados como root) quedan sin permiso de escritura para ese
# usuario y sqld arranca en modo solo-lectura.
RUN chown -R sqld:sqld /var/lib/sqld
EXPOSE 8080
CMD ["sqld", "--db-path", "/var/lib/sqld", "--http-listen-addr", "0.0.0.0:8080", "--no-welcome"]
