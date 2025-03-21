#!/bin/bash
# Script to manually deploy the Book Database frontend to GitHub Pages

echo "📦 Building the frontend application..."
cd frontend
npm run build

echo "🔧 Creating .nojekyll file to disable Jekyll processing..."
touch dist/.nojekyll

echo "🚀 Deploying to GitHub Pages..."
git checkout -b temp-deploy

# Force clean gh-pages branch
git push origin --delete gh-pages || echo "No gh-pages branch to delete"

# Create and push a clean gh-pages branch with just the build output
git checkout --orphan gh-pages
git rm -rf .
cp -r frontend/dist/* .
cp frontend/dist/.nojekyll .
git add .
git commit -m "Deploy frontend to GitHub Pages"
git push -f origin gh-pages

# Return to main branch
git checkout main
git branch -D temp-deploy

echo "✅ Deployment complete! Your site will be available at https://dpaq7.github.io/book_database/ in a few minutes."
