#!/bin/sh
# Levanta sqld temporalmente durante el build para sembrar sus datos en su
# formato nativo (no es un .sqlite plano: sqld administra su propio
# directorio bajo --db-path), y lo apaga al terminar. El directorio
# resultante (/var/lib/sqld) es lo que se copia a la imagen final.
set -e

sqld --db-path /var/lib/sqld --http-listen-addr 127.0.0.1:8080 --no-welcome &
SQLD_PID=$!
trap 'kill "$SQLD_PID" 2>/dev/null || true' EXIT

# sqld tarda un instante en aceptar conexiones; reintenta el push en vez
# de depender de un healthcheck (la imagen no trae curl/wget).
tries=0
until pnpm --filter @camaleon/db db:push; do
  tries=$((tries + 1))
  if [ "$tries" -ge 10 ]; then
    echo "sqld no respondió a tiempo" >&2
    exit 1
  fi
  sleep 1
done

pnpm --filter @camaleon/db db:seed

kill "$SQLD_PID"
wait "$SQLD_PID" 2>/dev/null || true
trap - EXIT
