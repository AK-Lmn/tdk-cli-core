#!/bin/bash

# Update ALL workspace package.json files with latest dependencies
# This script runs bun update in each workspace directory

set -e

REPO_ROOT="/private/var/www/2025/ollamar1/beauty-crm"
TOTAL=0
UPDATED=0

echo "🚀 Updating ALL workspace packages in monorepo..."
echo "Repository: $REPO_ROOT"
echo ""

# Find all package.json files (excluding node_modules, dist, build, .next)
find "$REPO_ROOT" -name "package.json" -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.next/*" \
  ! -path "*/build/*" \
  ! -path "*/.git/*" \
  | sort | while read pkg_file; do

  TOTAL=$((TOTAL + 1))
  pkg_dir=$(dirname "$pkg_file")
  pkg_name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$pkg_file" | cut -d'"' -f4 || echo "unknown")

  # Skip if no dependencies
  if ! grep -q '"dependencies"\|"devDependencies"' "$pkg_file"; then
    continue
  fi

  UPDATED=$((UPDATED + 1))

  echo "[$UPDATED] Updating: $pkg_name"
  echo "     Path: $pkg_dir"

  # Change to package directory and run bun update
  cd "$pkg_dir"

  # Run bun update to update package.json versions
  bun update 2>&1 | tail -3 || true

  cd - > /dev/null
  echo ""
done

echo "✅ Update complete!"
echo "Total package.json files found: $TOTAL"
echo "Packages with dependencies updated: $UPDATED"

