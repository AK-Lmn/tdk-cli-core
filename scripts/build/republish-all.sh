#!/usr/bin/env bash

# Definitive script to republish all @beauty-crm packages to Verdaccio
# Fixes IntegrityCheckFailed and 404 errors by ensuring proper version bumping
# and dependency-aware publishing order
#
# Usage: 
#   ./scripts/republish-all.sh [--force] [--platform-only] [--product-only]

set -euo pipefail

# Configuration
REGISTRY="http://verdaccio.localhost:4873"
VERDACCIO_URL="http://verdaccio.localhost:4873"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m' 
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global counters
PUBLISHED=0
SKIPPED=0
FAILED=0

# Parse command line arguments
FORCE_PUBLISH=false
PLATFORM_ONLY=false
PRODUCT_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE_PUBLISH=true
      echo -e "${YELLOW}🔥 FORCE MODE ENABLED: Will bump versions and republish all packages${NC}"
      shift
      ;;
    --platform-only)
      PLATFORM_ONLY=true
      shift
      ;;
    --product-only)
      PRODUCT_ONLY=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--force] [--platform-only] [--product-only]"
      exit 1
      ;;
  esac
done

# Check if Verdaccio is running
check_verdaccio() {
  echo -e "${BLUE}🔍 Checking Verdaccio availability...${NC}"
  if ! curl -sf "${VERDACCIO_URL}" > /dev/null 2>&1; then
    echo -e "${RED}❌ Verdaccio is not running at ${VERDACCIO_URL}${NC}"
    echo -e "${YELLOW}💡 Start it with: bun run verdaccio:start${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Verdaccio is running${NC}"
}

# Get package name from package.json
get_package_name() {
  local package_dir="$1"
  local abs_package_dir="$(cd "${package_dir}" 2>/dev/null && pwd)" || abs_package_dir="${package_dir}"
  if [[ -f "${abs_package_dir}/package.json" ]]; then
    node -p "require('${abs_package_dir}/package.json').name" 2>/dev/null || echo ""
  else
    echo ""
  fi
}

# Check if package is private
is_private_package() {
  local package_dir="$1"
  local abs_package_dir="$(cd "${package_dir}" 2>/dev/null && pwd)" || abs_package_dir="${package_dir}"
  if [[ -f "${abs_package_dir}/package.json" ]]; then
    node -p "require('${abs_package_dir}/package.json').private === true" 2>/dev/null | grep -q "true"
  else
    return 1
  fi
}

# Check if package exists in registry
package_exists_in_registry() {
  local package_name="$1"
  local encoded_name=$(echo "$package_name" | sed 's/@/%40/g; s/\//%2f/g')
  curl -sf "${REGISTRY}/${encoded_name}" > /dev/null 2>&1
}

# Get current version from package.json
get_current_version() {
  local package_dir="$1"
  local abs_package_dir="$(cd "${package_dir}" 2>/dev/null && pwd)" || abs_package_dir="${package_dir}"
  if [[ -f "${abs_package_dir}/package.json" ]]; then
    node -p "require('${abs_package_dir}/package.json').version" 2>/dev/null || echo "0.0.0"
  else
    echo "0.0.0"
  fi
}

# Publish a single package with proper version management
publish_package() {
  local package_dir="$1"
  local package_name
  package_name=$(get_package_name "$package_dir")
  
  # Skip if no package name or not @beauty-crm scoped
  if [[ -z "$package_name" ]] || [[ ! "$package_name" =~ ^@beauty-crm/ ]]; then
    return 0
  fi

  echo -e "\n${BLUE}📦 Processing: ${package_name}${NC}"
  echo -e "   📁 Path: $package_dir"

  cd "$package_dir"

  # Check if package is private
  if is_private_package "$package_dir"; then
    echo -e "   ${YELLOW}⚠️  Package is private, temporarily removing private flag${NC}"
    # Create backup of package.json
    cp package.json package.json.backup
    # Remove private flag temporarily
    node -e "
      const pkg = require('./package.json');
      delete pkg.private;
      require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    trap 'mv package.json.backup package.json 2>/dev/null || true' EXIT
  fi

  local current_version
  current_version=$(get_current_version "$package_dir")
  echo -e "   🏷️  Current version: $current_version"

  # Check if package exists in registry and handle versioning
  local should_publish=true
  if package_exists_in_registry "$package_name" && [[ "$FORCE_PUBLISH" != "true" ]]; then
    echo -e "   ${YELLOW}⚠️  Package exists in registry${NC}"
    should_publish=false
  fi

  # Force publish or package doesn't exist - bump version
  if [[ "$FORCE_PUBLISH" == "true" ]] || [[ "$should_publish" == "true" ]]; then
    echo -e "   ⬆️  Bumping version (patch)..."
    
    # Use Node.js to bump patch version (more reliable than npm)
    local new_version
    new_version=$(node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const parts = pkg.version.split('.');
      parts[2] = parseInt(parts[2]) + 1;
      pkg.version = parts.join('.');
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      console.log(pkg.version);
    " 2>/dev/null || echo "failed")
    
    if [[ "$new_version" == "failed" ]]; then
      echo -e "   ${RED}❌ Version bump failed${NC}"
      ((FAILED++))
      cd - > /dev/null
      return 1
    fi
    
    echo -e "   🏷️  New version: $new_version"
  else
    echo -e "   ⏭️  Skipping (already exists, use --force to republish)${NC}"
    ((SKIPPED++))
    cd - > /dev/null
    return 0
  fi

  # Build if build script exists
  if grep -q '"build"' package.json 2>/dev/null; then
    echo -e "   🔨 Building package..."
    if ! bun run build > /tmp/build_${package_name//\//_}.log 2>&1; then
      echo -e "   ${RED}❌ Build failed${NC}"
      echo -e "   📄 Build log: /tmp/build_${package_name//\//_}.log"
      ((FAILED++))
      cd - > /dev/null
      return 1
    fi
    echo -e "   ✅ Build successful"
  fi

  # Publish using bun with proper registry and access settings
  echo -e "   🚀 Publishing to Verdaccio..."
  
  # Set registry in publishConfig to ensure bun uses the right registry
  local temp_pkg_modified=false
  if ! grep -q "publishConfig" package.json 2>/dev/null; then
    echo -e "   📝 Adding publishConfig to package.json..."
    node -e "
      const pkg = require('./package.json');
      pkg.publishConfig = { registry: '${REGISTRY}', access: 'public' };
      require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    temp_pkg_modified=true
  else
    # Update existing publishConfig
    node -e "
      const pkg = require('./package.json');
      pkg.publishConfig = pkg.publishConfig || {};
      pkg.publishConfig.registry = '${REGISTRY}';
      pkg.publishConfig.access = 'public';
      require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    temp_pkg_modified=true
  fi

  # Publish with bun (handles publishConfig better than npm)
  local publish_output
  if publish_output=$(bun publish --no-git-checks 2>&1); then
    echo -e "   ${GREEN}✅ Published successfully${NC}"
    ((PUBLISHED++))
  else
    # Check for common errors
    if echo "$publish_output" | grep -q "409\|already exists\|already published"; then
      echo -e "   ${YELLOW}⚠️  Already published (version conflict)${NC}"
      ((SKIPPED++))
    elif echo "$publish_output" | grep -q "401\|403\|unauthorized"; then
      echo -e "   ${RED}❌ Authentication failed${NC}"
      echo -e "   💡 Check Verdaccio configuration"
      ((FAILED++))
    else
      echo -e "   ${RED}❌ Publish failed${NC}"
      echo -e "   📄 Error: $publish_output"
      ((FAILED++))
    fi
  fi

  # Restore package.json if we modified it
  if [[ "$temp_pkg_modified" == "true" ]] && [[ -f "package.json.backup" ]]; then
    mv package.json.backup package.json
  fi

  cd - > /dev/null
}

# Process packages in dependency order
process_packages() {
  local base_dir="$1"
  local category="$2"
  
  if [[ ! -d "$base_dir" ]]; then
    echo -e "${YELLOW}⚠️  Directory not found: $base_dir${NC}"
    return 0
  fi

  echo -e "\n${GREEN}=== $category Packages ===${NC}"
  
  # Find all package directories and sort them for consistent processing
  local package_dirs=()
  while IFS= read -r -d '' package_dir; do
    if [[ -f "${package_dir}/package.json" ]]; then
      local pkg_name
      pkg_name=$(get_package_name "$package_dir")
      if [[ -n "$pkg_name" ]] && [[ "$pkg_name" =~ ^@beauty-crm/ ]]; then
        package_dirs+=("$package_dir")
      fi
    fi
  done < <(find "$base_dir" -maxdepth 1 -mindepth 1 -type d -print0)

  # Sort packages for consistent processing
  IFS=$'\n' package_dirs=($(sort <<<"${package_dirs[*]}"))

  local processed=0
  for package_dir in "${package_dirs[@]}"; do
    publish_package "$package_dir"
    ((processed++))
  done

  echo -e "${BLUE}📊 Processed $processed packages in $category${NC}"
}

# Main execution
main() {
  echo -e "${GREEN}🚀 Beauty CRM Package Republisher${NC}"
  echo -e "${GREEN}=================================${NC}"
  
  check_verdaccio
  
  cd "$ROOT_DIR"
  
  # Process packages in dependency order (platform first, then product)
  if [[ "$PRODUCT_ONLY" != "true" ]]; then
    process_packages "shared-platform-engineering" "Platform"
  fi
  
  if [[ "$PLATFORM_ONLY" != "true" ]]; then
    process_packages "shared-product-engineering" "Product"  
  fi

  # Final summary
  echo -e "\n${GREEN}=================================${NC}"
  echo -e "${GREEN}📊 FINAL SUMMARY${NC}"
  echo -e "${GREEN}=================================${NC}"
  echo -e "✅ Published: ${GREEN}$PUBLISHED${NC}"
  echo -e "⚠️  Skipped: ${YELLOW}$SKIPPED${NC}"
  echo -e "❌ Failed: ${RED}$FAILED${NC}"
  echo -e "📦 Total processed: $((PUBLISHED + SKIPPED + FAILED))"
  
  if [[ $FAILED -gt 0 ]]; then
    echo -e "\n${RED}⚠️  Some packages failed to publish. Check the output above for details.${NC}"
    echo -e "${YELLOW}💡 You can run with --force to attempt republishing all packages${NC}"
    exit 1
  else
    echo -e "\n${GREEN}🎉 All packages processed successfully!${NC}"
    echo -e "🌐 Access Verdaccio UI at: ${VERDACCIO_URL}"
    echo -e "📚 Packages are now available for installation with:"
    echo -e "   ${BLUE}bun install --registry ${REGISTRY}${NC}"
  fi
}

# Run main function
main "$@"