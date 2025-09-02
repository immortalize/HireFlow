#!/bin/bash

# HireFlow Vercel Deployment Script
# This script will guide you through deploying HireFlow to Vercel

set -e

echo "🚀 HireFlow Vercel Deployment Script"
echo "====================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ You are not logged in to Vercel. Please run:"
    echo "   vercel login"
    exit 1
fi

echo "✅ Vercel CLI is installed and you're logged in"

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the root directory of your HireFlow project"
    exit 1
fi

echo "📦 Setting up Vercel project..."

# Navigate to frontend directory for deployment
cd frontend

# Set up environment variables
echo "🔐 Setting up environment variables..."

# Database configuration
echo "Choose your database option:"
echo "1. Vercel Postgres (recommended for simplicity)"
echo "2. External PostgreSQL (Supabase, PlanetScale, etc.)"
echo "3. Skip for now (you'll configure later)"

read -p "Enter your choice (1-3): " db_choice

case $db_choice in
    1)
        echo "Creating Vercel Postgres database..."
        vercel storage create postgres hireflow-db
        echo "✅ Vercel Postgres database created"
        ;;
    2)
        echo "Please provide your external PostgreSQL connection string:"
        read -p "DATABASE_URL: " database_url
        vercel env add DATABASE_URL production "$database_url"
        echo "✅ External database configured"
        ;;
    3)
        echo "⚠️  You'll need to configure DATABASE_URL later"
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

# Set required environment variables
echo "🔐 Setting up application secrets..."

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi

vercel env add JWT_SECRET production "$JWT_SECRET"

# Set CORS origin
read -p "Enter your frontend URL (e.g., https://hireflow.vercel.app): " frontend_url
vercel env add CORS_ORIGIN production "$frontend_url"

# Set API URL for frontend
api_url="${frontend_url}/api"
vercel env add NEXT_PUBLIC_API_URL production "$api_url"

echo "✅ Environment variables configured"

# Deploy the application
echo "🚀 Deploying HireFlow to Vercel..."
vercel --prod

# Navigate back to root
cd ..

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application should be available at:"
echo "   https://hireflow.vercel.app"
echo ""
echo "📊 Monitor your deployment:"
echo "   vercel ls"
echo "   vercel logs"
echo ""
echo "🔧 Useful commands:"
echo "   vercel ls              # List deployments"
echo "   vercel logs            # View logs"
echo "   vercel env ls          # List environment variables"
echo "   vercel env pull .env   # Pull environment variables"
echo ""
echo "🎉 HireFlow is now deployed on Vercel!"
