#!/bin/bash

# Update all dependencies in all package.json files across the monorepo
# This script finds all package.json files and updates them to use "latest" versions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting monorepo-wide dependency update..."
echo "Repository root: $REPO_ROOT"
echo ""

# Counter for tracking
TOTAL=0
UPDATED=0

# Find all package.json files (excluding node_modules and dist)
while IFS= read -r pkg_file; do
  TOTAL=$((TOTAL + 1))
  pkg_dir=$(dirname "$pkg_file")
  pkg_name=$(grep '"name"' "$pkg_file" | head -1 | sed 's/.*"name": "\([^"]*\)".*/\1/')
  
  echo "[$TOTAL] Processing: $pkg_name"
  echo "     Path: $pkg_dir"
  
  # Check if package.json has dependencies or devDependencies
  if grep -q '"dependencies"\|"devDependencies"' "$pkg_file"; then
    UPDATED=$((UPDATED + 1))
    
    # Run bun install in that directory to update lock files
    cd "$pkg_dir"
    bun install --latest 2>&1 | grep -E "(added|updated|removed|warn)" | head -3 || true
    cd - > /dev/null
  fi
  
  echo ""
done < <(find "$REPO_ROOT" -name "package.json" -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.next/*" \
  ! -path "*/build/*" \
  | sort)

echo "✅ Update complete!"
echo "Total package.json files found: $TOTAL"
echo "Packages updated: $UPDATED"

