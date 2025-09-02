# HireFlow Fly.io Deployment Guide

This guide will help you deploy your HireFlow application to Fly.io with all services combined in a single container.

## 📋 Prerequisites

1. **Fly.io CLI**: Install the Fly CLI
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Fly.io Account**: Sign up at [fly.io](https://fly.io) and log in
   ```bash
   fly auth login
   ```

3. **Docker**: Ensure Docker is running on your machine

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

Run the deployment script:
```bash
./deploy.sh
```

The script will:
- Check prerequisites
- Create the Fly.io app
- Set up PostgreSQL database
- Configure environment variables
- Deploy your application

### Option 2: Manual Deployment

#### Step 1: Create the Fly.io App
```bash
fly apps create hireflow --org personal
```

#### Step 2: Set Up Database

**Option A: Fly Postgres (Recommended)**
```bash
fly postgres create hireflow-db --org personal --region iad
fly postgres attach hireflow-db --app hireflow
```

**Option B: External PostgreSQL**
```bash
fly secrets set DATABASE_URL="your-postgresql-connection-string"
```

#### Step 3: Configure Environment Variables
```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set secrets
fly secrets set JWT_SECRET="$JWT_SECRET"
fly secrets set CORS_ORIGIN="https://hireflow.fly.dev"
fly secrets set NEXT_PUBLIC_API_URL="https://hireflow.fly.dev:5000"
```

#### Step 4: Deploy
```bash
fly deploy
```

## 📁 Configuration Files

### `fly.toml`
Main configuration file for Fly.io deployment:
- App name: `hireflow`
- Primary region: `iad` (Washington DC)
- Memory: 2GB
- Auto-scaling enabled
- Health checks configured

### `Dockerfile`
Multi-stage Dockerfile that:
- Builds backend (Node.js/Express)
- Builds frontend (Next.js)
- Combines both into a single runtime container
- Runs both services with a startup script

## 🔧 Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://hireflow.fly.dev` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://hireflow.fly.dev:5000` |

## 🗄️ Database Setup

### Fly Postgres (Recommended)
- Managed PostgreSQL service
- Automatic backups
- Easy scaling
- Integrated with Fly.io

### External Options
- **Supabase**: Free tier available
- **PlanetScale**: MySQL-compatible
- **Railway**: Easy PostgreSQL hosting
- **Neon**: Serverless PostgreSQL

## 📊 Monitoring & Management

### View Logs
```bash
fly logs
```

### Check Status
```bash
fly status
```

### Access Container
```bash
fly ssh console
```

### Scale Application
```bash
fly scale count 2  # Scale to 2 instances
fly scale memory 4096  # Increase memory to 4GB
```

### Update Application
```bash
fly deploy
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Dockerfile syntax
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check if database is accessible from Fly.io
   - Ensure proper SSL configuration

3. **CORS Errors**
   - Update CORS_ORIGIN to match your domain
   - Check frontend API URL configuration

4. **Memory Issues**
   - Increase memory allocation in fly.toml
   - Optimize application memory usage

### Debug Commands
```bash
# View detailed logs
fly logs --all

# Check app configuration
fly config show

# Restart application
fly apps restart hireflow

# View machine details
fly machine list
```

## 🌐 Custom Domains

To use a custom domain:

1. Add your domain in Fly.io dashboard
2. Update DNS records
3. Configure SSL certificate
4. Update CORS_ORIGIN and NEXT_PUBLIC_API_URL

## 📈 Scaling

### Horizontal Scaling
```bash
fly scale count 3  # Run 3 instances
```

### Vertical Scaling
```bash
fly scale memory 4096  # 4GB memory
fly scale cpu 2        # 2 CPUs
```

## 🔒 Security

- All secrets are encrypted and stored securely
- HTTPS is enforced
- Database connections use SSL
- JWT tokens are properly secured

## 📞 Support

- Fly.io Documentation: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- HireFlow Issues: Create an issue in your repository

---

**Happy Deploying! 🚀**
