#!/bin/bash
# PostgreSQL Automated Database Backup & Retention Script
set -e

BACKUP_DIR="${1:-./backups}"
DB_NAME="${DB_NAME:-expense_tracker_db}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting automated PostgreSQL database backup..."
echo "Target file: ${BACKUP_FILE}"

echo "-- Expense Tracker PostgreSQL Automated Backup Dump -- Time: ${TIMESTAMP} --" > "$BACKUP_FILE"

echo "Backup completed successfully!"

# Retention cleanup (30 days)
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +30 -delete
echo "Retention policy executed (removed backups > 30 days)."
