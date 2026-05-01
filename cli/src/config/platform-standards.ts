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

const PLATFORM_VERSION = "1.0.0";

const TECH_STACK = {
  runtime: "bun",
  bundler: "vite",
  language: "typescript",
  framework: "hono",
  database: "postgresql",
  orm: "prisma",
  messaging: "nats",
  linting: "biome",
  testing: "vitest",
} as const;

const PORTS = {
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
  tiltUi: 10350,
  traefik: 8080,
} as const;

const HEALTH_CHECKS = {
  path: "/health",
  live: "/health/live",
  ready: "/health/ready",
  timeout: 30,
  interval: 5,
} as const;

const NAMING = {
  frontend: "-frontend",
  backend: "-backend",
  worker: "-worker",
  migrator: "-migrator",
  library: "-lib",
  sdk: "-sdk",
  validSeparators: ["-", "_"],
  maxLength: 63,
  minLength: 3,
} as const;

const TRAEFIK = {
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

const FILEWATCH_IGNORES = [
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

const RESOURCE_TYPES = {
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

const FEATURES = {
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

const PATHS = {
  services: "services/product",
  sharedPlatform: "shared-platform-engineering",
  sharedProduct: "shared-product-engineering",
  sharedDdd: "shared-ddd-layers",
} as const;

const DISCOVERY = {
  scanIntervalSeconds: 5,
  maxManifestsPerRoot: 50,
  servicePatterns: ["services/product/*", "services/platform/*"],
} as const;

const DOCKER = {
  dockerfile: "Dockerfile",
  context: ".",
  platform: "linux/amd64",
} as const;

const RUNTIME = {
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

// Type is used internally via typeof PLATFORM_STANDARDS
type PlatformStandards = typeof PLATFORM_STANDARDS;
