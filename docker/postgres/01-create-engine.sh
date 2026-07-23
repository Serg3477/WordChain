#!/bin/sh
set -eu

if [ -z "${ENGINE_DB_NAME:-}" ]; then
    echo "ENGINE_DB_NAME is not set"
    exit 1
fi

echo "Creating additional database: ${ENGINE_DB_NAME}"

psql \
    --set ON_ERROR_STOP=1 \
    --username "${POSTGRES_USER}" \
    --dbname "${POSTGRES_DB}" \
    --set engine_db="${ENGINE_DB_NAME}" \
    <<'EOSQL'
SELECT format(
    'CREATE DATABASE %I OWNER %I',
    :'engine_db',
    current_user
)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_database
    WHERE datname = :'engine_db'
)
\gexec
EOSQL

echo "Additional database ${ENGINE_DB_NAME} is ready"