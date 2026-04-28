/**
 * Platform Standards for TDK CLI
 *
 * These are hardcoded platform-wide standards that all projects
 * must follow. They are NOT configurable per-project.
 *
 * To change platform standards, update this file and release a new CLI version.
 * All projects will regenerate their config files with the new standards.
 *
 * For project-specific configuration, see .tdk/project.yaml
 */

export const PLATFORM_VERSION = "1.0.0";

/**
 * Core technology stack - enforced across all services
 */
export const TECH_STACK = {
  /** Runtime: Bun (not Node.js) */
  runtime: "bun",

  /** Bundler: Vite (strict requirement) */
  bundler: "vite",

  /** Language: TypeScript */
  language: "typescript",

  /** Web framework: Hono */
  framework: "hono",

  /** Database: PostgreSQL */
  database: "postgresql",

  /** ORM: Prisma v7 */
  orm: "prisma",

  /** Messaging: NATS JetStream */
  messaging: "nats",

  /** Linting/Formatting: Biome */
  linting: "biome",

  /** Testing: Vitest */
  testing: "vitest",
} as const;

/**
 * Port allocation strategy - standard across all projects
 */
export const PORTS = {
  frontend: {
    base: 3000,
    range: "3000-3999" as const,
    start: 3000,
    end: 3999,
  },
  backend: {
    base: 4000,
    range: "4000-4999" as const,
    start: 4000,
    end: 4999,
  },
  health: {
    base: 5000,
    range: "5000-5999" as const,
    start: 5000,
    end: 5999,
  },
  worker: {
    base: 6000,
    range: "6000-6999" as const,
    start: 6000,
    end: 6999,
  },
  migrator: {
    base: 7000,
    range: "7000-7999" as const,
    start: 7000,
    end: 7999,
  },
  /** Tilt UI port */
  tiltUi: 10350,
  /** Traefik dashboard port */
  traefik: 8080,
} as const;

/**
 * Health check endpoints - standard across all services
 */
export const HEALTH_CHECKS = {
  /** Main health endpoint */
  path: "/health",
  /** Liveness probe */
  live: "/health/live",
  /** Readiness probe */
  ready: "/health/ready",
  /** Timeout in seconds */
  timeout: 30,
  /** Interval in seconds */
  interval: 5,
} as const;

/**
 * Service naming patterns - enforced across all services
 */
export const NAMING = {
  /** Frontend service suffix */
  frontend: "-frontend",
  /** Backend service suffix */
  backend: "-backend",
  /** Worker service suffix */
  worker: "-worker",
  /** Migrator service suffix */
  migrator: "-migrator",
  /** Library suffix */
  library: "-lib",
  /** SDK suffix */
  sdk: "-sdk",
  /** Valid name separators */
  validSeparators: ["-", "_"],
  /** Max service name length */
  maxLength: 63,
  /** Min service name length */
  minLength: 3,
} as const;

/**
 * Traefik configuration - standard for all projects
 */
export const TRAEFIK = {
  entrypoint: "web",
  network: "traefik-public",
  defaultHost: "localhost",
  defaultPort: 80,
  tlsEnabled: false,
  entrypoints: ["web"],
  middlewares: [],
  tls: { enabled: false },
  healthcheckPath: "/health",
  healthcheckInterval: "10s",
  healthcheckTimeout: "5s",
  frontendPriorityBase: 100,
} as const;

/**
 * File watch ignore patterns - prevents fsnotify buffer overflow
 */
export const FILEWATCH_IGNORES = [
  "node_modules",
  "dist",
  "build",
  ".git",
  ".prisma",
  ".turbo",
  "coverage",
  "tmp",
  "temp",
  "__tests__",
  "test",
  "tests",
] as const;

/**
 * Service type definitions - maps types to their configuration
 */
export const RESOURCE_TYPES = {
  frontend: {
    suffix: "-frontend",
    portRange: "3000-3999",
  },
  backend: {
    suffix: "-backend",
    portRange: "4000-4999",
  },
  library: {
    suffix: "-library",
    portRange: null,
  },
  sdk: {
    suffix: "-sdk",
    portRange: "3000-9999",
  },
  migrator: {
    suffix: "-migrator",
    portRange: "7000-7999",
  },
  worker: {
    suffix: "-worker",
    portRange: "6000-6999",
  },
} as const;

/**
 * Platform features - available to all projects
 */
export const FEATURES = {
  prisma: "Database ORM with migrations",
  nats: "Event streaming via NATS",
  redis: "Caching layer",
  infisical: "Secrets management",
  vitest: "Testing framework",
  traefik: "HTTP routing",
  websocket: "Real-time connections",
  graphql: "GraphQL support",
  grpc: "gRPC support",
  viteNode: "Vite Node runtime",
  maintenance: "Maintenance mode",
} as const;

/**
 * Project paths - standard directory structure
 */
export const PATHS = {
  services: "services/product",
  sharedPlatform: "shared-platform-engineering",
  sharedProduct: "shared-product-engineering",
  sharedDdd: "shared-ddd-layers",
} as const;

/**
 * Discovery settings - how TDK finds services
 */
export const DISCOVERY = {
  /** Scan interval in seconds */
  scanIntervalSeconds: 5,
  /** Max manifests per root */
  maxManifestsPerRoot: 50,
  /** Service patterns to match */
  servicePatterns: ["services/product/*", "services/platform/*"],
} as const;

/**
 * Docker build configuration defaults
 */
export const DOCKER = {
  dockerfile: "Dockerfile",
  context: ".",
  platform: "linux/amd64",
} as const;

/**
 * Runtime command configuration
 */
export const RUNTIME = {
  backend: {
    command: "bun",
    args: ["run", "dev"],
    env: { NODE_ENV: "development" },
  },
  frontend: {
    command: "bun",
    args: ["run", "dev"],
    env: { NODE_ENV: "development" },
  },
} as const;

/**
 * Export all platform standards as a single object
 */
export const PLATFORM_STANDARDS = {
  version: PLATFORM_VERSION,
  tech: TECH_STACK,
  ports: PORTS,
  health: HEALTH_CHECKS,
  naming: NAMING,
  traefik: TRAEFIK,
  filewatchIgnores: FILEWATCH_IGNORES,
  serviceTypes: RESOURCE_TYPES,
  features: FEATURES,
  paths: PATHS,
  discovery: DISCOVERY,
  docker: DOCKER,
  runtime: RUNTIME,
} as const;

/** Type for platform standards */
export type PlatformStandards = typeof PLATFORM_STANDARDS;
