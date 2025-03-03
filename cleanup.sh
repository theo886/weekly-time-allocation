#!/bin/bash

# Preserve important files by moving them temporarily
mkdir -p .temp_preserve
cp important_credentials.md .temp_preserve/
cp .gitignore .temp_preserve/ 2>/dev/null || true

# Delete everything except .git, .temp_preserve and this script
find . -mindepth 1 -maxdepth 1 \
  ! -name '.git' \
  ! -name '.temp_preserve' \
  ! -name 'cleanup.sh' \
  -exec rm -rf {} \;

# Move preserved files back
mv .temp_preserve/* .
rmdir .temp_preserve

# Create a basic new structure
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/pages
mkdir -p public
mkdir -p api

# Create a basic README.md
echo "# Weekly Time Allocation" > README.md
echo "" >> README.md
echo "A new implementation of the weekly time allocation tracker." >> README.md

echo "Cleanup complete! The project has been reset while preserving important credentials and git history."