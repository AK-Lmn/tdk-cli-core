# Build Scripts

Build, publish, and package management scripts for the monorepo.

## Scripts

### Publishing
- `publish-all.py` / `publish-all-simple.sh` - Publish all packages
- `publish-missing.sh` - Publish only missing packages
- `publish-to-verdaccio.sh` - Publish to local Verdaccio registry
- `republish-all.sh` - Force republish all packages
- `republish-needed.sh` / `republish-needed.js` - Republish only changed packages
- `test-single-publish.sh` - Test publishing a single package

### Version Management
- `bun-version-bump.sh` - Bump versions across packages
- `upgrade-prisma-v7.py` - Upgrade Prisma to v7
- `update-all-monorepo-deps.sh` - Update all monorepo dependencies
- `update-all-workspace-packages.sh` - Update workspace packages
- `verify-prisma-versions.sh` - Verify Prisma version consistency

### Docker & Config
- `generate-workspace-dockerfiles.cjs` - Generate Dockerfiles for services
- `vite-config-inventory.ts` - Inventory of Vite configurations

## Usage

```bash
# Publish all packages
./scripts/build/publish-all.py

# Bump versions
./scripts/build/bun-version-bump.sh

# Republish only changed packages
./scripts/build/republish-needed.sh

# Update all dependencies
./scripts/build/update-all-monorepo-deps.sh
```
