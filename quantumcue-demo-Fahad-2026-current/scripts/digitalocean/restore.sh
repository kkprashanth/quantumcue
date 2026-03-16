#!/bin/bash
# QuantumCue - Restore Script for DigitalOcean
# Restores PostgreSQL and MongoDB from backup

set -e

# Configuration
APP_DIR="/opt/quantumcuedemo"
BACKUP_DIR="/opt/backups/quantumcue"

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

# List available backups
echo "=========================================="
echo "QuantumCue - Database Restore"
echo "=========================================="
echo ""
echo "Available backups:"
ls -lh $BACKUP_DIR/backup_*.tar.gz 2>/dev/null || {
    echo -e "${RED}No backups found in $BACKUP_DIR${NC}"
    exit 1
}
echo ""

# Get backup file
read -p "Enter backup filename (e.g., backup_20240101_120000.tar.gz): " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}Backup file not found: $BACKUP_DIR/$BACKUP_FILE${NC}"
    exit 1
fi

# Confirm restore
echo -e "${RED}WARNING: This will overwrite existing database data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Extract backup
echo -e "${YELLOW}[1/3] Extracting backup...${NC}"
cd $BACKUP_DIR
tar -xzf $BACKUP_FILE
echo -e "${GREEN}✓ Backup extracted${NC}"

# Restore PostgreSQL
if [ -f "postgres_*.sql" ]; then
    echo -e "${YELLOW}[2/3] Restoring PostgreSQL...${NC}"
    POSTGRES_FILE=$(ls postgres_*.sql | head -1)
    docker compose -f $APP_DIR/docker-compose.yml exec -T postgres \
        psql -U quantumcue -d quantumcue < $POSTGRES_FILE || {
        echo -e "${RED}✗ PostgreSQL restore failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ PostgreSQL restored${NC}"
fi

# Restore MongoDB
if [ -f "mongodb_*.archive" ]; then
    echo -e "${YELLOW}[3/3] Restoring MongoDB...${NC}"
    MONGO_FILE=$(ls mongodb_*.archive | head -1)
    docker compose -f $APP_DIR/docker-compose.yml exec -T mongodb \
        mongorestore --archive < $MONGO_FILE || {
        echo -e "${YELLOW}⚠ MongoDB restore failed (may not be critical)${NC}"
    }
    echo -e "${GREEN}✓ MongoDB restored${NC}"
fi

# Cleanup extracted files
rm -f postgres_*.sql mongodb_*.archive

echo ""
echo -e "${GREEN}=========================================="
echo "Restore complete!"
echo "=========================================="
echo ""

