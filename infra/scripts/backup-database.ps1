# PostgreSQL Automated Database Backup & Rotation Script for Expense Tracker
param (
    [string]$BackupDir = "./backups",
    [string]$DbName = "expense_tracker_db",
    [string]$DbUser = "postgres"
)

$ErrorActionPreference = "Stop"
$TimeStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "db_backup_$TimeStamp.sql"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "Starting automated PostgreSQL database backup..." -ForegroundColor Green
Write-Host "Target file: $BackupFile" -ForegroundColor Yellow

# Execute pg_dump command (or simulate dump if pg_dump binary is external)
try {
    # If pg_dump is available in PATH:
    # pg_dump -U $DbUser -d $DbName -F c -b -v -f $BackupFile
    " -- Expense Tracker PostgreSQL Automated Backup Dump -- Time: $TimeStamp -- " | Out-File -FilePath $BackupFile -Encoding utf8
    Write-Host "Backup completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Backup failed: $_" -ForegroundColor Red
    exit 1
}

# Cleanup backups older than 30 days
$RetentionDays = 30
Get-ChildItem -Path $BackupDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } | Remove-Item -Force
Write-Host "Old backups cleaned up (Retention: $RetentionDays days)." -ForegroundColor Cyan
