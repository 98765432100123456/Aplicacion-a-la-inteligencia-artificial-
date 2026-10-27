#!/bin/sh
# Respaldo diario de MariaDB. Programar con cron, por ejemplo a las 2:15 a. m.:
#   15 2 * * * /opt/ica-bienestar/despliegue/respaldo.sh >> /var/log/ica-respaldo.log 2>&1
# Conserva los respaldos de los últimos 14 días en despliegue/respaldos/.
set -eu
cd "$(dirname "$0")"
FECHA=$(date +%Y-%m-%d_%H%M)
docker compose -f docker-compose.servidor.yml --env-file .env.servidor exec -T db \
  sh -c 'mariadb-dump --single-transaction --routines --triggers -u root -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' \
  | gzip > "respaldos/ica_bienestar_$FECHA.sql.gz"
find respaldos -name 'ica_bienestar_*.sql.gz' -mtime +14 -delete
echo "Respaldo creado: respaldos/ica_bienestar_$FECHA.sql.gz"
