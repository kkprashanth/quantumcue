# QuantumCue - Quick Deployment Guide

This is a condensed version of the full deployment guide. For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- DigitalOcean account
- Domain name (optional)
- Groq API key
- SSH key added to DigitalOcean

## 5-Minute Setup

### 1. Create Droplet

- **Image**: Ubuntu 24.04 LTS
- **Plan**: 2GB RAM minimum (4GB recommended)
- **Region**: Closest to your users
- **Authentication**: SSH keys

### 2. Run Setup Scripts

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Run setup (downloads and executes scripts)
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/01-initial-setup.sh | bash
curl -fsSL https://raw.githubusercontent.com/your-org/quantumcuedemo/main/scripts/digitalocean/02-install-docker.sh | bash
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/quantumcuedemo.git /opt/quantumcuedemo
cd /opt/quantumcuedemo

# Run deployment script
bash scripts/digitalocean/03-deploy.sh
```

### 4. Configure Environment

```bash
# Edit backend environment
nano backend/.env
# Set: SECRET_KEY, GROQ_API_KEY, POSTGRES_PASSWORD

# Edit frontend environment
nano frontend/.env
# Set: VITE_API_BASE_URL
```

### 5. Start Services

```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

## Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/health

# Check services
docker compose -f docker-compose.prod.yml ps
```

## SSL Setup (Optional)

1. Point domain to droplet IP
2. Install certbot: `apt install -y certbot`
3. Get certificate: `certbot certonly --standalone -d yourdomain.com`
4. Configure nginx (see full guide)
5. Setup auto-renewal

## Common Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Update application
cd /opt/quantumcuedemo
bash scripts/digitalocean/update.sh

# Create backup
bash scripts/digitalocean/backup.sh
```

## Next Steps

- Read full [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Setup SSL certificates
- Configure backups
- Create admin user
- Setup monitoring

## Troubleshooting

**Services won't start?**
```bash
docker compose -f docker-compose.prod.yml logs
```

**Database connection issues?**
```bash
docker compose -f docker-compose.prod.yml ps postgres
```

**Need help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section.

