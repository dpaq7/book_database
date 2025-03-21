#!/bin/bash
# Script to build and deploy the Book Database frontend to GitHub Pages

echo "📦 Building the frontend application..."
cd frontend
npm run build

echo "🚀 Preparing for deployment..."
cd ..

# Create or clear the deployment directory
rm -rf gh-pages-deploy
mkdir -p gh-pages-deploy

# Copy build files to deployment directory
echo "📋 Copying build files..."
cp -r frontend/dist/* gh-pages-deploy/
touch gh-pages-deploy/.nojekyll

# Switch to gh-pages branch
echo "🔄 Setting up gh-pages branch..."
git checkout gh-pages 2>/dev/null || git checkout -b gh-pages

# Remove previous files but keep .git
find . -maxdepth 1 ! -name '.git' ! -name 'gh-pages-deploy' ! -name '.' -exec rm -rf {} \;

# Copy files from deployment directory
echo "📦 Moving build files to root..."
cp -r gh-pages-deploy/* .
cp gh-pages-deploy/.nojekyll .
rm -rf gh-pages-deploy

# Commit and push
echo "💾 Committing changes..."
git add -A
git commit -m "Deploy frontend to GitHub Pages"

echo "🚀 Pushing to GitHub..."
git push -f origin gh-pages

# Return to original branch
echo "✅ Returning to main branch..."
git checkout main

echo "✨ Deployment complete! Your site will be available at https://dpaq7.github.io/book_database/ in a few minutes."
