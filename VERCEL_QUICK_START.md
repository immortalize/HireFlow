# Quick Vercel Deployment Steps

## 🚀 Deploy in 5 Minutes

### Option 1: Simple Deployment (Recommended)
```bash
./deploy-simple.sh
```

### Option 2: Full Setup with Database
```bash
./deploy-vercel.sh
```

### Option 3: Manual Deployment
```bash
# Navigate to frontend directory
cd frontend

# Initialize project
vercel

# Set environment variables
vercel env add DATABASE_URL production "your-database-url"
vercel env add JWT_SECRET production "your-jwt-secret"
vercel env add CORS_ORIGIN production "https://hireflow.vercel.app"
vercel env add NEXT_PUBLIC_API_URL production "https://hireflow.vercel.app/api"

# Deploy to production
vercel --prod
```

## 📁 What's Been Set Up

✅ **frontend/vercel.json** - Vercel configuration
✅ **deploy-vercel.sh** - Full automated deployment script  
✅ **deploy-simple.sh** - Simple deployment script
✅ **VERCEL_DEPLOYMENT.md** - Complete deployment guide
✅ **API Routes** - Backend functionality in Next.js API routes
✅ **Prisma Setup** - Database client configuration

## 🌐 Your App Will Be Available At
`https://hireflow.vercel.app`

## 🔧 Key Features
- **Automatic Deployments** - Deploy on every git push
- **Edge Functions** - Global performance
- **Built-in Analytics** - Monitor performance
- **Custom Domains** - Easy domain setup
- **Environment Variables** - Secure configuration

## 📊 Monitor Your Deployment
```bash
vercel ls          # List deployments
vercel logs         # View logs
vercel status       # Check status
```

---
**Ready to deploy? Run `./deploy-simple.sh` 🚀**
