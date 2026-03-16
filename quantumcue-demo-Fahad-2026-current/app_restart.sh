#!/bin/bash
# restart-quantumcue.sh - Restart script for docker-compose.yml + docker-compose.prod.yml
# Usage: ./restart-quantumcue.sh

echo "🔄 Restarting QuantumCue production stack..."

# Define your exact compose files
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

# Stop all services (graceful)
echo "⏹️  Stopping services..."
docker compose $COMPOSE_FILES stop

# Start all services (no rebuild)
echo "▶️  Starting services..."
docker compose $COMPOSE_FILES start

# Show status
echo "✅ Restart complete!"
echo "📊 Status:"
docker compose $COMPOSE_FILES ps

echo "📋 Recent logs:"
docker compose $COMPOSE_FILES logs --tail=10

