#!/bin/bash

# ===========================================
# EXPENSE MANAGEMENT DEPLOYMENT SCRIPT
# ===========================================

set -e

echo "🚀 Starting Expense Management Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before running again!"
    exit 1
fi

# Check Docker and Docker Compose
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker and Docker Compose are installed."

# Get deployment mode
DEPLOYMENT_MODE=${1:-production}

if [ "$DEPLOYMENT_MODE" = "dev" ] || [ "$DEPLOYMENT_MODE" = "development" ]; then
    print_status "Starting development environment..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up --build -d
    
    print_success "Development environment started!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:5000"
    print_status "API Docs: http://localhost:5000/api-docs"
    print_status "MongoDB: localhost:27017"
    
elif [ "$DEPLOYMENT_MODE" = "prod" ] || [ "$DEPLOYMENT_MODE" = "production" ]; then
    print_status "Starting production environment..."
    
    # Stop existing containers
    docker-compose down
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose pull
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose up --build -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check health
    print_status "Checking service health..."
    docker-compose ps
    
    print_success "Production environment started!"
    print_status "Application: http://localhost"
    print_status "API: http://localhost:5000"
    print_status "API Docs: http://localhost:5000/api-docs"
    
else
    print_error "Invalid deployment mode. Use 'dev' or 'prod'"
    exit 1
fi

# Show logs
echo ""
print_status "To view logs, use:"
echo "  docker-compose logs -f [service-name]"
echo ""
print_status "To stop services, use:"
echo "  docker-compose down"
echo ""
print_success "Deployment completed successfully! 🎉"
