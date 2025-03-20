#!/bin/bash

# Script to set up the Book Database GitHub repository
# This script initializes Git, adds all files, and pushes to a new GitHub repository

echo "🔧 Setting up GitHub repository for Book Database..."

# Initialize Git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "📝 Initializing Git repository..."
  git init
else
  echo "✅ Git repository already initialized"
fi

# Prompt for GitHub username
read -p "Enter your GitHub username: " github_username

# Check if .gitignore exists, create if not
if [ ! -f ".gitignore" ]; then
  echo "📝 Creating .gitignore file..."
  cat > .gitignore << EOL
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
.env

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea
.vscode/*
!.vscode/settings.json
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
EOL
fi

# Add all files to Git
echo "📥 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit for Book Database TypeScript version"

# Add GitHub remote
echo "🔗 Adding GitHub remote..."
git remote add origin "https://github.com/$github_username/book-database.git"

# Rename the default branch to main if not already
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
  echo "🏷️ Renaming current branch to main..."
  git branch -M main
fi

echo ""
echo "✅ Repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub with: git push -u origin main"
echo "2. Set up GitHub Pages in your repository settings"
echo "3. Your site will be available at: https://$github_username.github.io/book-database"
echo ""
echo "Remember, the backend is deployed at: https://book-database-backend.onrender.com"
