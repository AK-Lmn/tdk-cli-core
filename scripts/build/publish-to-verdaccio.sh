#!/usr/bin/env bash

# Script to publish all internal packages to Verdaccio local registry
# Usage: ./scripts/publish-to-verdaccio.sh [--platform] [--product] [--all]

set -euo pipefail

REGISTRY="http://verdaccio.localhost:4873"
VERDACCIO_URL="http://verdaccio.localhost:4873"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Verdaccio is running
check_verdaccio() {
  if ! curl -s "${VERDACCIO_URL}" > /dev/null 2>&1; then
    echo -e "${RED}Error: Verdaccio is not running at ${VERDACCIO_URL}${NC}"
    echo -e "${YELLOW}Start it with: bun run verdaccio:start${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Verdaccio is running${NC}"
}

# Publish a single package
publish_package() {
  local package_dir="$1"
  local package_name=$(grep '"name"' "${package_dir}/package.json" | head -1 | sed 's/.*"name": *"\(.*\)".*/\1/')
  
  if [[ -z "${package_name}" ]]; then
    echo -e "${YELLOW}⚠ Skipping ${package_dir} (no package name found)${NC}"
    return 0
  fi

  # Skip if package is not @beauty-crm scoped
  if [[ ! "${package_name}" =~ ^@beauty-crm/ ]]; then
    return 0
  fi

  echo -e "${YELLOW}Publishing ${package_name}...${NC}"
  
  # Build the package first
  if [[ -f "${package_dir}/package.json" ]]; then
    cd "${package_dir}"
    
    # Run build if build script exists
    if grep -q '"build"' package.json; then
      echo "  Building ${package_name}..."
      bun run build || {
        echo -e "${RED}✗ Build failed for ${package_name}${NC}"
        cd - > /dev/null
        return 1
      }
    fi
    
    # Remove private flag temporarily for publishing
    # Verdaccio allows private packages but some tools complain
    # We'll publish and then restore
    local was_private=false
    if grep -q '"private":\s*true' package.json; then
      was_private=true
      # Remove private flag temporarily (in memory, don't modify file)
      # Actually, Verdaccio accepts private packages, so we can skip this
    fi
    
    # Publish to Verdaccio
    echo "  Publishing ${package_name} to ${REGISTRY}..."
    # Bun uses --access flag, but we can also set it in package.json temporarily
    # For Bun, we need to ensure the package.json has publishConfig or we use npm/pnpm publish
    if command -v npm > /dev/null 2>&1; then
      npm publish --registry "${REGISTRY}" --access public --workspaces=false 2>&1 | tee /tmp/npm_publish.log || {
        # Check if it's a 409 error (package already exists)
        if grep -q "409 Conflict" /tmp/npm_publish.log || grep -q "already present" /tmp/npm_publish.log; then
          echo -e "${YELLOW}⚠ Package ${package_name} already exists, skipping${NC}"
          cd - > /dev/null
          return 0
        fi
        echo -e "${RED}✗ Publish failed for ${package_name}${NC}"
        cd - > /dev/null
        return 1
      }
    else
      # Fallback: Bun publish (may require publishConfig in package.json)
      bun publish --registry "${REGISTRY}" 2>&1 | tee /tmp/bun_publish.log || {
        # Check if it's a 409 error (package already exists)
        if grep -q "409 Conflict" /tmp/bun_publish.log || grep -q "already present" /tmp/bun_publish.log; then
          echo -e "${YELLOW}⚠ Package ${package_name} already exists, skipping${NC}"
          cd - > /dev/null
          return 0
        fi
        echo -e "${RED}✗ Publish failed for ${package_name}${NC}"
        echo -e "${YELLOW}Tip: Ensure package.json has publishConfig.registry set${NC}"
        cd - > /dev/null
        return 1
      }
    fi
    
    echo -e "${GREEN}✓ Published ${package_name}${NC}"
    cd - > /dev/null
  fi
}

# Main function
main() {
  check_verdaccio
  
  local filter="${1:-all}"
  local publish_count=0
  local failed_count=0
  
  echo -e "${GREEN}Starting package publication to Verdaccio...${NC}"
  echo ""
  
  # Determine which packages to publish
  case "${filter}" in
    --platform)
      echo "Publishing platform packages only..."
      while IFS= read -r -d '' package_dir; do
        publish_package "${package_dir}" || ((++failed_count))
        ((++publish_count))
      done < <(find shared-platform-engineering -maxdepth 1 -mindepth 1 -type d -print0)
      ;;
    --product)
      echo "Publishing product packages only..."
      while IFS= read -r -d '' package_dir; do
        publish_package "${package_dir}" || ((++failed_count))
        ((++publish_count))
      done < <(find shared-product-engineering -maxdepth 1 -mindepth 1 -type d -print0)
      ;;
    --all|*)
      echo "Publishing all packages..."
      # Publish in dependency order (platform first, then product)
      echo "Publishing platform packages..."
      while IFS= read -r -d '' package_dir; do
        if [[ -f "${package_dir}/package.json" ]]; then
          publish_package "${package_dir}" || ((++failed_count))
          ((++publish_count))
        fi
      done < <(find shared-platform-engineering -maxdepth 1 -mindepth 1 -type d -print0)
      
      echo ""
      echo "Publishing product packages..."
      while IFS= read -r -d '' package_dir; do
        if [[ -f "${package_dir}/package.json" ]]; then
          publish_package "${package_dir}" || ((++failed_count))
          ((++publish_count))
        fi
      done < <(find shared-product-engineering -maxdepth 1 -mindepth 1 -type d -print0)
      ;;
  esac
  
  echo ""
  echo -e "${GREEN}=== Publication Summary ===${NC}"
  echo -e "Total packages processed: ${publish_count}"
  if [[ ${failed_count} -gt 0 ]]; then
    echo -e "${RED}Failed: ${failed_count}${NC}"
    exit 1
  else
    echo -e "${GREEN}All packages published successfully!${NC}"
    echo ""
    echo "Access Verdaccio UI at: ${VERDACCIO_URL}"
  fi
}

main "$@"
