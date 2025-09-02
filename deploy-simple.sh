#!/bin/bash

# Simple Vercel Deployment Script
# Run this from the root directory

echo "🚀 Deploying HireFlow to Vercel..."

# Navigate to frontend and deploy
cd frontend
vercel --prod
cd ..

echo "✅ Deployment complete!"
echo "🌐 Your app is available at: https://hireflow.vercel.app"
