# QuantumCue Deployment Guide

This guide covers deploying QuantumCue to DigitalOcean using Ubuntu 24.04 LTS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [DigitalOcean Droplet Setup](#digitalocean-droplet-setup)
4. [Application Deployment](#application-deployment)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Post-Deployment](#post-deployment)
7. [Maintenance & Updates](#maintenance--updates)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- **DigitalOcean Account** with billing enabled
- **Domain Name** (optional but recommended for production)
- **API Keys**:
  - Groq API key (required for dataset labeling)
  - Anthropic API key (optional, for job creation chat)
- **SSH Key** added to your DigitalOcean account
- **Basic Linux knowledge** for server management

---

## Deployment Options

### Option 1: DigitalOcean App Platform (Recommended for Demos)

**Pros:**
- Managed service, no server management
- Auto-scaling and load balancing
- Built-in SSL certificates
- Managed databases available
- Easy CI/CD integration

**Cons:**
- Less control over environment
- Higher cost for production workloads
- Limited customization

**Best For:** Quick demos, prototypes, low-traffic applications

### Option 2: DigitalOcean Droplet (Recommended for Production)

**Pros:**
- Full control over environment
- Cost-effective for predictable workloads
- Custom configurations possible
- Better for multi-service applications

**Cons:**
- Requires server management
- Manual SSL setup
- You handle updates and security

**Best For:** Production deployments, custom requirements, cost optimization

This guide focuses on **Option 2: Droplet Deployment**.

---

## DigitalOcean Droplet Setup

### Step 1: Create Droplet

1. Log in to [DigitalOcean Control Panel](https://cloud.digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. Configure:
   - **Image**: Ubuntu 24.04 LTS
   - **Plan**: 
     - Minimum: 2GB RAM / 1 vCPU ($12/month)
     - Recommended: 4GB RAM / 2 vCPU ($24/month)
     - Production: 8GB RAM / 4 vCPU ($48/month)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or password
   - **Hostname**: `quantumcue-prod` (or your preference)
   - **Tags**: `production`, `quantumcue` (optional)
4. Click **"Create Droplet"**

### Step 2: Initial Server Setup

Once your droplet is created, SSH into it:

```bash
ssh root@your-droplet-ip
```

Run the initial setup script:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/01-initial-setup.sh | bash
```

Or manually:

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

# Create non-root user (optional but recommended)
adduser quantumcue
usermod -aG sudo quantumcue
```

### Step 3: Install Docker & Docker Compose

Run the Docker installation script:

```bash
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/02-install-docker.sh | bash
```

Or manually:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Add user to docker group (if using non-root user)
usermod -aG docker quantumcue

# Verify installation
docker --version
docker compose version
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# As root or with sudo
cd /opt
git clone https://github.com/your-org/quantumcuedemo.git
cd quantumcuedemo

# Or use the deployment script
/opt/quantumcuedemo/scripts/digitalocean/03-deploy.sh
```

### Step 2: Configure Environment Variables

```bash
# Copy example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env
nano backend/.env
```

**Required backend/.env variables:**

```bash
# Application
SECRET_KEY=your-secret-key-minimum-32-characters-long
APP_ENV=production
DEBUG=False

# Database (from docker-compose, but set explicitly)
POSTGRES_USER=quantumcue
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=quantumcue

# LLM APIs
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=llama-3.1-70b-versatile
ANTHROPIC_API_KEY=sk-ant-your-key-here  # Optional

# MongoDB (optional)
MONGO_USER=quantumcue
MONGO_PASSWORD=your-mongo-password
MONGO_DB=quantumcue_audit

# Redis (optional)
REDIS_URL=redis://redis:6379/0

# CORS (update with your domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Required frontend/.env variables:**

```bash
# Update with your domain
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
# Or if using same domain:
VITE_API_BASE_URL=https://yourdomain.com/api/v1
```

### Step 3: Generate Secret Key

```bash
# Generate a secure secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add the output to `backend/.env` as `SECRET_KEY`.

### Step 4: Run Database Migrations

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d postgres mongodb redis

# Wait for databases to be ready
sleep 10

# Run migrations
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
```

### Step 5: Deploy Application

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 6: Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/health

# Check if services are running
docker compose -f docker-compose.prod.yml ps
```

---

## SSL/HTTPS Setup

### Option 1: Using Nginx with Let's Encrypt (Recommended)

The production docker-compose includes an Nginx container. You'll need to:

1. **Point your domain to the droplet IP**
   - Add A record: `yourdomain.com` → `your-droplet-ip`
   - Add A record: `www.yourdomain.com` → `your-droplet-ip`
   - Add A record: `api.yourdomain.com` → `your-droplet-ip` (if using subdomain)

2. **Create Nginx configuration**

   Create `nginx.prod.conf` in the project root:

   ```nginx
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

       # Redirect HTTP to HTTPS
       server {
           listen 80;
           server_name yourdomain.com www.yourdomain.com;
           return 301 https://$server_name$request_uri;
       }

       # Backend API
       server {
           listen 443 ssl http2;
           server_name api.yourdomain.com;

           ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
           ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

           location / {
               proxy_pass http://backend;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme;
           }
       }

       # Frontend
       server {
           listen 443 ssl http2;
           server_name yourdomain.com www.yourdomain.com;

           ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
           ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

           location /api {
               proxy_pass http://backend;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme;
           }

           location / {
               proxy_pass http://frontend;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto $scheme;
           }
       }
   }
   ```

3. **Obtain SSL Certificates**

   ```bash
   # Install certbot
   apt install -y certbot

   # Stop nginx temporarily
   docker compose -f docker-compose.prod.yml stop nginx

   # Obtain certificates
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   certbot certonly --standalone -d api.yourdomain.com

   # Copy certificates to certbot directory
   mkdir -p certbot/conf certbot/www
   cp -r /etc/letsencrypt/live certbot/conf/
   cp -r /etc/letsencrypt/archive certbot/conf/
   ```

4. **Restart services**

   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

5. **Setup auto-renewal**

   ```bash
   # Add to crontab
   crontab -e

   # Add this line (runs daily at 2 AM)
   0 2 * * * certbot renew --quiet && docker compose -f /opt/quantumcuedemo/docker-compose.prod.yml restart nginx
   ```

### Option 0 (Fastest): Caddy + Let's Encrypt via Docker Compose overlay

If you are running the **dev-like** stack on your droplet using `docker-compose.yml` (not `docker-compose.prod.yml`), you can enable HTTPS quickly without changing your local workflow by using an overlay compose file.

**What this does**
- Caddy terminates TLS on **80/443** and automatically obtains/renews Let’s Encrypt certs
- Routes:
  - `https://quantumharlem.org/api/*` → `backend:8000`
  - everything else → `frontend:3000`
- Optionally binds `backend` and `frontend` ports to `127.0.0.1` on the droplet (reduced public exposure)

**Prereqs**
- DNS A records:
  - `@` → your droplet IP
  - `www` → your droplet IP
- Firewall allows inbound **22/80/443** only

**Files**
- `Caddyfile`
- `docker-compose.ssl.yml`

**Deploy command (on droplet)**

```bash
cd /opt/quantumcuedemo
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.ssl.yml logs -f caddy
```

**Verify**

```bash
curl -I https://quantumharlem.org
curl -I https://quantumharlem.org/api/v1/health
```

Notes:
- Let’s Encrypt cannot issue certificates for bare IPs; HTTPS will be on the **domain**.
- Because API requests are same-origin (`/api/v1`), CORS is typically not required for the browser path.

### Option 2: Using DigitalOcean Load Balancer

1. Create a Load Balancer in DigitalOcean
2. Point your domain to the load balancer
3. Enable SSL/TLS with Let's Encrypt
4. Configure forwarding rules

---

## Post-Deployment

### 1. Create Initial Admin User

```bash
# Access backend container
docker compose -f docker-compose.prod.yml exec backend bash

# Run user creation script (if available)
python -m app.scripts.create_admin_user

# Or use the API
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure-password",
    "full_name": "Admin User"
  }'
```

### 2. Setup Monitoring (Optional)

```bash
# Install monitoring tools
apt install -y htop iotop

# Setup log rotation
cat > /etc/logrotate.d/quantumcue << EOF
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

### 3. Setup Backups

```bash
# Create backup script
cat > /opt/quantumcuedemo/scripts/digitalocean/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/quantumcue"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker compose -f /opt/quantumcuedemo/docker-compose.prod.yml exec -T postgres pg_dump -U quantumcue quantumcue > $BACKUP_DIR/postgres_$DATE.sql

# Backup MongoDB
docker compose -f /opt/quantumcuedemo/docker-compose.prod.yml exec -T mongodb mongodump --archive > $BACKUP_DIR/mongodb_$DATE.archive

# Compress backups
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/postgres_$DATE.sql $BACKUP_DIR/mongodb_$DATE.archive

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/quantumcuedemo/scripts/digitalocean/backup.sh

# Add to crontab (daily at 3 AM)
crontab -e
# Add: 0 3 * * * /opt/quantumcuedemo/scripts/digitalocean/backup.sh
```

---

## Maintenance & Updates

### Updating the Application

```bash
cd /opt/quantumcuedemo

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
```

### Viewing Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Restarting Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Database Maintenance

```bash
# Access PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U quantumcue -d quantumcue

# Access MongoDB
docker compose -f docker-compose.prod.yml exec mongodb mongosh
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check container status
docker compose -f docker-compose.prod.yml ps

# Check system resources
df -h  # Disk space
free -h  # Memory
```

### Database Connection Issues

```bash
# Verify database is running
docker compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test connection
docker compose -f docker-compose.prod.yml exec backend python -c "from app.db.session import engine; print('Connected')"
```

### SSL Certificate Issues

```bash
# Check certificate expiration
certbot certificates

# Renew manually
certbot renew

# Verify nginx config
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services to free memory
docker compose -f docker-compose.prod.yml restart

# Consider upgrading droplet size
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :80
lsof -i :443

# Stop conflicting services
systemctl stop apache2  # If Apache is installed
systemctl stop nginx    # If system nginx is running
```

---

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication only (disable password auth)
- [ ] Strong passwords for all services
- [ ] SSL certificates installed and auto-renewing
- [ ] Regular security updates enabled
- [ ] Fail2ban configured
- [ ] Non-root user created (optional)
- [ ] Backups configured
- [ ] Environment variables secured (not in git)
- [ ] CORS origins properly configured
- [ ] **MongoDB and Redis secured (bound to localhost only)** - See [Securing Database Services](#securing-database-services)

## Securing Database Services

### Critical Security Issue

MongoDB (port 27017) and Redis (port 6379) should **never** be exposed to the public internet. By default, Docker Compose may bind these services to `0.0.0.0`, making them accessible from anywhere.

### Quick Fix

Run the security hardening script immediately after deployment:

```bash
cd /opt/quantumcuedemo
bash scripts/digitalocean/04-secure-services.sh
```

This script will:
1. Check if MongoDB and Redis are exposed
2. Update `docker-compose.yml` to bind services to localhost only
3. Restart services with secure configuration
4. Verify external access is blocked

### Manual Fix

If you prefer to fix manually:

1. **Update docker-compose.yml**:

   For MongoDB:
   ```yaml
   ports:
     - "127.0.0.1:27017:27017"  # Bind to localhost only
   ```

   For Redis:
   ```yaml
   command: redis-server --appendonly yes --bind 127.0.0.1 ::1
   ports:
     - "127.0.0.1:6379:6379"  # Bind to localhost only
   ```

2. **Restart services**:
   ```bash
   docker compose down mongodb redis
   docker compose up -d mongodb redis
   ```

3. **Verify security**:
   ```bash
   # From your local machine (should fail)
   # Option 1: Using netcat (recommended)
   nc -zv YOUR_DROPLET_IP 27017  # MongoDB
   nc -zv YOUR_DROPLET_IP 6379   # Redis
   
   # Option 2: Using bash TCP redirection
   timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/27017" 2>&1
   timeout 2 bash -c "echo > /dev/tcp/YOUR_DROPLET_IP/6379" 2>&1
   
   # Option 3: Install telnet if needed
   # sudo apt install -y telnet  # Ubuntu/Debian
   # telnet YOUR_DROPLET_IP 27017
   ```

   All methods should fail with "Connection refused" or timeout.

### Why This Matters

Exposed MongoDB and Redis instances are common attack vectors:
- **MongoDB**: Attackers can access your database, read sensitive data, or delete data
- **Redis**: Attackers can execute commands, access cached data, or use your server for cryptocurrency mining

**Always bind these services to localhost (127.0.0.1) in production!**

---

## Additional Resources

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs
3. Check DigitalOcean status page
4. Open an issue on GitHub

