#!/bin/bash

# HireFlow Fly.io Deployment Script
# This script will guide you through deploying HireFlow to Fly.io

set -e

echo "🚀 HireFlow Fly.io Deployment Script"
echo "====================================="

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ You are not logged in to Fly.io. Please run:"
    echo "   fly auth login"
    exit 1
fi

echo "✅ Fly CLI is installed and you're logged in"

# Create the app if it doesn't exist
echo "📦 Creating Fly.io app..."
fly apps create hireflow --org personal || echo "App already exists"

# Set up PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
echo "Choose your database option:"
echo "1. Fly Postgres (recommended for simplicity)"
echo "2. External PostgreSQL (Supabase, PlanetScale, etc.)"
echo "3. Skip for now (you'll configure later)"

read -p "Enter your choice (1-3): " db_choice

case $db_choice in
    1)
        echo "Creating Fly Postgres database..."
        fly postgres create hireflow-db --org personal --region fra
        fly postgres attach hireflow-db --app hireflow
        echo "✅ Fly Postgres database created and attached"
        ;;
    2)
        echo "Please provide your external PostgreSQL connection string:"
        read -p "DATABASE_URL: " database_url
        fly secrets set DATABASE_URL="$database_url"
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

# Set required secrets
echo "🔐 Setting up application secrets..."

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi

fly secrets set JWT_SECRET="$JWT_SECRET"

# Set CORS origin
read -p "Enter your frontend URL (e.g., https://hireflow.fly.dev): " frontend_url
fly secrets set CORS_ORIGIN="$frontend_url"

# Set API URL for frontend
api_url="${frontend_url}:5000"
fly secrets set NEXT_PUBLIC_API_URL="$api_url"

echo "✅ Secrets configured"

# Deploy the application
echo "🚀 Deploying HireFlow to Fly.io..."
fly deploy

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application should be available at:"
echo "   https://hireflow.fly.dev"
echo ""
echo "📊 Monitor your deployment:"
echo "   fly status"
echo "   fly logs"
echo ""
echo "🔧 Useful commands:"
echo "   fly ssh console    # Access the container"
echo "   fly logs           # View logs"
echo "   fly status         # Check app status"
echo "   fly scale count 2  # Scale to 2 instances"
echo ""
echo "🎉 HireFlow is now deployed on Fly.io!"
