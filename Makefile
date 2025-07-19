# ===========================================
# EXPENSE MANAGEMENT - MAKEFILE
# ===========================================

.PHONY: help build up down restart logs clean dev prod

# Default target
.DEFAULT_GOAL := help

# Colors
YELLOW := \033[1;33m
GREEN := \033[0;32m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m

help: ## Show this help message
	@echo "$(GREEN)Expense Management - Docker Commands$(NC)"
	@echo "$(YELLOW)Usage: make [target]$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-20s$(NC) %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"
	@echo "API Docs: http://localhost:5000/api-docs"

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

# Production commands
prod: ## Start production environment
	@echo "$(GREEN)Starting production environment...$(NC)"
	docker-compose up --build -d
	@echo "$(GREEN)Production environment started!$(NC)"
	@echo "Application: http://localhost"
	@echo "API: http://localhost:5000"
	@echo "API Docs: http://localhost:5000/api-docs"

prod-logs: ## Show production logs
	docker-compose logs -f

prod-stop: ## Stop production environment
	docker-compose down

# General commands
build: ## Build all images
	docker-compose build

up: ## Start services (detached)
	docker-compose up -d

down: ## Stop and remove containers
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

# Individual service commands
backend-logs: ## Show backend logs
	docker-compose logs -f backend

frontend-logs: ## Show frontend logs
	docker-compose logs -f frontend

mongodb-logs: ## Show MongoDB logs
	docker-compose logs -f mongodb

# Database commands
db-backup: ## Backup MongoDB database
	@echo "$(YELLOW)Creating database backup...$(NC)"
	docker-compose exec mongodb mongodump --out /data/backup --db expense_management
	docker cp $$(docker-compose ps -q mongodb):/data/backup ./backup
	@echo "$(GREEN)Database backup completed: ./backup$(NC)"

db-restore: ## Restore MongoDB database from backup
	@echo "$(YELLOW)Restoring database from backup...$(NC)"
	docker cp ./backup $$(docker-compose ps -q mongodb):/data/backup
	docker-compose exec mongodb mongorestore /data/backup
	@echo "$(GREEN)Database restore completed$(NC)"

# Utility commands
ps: ## Show running containers
	docker-compose ps

stats: ## Show container resource usage
	docker stats

clean: ## Remove stopped containers and unused images
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker container prune -f
	docker image prune -f
	docker volume prune -f
	docker network prune -f
	@echo "$(GREEN)Cleanup completed$(NC)"

clean-all: ## Remove all containers, images, volumes and networks
	@echo "$(RED)WARNING: This will remove ALL Docker resources!$(NC)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose down -v --rmi all
	docker system prune -a -f --volumes

# Health checks
health: ## Check service health
	@echo "$(BLUE)Checking service health...$(NC)"
	docker-compose ps
	@echo ""
	@echo "$(BLUE)Backend health:$(NC)"
	@curl -f http://localhost:5000/ > /dev/null 2>&1 && echo "$(GREEN)✓ Backend is healthy$(NC)" || echo "$(RED)✗ Backend is not responding$(NC)"
	@echo "$(BLUE)Frontend health:$(NC)"
	@curl -f http://localhost/ > /dev/null 2>&1 && echo "$(GREEN)✓ Frontend is healthy$(NC)" || echo "$(RED)✗ Frontend is not responding$(NC)"

# Setup commands
setup: ## Initial setup - copy env file and start services
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from template...$(NC)"; \
		cp .env.example .env; \
		echo "$(RED)Please edit .env file with your configuration!$(NC)"; \
	else \
		echo "$(GREEN).env file already exists$(NC)"; \
	fi

# Update commands
update: ## Pull latest images and restart
	docker-compose pull
	docker-compose up -d

# Security scan
security-scan: ## Run security scan on images
	@echo "$(BLUE)Running security scan...$(NC)"
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image expense-management_backend:latest
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image expense-management_frontend:latest
