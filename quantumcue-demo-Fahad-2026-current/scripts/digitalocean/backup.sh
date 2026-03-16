#!/bin/bash
# QuantumCue - Backup Script for DigitalOcean
# Creates backups of PostgreSQL and MongoDB databases

set -e

# Configuration
APP_DIR="/opt/quantumcuedemo"
BACKUP_DIR="/opt/backups/quantumcue"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

echo "=========================================="
echo "QuantumCue - Database Backup"
echo "=========================================="
echo ""

# Backup PostgreSQL
echo -e "${YELLOW}[1/3] Backing up PostgreSQL...${NC}"
docker compose -f $APP_DIR/docker-compose.yml exec -T postgres \
    pg_dump -U quantumcue quantumcue > $BACKUP_DIR/postgres_$DATE.sql 2>/dev/null || {
    echo -e "${RED}✗ PostgreSQL backup failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ PostgreSQL backup created: postgres_$DATE.sql${NC}"

# Backup MongoDB
echo -e "${YELLOW}[2/3] Backing up MongoDB...${NC}"
docker compose -f $APP_DIR/docker-compose.yml exec -T mongodb \
    mongodump --archive > $BACKUP_DIR/mongodb_$DATE.archive 2>/dev/null || {
    echo -e "${YELLOW}⚠ MongoDB backup failed (may not be critical)${NC}"
}

if [ -f "$BACKUP_DIR/mongodb_$DATE.archive" ]; then
    echo -e "${GREEN}✓ MongoDB backup created: mongodb_$DATE.archive${NC}"
fi

# Compress backups
echo -e "${YELLOW}[3/3] Compressing backups...${NC}"
cd $BACKUP_DIR
tar -czf backup_$DATE.tar.gz postgres_$DATE.sql mongodb_$DATE.archive 2>/dev/null || {
    tar -czf backup_$DATE.tar.gz postgres_$DATE.sql
}
echo -e "${GREEN}✓ Backup compressed: backup_$DATE.tar.gz${NC}"

# Remove uncompressed files
rm -f $BACKUP_DIR/postgres_$DATE.sql $BACKUP_DIR/mongodb_$DATE.archive

# Remove old backups
echo -e "${YELLOW}Cleaning up old backups (keeping last $RETENTION_DAYS days)...${NC}"
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}✓ Old backups cleaned up${NC}"

# Show backup size
BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.tar.gz | cut -f1)
echo ""
echo -e "${GREEN}=========================================="
echo "Backup complete!"
echo "=========================================="
echo "Backup file: backup_$DATE.tar.gz"
echo "Size: $BACKUP_SIZE"
echo "Location: $BACKUP_DIR"
echo ""

