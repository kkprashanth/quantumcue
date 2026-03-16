# QuantumCue DigitalOcean Deployment Checklist

This checklist will guide you through deploying your branch to DigitalOcean step-by-step.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] **Commit all changes** to your branch
  ```bash
  git add .
  git commit -m "Your commit message"
  git push origin your-branch-name
  ```

- [ ] **Verify your branch is ready**
  - All tests pass locally
  - No critical errors in console
  - Environment variables documented

### 2. DigitalOcean Account Setup
- [ ] **DigitalOcean account** with billing enabled
- [ ] **SSH key** added to DigitalOcean account
  - Go to: Settings → Security → SSH Keys
  - Add your public key if not already added

### 3. Required API Keys
- [ ] **Groq API Key** (required for dataset labeling)
  - Get from: https://console.groq.com/keys
  - Format: `gsk_...`
- [ ] **Anthropic API Key** (optional, for job creation chat)
  - Get from: https://console.anthropic.com/
  - Format: `sk-ant-...`

### 4. Domain Setup (Optional but Recommended)
- [ ] **Domain name** registered and DNS access
- [ ] **A record** ready to point to droplet IP (after creation)

---

## Step-by-Step Deployment

### Step 1: Create DigitalOcean Droplet

1. **Log in** to [DigitalOcean Control Panel](https://cloud.digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. **Configure Droplet:**
   - **Image**: Ubuntu 24.04 LTS
   - **Plan**: 
     - Minimum: 2GB RAM / 1 vCPU ($12/month)
     - Recommended: 4GB RAM / 2 vCPU ($24/month)
     - Production: 8GB RAM / 4 vCPU ($48/month)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: Select your SSH key
   - **Hostname**: `quantumcue-prod` (or your preference)
   - **Tags**: `production`, `quantumcue` (optional)
4. Click **"Create Droplet"**
5. **Note your droplet IP address** (you'll need this)

### Step 2: Initial Server Setup

SSH into your droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

Run the initial setup script:

```bash
# Download and run initial setup
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/quantumcuedemo/main/scripts/digitalocean/01-initial-setup.sh | bash
```

**OR manually:**

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git ufw fail2ban

# Setup firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Step 3: Install Docker & Docker Compose

```bash
# Download and run Docker installation script
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/quantumcuedemo/main/scripts/digitalocean/02-install-docker.sh | bash
```

**OR manually:**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 4: Clone Your Branch

```bash
# Set your repository URL and branch
export QUANTUMCUE_REPO_URL="https://github.com/YOUR_ORG/quantumcuedemo.git"
export QUANTUMCUE_BRANCH="your-branch-name"

# Navigate to /opt
cd /opt

# Clone repository
git clone -b $QUANTUMCUE_BRANCH $QUANTUMCUE_REPO_URL quantumcuedemo
cd quantumcuedemo
```

**OR use the deployment script:**

```bash
export QUANTUMCUE_REPO_URL="https://github.com/YOUR_ORG/quantumcuedemo.git"
export QUANTUMCUE_BRANCH="your-branch-name"
bash scripts/digitalocean/03-deploy.sh
```

### Step 5: Configure Environment Variables

#### Backend Configuration

```bash
# Edit backend environment file
nano backend/.env
```

**Required variables for `backend/.env`:**

```bash
# Application
SECRET_KEY=your-secret-key-minimum-32-characters-long
APP_ENV=production
DEBUG=False

# Database
POSTGRES_USER=quantumcue
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=quantumcue

# LLM APIs (REQUIRED)
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Optional LLM
ANTHROPIC_API_KEY=sk-ant-your-key-here

# MongoDB (optional, has defaults)
MONGO_USER=quantumcue
MONGO_PASSWORD=your-mongo-password
MONGO_DB=quantumcue_audit

# Redis (optional, has defaults)
REDIS_URL=redis://redis:6379/0

# CORS - Update with your domain or IP
CORS_ORIGINS=http://YOUR_DROPLET_IP,https://yourdomain.com
```

**Generate a secure SECRET_KEY:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it as `SECRET_KEY` in `backend/.env`.

#### Frontend Configuration

```bash
# Edit frontend environment file
nano frontend/.env
```

**Required variables for `frontend/.env`:**

```bash
# Update with your droplet IP or domain
VITE_API_BASE_URL=http://YOUR_DROPLET_IP:8000/api/v1
# OR if using domain:
# VITE_API_BASE_URL=https://yourdomain.com/api/v1
```

### Step 6: Create Nginx Production Config (if missing)

The `docker-compose.prod.yml` references `nginx.prod.conf` which may not exist. Create it:

```bash
# Create nginx production config
cat > nginx.prod.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP server - redirect to HTTPS (if using SSL)
    server {
        listen 80;
        server_name _;

        # For Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect to HTTPS (uncomment when SSL is configured)
        # return 301 https://$host$request_uri;

        # Temporary: serve HTTP until SSL is configured
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 600s;
            proxy_connect_timeout 600s;
        }
    }

    # HTTPS server (uncomment and configure when SSL is ready)
    # server {
    #     listen 443 ssl http2;
    #     server_name yourdomain.com;
    #
    #     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    #     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    #
    #     location / {
    #         proxy_pass http://frontend;
    #         proxy_http_version 1.1;
    #         proxy_set_header Upgrade $http_upgrade;
    #         proxy_set_header Connection 'upgrade';
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #         proxy_cache_bypass $http_upgrade;
    #     }
    #
    #     location /api {
    #         proxy_pass http://backend;
    #         proxy_http_version 1.1;
    #         proxy_set_header Upgrade $http_upgrade;
    #         proxy_set_header Connection 'upgrade';
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #         proxy_cache_bypass $http_upgrade;
    #         proxy_read_timeout 600s;
    #         proxy_connect_timeout 600s;
    #     }
    # }
}
EOF
```

### Step 7: Start Database Services

```bash
# Load environment variables
set -a
source backend/.env
set +a

# Start databases
docker compose -f docker-compose.prod.yml up -d postgres mongodb redis

# Wait for databases to be ready
sleep 10

# Verify databases are running
docker compose -f docker-compose.prod.yml ps
```

### Step 8: Run Database Migrations

```bash
# Ensure environment variables are loaded
set -a
source backend/.env
set +a

# Run migrations
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
```

### Step 9: Build and Start All Services

```bash
# Load environment variables
set -a
source backend/.env
set +a

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 10: Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/health

# Check services are running
docker compose -f docker-compose.prod.yml ps

# Check nginx is accessible
curl http://localhost
```

**From your local machine:**

```bash
# Replace YOUR_DROPLET_IP with your actual IP
curl http://YOUR_DROPLET_IP/health
```

### Step 11: Security Hardening (CRITICAL)

**IMPORTANT:** Secure MongoDB and Redis by binding them to localhost only:

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/04-secure-services.sh
```

This script will:
- Secure MongoDB by binding to localhost only
- Secure Redis by binding to localhost only
- Verify ports are not exposed to the internet

**Verify security:**

```bash
# From your local machine (should fail)
telnet YOUR_DROPLET_IP 27017  # MongoDB - should fail
telnet YOUR_DROPLET_IP 6379   # Redis - should fail
```

### Step 12: Configure Domain (Optional)

If you have a domain:

1. **Point DNS to your droplet:**
   - Create an A record: `@` → `YOUR_DROPLET_IP`
   - Create an A record: `www` → `YOUR_DROPLET_IP`
   - Wait for DNS propagation (5-60 minutes)

2. **Update CORS in backend/.env:**
   ```bash
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **Update frontend/.env:**
   ```bash
   VITE_API_BASE_URL=https://yourdomain.com/api/v1
   ```

4. **Restart services:**
   ```bash
   docker compose -f docker-compose.prod.yml restart backend frontend
   ```

### Step 13: Setup SSL/HTTPS (Optional but Recommended)

1. **Install Certbot:**
   ```bash
   apt install -y certbot
   ```

2. **Create certbot directories:**
   ```bash
   mkdir -p certbot/conf certbot/www
   ```

3. **Get SSL certificate:**
   ```bash
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

4. **Update nginx.prod.conf** to use SSL (uncomment HTTPS server block)

5. **Restart nginx:**
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```

6. **Setup auto-renewal:**
   ```bash
   # Add to crontab
   crontab -e
   # Add line:
   0 3 * * * certbot renew --quiet && docker compose -f /opt/quantumcuedemo/docker-compose.prod.yml restart nginx
   ```

---

## Post-Deployment Verification

### Checklist

- [ ] **Backend health check** returns 200 OK
- [ ] **Frontend** loads in browser
- [ ] **API endpoints** respond correctly
- [ ] **Database migrations** completed successfully
- [ ] **MongoDB and Redis** are secured (not accessible from internet)
- [ ] **Firewall** is enabled and configured
- [ ] **SSL certificate** installed (if using domain)
- [ ] **Logs** show no critical errors

### Test Application

1. **Access frontend:** `http://YOUR_DROPLET_IP` or `https://yourdomain.com`
2. **Create an account** and log in
3. **Upload a dataset** to test the workflow
4. **Create a project** to verify end-to-end functionality

---

## Common Issues & Troubleshooting

### Issue: Services won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check environment variables
cat backend/.env
cat frontend/.env

# Verify Docker is running
docker ps
```

### Issue: Database connection errors

```bash
# Check database is running
docker compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify DATABASE_URL in backend/.env matches docker-compose
```

### Issue: Frontend can't reach backend

```bash
# Verify VITE_API_BASE_URL in frontend/.env
# Should be: http://YOUR_DROPLET_IP:8000/api/v1 (or domain)

# Check backend is running
docker compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker compose -f docker-compose.prod.yml logs backend
```

### Issue: Port conflicts

```bash
# Check what's using ports
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :8000

# Stop conflicting services
systemctl stop apache2  # if installed
systemctl stop nginx    # if installed as system service
```

---

## Maintenance Commands

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
cd /opt/quantumcuedemo

# Pull latest changes
git pull origin your-branch-name

# Rebuild and restart
set -a && source backend/.env && set +a
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
```

### Backup Database

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/backup.sh
```

---

## Quick Reference

### Important Files
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration
- `docker-compose.prod.yml` - Production Docker Compose config
- `nginx.prod.conf` - Nginx reverse proxy configuration

### Important Directories
- `/opt/quantumcuedemo` - Application root
- `scripts/digitalocean/` - Deployment scripts

### Important Ports
- `80` - HTTP (nginx)
- `443` - HTTPS (nginx)
- `8000` - Backend API (internal only)
- `3000` - Frontend dev server (not used in production)

---

## Need Help?

- Check logs: `docker compose -f docker-compose.prod.yml logs -f`
- Review deployment docs: `docs/DEPLOYMENT.md`
- Check troubleshooting: `docs/DEPLOYMENT.md#troubleshooting`
