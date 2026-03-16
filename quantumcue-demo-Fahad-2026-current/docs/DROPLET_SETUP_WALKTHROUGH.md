# QuantumCue - Ubuntu 24.04 Droplet Setup Walkthrough

This is a comprehensive step-by-step guide for deploying QuantumCue on a brand new Ubuntu 24.04 LTS DigitalOcean droplet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Initial Droplet Access](#step-1-initial-droplet-access)
3. [Step 2: Server Hardening](#step-2-server-hardening)
4. [Step 3: Install Dependencies](#step-3-install-dependencies)
5. [Step 4: Clone and Configure Repository](#step-4-clone-and-configure-repository)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Deploy Application](#step-6-deploy-application)
8. [Step 7: Verify Deployment](#step-7-verify-deployment)
9. [Step 8: SSL Setup (Optional)](#step-8-ssl-setup-optional)
10. [Step 9: Post-Deployment](#step-9-post-deployment)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **DigitalOcean Account** with billing enabled
- **Droplet Created**: Ubuntu 24.04 LTS x64 droplet
- **Droplet IP Address**: Note your droplet's public IP address
- **SSH Key**: Your SSH public key added to DigitalOcean account
- **API Keys Ready**:
  - Groq API key (required) - Get from [Groq Console](https://console.groq.com/keys)
  - Anthropic API key (optional) - Get from [Anthropic Console](https://console.anthropic.com/)
- **Repository URL**: Your GitHub/GitLab repository URL (if using version control)
- **Domain Name** (optional): For SSL setup later

---

## Step 1: Initial Droplet Access

### 1.1 Connect to Your Droplet

From your local machine, SSH into the droplet:

```bash
ssh root@your-droplet-ip
```

Replace `your-droplet-ip` with your actual droplet IP address.

**Note**: If you're using a non-standard SSH port or key file, adjust the command:
```bash
ssh -i ~/.ssh/your_key root@your-droplet-ip
```

### 1.2 Verify System Information

Once connected, verify you're on Ubuntu 24.04:

```bash
lsb_release -a
```

You should see:
```
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 24.04 LTS
Release:        24.04
Codename:       noble
```

### 1.3 Check System Resources

Verify your droplet has adequate resources:

```bash
free -h    # Check memory
df -h      # Check disk space
nproc      # Check CPU cores
```

**Minimum Requirements:**
- 2GB RAM (4GB recommended)
- 20GB disk space
- 1 vCPU (2+ recommended)

---

## Step 2: Server Hardening

### 2.1 Update System Packages

Update all system packages to the latest versions:

```bash
apt update && apt upgrade -y
```

This may take a few minutes. Reboot if kernel updates were installed:

```bash
reboot
```

Wait a minute, then reconnect via SSH.

### 2.2 Run Initial Setup Script

The easiest way is to use the provided setup script. You can either:

**Option A: Download and run directly (if repository is public):**
```bash
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/01-initial-setup.sh | bash
```

**Option B: Run manually (see below)**

### 2.3 Manual Server Setup

If you prefer to set up manually or the script isn't available:

```bash
# Install essential packages
apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    ufw \
    fail2ban \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release
```

**Note**: During the installation, you may see Python `SyntaxWarning` messages related to fail2ban test files. These are harmless warnings caused by Python 3.12's stricter escape sequence handling. The installation will complete successfully despite these warnings. You can safely ignore them.

```bash
# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Verify firewall status
ufw status

# Configure fail2ban (protects against brute force attacks)
systemctl enable fail2ban
systemctl start fail2ban
systemctl status fail2ban

# Create application directories
mkdir -p /opt/quantumcuedemo
mkdir -p /opt/backups/quantumcue
```

### 2.4 (Optional) Create Non-Root User

For better security, create a non-root user:

```bash
# Create user
adduser quantumcue

# Add to sudo group
usermod -aG sudo quantumcue

# Copy SSH key (if you have one)
mkdir -p /home/quantumcue/.ssh
cp ~/.ssh/authorized_keys /home/quantumcue/.ssh/
chown -R quantumcue:quantumcue /home/quantumcue/.ssh
chmod 700 /home/quantumcue/.ssh
chmod 600 /home/quantumcue/.ssh/authorized_keys
```

**Note**: If you create a non-root user, you'll need to use `sudo` for most commands, or add the user to the docker group later.

---

## Step 3: Install Dependencies

### 3.1 Install Docker

**Option A: Use the provided script:**
```bash
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/02-install-docker.sh | bash
```

**Option B: Install manually:**

```bash
# Install Docker using official script
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker compose version

# (Optional) Add user to docker group (if using non-root user)
usermod -aG docker quantumcue
```

**Important**: If you added a user to the docker group, that user needs to log out and back in for the changes to take effect.

### 3.2 Verify Docker Installation

Test Docker is working:

```bash
docker run hello-world
```

You should see a success message. Clean up the test container:

```bash
docker rm $(docker ps -aq -f ancestor=hello-world)
```

---

## Step 4: Clone and Configure Repository

### 4.1 Setup SSH Keys for Private Repository

If your repository is private, you'll need to configure SSH keys to authenticate with GitHub/GitLab.

#### 4.1.1 Generate SSH Key Pair

```bash
# Generate a new SSH key pair (if you don't already have one)
ssh-keygen -t ed25519 -C "quantumcue-droplet@yourdomain.com"

# Press Enter to accept default location (~/.ssh/id_ed25519)
# Optionally set a passphrase (recommended for production)
# Or press Enter twice for no passphrase (less secure but easier for automation)
```

**Note**: If you already have an SSH key, you can skip this step and use your existing key.

#### 4.1.2 Display Public Key

```bash
# Display your public key
cat ~/.ssh/id_ed25519.pub

# Or if using RSA key:
# cat ~/.ssh/id_rsa.pub
```

**Copy the entire output** - you'll need to add this to GitHub/GitLab.

#### 4.1.3 Add SSH Key to GitHub

1. Go to GitHub and sign in
2. Click your profile picture → **Settings**
3. In the left sidebar, click **SSH and GPG keys**
4. Click **New SSH key**
5. Give it a title (e.g., "QuantumCue Droplet")
6. Paste your public key into the "Key" field
7. Click **Add SSH key**

**For GitLab:**
1. Go to GitLab and sign in
2. Click your profile picture → **Preferences**
3. Click **SSH Keys** in the left sidebar
4. Paste your public key and click **Add key**

#### 4.1.4 Test SSH Connection

```bash
# Test GitHub connection
ssh -T git@github.com

# You should see: "Hi username! You've successfully authenticated..."
# For GitLab:
# ssh -T git@gitlab.com
```

If you see a warning about host authenticity, type `yes` to continue.

#### 4.1.5 Configure SSH for Git Operations

```bash
# Ensure SSH agent is running
eval "$(ssh-agent -s)"

# Add your SSH key to the agent
ssh-add ~/.ssh/id_ed25519
# Or for RSA: ssh-add ~/.ssh/id_rsa
```

### 4.2 Set Repository URL

Before cloning, set your repository URL as an environment variable. **Use SSH URL format for private repositories:**

```bash
# For GitHub (SSH format)
export QUANTUMCUE_REPO_URL="git@github.com:epellish/quantumcuedemo.git"
export QUANTUMCUE_BRANCH="develop"  # or your branch name

# For GitLab (SSH format)
# export QUANTUMCUE_REPO_URL="git@gitlab.com:username/quantumcuedemo.git"
```

**Important**: Use `git@github.com:` format (SSH) instead of `https://github.com/` format for private repositories.

### 4.3 Clone Repository

**Option A: Use the deployment script:**

**Important**: Before running the deployment script, make sure you've:
1. Set up SSH keys (Step 4.1)
2. Added the SSH key to GitHub/GitLab
3. Set the `QUANTUMCUE_REPO_URL` environment variable with SSH format

```bash
cd /opt

# Set repository URL (use SSH format for private repos)
export QUANTUMCUE_REPO_URL="git@github.com:epellish/quantumcuedemo.git"
export QUANTUMCUE_BRANCH="develop"

# Run deployment script (note: script URL may need to be updated for your repo)
# For now, you may need to clone manually first, then run the script locally
bash /opt/quantumcuedemo/scripts/digitalocean/03-deploy.sh
```

**Note**: The script will use the `QUANTUMCUE_REPO_URL` environment variable. Make sure it's set to SSH format for private repositories.

**Option B: Clone manually (Recommended for private repos):**

```bash
cd /opt

# For private repositories, use SSH URL:
git clone -b develop git@github.com:epellish/quantumcuedemo.git quantumcuedemo

# Or if using the environment variable (set in Step 4.2):
git clone -b $QUANTUMCUE_BRANCH $QUANTUMCUE_REPO_URL quantumcuedemo

cd quantumcuedemo
```

**Note**: 
- For **private repositories**, always use SSH format: `git@github.com:username/repo.git`
- For **public repositories**, you can use HTTPS: `https://github.com/username/repo.git`
- Make sure you've completed Step 4.1 (SSH key setup) before cloning private repos
- If clone fails, see troubleshooting section "Git Clone Fails for Private Repository"

### 4.4 Verify Repository Structure

Check that the repository was cloned correctly:

```bash
cd /opt/quantumcuedemo
ls -la

# Should see directories like:
# backend/
# frontend/
# docker-compose.prod.yml
# scripts/
```

---

## Step 5: Configure Environment Variables

### 5.1 Create Backend Environment File

```bash
cd /opt/quantumcuedemo

# Copy example file (if it exists)
if [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
else
    # Create minimal .env file
    cat > backend/.env << 'EOF'
SECRET_KEY=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING
APP_ENV=production
DEBUG=False
GROQ_API_KEY=your_groq_api_key_here
POSTGRES_USER=quantumcue
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_DB=quantumcue
EOF
fi
```

### 5.2 Edit Backend Environment File

Edit the backend environment file:

```bash
nano backend/.env
```

**Required variables to set:**

```bash
# Generate a secure secret key (run this command separately)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Then set in .env:
SECRET_KEY=<paste-generated-key-here>
APP_ENV=production
DEBUG=False

# Database credentials
POSTGRES_USER=quantumcue
POSTGRES_PASSWORD=<choose-strong-password>
POSTGRES_DB=quantumcue

# LLM API Keys
GROQ_API_KEY=gsk_your_actual_groq_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Optional: Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# CORS (update with your domain or IP)
# For IP-based access initially:
CORS_ORIGINS=http://your-droplet-ip,http://your-droplet-ip:3000
# Later, when you have a domain:
# CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`.

### 5.3 Create Frontend Environment File

```bash
# Copy example file (if it exists)
if [ -f "frontend/.env.example" ]; then
    cp frontend/.env.example frontend/.env
else
    # Create minimal .env file
    cat > frontend/.env << 'EOF'
VITE_API_URL=http://your-droplet-ip:8000/api/v1
EOF
fi
```

### 5.4 Edit Frontend Environment File

```bash
nano frontend/.env
```

**Set the API base URL:**

For IP-based access (initial setup):
```bash
VITE_API_URL=http://your-droplet-ip:8000/api/v1
```

Replace `your-droplet-ip` with your actual droplet IP.

**Later, when you have a domain:**
```bash
VITE_API_URL=https://yourdomain.com/api/v1
# or
VITE_API_URL=https://api.yourdomain.com/api/v1
```

**Important**: The variable name is `VITE_API_URL` (not `VITE_API_BASE_URL`).

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`.

---

## Step 6: Deploy Application

### 6.1 Start Database Services

**Option A: Use the startup script (Recommended):**

The startup script automatically loads environment variables and starts all services:

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/start.sh
```

This script will:
1. Load environment variables from `backend/.env`
2. Start database services (PostgreSQL, MongoDB, Redis)
3. Run database migrations
4. Start all services (backend, frontend)

**Option B: Start manually:**

First, export environment variables from `backend/.env`:

```bash
cd /opt/quantumcuedemo

# Load environment variables
set -a
source backend/.env
set +a

# Start database services (PostgreSQL, MongoDB, Redis)
docker compose up -d postgres mongodb redis
```

Wait for database to be ready (about 10-15 seconds):

```bash
# Check status
docker compose ps

# Wait until all database services show "healthy" or "running"
```

### 6.2 Run Database Migrations (if not using startup script)

If you're starting manually (Option B), run migrations:

```bash
# Make sure environment variables are still loaded
set -a
source backend/.env
set +a

# Run migrations
docker compose run --rm backend alembic upgrade head
```

You should see migration output. If there are errors, check the logs:

```bash
docker compose logs backend
```

### 6.3 Build and Start All Services (if not using startup script)

If you're starting manually (Option B), build and start all services:

```bash
# Make sure environment variables are still loaded
set -a
source backend/.env
set +a

# Build and start all services
docker compose up -d --build

# This will:
# - Build backend and frontend Docker images
# - Start all services (backend, frontend, databases)
# - Run in detached mode (-d)
```

This may take several minutes on first build.

**Note**: If you used the startup script (Option A), this step is already done. Skip to Step 7.

### 6.4 Check Service Status

```bash
# Check all services
docker compose ps

# You should see all services in "Up" or "running" state
```

### 6.5 Secure Database Services (CRITICAL - Do This Immediately!)

**IMPORTANT**: MongoDB and Redis should never be exposed to the public internet. Run the security hardening script:

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/04-secure-services.sh
```

This script will:
- Bind MongoDB (port 27017) to localhost only
- Bind Redis (port 6379) to localhost only
- Verify services are not accessible from external IPs
- Restart services with secure configuration

**Why this is critical**: Exposed MongoDB and Redis instances are common attack vectors. Attackers can access your databases, read sensitive data, or delete data. Always secure these services immediately after deployment.

**Verify the fix** (from your local machine):
```bash
# Option 1: Using netcat (recommended - install with: sudo apt install -y netcat-openbsd)
nc -zv YOUR_DROPLET_IP 27017  # MongoDB - should fail
nc -zv YOUR_DROPLET_IP 6379   # Redis - should fail

# Option 2: Using bash TCP redirection
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/27017" 2>&1
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/6379" 2>&1

# Option 3: Install telnet if needed
# sudo apt install -y telnet  # Ubuntu/Debian
# telnet YOUR_DROPLET_IP 27017
```

All methods should fail with "Connection refused" or timeout. If any connection succeeds, the services are still exposed and need to be secured.

---

## Step 7: Verify Deployment

### 7.1 Check Backend Health

```bash
# From the server
curl http://localhost:8000/health

# Should return JSON with status information
```

### 7.2 Check Service Logs

```bash
# View all logs
docker compose logs -f

# Or view specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

**Press `Ctrl+C` to exit log viewing.**

### 7.3 Test from Your Local Machine

From your local machine, test the API:

```bash
# Replace with your droplet IP
curl http://your-droplet-ip:8000/health

# Test API endpoint
curl http://your-droplet-ip:8000/api/v1/health/detailed
```

### 7.4 Access Frontend (if exposed)

If you've configured the frontend to be accessible:

```bash
# Check if frontend is running
curl http://your-droplet-ip:3000
```

**Note**: The frontend is exposed on port 3000 by default in docker-compose.yml. You can access it at `http://your-droplet-ip:3000`.

### 7.5 Verify Database Connections

```bash
# Test PostgreSQL connection
docker compose exec postgres psql -U quantumcue -d quantumcue -c "SELECT version();"

# Test MongoDB connection
docker compose exec mongodb mongosh --eval "db.version()"
```

---

## Step 8: SSL Setup (Optional)

SSL setup is optional for initial deployment. You can set it up later when you have a domain name.

### 8.1 Prerequisites for SSL

- Domain name pointing to your droplet IP
- DNS A records configured:
  - `yourdomain.com` → `your-droplet-ip`
  - `www.yourdomain.com` → `your-droplet-ip` (optional)
  - `api.yourdomain.com` → `your-droplet-ip` (optional, if using subdomain)

### 8.2 Install Certbot

```bash
apt install -y certbot
```

### 8.3 Obtain SSL Certificates

```bash
# Stop nginx temporarily (if running)
docker compose stop nginx

# Obtain certificate for your domain
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# If using API subdomain
certbot certonly --standalone -d api.yourdomain.com
```

### 8.4 Configure Nginx

Create or update `nginx.prod.conf` in the project root. See the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide for the full nginx configuration.

### 8.5 Setup Auto-Renewal

```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * certbot renew --quiet && docker compose -f /opt/quantumcuedemo/docker-compose.prod.yml restart nginx
```

---

## Step 9: Post-Deployment

### 9.1 Create Initial Admin User

You can create an admin user via the API:

```bash
# From your local machine or server
curl -X POST http://your-droplet-ip:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "your-secure-password",
    "full_name": "Admin User"
  }'
```

**Note**: Replace with your actual email and a strong password.

### 9.2 Setup Backups

The backup script is already in the repository. Set it up:

```bash
cd /opt/quantumcuedemo

# Make backup script executable
chmod +x scripts/digitalocean/backup.sh

# Test backup
bash scripts/digitalocean/backup.sh

# Setup automatic backups (daily at 3 AM)
crontab -e

# Add this line:
0 3 * * * /opt/quantumcuedemo/scripts/digitalocean/backup.sh
```

### 9.3 Setup Monitoring (Optional)

```bash
# Install monitoring tools
apt install -y htop iotop

# View system resources
htop
```

### 9.4 Configure Log Rotation

```bash
cat > /etc/logrotate.d/quantumcue << 'EOF'
/opt/quantumcuedemo/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 root root
}
EOF
```

### 9.5 Enable Automatic Security Updates

```bash
apt install -y unattended-upgrades

# Configure
dpkg-reconfigure --priority=low unattended-upgrades
```

### 9.6 Verify Database Security (CRITICAL)

Ensure MongoDB and Redis are secured:

```bash
# Run the security hardening script if you haven't already
cd /opt/quantumcuedemo
bash scripts/digitalocean/04-secure-services.sh

# Verify from your local machine (should fail)
# Using netcat (recommended):
nc -zv YOUR_DROPLET_IP 27017  # MongoDB - should fail
nc -zv YOUR_DROPLET_IP 6379   # Redis - should fail

# Or using bash:
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/27017" 2>&1
timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/6379" 2>&1
```

If either connection succeeds, your databases are exposed and need immediate attention. See the [Security section](#securing-database-services) in the main DEPLOYMENT.md guide.

---

## Troubleshooting

### Python SyntaxWarnings During Package Installation

If you see `SyntaxWarning` messages during `apt install` (especially when installing fail2ban), these are harmless warnings caused by Python 3.12's stricter escape sequence handling. The warnings look like:

```
SyntaxWarning: invalid escape sequence '\s'
SyntaxWarning: invalid escape sequence '\d'
```

**Solution**: These warnings can be safely ignored. The packages install correctly despite the warnings. The installation will complete successfully. This is a known issue with some Python packages that haven't been updated for Python 3.12's stricter syntax checking.

### Services Won't Start

```bash
# Check logs for errors
docker compose logs

# Check specific service
docker compose logs backend

# Check container status
docker compose ps

# Check system resources
df -h      # Disk space
free -h    # Memory
```

### Database Connection Issues

```bash
# Verify database containers are running
docker compose ps postgres mongodb redis

# Check database logs
docker compose logs postgres

# Test database connection from backend
docker compose exec backend python -c "from app.db.session import engine; print('Connected')"
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :80
lsof -i :443
lsof -i :8000

# Stop conflicting services
systemctl stop apache2  # If Apache is installed
systemctl stop nginx    # If system nginx is running
```

### Environment Variable Issues

```bash
# Verify environment files exist
ls -la backend/.env frontend/.env

# Check if variables are set correctly
cat backend/.env | grep -v PASSWORD  # Don't show passwords
```

### Docker Issues

```bash
# Check Docker status
systemctl status docker

# Restart Docker
systemctl restart docker

# Check Docker version
docker --version
docker compose version

# View Docker logs
journalctl -u docker -n 50
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services to free memory
docker compose restart

# Consider upgrading droplet size if consistently high
```

### Frontend Not Accessible / Page Just Spins

If the frontend page loads but just spins (doesn't show content):

**1. Check Firewall Rules**

```bash
# Check if ports 3000 and 8000 are open
ufw status

# If not, add them:
ufw allow 3000/tcp
ufw allow 8000/tcp
```

**2. Check Frontend Logs for Errors**

```bash
# View frontend logs
docker compose logs frontend

# Look for errors like:
# - Build errors
# - API connection errors
# - CORS errors
```

**3. Verify Frontend Environment Configuration**

```bash
# Check frontend .env file
cat frontend/.env

# Should have (replace with your droplet IP):
# VITE_API_URL=http://your-droplet-ip:8000/api/v1
# OR for same-origin (if accessing from server):
# VITE_API_URL=http://localhost:8000/api/v1
```

**4. Test Backend Directly**

```bash
# From your local machine, test backend:
curl http://your-droplet-ip:8000/health

# Should return JSON. If it doesn't, backend isn't accessible.
```

**5. Check Frontend Container Status**

```bash
# Check if frontend is actually running
docker compose ps frontend

# Check frontend container logs
docker compose logs -f frontend

# Restart frontend if needed
docker compose restart frontend
```

**6. Common Issues:**

- **Frontend can't reach backend**: Update `frontend/.env` with correct `VITE_API_BASE_URL`
- **CORS errors**: Check `backend/.env` has `CORS_ORIGINS` set to include your IP
- **Build errors**: Check frontend logs for compilation errors
- **Port not accessible**: Verify firewall allows ports 3000 and 8000

### Migration Errors

```bash
# Check migration logs
docker compose logs backend | grep -i migration

# Run migrations manually with verbose output
docker compose run --rm backend alembic upgrade head --verbose

# Check database connection
docker compose exec postgres psql -U quantumcue -d quantumcue -c "\dt"
```

### SSL Certificate Issues

```bash
# Check certificate expiration
certbot certificates

# Renew manually
certbot renew

# Verify nginx config (if using nginx container)
docker compose exec nginx nginx -t
```

### Git Clone Fails for Private Repository

If you get errors like "Permission denied (publickey)" or "Host key verification failed":

```bash
# Test SSH connection to GitHub
ssh -T git@github.com

# If you see "Permission denied", check:
# 1. SSH key is added to GitHub/GitLab
# 2. Correct key is being used
ssh-add -l  # List loaded keys

# Add your key explicitly
ssh-add ~/.ssh/id_ed25519  # or id_rsa

# Verify key is in GitHub
cat ~/.ssh/id_ed25519.pub  # Copy and verify it matches GitHub

# Test again
ssh -T git@github.com
```

**Common Issues:**
- **"Host key verification failed"**: Type `yes` when prompted to accept the host key
- **"Permission denied"**: Make sure your SSH public key is added to your GitHub/GitLab account
- **"Could not resolve hostname"**: Check your internet connection and DNS resolution
- **Wrong repository URL format**: Use `git@github.com:username/repo.git` (SSH) not `https://github.com/...` for private repos

---

## Next Steps

After successful deployment:

1. **Access the Application**: Visit `http://your-droplet-ip:8000` (or your domain)
2. **Create Admin User**: Use the API registration endpoint
3. **Configure Domain**: Point your domain to the droplet IP
4. **Setup SSL**: Follow Step 8 when ready
5. **Configure Backups**: Set up automatic backups (Step 9.2)
6. **Monitor Performance**: Use `htop` and `docker stats` to monitor resources
7. **Review Logs**: Regularly check application logs for issues

---

## Additional Resources

- [Full Deployment Guide](./DEPLOYMENT.md) - Detailed deployment documentation
- [Quick Start Guide](./DEPLOYMENT_QUICKSTART.md) - Condensed deployment steps
- [Environment Variables](../ENV_VARIABLES.md) - Complete environment variable reference
- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [Docker Documentation](https://docs.docker.com/)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review application logs: `docker compose logs`
3. Check the main [DEPLOYMENT.md](./DEPLOYMENT.md) guide
4. Review DigitalOcean status page
5. Open an issue on GitHub with relevant logs and error messages

