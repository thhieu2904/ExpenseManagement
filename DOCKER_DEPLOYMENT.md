# 🐳 Docker Deployment Guide

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### 2. Development Mode

```bash
# Using script
./deploy.sh dev

# Or using make
make dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up --build -d
```

### 3. Production Mode

```bash
# Using script
./deploy.sh prod

# Or using make
make prod

# Or using docker-compose directly
docker-compose up --build -d
```

## 📋 Services

| Service  | Development Port | Production Port | Description    |
| -------- | ---------------- | --------------- | -------------- |
| Frontend | 3000             | 80              | React Vite App |
| Backend  | 5000             | 5000            | Node.js API    |
| MongoDB  | 27017            | -               | Database       |
| Nginx    | -                | 80, 443         | Reverse Proxy  |

## 🔧 Common Commands

### Using Make (Recommended)

```bash
make help          # Show all available commands
make dev           # Start development environment
make prod          # Start production environment
make logs          # Show all logs
make health        # Check service health
make clean         # Clean up resources
```

### Using Docker Compose

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose up -d
docker-compose logs -f
docker-compose down

# Individual services
docker-compose logs -f backend
docker-compose restart frontend
```

### Using Scripts

```bash
# Linux/Mac
./deploy.sh dev
./deploy.sh prod

# Windows PowerShell
.\deploy.ps1 -Mode dev
.\deploy.ps1 -Mode prod
```

## 🌐 Environment Variables

### Required Variables

```env
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DB_NAME=expense_management

# JWT
JWT_SECRET=your-super-secret-jwt-key

# API Keys
GEMINI_API_KEY=your-gemini-api-key
```

### Optional Variables

```env
# Ports
BACKEND_PORT=5000
FRONTEND_PORT=80
HTTP_PORT=80
HTTPS_PORT=443

# App
NODE_ENV=production
APP_NAME=ExpenseManagement
```

## 🚀 Cloud Deployment

### AWS EC2

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy
git clone your-repo
cd ExpenseManagement
cp .env.example .env
# Edit .env file
./deploy.sh prod
```

### DigitalOcean Droplet

```bash
# One-click Docker Droplet or install manually
git clone your-repo
cd ExpenseManagement
cp .env.example .env
# Edit .env file
make prod
```

### Google Cloud Run

```bash
# Build and push images
docker build -t gcr.io/PROJECT-ID/expense-backend ./backend
docker build -t gcr.io/PROJECT-ID/expense-frontend ./frontend-vite

docker push gcr.io/PROJECT-ID/expense-backend
docker push gcr.io/PROJECT-ID/expense-frontend

# Deploy using Cloud Run
gcloud run deploy expense-backend --image gcr.io/PROJECT-ID/expense-backend
gcloud run deploy expense-frontend --image gcr.io/PROJECT-ID/expense-frontend
```

## 🔒 Security Considerations

### Production Security

- Use strong passwords for MongoDB
- Set secure JWT secret (minimum 32 characters)
- Enable HTTPS with SSL certificates
- Use environment variables for secrets
- Run containers as non-root users
- Enable Docker security scanning

### Environment Security

```bash
# Set proper file permissions
chmod 600 .env
chmod +x deploy.sh

# Use Docker secrets in production
docker secret create jwt_secret jwt_secret.txt
```

## 📊 Monitoring & Logging

### View Logs

```bash
# All services
make logs

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Health Checks

```bash
# Check service status
make health
docker-compose ps

# Manual health check
curl http://localhost:5000/
curl http://localhost/
```

### Performance Monitoring

```bash
# Resource usage
docker stats

# Container inspection
docker inspect expense-backend
docker inspect expense-frontend
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Find process using port
   lsof -i :5000
   # Kill process
   kill -9 PID
   ```

2. **Permission denied**

   ```bash
   sudo chown -R $USER:$USER .
   chmod +x deploy.sh
   ```

3. **Database connection error**

   ```bash
   # Check MongoDB container
   docker-compose logs mongodb
   # Restart MongoDB
   docker-compose restart mongodb
   ```

4. **Frontend build error**
   ```bash
   # Clear cache and rebuild
   docker-compose down
   docker image prune -f
   docker-compose up --build
   ```

### Debug Mode

```bash
# Run with debug output
DEBUG=* docker-compose up

# Interactive mode
docker-compose run --rm backend bash
docker-compose run --rm frontend sh
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# In docker-compose.yml
backend:
  deploy:
    replicas: 3

frontend:
  deploy:
    replicas: 2
```

### Load Balancer

```yaml
# Add to docker-compose.yml
loadbalancer:
  image: nginx:alpine
  volumes:
    - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf
  ports:
    - "80:80"
  depends_on:
    - backend
    - frontend
```

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
make update
# or
docker-compose pull
docker-compose up -d
```

### Database Backup

```bash
# Backup
make db-backup

# Restore
make db-restore
```

### Clean Up

```bash
# Remove unused resources
make clean

# Complete cleanup (WARNING: removes all data)
make clean-all
```
