#!/bin/bash

# HireFlow Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to start services
start_services() {
    local env=${1:-production}
    
    check_docker
    check_docker_compose
    
    print_status "Starting HireFlow services in $env mode..."
    
    if [ "$env" = "development" ]; then
        docker-compose -f docker-compose.dev.yml up --build -d
        print_success "Development services started!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend: http://localhost:5000"
        print_status "Database: localhost:5432"
    else
        docker-compose up --build -d
        print_success "Production services started!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend: http://localhost:5000"
        print_status "Database: localhost:5432"
    fi
}

# Function to stop services
stop_services() {
    local env=${1:-production}
    
    print_status "Stopping HireFlow services..."
    
    if [ "$env" = "development" ]; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker-compose down
    fi
    
    print_success "Services stopped!"
}

# Function to restart services
restart_services() {
    local env=${1:-production}
    
    stop_services "$env"
    start_services "$env"
}

# Function to view logs
view_logs() {
    local service=${1:-""}
    local env=${2:-production}
    
    if [ "$env" = "development" ]; then
        if [ -n "$service" ]; then
            docker-compose -f docker-compose.dev.yml logs -f "$service"
        else
            docker-compose -f docker-compose.dev.yml logs -f
        fi
    else
        if [ -n "$service" ]; then
            docker-compose logs -f "$service"
        else
            docker-compose logs -f
        fi
    fi
}

# Function to run database migrations
run_migrations() {
    local env=${1:-production}
    
    print_status "Running database migrations..."
    
    if [ "$env" = "development" ]; then
        docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
    else
        docker-compose exec backend npx prisma migrate deploy
    fi
    
    print_success "Migrations completed!"
}

# Function to reset database
reset_database() {
    local env=${1:-production}
    
    print_warning "This will reset the database and all data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        
        if [ "$env" = "development" ]; then
            docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate reset --force
        else
            docker-compose exec backend npx prisma migrate reset --force
        fi
        
        print_success "Database reset completed!"
    else
        print_status "Database reset cancelled."
    fi
}

# Function to clean up Docker resources
cleanup() {
    local level=${1:-basic}
    
    print_status "Cleaning up Docker resources..."
    
    case $level in
        "basic")
            docker-compose down
            ;;
        "volumes")
            docker-compose down -v
            ;;
        "images")
            docker-compose down --rmi all
            ;;
        "all")
            docker-compose down -v --rmi all
            docker system prune -f
            ;;
        *)
            print_error "Invalid cleanup level. Use: basic, volumes, images, or all"
            exit 1
            ;;
    esac
    
    print_success "Cleanup completed!"
}

# Function to show status
show_status() {
    local env=${1:-production}
    
    print_status "HireFlow services status:"
    echo
    
    if [ "$env" = "development" ]; then
        docker-compose -f docker-compose.dev.yml ps
    else
        docker-compose ps
    fi
}

# Function to show help
show_help() {
    echo "HireFlow Docker Management Script"
    echo
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  start [env]           Start services (production|development)"
    echo "  stop [env]            Stop services (production|development)"
    echo "  restart [env]         Restart services (production|development)"
    echo "  logs [service] [env]  View logs (optional: service name, env)"
    echo "  migrate [env]         Run database migrations (production|development)"
    echo "  reset [env]           Reset database (production|development)"
    echo "  cleanup [level]       Clean up Docker resources (basic|volumes|images|all)"
    echo "  status [env]          Show services status (production|development)"
    echo "  help                  Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start development"
    echo "  $0 logs backend development"
    echo "  $0 cleanup all"
    echo
}

# Main script logic
case "${1:-help}" in
    "start")
        start_services "${2:-production}"
        ;;
    "stop")
        stop_services "${2:-production}"
        ;;
    "restart")
        restart_services "${2:-production}"
        ;;
    "logs")
        view_logs "${2:-}" "${3:-production}"
        ;;
    "migrate")
        run_migrations "${2:-production}"
        ;;
    "reset")
        reset_database "${2:-production}"
        ;;
    "cleanup")
        cleanup "${2:-basic}"
        ;;
    "status")
        show_status "${2:-production}"
        ;;
    "help"|*)
        show_help
        ;;
esac
