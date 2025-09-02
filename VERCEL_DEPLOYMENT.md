# HireFlow Vercel Deployment Guide

This guide will help you deploy your HireFlow application to Vercel, which is perfect for Next.js applications and provides excellent performance and developer experience.

## 📋 Prerequisites

1. **Vercel CLI**: Install the Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) and log in
   ```bash
   vercel login
   ```

3. **Node.js**: Ensure you have Node.js 18+ installed

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

Run the deployment script:
```bash
./deploy-vercel.sh
```

The script will:
- Check prerequisites
- Set up environment variables
- Configure database
- Deploy your application

### Option 2: Manual Deployment

#### Step 1: Initialize Vercel Project
```bash
vercel
```

Follow the prompts:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N`
- Project name: `hireflow`
- Directory: `frontend`
- Override settings: `N`

#### Step 2: Set Up Database

**Option A: Vercel Postgres (Recommended)**
```bash
vercel storage create postgres hireflow-db
```

**Option B: External PostgreSQL**
```bash
vercel env add DATABASE_URL production "your-postgresql-connection-string"
```

#### Step 3: Configure Environment Variables
```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set secrets
vercel env add JWT_SECRET production "$JWT_SECRET"
vercel env add CORS_ORIGIN production "https://hireflow.vercel.app"
vercel env add NEXT_PUBLIC_API_URL production "https://hireflow.vercel.app/api"
```

#### Step 4: Deploy
```bash
vercel --prod
```

## 📁 Configuration Files

### `vercel.json`
Main configuration file for Vercel deployment:
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/.next`
- Framework: Next.js
- Function timeout: 30 seconds
- API route rewrites configured

### `frontend/app/api/health/route.ts`
Updated health check endpoint using Next.js 13+ App Router format.

## 🔧 Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://hireflow.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://hireflow.vercel.app/api` |

## 🗄️ Database Setup

### Vercel Postgres (Recommended)
- Managed PostgreSQL service
- Automatic backups
- Easy scaling
- Integrated with Vercel
- Free tier available

### External Options
- **Supabase**: Free tier available
- **PlanetScale**: MySQL-compatible
- **Railway**: Easy PostgreSQL hosting
- **Neon**: Serverless PostgreSQL

## 🏗️ Architecture

### Frontend Deployment
- Next.js application deployed to Vercel
- Automatic builds on git push
- Edge functions for API routes
- Global CDN for static assets

### Backend Integration
Since Vercel is primarily for frontend, you have several options:

1. **API Routes**: Convert backend logic to Next.js API routes
2. **External Backend**: Deploy backend separately (Railway, Render, etc.)
3. **Serverless Functions**: Use Vercel Functions for backend logic

## 📊 Monitoring & Management

### View Deployments
```bash
vercel ls
```

### View Logs
```bash
vercel logs
```

### List Environment Variables
```bash
vercel env ls
```

### Pull Environment Variables
```bash
vercel env pull .env
```

### View Project Settings
```bash
vercel project ls
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Verify build script in package.json

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check if database is accessible from Vercel
   - Ensure proper SSL configuration

3. **CORS Errors**
   - Update CORS_ORIGIN to match your domain
   - Check frontend API URL configuration

4. **Function Timeout**
   - Increase maxDuration in vercel.json
   - Optimize API route performance

### Debug Commands
```bash
# View detailed logs
vercel logs --follow

# Check project configuration
vercel project ls

# Redeploy without cache
vercel --prod --force

# View function logs
vercel logs --function api/health
```

## 🌐 Custom Domains

To use a custom domain:

1. Add your domain in Vercel dashboard
2. Update DNS records
3. Configure SSL certificate
4. Update CORS_ORIGIN and NEXT_PUBLIC_API_URL

## 📈 Performance Optimization

### Vercel Features
- **Edge Functions**: Deploy functions globally
- **Image Optimization**: Automatic image optimization
- **Analytics**: Built-in performance monitoring
- **Speed Insights**: Core Web Vitals tracking

### Optimization Tips
- Use Next.js Image component
- Implement proper caching strategies
- Optimize bundle size
- Use static generation where possible

## 🔒 Security

- Environment variables are encrypted
- HTTPS is enforced
- Database connections use SSL
- JWT tokens are properly secured

## 🔄 Continuous Deployment

### GitHub Integration
1. Connect your GitHub repository
2. Enable automatic deployments
3. Configure branch protection rules
4. Set up preview deployments

### Environment Management
```bash
# Add environment variable for preview
vercel env add DATABASE_URL preview "preview-db-url"

# Add environment variable for development
vercel env add DATABASE_URL development "dev-db-url"
```

## 📞 Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
- HireFlow Issues: Create an issue in your repository

## 🆚 Vercel vs Fly.io Comparison

| Feature | Vercel | Fly.io |
|---------|--------|--------|
| **Best For** | Frontend/Next.js | Full-stack/Docker |
| **Database** | Vercel Postgres | Fly Postgres |
| **Deployment** | Git-based | Docker-based |
| **Scaling** | Automatic | Manual |
| **Cost** | Free tier | Pay-as-you-go |
| **Complexity** | Simple | Moderate |

---

**Happy Deploying! 🚀**
