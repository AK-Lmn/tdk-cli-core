#!/usr/bin/env bash

# Publish only missing @beauty-crm packages to Verdaccio

set -e

REGISTRY="http://verdaccio.localhost:4873"
ROOT_DIR="/private/var/www/2025/ollamar1/beauty-crm"

echo "🚀 Publishing missing @beauty-crm packages to Verdaccio..."
echo ""

# List of packages that are missing (from error messages)
MISSING_PACKAGES=(
  "shared-platform-engineering/platform-identity-client"
  "shared-product-engineering/product-appointment-unified"
  "shared-platform-engineering/platform-computing-runtime"
  "shared-product-engineering/product-constants"
  "shared-product-engineering/product-identity-unified"
)

published=0
failed=0

for pkg_dir in "${MISSING_PACKAGES[@]}"; do
  full_path="$ROOT_DIR/$pkg_dir"
  
  if [ ! -d "$full_path" ]; then
    echo "❌ Directory not found: $pkg_dir"
    ((failed++))
    continue
  fi
  
  cd "$full_path"
  pkg_name=$(grep '"name"' package.json | head -1 | sed 's/.*"name": *"\(.*\)".*/\1/')
  
  echo "📦 $pkg_name"
  echo "   Path: $pkg_dir"
  
  # Build
  if grep -q '"build"' package.json; then
    echo "   Building..."
    if ! bun run build > /dev/null 2>&1; then
      echo "   ❌ Build failed"
      ((failed++))
      continue
    fi
  fi
  
  # Publish
  echo "   Publishing..."
  output=$(npm publish --registry "$REGISTRY" --access public 2>&1 || true)
  
  if echo "$output" | grep -q "409 Conflict"; then
    echo "   ⚠️  Already published"
  elif echo "$output" | grep -q "npm error"; then
    echo "   ❌ Failed to publish"
    echo "$output" | grep "npm error" | head -2
    ((failed++))
  else
    echo "   ✅ Published"
    ((published++))
  fi
  
  echo ""
done

echo "="*50
echo "📊 Summary:"
echo "  ✅ Published: $published"
echo "  ❌ Failed: $failed"
echo "="*50

