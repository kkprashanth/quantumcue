# DigitalOcean Deployment Scripts

This directory contains scripts for deploying and managing QuantumCue on DigitalOcean Droplets running Ubuntu 24.04 LTS.

## Scripts Overview

### Setup Scripts (Run in order)

1. **`01-initial-setup.sh`** - Initial server configuration
   - Updates system packages
   - Installs essential tools (curl, git, ufw, fail2ban)
   - Configures firewall
   - Creates application directories
   - Optional: Creates non-root user

2. **`02-install-docker.sh`** - Docker installation
   - Installs Docker Engine
   - Installs Docker Compose plugin
   - Starts and enables Docker service
   - Adds user to docker group

3. **`03-deploy.sh`** - Application deployment
   - Clones/updates repository
   - Creates environment files from examples
   - Generates secret keys
   - Starts database services
   - Runs database migrations

4. **`04-secure-services.sh`** - Security hardening (IMPORTANT)
   - Secures MongoDB by binding to localhost only
   - Secures Redis by binding to localhost only
   - Verifies services are not exposed to public internet
   - Tests external access to ensure ports are blocked
   - **Run this after initial deployment to fix security vulnerabilities**

4b. **`07-force-secure-ports.sh`** - Force secure port binding (if 04-secure-services.sh didn't work)
   - Forces update of docker-compose.yml port bindings
   - Stops and recreates containers with secure configuration
   - Adds explicit firewall deny rules for ports 27017 and 6379
   - Verifies port bindings are correct
   - **Run this if you can still connect to MongoDB/Redis from external IPs**

5. **`start.sh`** - Start all services
   - Loads environment variables from backend/.env
   - Starts PostgreSQL database
   - Runs database migrations
   - Starts all services (backend, frontend, nginx)

### Management Scripts

6. **`backup.sh`** - Database backup
   - Backs up PostgreSQL database
   - Backs up MongoDB database
   - Compresses backups
   - Removes old backups (keeps last 7 days)

7. **`restore.sh`** - Database restore
   - Lists available backups
   - Restores PostgreSQL from backup
   - Restores MongoDB from backup

8. **`update.sh`** - Application update
   - Creates backup before update
   - Pulls latest code from repository
   - Rebuilds and restarts services
   - Runs database migrations

### Troubleshooting Scripts

9. **`05-diagnose-freezing.sh`** - Diagnose terminal freezing
   - Checks disk space, memory, and swap usage
   - Identifies resource bottlenecks
   - Shows Docker container resource usage
   - Displays system load and I/O wait
   - **Run this if terminal/shell commands are freezing**

10. **`06-fix-freezing.sh`** - Fix terminal freezing
    - Frees up disk space (Docker cleanup)
    - Restarts Docker daemon
    - Restarts application services
    - Adds swap space if needed
    - **Run this after diagnosing freezing issues**

11. **`08-diagnose-upload-issues.sh`** - Diagnose dataset upload issues
    - Checks disk space and memory
    - Verifies uploads directory exists and is writable
    - Finds large files and temporary directories
    - Checks Docker container resource usage
    - Reviews backend logs for upload errors
    - Identifies hanging upload processes
    - Provides cleanup recommendations
    - **Run this if dataset uploads are hanging or failing**

12. **`09-restart-and-verify.sh`** - Restart all services and verify they're running
    - Stops all services gracefully
    - Starts database services (PostgreSQL, MongoDB, Redis)
    - Waits for databases to be ready
    - Starts application services (backend, frontend)
    - Verifies all services are healthy and responding
    - **CRITICAL: Ensures Redis is running** (required for caching)
    - Provides detailed status report
    - **Run this after updates, crashes, or when services are down**

13. **`10-fix-backend-crash.sh`** - Diagnose and fix backend container crashes
    - Checks backend container status and restart count
    - Identifies crash reasons (OOM kills, exceptions, etc.)
    - Checks for large files in uploads that might cause memory issues
    - Provides options to fix:
      1. Restart backend only (keep uploads)
      2. Clean uploads and restart (if OOM kills found)
      3. Full cleanup and rebuild
    - Verifies backend is running after fix
    - **Run this when backend container keeps crashing or restarting**

## Quick Start

### First-Time Deployment

```bash
# 1. SSH into your DigitalOcean droplet
ssh root@your-droplet-ip

# 2. Download and run setup scripts
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/01-initial-setup.sh | bash
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/02-install-docker.sh | bash

# 3. Clone repository and deploy
git clone https://github.com/your-org/quantumcuedemo.git /opt/quantumcuedemo
cd /opt/quantumcuedemo
bash scripts/digitalocean/03-deploy.sh

# 4. Edit environment files
nano backend/.env
nano frontend/.env

# 5. Start application
bash scripts/digitalocean/start.sh

# 6. Secure MongoDB and Redis (IMPORTANT - prevents public exposure)
bash scripts/digitalocean/04-secure-services.sh
```

### Or Use Scripts Locally

If you've already cloned the repository:

```bash
# Copy scripts to server
scp -r scripts/digitalocean root@your-droplet-ip:/tmp/

# SSH into server
ssh root@your-droplet-ip

# Run scripts
bash /tmp/digitalocean/01-initial-setup.sh
bash /tmp/digitalocean/02-install-docker.sh
bash /tmp/digitalocean/03-deploy.sh
```

## Usage Examples

### Create Backup

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/backup.sh
```

### Restore from Backup

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/restore.sh
# Follow prompts to select backup file
```

### Update Application

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/update.sh
```

### Diagnose Terminal Freezing

If your terminal or tmux session keeps freezing (even after simple commands like `cd`):

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/05-diagnose-freezing.sh
```

This will identify the root cause (usually disk space, memory, or swap issues).

### Fix Terminal Freezing

After diagnosing, apply fixes:

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/06-fix-freezing.sh
```

This will:
- Free up disk space
- Restart Docker
- Restart services
- Add swap space if needed

## Configuration

### Environment Variables

Before running `03-deploy.sh`, you can set:

```bash
export QUANTUMCUE_REPO_URL="https://github.com/your-org/quantumcuedemo.git"
export QUANTUMCUE_BRANCH="main"
```

### Backup Retention

Edit `backup.sh` to change retention period:

```bash
RETENTION_DAYS=7  # Keep backups for 7 days
```

## Requirements

- Ubuntu 24.04 LTS
- Root or sudo access
- Internet connection
- At least 2GB RAM (4GB recommended)

## Troubleshooting

### Terminal/Tmux Freezing

If your terminal or tmux session freezes even after simple commands like `cd`:

**Quick Diagnosis:**
```bash
# Check disk space (most common cause)
df -h

# Check memory
free -h

# Check system load
uptime
```

**Full Diagnosis:**
```bash
bash scripts/digitalocean/05-diagnose-freezing.sh
```

**Common Causes & Fixes:**

1. **Disk Full (>90%)** - Most common cause
   ```bash
   # Free up space
   docker system prune -a --volumes
   docker volume prune
   ```

2. **Memory Exhausted** - System is swapping
   ```bash
   # Check memory
   free -h
   
   # Add swap (if none exists)
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   ```

3. **High System Load**
   ```bash
   # Check what's using CPU
   ps aux --sort=-%cpu | head -10
   
   # Restart Docker
   systemctl restart docker
   ```

**Apply All Fixes:**
```bash
bash scripts/digitalocean/06-fix-freezing.sh
```

### Script Fails

- Check if running as root: `sudo bash script.sh`
- Check internet connection
- Review error messages
- Check logs: `journalctl -xe`

### Docker Issues

- Verify Docker is running: `systemctl status docker`
- Check Docker version: `docker --version`
- Restart Docker: `systemctl restart docker`

### Permission Issues

- Ensure scripts are executable: `chmod +x scripts/digitalocean/*.sh`
- If using non-root user, ensure they're in docker group: `usermod -aG docker username`

## Security Notes

### Critical Security Steps

**IMPORTANT**: After deploying, you MUST run the security hardening script:

```bash
bash scripts/digitalocean/04-secure-services.sh
```

This script:
- Binds MongoDB (port 27017) to localhost only
- Binds Redis (port 6379) to localhost only
- Prevents unauthorized external access to databases
- Verifies services are not exposed to the public internet

**Why this matters**: By default, Docker Compose may expose MongoDB and Redis to the public internet, creating a serious security vulnerability. The security script fixes this by binding services to localhost (127.0.0.1) only.

### General Security Best Practices

- Scripts require root access for system-level changes
- Review scripts before running on production
- Keep backups secure and encrypted
- Regularly update system packages
- Use SSH keys instead of passwords
- Run `04-secure-services.sh` immediately after deployment
- Verify firewall rules: `ufw status`
- Test external access: `telnet YOUR_IP 27017` (should fail)

## Support

For issues:
1. Check the main [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) guide
2. Review script error messages
3. Check application logs: `docker compose logs`

