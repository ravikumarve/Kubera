#!/bin/bash
# KUBERA PostgreSQL backup script
# Usage: ./scripts/backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

PGPASSWORD=${PGPASSWORD:-postgres} pg_dump \
  -h ${PGHOST:-localhost} \
  -U ${PGUSER:-postgres} \
  -d ${PGDATABASE:-kubera} \
  -F c \
  -f "${BACKUP_DIR}/kubera_${TIMESTAMP}.dump"

echo "✅ Backup saved: ${BACKUP_DIR}/kubera_${TIMESTAMP}.dump"
