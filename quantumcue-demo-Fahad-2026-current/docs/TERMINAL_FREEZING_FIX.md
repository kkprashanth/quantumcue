# Terminal Freezing Fix - Quick Reference

## Immediate Commands to Run (When Terminal Freezes)

### Option 1: Use DigitalOcean Console (Recommended)

If SSH/tmux is completely frozen:

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click your Droplet
3. Click **"Access"** → **"Launch Droplet Console"**
4. This gives you a browser-based terminal (no SSH needed)

### Option 2: Quick Diagnostic Commands

Once you have a working terminal, run these **one at a time** (don't run all at once if system is slow):

```bash
# Check disk space (MOST COMMON CAUSE)
df -h

# If disk is >90% full, free up space immediately:
docker system prune -a --volumes
docker volume prune

# Check memory
free -h

# Check system load
uptime

# Check what's using resources
ps aux --sort=-%cpu | head -10
```

### Option 3: Run Diagnostic Script

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/05-diagnose-freezing.sh
```

This will show you exactly what's wrong.

### Option 4: Apply Automatic Fixes

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/06-fix-freezing.sh
```

This will:
- Free up disk space
- Restart Docker
- Restart services
- Add swap space

## Most Common Causes

### 1. Disk Full (>90% usage)

**Symptoms:** Terminal freezes, commands hang, even `cd` doesn't work

**Quick Fix:**
```bash
# Free up Docker space
docker system prune -a --volumes

# Check again
df -h
```

**If still full:**
```bash
# Remove old logs
journalctl --vacuum-time=7d

# Remove old backups (if you have many)
find /opt/backups -type f -mtime +30 -delete
```

### 2. Memory Exhausted (No Swap)

**Symptoms:** System is swapping heavily, everything is slow

**Quick Fix:**
```bash
# Check memory
free -h

# Add 2GB swap (if none exists)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo "/swapfile none swap sw 0 0" >> /etc/fstab
```

### 3. Docker Containers Using Too Much Memory

**Symptoms:** High memory usage, containers restarting

**Quick Fix:**
```bash
# Check container memory usage
docker stats --no-stream

# Restart Docker
systemctl restart docker

# Restart services
cd /opt/quantumcuedemo
docker compose restart
```

### 4. High System Load

**Symptoms:** CPU at 100%, commands take forever

**Quick Fix:**
```bash
# See what's using CPU
ps aux --sort=-%cpu | head -10

# Kill problematic processes (if safe)
kill -9 PID

# Or restart everything
systemctl restart docker
cd /opt/quantumcuedemo && docker compose restart
```

## Prevention

### 1. Monitor Disk Space Regularly

```bash
# Add to crontab (runs daily)
crontab -e

# Add this line:
0 2 * * * df -h | mail -s "Disk Usage" your-email@example.com
```

### 2. Set Up Swap Space

If you have a 2-4GB RAM droplet, always have at least 2GB swap:

```bash
# Check if swap exists
swapon --show

# If none, add it (see "Memory Exhausted" section above)
```

### 3. Regular Docker Cleanup

```bash
# Add to crontab (weekly cleanup)
0 3 * * 0 docker system prune -af --volumes
```

### 4. Use Resource Limits in Docker Compose

Edit `docker-compose.yml` to add memory limits:

```yaml
services:
  backend:
    # ... other config ...
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## Emergency Recovery

If **nothing works** and you can't access the server:

1. **Use DigitalOcean Console** (browser-based, always works)
2. **Reboot the droplet** from DigitalOcean dashboard (last resort)
3. **Resize the droplet** to get more RAM/CPU (if resources are the issue)

## Quick Command Reference

```bash
# Check everything at once
df -h && free -h && uptime

# Free up space
docker system prune -a --volumes

# Restart Docker
systemctl restart docker

# Restart services
cd /opt/quantumcuedemo && docker compose restart

# Add swap
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile

# Check what's using resources
ps aux --sort=-%cpu | head -10
docker stats --no-stream
```

## When to Upgrade Your Droplet

Consider upgrading if:
- Disk is consistently >80% full
- Memory usage is consistently >90%
- System load is consistently >2x CPU cores
- Freezing happens regularly despite fixes

**Recommended minimums:**
- **2GB RAM / 1 vCPU** - Minimum for development
- **4GB RAM / 2 vCPU** - Recommended for production
- **8GB RAM / 4 vCPU** - For production with high traffic
