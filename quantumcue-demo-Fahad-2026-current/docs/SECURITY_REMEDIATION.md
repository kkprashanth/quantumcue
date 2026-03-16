# Security Remediation Guide

## Immediate Action Required: MongoDB and Redis Exposure

If you've received a security scan report indicating that MongoDB (port 27017) or Redis (port 6379) are exposed to the public internet, follow these steps immediately.

## Quick Fix (Recommended)

Run the automated security hardening script:

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/04-secure-services.sh
```

This script will automatically:
1. Detect if services are exposed
2. Update configuration to bind to localhost only
3. Restart services securely
4. Verify the fix

## Manual Fix

If you prefer to fix manually or the script doesn't work:

### Step 1: Stop Exposed Services

```bash
cd /opt/quantumcuedemo
docker compose down mongodb redis
```

### Step 2: Update docker-compose.yml

Edit `docker-compose.yml` and update the MongoDB and Redis port bindings:

**For MongoDB:**
```yaml
mongodb:
  # ... other config ...
  ports:
    - "127.0.0.1:27017:27017"  # Changed from "27017:27017"
```

**For Redis:**
```yaml
redis:
  # ... other config ...
  command: redis-server --appendonly yes --bind 127.0.0.1 ::1
  ports:
    - "127.0.0.1:6379:6379"  # Changed from "6379:6379"
```

### Step 3: Restart Services

```bash
# Load environment variables
set -a
source backend/.env
set +a

# Start services with secure configuration
docker compose up -d mongodb redis
```

### Step 4: Verify the Fix

From your local machine (not the server), test external access using one of these methods:

**Option 1: Using netcat (nc) - Recommended**
```bash
# Install netcat if needed (Ubuntu/Debian)
sudo apt install -y netcat-openbsd

# Test MongoDB (should fail)
nc -zv YOUR_DROPLET_IP 27017

# Test Redis (should fail)
nc -zv YOUR_DROPLET_IP 6379
```

**Option 2: Using bash TCP redirection**
```bash
# Test MongoDB (should fail with "Connection refused")
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/27017" 2>&1

# Test Redis (should fail with "Connection refused")
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/6379" 2>&1
```

**Option 3: Using curl**
```bash
# Test MongoDB (should fail)
curl -v --connect-timeout 2 telnet://YOUR_DROPLET_IP:27017

# Test Redis (should fail)
curl -v --connect-timeout 2 telnet://YOUR_DROPLET_IP:6379
```

**Option 4: Install telnet (if you prefer)**
```bash
# Ubuntu/Debian
sudo apt install -y telnet

# macOS
brew install telnet

# Then use:
telnet YOUR_DROPLET_IP 27017  # Should fail
telnet YOUR_DROPLET_IP 6379   # Should fail
```

All methods should fail with "Connection refused", "Connection timed out", or similar errors. If any connection succeeds, the services are still exposed.

## Verify Current State

### Check if Services are Exposed

On the server:

```bash
# Check MongoDB
netstat -tuln | grep 27017
# or
ss -tuln | grep 27017

# Check Redis
netstat -tuln | grep 6379
# or
ss -tuln | grep 6379
```

If you see `0.0.0.0:27017` or `:::27017` (or similar for 6379), the service is exposed.

### Test External Access

From your local machine, use one of these methods:

**Using netcat (nc) - Recommended:**
```bash
# Test MongoDB (should fail after fix)
nc -zv YOUR_DROPLET_IP 27017

# Test Redis (should fail after fix)
nc -zv YOUR_DROPLET_IP 6379
```

**Using bash TCP redirection:**
```bash
# Test MongoDB
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/27017" 2>&1

# Test Redis
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/6379" 2>&1
```

**Using curl:**
```bash
# Test MongoDB
curl -v --connect-timeout 2 telnet://YOUR_DROPLET_IP:27017

# Test Redis
curl -v --connect-timeout 2 telnet://YOUR_DROPLET_IP:6379
```

If any connection succeeds (shows "succeeded", "open", or "Connected"), the service is still exposed.

## Why This Matters

### MongoDB Exposure Risks

- **Data Theft**: Attackers can read all data in your database
- **Data Deletion**: Attackers can delete or corrupt your data
- **Ransomware**: Attackers may encrypt your data and demand payment
- **Compliance Violations**: Exposed databases violate security standards (GDPR, HIPAA, etc.)

### Redis Exposure Risks

- **Command Execution**: Attackers can execute arbitrary commands
- **Data Access**: Attackers can read cached data (sessions, tokens, etc.)
- **Cryptocurrency Mining**: Attackers may use your server for mining
- **Denial of Service**: Attackers can exhaust server resources

## Prevention

### For New Deployments

1. Always run `04-secure-services.sh` immediately after deployment
2. Verify services are not exposed before going live
3. Use the updated `docker-compose.yml` which binds to localhost by default

### For Existing Deployments

1. Run the security script: `bash scripts/digitalocean/04-secure-services.sh`
2. Add to your deployment checklist
3. Regularly audit exposed ports: `netstat -tuln` or `ss -tuln`

## Additional Security Measures

### Firewall Configuration

Ensure your firewall (UFW) is properly configured:

```bash
# Check firewall status
ufw status

# Only allow necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
# DO NOT allow 27017 or 6379
```

### Network Isolation

Consider using Docker networks to isolate services:

```yaml
networks:
  quantumcue-network:
    driver: bridge
    internal: false  # Set to true to prevent external access
```

### Authentication

Ensure MongoDB and Redis have strong passwords set in `backend/.env`:

```bash
MONGO_USER=quantumcue
MONGO_PASSWORD=your-strong-password-here
```

## Monitoring

### Check for Unauthorized Access

```bash
# Check MongoDB logs
docker compose logs mongodb | grep -i "connection\|auth\|error"

# Check Redis logs
docker compose logs redis | grep -i "connection\|auth\|error"
```

### Regular Security Audits

Run these commands regularly:

```bash
# List all listening ports
netstat -tuln | grep LISTEN
# or
ss -tuln | grep LISTEN

# Check for unexpected services
docker compose ps
```

## Support

If you need help:

1. Check the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review the [DROPLET_SETUP_WALKTHROUGH.md](./DROPLET_SETUP_WALKTHROUGH.md)
3. Run the security script: `bash scripts/digitalocean/04-secure-services.sh`
4. Check application logs: `docker compose logs`

## References

- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Redis Security Guide](https://redis.io/topics/security)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
