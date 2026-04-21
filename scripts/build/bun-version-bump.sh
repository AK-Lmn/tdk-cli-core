#!/bin/bash

set -euo pipefail

# Reliable version bumping script for Bun monorepos
# Usage: ./bun-version-bump.sh [package-path] [patch|minor|major]

PACKAGE_PATH="${1:-shared-product-engineering/product-constants}"
BUMP_TYPE="${2:-patch}"
ROOT_DIR="/private/var/www/2025/ollamar1/beauty-crm"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🥞 Bun Version Bump Tool${NC}"
echo "Package: $PACKAGE_PATH"
echo "Bump type: $BUMP_TYPE"
echo ""

cd "$ROOT_DIR/$PACKAGE_PATH"

# Validate package.json exists
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ package.json not found in $PACKAGE_PATH${NC}"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
if [[ -z "$CURRENT_VERSION" ]]; then
    echo -e "${RED}❌ Could not read version from package.json${NC}"
    exit 1
fi

echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Calculate new version
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"

case $BUMP_TYPE in
    "patch")
        new_patch=$((patch + 1))
        NEW_VERSION="$major.$minor.$new_patch"
        ;;
    "minor")
        new_minor=$((minor + 1))
        NEW_VERSION="$major.$new_minor.0"
        ;;
    "major")
        new_major=$((major + 1))
        NEW_VERSION="$new_major.0.0"
        ;;
    *)
        echo -e "${RED}❌ Invalid bump type: $BUMP_TYPE. Use: patch, minor, or major${NC}"
        exit 1
        ;;
esac

echo -e "New version: ${GREEN}$NEW_VERSION${NC}"

# Create backup
cp package.json package.json.backup
echo -e "${BLUE}📄 Created backup: package.json.backup${NC}"

# Update version using Node.js (most reliable method)
node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('✅ Updated package.json version to $NEW_VERSION');
" || {
    echo -e "${RED}❌ Failed to update package.json${NC}"
    mv package.json.backup package.json
    exit 1
}

# Verify the update
VERIFIED_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
if [[ "$VERIFIED_VERSION" == "$NEW_VERSION" ]]; then
    echo -e "${GREEN}✅ Version successfully updated to $NEW_VERSION${NC}"
    rm package.json.backup
else
    echo -e "${RED}❌ Version verification failed${NC}"
    mv package.json.backup package.json
    exit 1
fi

# Optional: Run build if build script exists
if grep -q '"build"' package.json; then
    echo -e "${BLUE}🔨 Running build...${NC}"
    if bun run build > /tmp/build.log 2>&1; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Build failed (see /tmp/build.log)${NC}"
        echo "Build failures don't affect version bumping"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Version bump complete!${NC}"
echo "Package: $(node -p "require('./package.json').name")"
echo "Version: $CURRENT_VERSION → $NEW_VERSION"

# Show next steps
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Review the changes: git diff package.json"
echo "2. Commit: git add package.json && git commit -m 'bump: $PACKAGE_PATH to $NEW_VERSION'"
echo "3. Publish: bun publish --registry http://verdaccio.localhost:4873"