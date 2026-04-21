#!/usr/bin/env node
/**
 * republish-needed.js - Smart selective package republishing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY = 'http://verdaccio.localhost:4873';
const ROOT_DIR = path.resolve(__dirname, '..');

// Colors
const C = {
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m', 
  yellow: '\x1b[33m'
};

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const PLATFORM_ONLY = args.includes('--platform-only');
const PRODUCT_ONLY = args.includes('--product-only');
const FORCE = args.includes('--force');

// Stats
let HEALTHY = 0;
let MISSING = 0;
let FIXED = 0;
let FAILED = 0;
let TOTAL = 0;
const NEED_REPUBLISH = [];

function log(msg, color = 'reset') {
  console.log(`${C[color]}${msg}${C.reset}`);
}

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (e) {
    // Return stderr/stdout even on error
    return e.stdout || e.stderr || '';
  }
}

function checkVerdaccio() {
  const result = exec(`curl -sf ${REGISTRY} > /dev/null 2>&1 && echo "OK"`);
  if (result) {
    log('✅ Verdaccio running', 'green');
    return true;
  }
  log('❌ Verdaccio not running', 'red');
  log('Start with: bun run verdaccio:start', 'yellow');
  return false;
}

function checkPackageHealth(pkgName) {
  const encoded = pkgName.replace('@', '%40').replace('/', '%2f');
  const result = exec(`curl -sf ${REGISTRY}/${encoded} > /dev/null 2>&1 && echo "OK"`);
  return !!result;
}

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pkgDir = path.join(dirPath, entry.name);
    const pkgJson = path.join(pkgDir, 'package.json');
    
    if (!fs.existsSync(pkgJson)) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
      
      if (!pkg.name || !pkg.name.startsWith('@beauty-crm/')) continue;

      TOTAL++;

      if (checkPackageHealth(pkg.name)) {
        HEALTHY++;
        if (VERBOSE) {
          log(`  ✅ ${pkg.name}@${pkg.version}`, 'green');
        }
      } else {
        MISSING++;
        NEED_REPUBLISH.push({ dir: pkgDir, json: pkgJson, name: pkg.name, version: pkg.version });
        log(`❌ ${pkg.name}@${pkg.version} MISSING`, 'red');
      }
    } catch (e) {
      // Skip packages with errors
    }
  }
}

function bumpVersion(pkgJson) {
  try {
    const content = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
    const parts = content.version.split('.');
    parts[2] = parseInt(parts[2]) + 1;
    content.version = parts.join('.');
    fs.writeFileSync(pkgJson, JSON.stringify(content, null, 2) + '\n');
    return content.version;
  } catch {
    return null;
  }
}

function publishPackage(pkg) {
  console.log('');
  log(`📦 Fixing: ${pkg.name}`, 'blue');

  // Check again if fixed
  if (!FORCE && checkPackageHealth(pkg.name)) {
    log('  ⏭️  Already exists', 'yellow');
    return 'skipped';
  }

  if (DRY_RUN) {
    log(`  🏃 Would publish ${pkg.name}@${pkg.version}`, 'cyan');
    return 'fixed';
  }

  // Handle private flag
  let wasPrivate = false;
  try {
    const content = JSON.parse(fs.readFileSync(pkg.json, 'utf8'));
    if (content.private) {
      wasPrivate = true;
      delete content.private;
      fs.writeFileSync(pkg.json, JSON.stringify(content, null, 2) + '\n');
      log('  🔓 Removed private flag', 'cyan');
    }
  } catch {}

  // Bump version if force
  if (FORCE) {
    const newVersion = bumpVersion(pkg.json);
    if (newVersion) {
      log(`  ⬆️  Bumped to ${newVersion}`, 'blue');
      pkg.version = newVersion;
    }
  }

  // Add publishConfig
  try {
    const content = JSON.parse(fs.readFileSync(pkg.json, 'utf8'));
    content.publishConfig = { access: 'public', registry: REGISTRY };
    fs.writeFileSync(pkg.json, JSON.stringify(content, null, 2) + '\n');
  } catch {}

  // Build
  let buildSuccess = true;
  try {
    const content = JSON.parse(fs.readFileSync(pkg.json, 'utf8'));
    if (content.scripts?.build) {
      log('  🔨 Building...', 'blue');
      exec('bun run build', { cwd: pkg.dir, timeout: 60000 });
      
      // Check if dist was created
      const distPath = path.join(pkg.dir, 'dist');
      if (!fs.existsSync(distPath)) {
        log('  ⚠️  No dist folder after build', 'yellow');
        buildSuccess = false;
      }
    }
  } catch (e) {
    log('  ⚠️  Build warning (continuing anyway)', 'yellow');
  }

  // Publish
  log('  🚀 Publishing...', 'blue');
  const publishResult = exec('bun publish --no-git-checks 2>&1', { cwd: pkg.dir, timeout: 30000 });
  
  if (publishResult) {
    if (publishResult.includes('409') || publishResult.includes('already exists')) {
      log('  ⚠️  Already exists (409)', 'yellow');
      return 'skipped';
    }
    log('  ✅ Published successfully', 'green');
    return 'fixed';
  } else {
    log('  ❌ Publish failed', 'red');
    return 'failed';
  }
}

function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Beauty CRM - Smart Package Republisher               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  if (DRY_RUN) {
    log('🏃 DRY RUN MODE', 'cyan');
  }

  if (!checkVerdaccio()) {
    process.exit(1);
  }
  console.log('');

  log('📦 Scanning packages...', 'blue');
  console.log('');

  // Scan directories
  if (!PRODUCT_ONLY) {
    scanDirectory(path.join(ROOT_DIR, 'shared-platform-engineering'));
    scanDirectory(path.join(ROOT_DIR, 'shared-ddd-layers'));
  }
  if (!PLATFORM_ONLY) {
    scanDirectory(path.join(ROOT_DIR, 'shared-product-engineering'));
  }

  // Fix missing packages
  if (!DRY_RUN && NEED_REPUBLISH.length > 0) {
    console.log('');
    log(`🔧 Fixing ${NEED_REPUBLISH.length} packages...`, 'blue');
    
    for (const pkg of NEED_REPUBLISH) {
      const result = publishPackage(pkg);
      if (result === 'fixed') FIXED++;
      else if (result === 'failed') FAILED++;
    }
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     REPUBLISH NEEDED - RESULTS                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📊 Health Check:`);
  log(`  ✅ Healthy: ${HEALTHY} packages (no action needed)`, 'green');
  log(`  ❌ Missing: ${MISSING} packages needed fixing`, 'red');
  console.log(`  📦 Total: ${TOTAL} packages scanned`);
  console.log('');

  if (NEED_REPUBLISH.length > 0) {
    log(`🔧 Fix Results:`, 'blue');
    log(`  ✅ Fixed: ${FIXED}`, 'green');
    log(`  ❌ Failed: ${FAILED}`, 'red');
    console.log('');
  }

  if (DRY_RUN) {
    log('🏃 DRY RUN - no changes made', 'cyan');
    console.log('');
  }

  if (MISSING > 0 && DRY_RUN) {
    log(`⚠️  ${MISSING} packages need republishing`, 'yellow');
    console.log('   Run without --dry-run to fix:');
    console.log('   ./scripts/republish-needed.sh');
  } else if (MISSING === 0 || (!DRY_RUN && FIXED === MISSING)) {
    log('🎉 All packages are healthy! No action needed.', 'green');
  }

  console.log('');
}

main();
