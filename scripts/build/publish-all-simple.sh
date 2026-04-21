#!/usr/bin/env bash

# Simple script to publish all @beauty-crm packages to Verdaccio
# Does not use set -e to avoid exiting on 409 errors

REGISTRY="http://verdaccio.localhost:4873"

echo "🚀 Publishing all @beauty-crm packages to Verdaccio..."
echo ""

published=0
skipped=0
failed=0

# Function to publish a package
publish_pkg() {
  local dir=$1
  local pkg_name=$(grep '"name"' "${dir}/package.json" | head -1 | sed 's/.*"name": *"\(.*\)".*/\1/')
  
  if [[ ! "$pkg_name" == @beauty-crm/* ]]; then
    return
  fi
  
  echo "📦 $pkg_name"
  cd "$dir"
  
  # Build if needed
  if grep -q '"build"' package.json; then
    echo "  Building..."
    bun run build > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      echo "  ❌ Build failed"
      ((failed++))
      cd - > /dev/null
      return
    fi
  fi
  
  # Publish
  echo "  Publishing..."
  output=$(npm publish --registry "$REGISTRY" --access public 2>&1)
  
  if echo "$output" | grep -q "409 Conflict"; then
    echo "  ⚠️  Already published"
    ((skipped++))
  elif echo "$output" | grep -q "npm error"; then
    echo "  ❌ Failed"
    echo "$output" | grep "npm error" | head -2
    ((failed++))
  else
    echo "  ✅ Published"
    ((published++))
  fi
  
  cd - > /dev/null
  echo ""
}

# Publish platform packages
echo "=== Platform Packages ==="
for dir in shared-platform-engineering/*/; do
  if [ -f "${dir}package.json" ]; then
    publish_pkg "$dir"
  fi
done

# Publish product packages
echo "=== Product Packages ==="
for dir in shared-product-engineering/*/; do
  if [ -f "${dir}package.json" ]; then
    publish_pkg "$dir"
  fi
done

echo "================================"
echo "📊 Summary:"
echo "  ✅ Published: $published"
echo "  ⚠️  Skipped: $skipped"
echo "  ❌ Failed: $failed"
echo "================================"

