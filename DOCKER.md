# HireFlow Docker Setup

This document explains how to run HireFlow using Docker containers.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Production Environment

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

### Development Environment

1. **Build and start development services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000 (with hot reload)
   - Backend API: http://localhost:5000 (with hot reload)
   - Database: localhost:5432

3. **Stop development services:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Services

### PostgreSQL Database
- **Port:** 5432
- **Database:** hireflow (production) / hireflow_dev (development)
- **User:** hireflow_user
- **Password:** hireflow_password
- **Health Check:** Available at container level

### Backend API
- **Port:** 5000
- **Health Check:** http://localhost:5000/health
- **Environment:** Production or Development
- **Features:** Hot reloading in development mode

### Frontend Next.js
- **Port:** 3000
- **Health Check:** http://localhost:3000/api/health
- **Environment:** Production or Development
- **Features:** Hot reloading in development mode

## Environment Variables

### Backend
- `NODE_ENV`: production/development
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `CORS_ORIGIN`: Allowed CORS origin

### Frontend
- `NODE_ENV`: production/development
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Database
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

## Database Setup

### Initial Setup
1. Start the services:
   ```bash
   docker-compose up -d postgres
   ```

2. Run database migrations:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

3. Seed the database (if needed):
   ```bash
   docker-compose exec backend npx prisma db seed
   ```

### Development Database Reset
```bash
docker-compose exec backend npx prisma migrate reset
```

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Access Container Shell
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres psql -U hireflow_user -d hireflow
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Complete cleanup
docker-compose down -v --rmi all
```

## Troubleshooting

### Port Conflicts
If ports 3000, 5000, or 5432 are already in use:
1. Stop the conflicting services
2. Or modify the port mappings in docker-compose.yml

### Database Connection Issues
1. Check if PostgreSQL container is running:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify database connection:
   ```bash
   docker-compose exec postgres pg_isready -U hireflow_user -d hireflow
   ```

### Build Issues
1. Clean Docker cache:
   ```bash
   docker system prune -a
   ```

2. Rebuild without cache:
   ```bash
   docker-compose build --no-cache
   ```

### Performance Issues
- Use development compose file for faster builds
- Mount volumes for hot reloading
- Use multi-stage builds for production

## Production Deployment

### Environment Variables
Create a `.env` file with production values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://yourdomain.com
```

### Security Considerations
1. Change default passwords
2. Use strong JWT secrets
3. Configure proper CORS origins
4. Enable SSL/TLS in production
5. Use secrets management for sensitive data

### Scaling
- Use Docker Swarm or Kubernetes for production scaling
- Configure load balancers
- Set up monitoring and logging
- Use external database services for better reliability
