/**
 * Template Engine for Master Config Generation
 *
 * Combines Platform Standards + Project Config → generates 4 output files
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Handlebars from "handlebars";
import { PLATFORM_STANDARDS } from "../config/platform-standards.js";

export interface ProjectConfig {
  version: string;
  project: {
    name: string;
    version: string;
  };
  stacks: {
    pre_alpha: { name: string; description: string; services: string[] };
    alpha: { name: string; description: string; services: string[] };
    beta: { name: string; description: string; services: string[] };
    out_of_scope: { name: string; description: string; services: string[] };
  };
  optional_infra: {
    monitoring: boolean;
    elk: boolean;
    debezium: boolean;
    golden_image: boolean;
  };
  discovery: {
    paths: string[];
  };
  overrides?: Record<string, unknown>;
}

export interface GeneratorContext {
  version: string;
  timestamp: string;
  tech: typeof PLATFORM_STANDARDS.tech;
  ports: typeof PLATFORM_STANDARDS.ports;
  health: typeof PLATFORM_STANDARDS.health;
  naming: typeof PLATFORM_STANDARDS.naming;
  traefik: typeof PLATFORM_STANDARDS.traefik;
  filewatchIgnores: string[];
  serviceTypes: typeof PLATFORM_STANDARDS.serviceTypes;
  features: typeof PLATFORM_STANDARDS.features;
  paths: typeof PLATFORM_STANDARDS.paths;
  discovery: { scanIntervalSeconds: number; maxManifestsPerRoot: number; paths: string[] };
  docker: typeof PLATFORM_STANDARDS.docker;
  runtime: typeof PLATFORM_STANDARDS.runtime;
  // Project-specific
  project: ProjectConfig["project"];
  stacks: ProjectConfig["stacks"];
  optionalInfra: ProjectConfig["optional_infra"];
  validDomains: string[];
  serviceDescriptions: Record<string, string>;
  infraDescriptions: Record<string, string>;
}

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  identity: "Authentication & user management",
  mdblaster: "Documentation site",
  "database-management": "PostgreSQL database",
  proxy: "Traefik reverse proxy",
  verdaccio: "Private npm registry",
  infisical: "Secret management",
  appointment: "Appointment management",
  "appointment-planner": "Appointment planner UI",
  salon: "Salon management",
  gdpr: "GDPR compliance",
  accounting: "Accounting domain",
  website: "Website builder",
  payment: "Payment processing",
  reporting: "Reporting & analytics",
  billing: "Billing management",
  inventory: "Inventory tracking - future release",
  staff: "Staff scheduling - future release",
  treatment: "Treatment catalog - future release",
};

const INFRA_DESCRIPTIONS: Record<string, string> = {
  monitoring: "Signoz, SkyWalking (RAM intensive)",
  elk: "Elasticsearch/Logstash/Kibana",
  debezium: "CDC with Kafka/Zookeeper",
  golden_image: "Golden image rebuild (one-time)",
};

export class TemplateEngine {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    // Handle both ESM and CommonJS contexts
    const currentDir = import.meta.dirname || path.dirname(new URL(import.meta.url).pathname);
    this.templatesDir = templatesDir || path.join(currentDir, "..", "..", "templates");
  }

  /**
   * Build the generator context from platform standards + project config
   */
  buildContext(projectConfig: ProjectConfig): GeneratorContext {
    // Collect all valid domains (services from all stacks except out_of_scope)
    const validDomains = [
      ...projectConfig.stacks.pre_alpha.services,
      ...projectConfig.stacks.alpha.services,
      ...projectConfig.stacks.beta.services,
    ];

    return {
      version: PLATFORM_STANDARDS.version,
      timestamp: new Date().toISOString(),
      tech: PLATFORM_STANDARDS.tech,
      ports: PLATFORM_STANDARDS.ports,
      health: PLATFORM_STANDARDS.health,
      naming: PLATFORM_STANDARDS.naming,
      traefik: PLATFORM_STANDARDS.traefik,
      filewatchIgnores: [...PLATFORM_STANDARDS.filewatchIgnores],
      serviceTypes: PLATFORM_STANDARDS.serviceTypes,
      features: PLATFORM_STANDARDS.features,
      paths: PLATFORM_STANDARDS.paths,
      discovery: {
        scanIntervalSeconds: PLATFORM_STANDARDS.discovery.scanIntervalSeconds,
        maxManifestsPerRoot: PLATFORM_STANDARDS.discovery.maxManifestsPerRoot,
        paths: projectConfig.discovery.paths,
      },
      docker: PLATFORM_STANDARDS.docker,
      runtime: PLATFORM_STANDARDS.runtime,
      project: projectConfig.project,
      stacks: projectConfig.stacks,
      optionalInfra: projectConfig.optional_infra,
      validDomains,
      serviceDescriptions: SERVICE_DESCRIPTIONS,
      infraDescriptions: INFRA_DESCRIPTIONS,
    };
  }

  /**
   * Load and compile a Handlebars template
   */
  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    return Handlebars.compile(templateSource);
  }

  /**
   * Generate tilt.config.json
   */
  generateTiltConfig(context: GeneratorContext): string {
    const template = this.loadTemplate("tilt.config.json");
    return template(context);
  }

  /**
   * Generate TILT_TECH_STACK.star
   */
  generateTechStack(context: GeneratorContext): string {
    const template = this.loadTemplate("TILT_TECH_STACK.star");
    return template(context);
  }

  /**
   * Generate TILT_SERVICE_DEFAULTS.star
   */
  generateServiceDefaults(context: GeneratorContext): string {
    const template = this.loadTemplate("TILT_SERVICE_DEFAULTS.star");
    return template(context);
  }

  /**
   * Generate spec.master
   */
  generateSpecMaster(context: GeneratorContext): string {
    const template = this.loadTemplate("spec.master");
    return template(context);
  }

  /**
   * Generate all 4 files
   */
  generateAll(projectConfig: ProjectConfig): {
    "tilt.config.json": string;
    "TILT_TECH_STACK.star": string;
    "TILT_SERVICE_DEFAULTS.star": string;
    "spec.master": string;
  } {
    const context = this.buildContext(projectConfig);

    return {
      "tilt.config.json": this.generateTiltConfig(context),
      "TILT_TECH_STACK.star": this.generateTechStack(context),
      "TILT_SERVICE_DEFAULTS.star": this.generateServiceDefaults(context),
      "spec.master": this.generateSpecMaster(context),
    };
  }
}

/**
 * Read and parse project.json
 */
export function readProjectConfig(projectRoot: string): ProjectConfig {
  const projectJsonPath = path.join(projectRoot, ".tdk", "project.json");

  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(`Project config not found: ${projectJsonPath}. Run 'tdk project init' first.`);
  }

  const jsonContent = fs.readFileSync(projectJsonPath, "utf-8");
  return JSON.parse(jsonContent) as ProjectConfig;
}

/**
 * Generate master config files for a project
 */
export function generateMasterConfigs(projectRoot: string): void {
  const projectConfig = readProjectConfig(projectRoot);

  // Generate files
  const engine = new TemplateEngine();
  const files = engine.generateAll(projectConfig);

  // Write files
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(projectRoot, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✓ Generated: ${filename}`);
  }
}

/**
 * Verify that generated files match expected output
 */
export function verifyMasterConfigs(projectRoot: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const projectConfig = readProjectConfig(projectRoot);
    const engine = new TemplateEngine();
    const expectedFiles = engine.generateAll(projectConfig);

    for (const [filename, expectedContent] of Object.entries(expectedFiles)) {
      const filePath = path.join(projectRoot, filename);

      if (!fs.existsSync(filePath)) {
        errors.push(`Missing file: ${filename}`);
        continue;
      }

      const actualContent = fs.readFileSync(filePath, "utf-8");
      if (actualContent !== expectedContent) {
        errors.push(`Out of sync: ${filename} (run 'tdk config regenerate')`);
      }
    }
  } catch (error) {
    errors.push(`Verification error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { valid: errors.length === 0, errors };
}
