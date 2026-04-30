/**
 * Template Engine for Master Config Generation
 *
 * Combines Platform Standards + Project Config → generates 4 output files
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Handlebars from "handlebars";
import { PLATFORM_STANDARDS } from "../config/platform-standards.js";

interface ProjectConfig {
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

interface GeneratorContext {
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
  project: ProjectConfig["project"];
  stacks: ProjectConfig["stacks"];
  optionalInfra: ProjectConfig["optional_infra"];
  allServices: string[];
  serviceDescriptions: Record<string, string>;
  infraDescriptions: Record<string, string>;
}

const RESOURCE_DESCRIPTIONS: Record<string, string> = {
  identity: "Authentication & user management",
  mdblaster: "Documentation site",
  "database-management": "PostgreSQL database",
  proxy: "Traefik reverse proxy",
  verdaccio: "Private npm registry",
  infisical: "Secret management",
  order: "Order management",
  "order-planner": "Order planner UI",
  user: "User management",
  gdpr: "GDPR compliance",
  accounting: "Accounting system",
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
    const currentDir = import.meta.dirname || path.dirname(new URL(import.meta.url).pathname);
    this.templatesDir = templatesDir || path.join(currentDir, "..", "..", "templates");
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers for Starlark-compatible output
   */
  private registerHelpers(): void {
    // Helper to format values for Starlark (arrays, objects, primitives)
    Handlebars.registerHelper("starlark", function(value: unknown): Handlebars.SafeString {
      const formatValue = (val: unknown): string => {
        if (val === null || val === undefined) {
          return "None";
        }
        if (typeof val === "string") {
          return `"${val.replace(/"/g, '\\"')}"`;
        }
        if (typeof val === "boolean") {
          return val ? "True" : "False";
        }
        if (typeof val === "number") {
          return String(val);
        }
        if (Array.isArray(val)) {
          const items = val.map((item) => formatValue(item));
          return `[${items.join(", ")}]`;
        }
        if (typeof val === "object") {
          const entries = Object.entries(val as Record<string, unknown>).map(([key, v]) => {
            return `"${key}": ${formatValue(v)}`;
          });
          return `{${entries.join(", ")}}`;
        }
        return String(val);
      };
      return new Handlebars.SafeString(formatValue(value));
    });

    // Helper to format arrays as Starlark lists
    Handlebars.registerHelper("starlarkArray", function(value: unknown[]): Handlebars.SafeString {
      if (!Array.isArray(value)) return new Handlebars.SafeString("[]");
      const starlarkHelper = Handlebars.helpers.starlark as (v: unknown) => Handlebars.SafeString;
      const items = value.map((item) => starlarkHelper(item).toString());
      return new Handlebars.SafeString(`[${items.join(", ")}]`);
    });

    // Helper for JSON-compatible output (for JSON files)
    Handlebars.registerHelper("json", function(value: unknown): string {
      return JSON.stringify(value);
    });
  }

  /**
   * Build the generator context from platform standards + project config
   */
  buildContext(projectConfig: ProjectConfig): GeneratorContext {
    // Collect all services from all stacks
    const allServices = [
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
      allServices,
      serviceDescriptions: RESOURCE_DESCRIPTIONS,
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
   * Generate TILT_RESOURCE_DEFAULTS.star
   */
  generateServiceDefaults(context: GeneratorContext): string {
    const template = this.loadTemplate("TILT_RESOURCE_DEFAULTS.star");
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
   * Generate Tiltfile (project root entrypoint)
   */
  generateTiltfile(context: GeneratorContext): string {
    const template = this.loadTemplate("Tiltfile");
    return template(context);
  }

  /**
   * Generate all 5 files (4 in .tdk/.tdk-out/ + Tiltfile in root)
   */
  generateAll(projectConfig: ProjectConfig): {
    "tilt.config.json": string;
    "TILT_TECH_STACK.star": string;
    "TILT_RESOURCE_DEFAULTS.star": string;
    "spec.master": string;
    "Tiltfile": string;
  } {
    const context = this.buildContext(projectConfig);

    return {
      "tilt.config.json": this.generateTiltConfig(context),
      "TILT_TECH_STACK.star": this.generateTechStack(context),
      "TILT_RESOURCE_DEFAULTS.star": this.generateServiceDefaults(context),
      "spec.master": this.generateSpecMaster(context),
      "Tiltfile": this.generateTiltfile(context),
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

  const outputDir = path.join(projectRoot, ".tdk", ".tdk-out");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const engine = new TemplateEngine();
  const files = engine.generateAll(projectConfig);

  const allGeneratedFiles = [
    "tilt.config.json",
    "TILT_TECH_STACK.star",
    "TILT_RESOURCE_DEFAULTS.star",
    "spec.master",
    "Tiltfile",
  ];

  for (const filename of allGeneratedFiles) {
    const content = files[filename as keyof typeof files];
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✓ Generated: .tdk/.tdk-out/${filename}`);
  }

  console.log("");
  console.log("💡 To start Tilt: tdk up");
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

    const outputDir = path.join(projectRoot, ".tdk", ".tdk-out");
    const allGeneratedFiles = [
      "tilt.config.json",
      "TILT_TECH_STACK.star",
      "TILT_RESOURCE_DEFAULTS.star",
      "spec.master",
      "Tiltfile",
    ];

    for (const filename of allGeneratedFiles) {
      const expectedContent = expectedFiles[filename as keyof typeof expectedFiles];
      const filePath = path.join(outputDir, filename);

      if (!fs.existsSync(filePath)) {
        errors.push(`Missing file: .tdk/.tdk-out/${filename}`);
        continue;
      }

      const actualContent = fs.readFileSync(filePath, "utf-8");
      if (actualContent !== expectedContent) {
        errors.push(`Out of sync: .tdk/.tdk-out/${filename} (run 'tdk config regenerate')`);
      }
    }

    const oldTiltfilePath = path.join(projectRoot, "Tiltfile");
    if (fs.existsSync(oldTiltfilePath)) {
      errors.push(`Deprecated: Tiltfile in project root (should be in .tdk/.tdk-out/, run 'tdk config regenerate')`);
    }
  } catch (error) {
    errors.push(`Verification error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { valid: errors.length === 0, errors };
}
