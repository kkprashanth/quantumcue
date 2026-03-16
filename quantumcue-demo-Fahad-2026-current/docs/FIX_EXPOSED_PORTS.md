# Fix Exposed MongoDB/Redis Ports - Step by Step

If you can still connect to MongoDB (port 27017) or Redis (port 6379) from your local machine using `nc -zv`, follow these steps:

## Quick Fix

Run the force secure ports script:

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/07-force-secure-ports.sh
```

This script will:
1. Force update docker-compose.yml
2. Stop and recreate containers
3. Add firewall deny rules
4. Verify the fix

## Manual Fix (If Script Doesn't Work)

### Step 1: Check Current Configuration

```bash
cd /opt/quantumcuedemo

# Check what's listening
netstat -tuln | grep -E ':(27017|6379)'
# or
ss -tuln | grep -E ':(27017|6379)'

# Check docker-compose.yml
grep -A 5 "mongodb:" docker-compose.yml | grep ports
grep -A 5 "redis:" docker-compose.yml | grep ports
```

### Step 2: Stop Containers Completely

```bash
# Load environment variables
set -a
source backend/.env
set +a

# Stop and remove containers (this removes old port bindings)
docker compose down mongodb redis

# Wait a moment
sleep 2
```

### Step 3: Verify docker-compose.yml is Correct

```bash
# Check MongoDB port binding
grep -A 10 "mongodb:" docker-compose.yml | grep -A 2 "ports:"
# Should show: - "127.0.0.1:27017:27017"

# Check Redis port binding
grep -A 10 "redis:" docker-compose.yml | grep -A 2 "ports:"
# Should show: - "127.0.0.1:6379:6379"

# If not correct, edit manually:
nano docker-compose.yml
```

Make sure MongoDB section looks like:
```yaml
mongodb:
  # ... other config ...
  ports:
    - "127.0.0.1:27017:27017"  # Must have 127.0.0.1
```

Make sure Redis section looks like:
```yaml
redis:
  # ... other config ...
  command: redis-server --appendonly yes --bind 127.0.0.1 ::1
  ports:
    - "127.0.0.1:6379:6379"  # Must have 127.0.0.1
```

### Step 4: Recreate Containers (Not Just Restart)

```bash
# Recreate containers with new configuration
docker compose up -d --force-recreate mongodb redis

# Wait for services to start
sleep 5

# Verify containers are running
docker compose ps mongodb redis
```

### Step 5: Add Firewall Rules (Defense in Depth)

```bash
# Explicitly deny these ports
ufw deny 27017/tcp
ufw deny 6379/tcp

# Verify firewall rules
ufw status | grep -E '(27017|6379)'
```

### Step 6: Verify Port Bindings

```bash
# Check what's actually listening
netstat -tuln | grep -E ':(27017|6379)'
# or
ss -tuln | grep -E ':(27017|6379)'

# Should show 127.0.0.1, NOT 0.0.0.0 or ::

# Check Docker port mappings
docker port quantumcue-mongodb
docker port quantumcue-redis

# Should show 127.0.0.1 bindings
```

### Step 7: Test from Local Machine

From your local machine (not the server):

```bash
# These should FAIL (connection refused or timeout)
nc -zv YOUR_DROPLET_IP 27017
nc -zv YOUR_DROPLET_IP 6379

# If either succeeds, the ports are still exposed!
```

## If Still Exposed After All Steps

### Check for Other Services

```bash
# Check if something else is listening on these ports
sudo lsof -i :27017
sudo lsof -i :6379

# Check all Docker containers
docker ps -a
docker port $(docker ps -q)
```

### Nuclear Option: Restart Docker

```bash
# Restart Docker daemon (this will stop all containers)
systemctl restart docker

# Wait for Docker to start
sleep 5

# Recreate containers
cd /opt/quantumcuedemo
set -a
source backend/.env
set +a
docker compose up -d mongodb redis
```

### Check Docker Network Configuration

```bash
# Inspect the network
docker network inspect quantumcue-network

# Check if ports are exposed at network level
docker network ls
```

## Verification Checklist

After applying fixes, verify:

- [ ] `netstat -tuln | grep 27017` shows `127.0.0.1:27017` (not `0.0.0.0:27017`)
- [ ] `netstat -tuln | grep 6379` shows `127.0.0.1:6379` (not `0.0.0.0:6379`)
- [ ] `ufw status` shows deny rules for 27017 and 6379
- [ ] `nc -zv YOUR_IP 27017` fails from local machine
- [ ] `nc -zv YOUR_IP 6379` fails from local machine
- [ ] `docker port quantumcue-mongodb` shows `127.0.0.1:27017`
- [ ] `docker port quantumcue-redis` shows `127.0.0.1:6379`

## Common Issues

### Issue: Ports still exposed after docker-compose.yml update

**Solution:** Use `--force-recreate` flag:
```bash
docker compose up -d --force-recreate mongodb redis
```

### Issue: Old containers still running

**Solution:** Stop and remove completely:
```bash
docker compose down mongodb redis
docker compose up -d mongodb redis
```

### Issue: Docker cached old configuration

**Solution:** Restart Docker daemon:
```bash
systemctl restart docker
# Then recreate containers
```

### Issue: Firewall not blocking

**Solution:** Add explicit deny rules:
```bash
ufw deny 27017/tcp
ufw deny 6379/tcp
ufw reload
```

## Prevention

To prevent this in the future:

1. Always use `127.0.0.1:PORT:PORT` format in docker-compose.yml
2. Add firewall deny rules as defense in depth
3. Run security script after every deployment
4. Test external access after changes
