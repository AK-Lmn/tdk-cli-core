/**
 * tdk project command
 *
 * Initialize or validate project-level master configuration files.
 * Creates TILT_SERVICE_DEFAULTS.star and TILT_TECH_STACK.star if they don't exist.
 */

import { Command } from 'commander';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { findProjectRoot } from '../utils/services.js';

// Template for TILT_SERVICE_DEFAULTS.star
const PLATFORM_CONFIG_TEMPLATE = `# =============================================================================
# TILT_SERVICE_DEFAULTS.star - Platform Runtime Configuration
# =============================================================================
# WHO SHOULD READ THIS:
#   - Platform engineers changing global defaults
#   - Developers debugging "why is my service on port X?"
#   - Anyone adding new infrastructure services
#
# WHAT THIS CONTROLS:
#   - Port ranges (frontend: 3000-3999, backend: 4000-4999)
#   - Health check endpoints (/health/live, /health/ready)
#   - Memory limits per service type
#   - Docker base images and networking
#
# READ-ONLY FOR MOST DEVELOPERS: Your service inherits from these values via
# service.json. You don't import this file directly.
# =============================================================================

# =============================================================================
# 🔌 PORT CONFIGURATION
# =============================================================================
# Services get auto-assigned ports from these ranges based on type
# =============================================================================

BASE_PORT_FRONTEND = 3000   # Frontend apps: 3000-3999
BASE_PORT_BACKEND = 4000    # Backend services: 4000-4999

# =============================================================================
# 🏥 HEALTH CHECK CONFIGURATION
# =============================================================================
# All services expose these endpoints for Tilt/Traefik health checks
# =============================================================================

HEALTH_CHECK_PATH = "/health"
HEALTH_CHECK_PATH_LIVE = "/health/live"    # Liveness probe (process up)
HEALTH_CHECK_PATH_READY = "/health/ready"  # Readiness probe (deps ready)

# Default health check intervals (seconds)
HEALTH_CHECK_INTERVAL = 10
HEALTH_CHECK_TIMEOUT = 5
HEALTH_CHECK_RETRIES = 3

# =============================================================================
# 💾 MEMORY LIMITS (MB)
# =============================================================================
# Per-service-type memory limits. Adjust based on your infrastructure.
# =============================================================================

MEMORY_LIMITS = {
    "frontend": 512,
    "backend": 1024,
    "worker": 768,
    "infra": 256,
}

# =============================================================================
# 🐳 DOCKER CONFIGURATION
# =============================================================================

# Base images used for golden layer builds
DOCKER_BASE_IMAGES = {
    "bun": "oven/bun:1.2",
    "node": "node:20-alpine",
    "nginx": "nginx:alpine",
}

# Network prefix for Docker networks
NETWORK_PREFIX = "tdk"

# =============================================================================
# 📦 VERDACCIO (Private NPM Registry)
# =============================================================================

VERDACCIO_URL_LOCAL = "http://localhost:4873"
VERDACCIO_URL_DOCKER = "http://verdaccio:4873"
VERDACCIO_NPM_REGISTRY = "http://localhost:4873"

# =============================================================================
# 🗄️ DATABASE DEFAULTS
# =============================================================================

DB_CONFIG = {
    "host": "postgres",
    "port": 5432,
    "user": "postgres",
    "password": "postgres",
}

# =============================================================================
# 📚 LIBRARY PATHS
# =============================================================================
# Where shared libraries live (relative to project root)
# =============================================================================

LIBRARY_ROOTS = {
    "platform": "shared-platform-engineering",
    "product": "shared-product-engineering",
    "ddd": "shared-ddd-layers",
}

# Export for Tilt
exports = {
    "BASE_PORT_FRONTEND": BASE_PORT_FRONTEND,
    "BASE_PORT_BACKEND": BASE_PORT_BACKEND,
    "HEALTH_CHECK_PATH": HEALTH_CHECK_PATH,
    "HEALTH_CHECK_PATH_LIVE": HEALTH_CHECK_PATH_LIVE,
    "HEALTH_CHECK_PATH_READY": HEALTH_CHECK_PATH_READY,
    "HEALTH_CHECK_INTERVAL": HEALTH_CHECK_INTERVAL,
    "HEALTH_CHECK_TIMEOUT": HEALTH_CHECK_TIMEOUT,
    "HEALTH_CHECK_RETRIES": HEALTH_CHECK_RETRIES,
    "MEMORY_LIMITS": MEMORY_LIMITS,
    "DOCKER_BASE_IMAGES": DOCKER_BASE_IMAGES,
    "NETWORK_PREFIX": NETWORK_PREFIX,
    "VERDACCIO_URL_LOCAL": VERDACCIO_URL_LOCAL,
    "VERDACCIO_URL_DOCKER": VERDACCIO_URL_DOCKER,
    "VERDACCIO_NPM_REGISTRY": VERDACCIO_NPM_REGISTRY,
    "DB_CONFIG": DB_CONFIG,
    "LIBRARY_ROOTS": LIBRARY_ROOTS,
}
`;

// Template for TILT_TECH_STACK.star
const TECH_STACK_TEMPLATE = `# =============================================================================
# TILT_TECH_STACK.star - Technology Stack Configuration
# =============================================================================
# WHO SHOULD READ THIS:
#   - Platform engineers doing tech stack migrations
#   - Developers wondering "why Bun not Node?"
#
# WHAT THIS CONTROLS:
#   - Runtime (Bun vs Node)
#   - Bundler (Vite vs Webpack)
#   - ORM (Prisma vs alternatives)
#   - Testing framework (Vitest vs Jest)
#
# ⚠️  CHANGING THESE IS A BIG DEAL:
#   These are platform-wide decisions affecting 120+ services.
#   Coordinate with platform engineering before changing.
# =============================================================================

# =============================================================================
# 🏃 RUNTIME
# =============================================================================
# Bun is our runtime of choice - faster, all-in-one, simpler
# https://bun.sh
# =============================================================================

RUNTIME = "bun"
RUNTIME_VERSION = "1.2"

# =============================================================================
# 📦 BUNDLER
# =============================================================================
# Vite for all frontend and library builds
# https://vitejs.dev
# =============================================================================

BUNDLER = "vite"
BUNDLER_VERSION = "5"

# =============================================================================
# 🗄️ ORM / DATABASE
# =============================================================================
# Prisma for all database access
# https://prisma.io
# =============================================================================

ORM = "prisma"
ORM_VERSION = "7"

# =============================================================================
# 📨 MESSAGING
# =============================================================================
# NATS JetStream for async messaging
# https://nats.io
# =============================================================================

MESSAGING = "nats"
MESSAGING_VERSION = "2"
NATS_SERVER = "nats://nats:4222"

# =============================================================================
# 🧪 TESTING
# =============================================================================
# Vitest for all tests (unit, integration, e2e)
# https://vitest.dev
# =============================================================================

TESTING = "vitest"
TESTING_VERSION = "1"

# =============================================================================
# 🎨 LINTING / FORMATTING
# =============================================================================
# Biome for fast linting and formatting
# https://biomejs.dev
# =============================================================================

LINTING = "biome"
LINTING_VERSION = "1.5"

# =============================================================================
# 🌐 WEB FRAMEWORK
# =============================================================================
# Hono for backend APIs (lightweight, fast)
# https://hono.dev
# =============================================================================

WEB_FRAMEWORK = "hono"
WEB_FRAMEWORK_VERSION = "4"

# =============================================================================
# 🐳 CONTAINER ORCHESTRATION
# =============================================================================

CONTAINER_PLATFORM = "docker"
COMPOSE_VERSION = "3.8"

# =============================================================================
# 📋 TECH STACK ASSERTION
# =============================================================================
# Validates that loaded modules match the expected tech stack
# =============================================================================

def assert_tech_stack(loaded_stack):
    """
    Validates that the loaded tech stack matches platform standards.
    Called automatically by the Tiltfile to ensure consistency.
    """
    required = {
        "bundler": BUNDLER,
        "runtime": RUNTIME,
    }
    
    for key, expected in required.items():
        actual = loaded_stack.get(key)
        if actual != expected:
            fail("Tech stack mismatch: {} should be '{}' but got '{}'".format(
                key, expected, actual
            ))
    
    print("✅ Tech stack validated: {} / {} / {}".format(
        BUNDLER, RUNTIME, TESTING
    ))

# Export for Tilt
exports = {
    "RUNTIME": RUNTIME,
    "RUNTIME_VERSION": RUNTIME_VERSION,
    "BUNDLER": BUNDLER,
    "BUNDLER_VERSION": BUNDLER_VERSION,
    "ORM": ORM,
    "ORM_VERSION": ORM_VERSION,
    "MESSAGING": MESSAGING,
    "MESSAGING_VERSION": MESSAGING_VERSION,
    "NATS_SERVER": NATS_SERVER,
    "TESTING": TESTING,
    "TESTING_VERSION": TESTING_VERSION,
    "LINTING": LINTING,
    "LINTING_VERSION": LINTING_VERSION,
    "WEB_FRAMEWORK": WEB_FRAMEWORK,
    "WEB_FRAMEWORK_VERSION": WEB_FRAMEWORK_VERSION,
    "CONTAINER_PLATFORM": CONTAINER_PLATFORM,
    "COMPOSE_VERSION": COMPOSE_VERSION,
    "assert_tech_stack": assert_tech_stack,
    "TECH_STACK": exports,  # Self-reference for convenience
}
`;

export const projectCommand = new Command('project')
  .description('Initialize or validate project-level master configuration')
  .option('--check', 'Check if master configs exist (exit code 0 if yes, 1 if no)', false)
  .option('--force', 'Overwrite existing master configs (dangerous)', false)
  .action(async (options) => {
    try {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error(chalk.red('Error: Could not find project root (no Tiltfile found).'));
        console.error(chalk.gray('Run this from within a project that has a Tiltfile.'));
        process.exit(1);
      }

      const defaultsPath = resolve(projectRoot, 'TILT_SERVICE_DEFAULTS.star');
      const techStackPath = resolve(projectRoot, 'TILT_TECH_STACK.star');

      // Check mode - just verify files exist
      if (options.check) {
        const defaultsExists = existsSync(defaultsPath);
        const techStackExists = existsSync(techStackPath);

        if (defaultsExists && techStackExists) {
          console.log(chalk.green('✅ Master configuration files exist:'));
          console.log(chalk.gray(`   - ${defaultsPath}`));
          console.log(chalk.gray(`   - ${techStackPath}`));
          process.exit(0);
        } else {
          console.log(chalk.yellow('⚠️  Master configuration files missing:'));
          if (!defaultsExists) console.log(chalk.gray(`   - TILT_SERVICE_DEFAULTS.star (not found)`));
          if (!techStackExists) console.log(chalk.gray(`   - TILT_TECH_STACK.star (not found)`));
          console.log(chalk.gray('\nRun `tdk project` to create them.'));
          process.exit(1);
        }
      }

      // Normal mode - create/update files
      console.log(chalk.blue('TDK Project Configuration\n'));
      console.log(chalk.gray(`Project root: ${projectRoot}\n`));

      const defaultsExists = existsSync(defaultsPath);
      const techStackExists = existsSync(techStackPath);

      // Show current status
      if (defaultsExists) {
        console.log(chalk.green('✓ TILT_SERVICE_DEFAULTS.star exists'));
      } else {
        console.log(chalk.yellow('✗ TILT_SERVICE_DEFAULTS.star missing'));
      }

      if (techStackExists) {
        console.log(chalk.green('✓ TILT_TECH_STACK.star exists'));
      } else {
        console.log(chalk.yellow('✗ TILT_TECH_STACK.star missing'));
      }

      // If both exist and no --force, we're done
      if (defaultsExists && techStackExists && !options.force) {
        console.log(chalk.green('\n✅ Project is already configured!'));
        console.log(chalk.gray('\nThese files control platform-wide settings:'));
        console.log(chalk.gray('  - TILT_SERVICE_DEFAULTS.star: ports, health checks, memory limits'));
        console.log(chalk.gray('  - TILT_TECH_STACK.star: Bun, Vite, Prisma, NATS stack'));
        console.log(chalk.gray('\nEach service you create will inherit from these via service.json'));
        return;
      }

      // Warn if overwriting
      if ((defaultsExists || techStackExists) && options.force) {
        console.log(chalk.red('\n⚠️  WARNING: --force will overwrite existing configuration!'));
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'This will reset your master configs to defaults. Continue?',
          default: false
        }]);
        if (!confirm) {
          console.log(chalk.yellow('Cancelled.'));
          return;
        }
      }

      // Create missing files
      console.log(chalk.blue('\n📋 Creating master configuration files...\n'));

      if (!defaultsExists || options.force) {
        writeFileSync(defaultsPath, PLATFORM_CONFIG_TEMPLATE, 'utf-8');
        console.log(chalk.green(`✓ Created: TILT_SERVICE_DEFAULTS.star`));
        console.log(chalk.gray(`  → Platform runtime config (ports, health checks, memory)`));
      }

      if (!techStackExists || options.force) {
        writeFileSync(techStackPath, TECH_STACK_TEMPLATE, 'utf-8');
        console.log(chalk.green(`✓ Created: TILT_TECH_STACK.star`));
        console.log(chalk.gray(`  → Tech stack lock (Bun, Vite, Prisma, NATS)`));
      }

      console.log(chalk.green('\n✅ Project configuration complete!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Review and customize the generated files'));
      console.log(chalk.gray('  2. Run `tdk init` to create individual services'));
      console.log(chalk.gray('  3. Run `tdk up` to start development'));

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });
