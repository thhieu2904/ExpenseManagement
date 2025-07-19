# ===========================================
# EXPENSE MANAGEMENT DEPLOYMENT SCRIPT (Windows PowerShell)
# ===========================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "development", "prod", "production")]
    [string]$Mode = "production"
)

# Colors for output
$colors = @{
    Red = [System.ConsoleColor]::Red
    Green = [System.ConsoleColor]::Green
    Yellow = [System.ConsoleColor]::Yellow
    Blue = [System.ConsoleColor]::Blue
    White = [System.ConsoleColor]::White
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $colors.Red
}

Write-Host "🚀 Starting Expense Management Deployment..." -ForegroundColor $colors.Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Creating from template..."
    Copy-Item ".env.example" ".env"
    Write-Warning "Please edit .env file with your configuration before running again!"
    exit 1
}

# Check Docker installation
Write-Status "Checking Docker installation..."
try {
    $dockerVersion = docker --version
    Write-Success "Docker is installed: $dockerVersion"
} catch {
    Write-Error "Docker is not installed or not accessible. Please install Docker Desktop for Windows."
    exit 1
}

# Check Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Success "Docker Compose is installed: $composeVersion"
} catch {
    Write-Error "Docker Compose is not installed or not accessible."
    exit 1
}

# Deployment based on mode
if ($Mode -eq "dev" -or $Mode -eq "development") {
    Write-Status "Starting development environment..."
    
    # Stop existing containers
    docker-compose -f docker-compose.dev.yml down
    
    # Start development environment
    docker-compose -f docker-compose.dev.yml up --build -d
    
    Write-Success "Development environment started!"
    Write-Status "Frontend: http://localhost:3000"
    Write-Status "Backend: http://localhost:5000"
    Write-Status "API Docs: http://localhost:5000/api-docs"
    Write-Status "MongoDB: localhost:27017"
    
} elseif ($Mode -eq "prod" -or $Mode -eq "production") {
    Write-Status "Starting production environment..."
    
    # Stop existing containers
    Write-Status "Stopping existing containers..."
    docker-compose down
    
    # Pull latest images
    Write-Status "Pulling latest images..."
    docker-compose pull
    
    # Build and start services
    Write-Status "Building and starting services..."
    docker-compose up --build -d
    
    # Wait for services to be ready
    Write-Status "Waiting for services to be ready..."
    Start-Sleep -Seconds 30
    
    # Check health
    Write-Status "Checking service health..."
    docker-compose ps
    
    Write-Success "Production environment started!"
    Write-Status "Application: http://localhost"
    Write-Status "API: http://localhost:5000"
    Write-Status "API Docs: http://localhost:5000/api-docs"
}

# Show additional commands
Write-Host ""
Write-Status "Useful commands:"
Write-Host "  View logs: docker-compose logs -f [service-name]" -ForegroundColor $colors.White
Write-Host "  Stop services: docker-compose down" -ForegroundColor $colors.White
Write-Host "  Restart service: docker-compose restart [service-name]" -ForegroundColor $colors.White
Write-Host ""
Write-Success "Deployment completed successfully! 🎉"
