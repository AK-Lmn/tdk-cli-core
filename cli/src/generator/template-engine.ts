/**
 * Template Engine for Master Config Generation
 *
 * Combines Platform Standards + Project Config → generates 4 output files
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Handlebars from "handlebars";
import { PLATFORM_STANDARDS } from "../config/platform-standards.js";
import type {
  ProjectConfig,
  JsonValue,
  ProjectStackDefinition,
  ProjectOptionalInfra,
  ProjectDiscovery,
} from "../types/index.js";

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
  paths: typeof PLATFORM_STANDARDS.paths;
  discovery: { scanIntervalSeconds: number; maxManifestsPerRoot: number; paths: string[] };
  docker: typeof PLATFORM_STANDARDS.docker;
  runtime: typeof PLATFORM_STANDARDS.runtime;
  project: ProjectConfig["project"];
  stacks: ProjectConfig["stacks"];
  optionalInfra: ProjectConfig["optional_infra"];
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

  private registerHelpers(): void {
    Handlebars.registerHelper("starlark", function(value: JsonValue): Handlebars.SafeString {
      const formatValue = (val: JsonValue): string => {
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
          const entries = Object.entries(val).map(([key, v]) => {
            return `"${key}": ${formatValue(v)}`;
          });
          return `{${entries.join(", ")}}`;
        }
        return String(val);
      };
      return new Handlebars.SafeString(formatValue(value));
    });

    Handlebars.registerHelper("starlarkArray", function(value: JsonValue[]): Handlebars.SafeString {
      if (!Array.isArray(value)) return new Handlebars.SafeString("[]");
      const starlarkHelper = Handlebars.helpers.starlark as (v: JsonValue) => Handlebars.SafeString;
      const items = value.map((item) => starlarkHelper(item).toString());
      return new Handlebars.SafeString(`[${items.join(", ")}]`);
    });

    Handlebars.registerHelper("json", function(value: JsonValue): string {
      return JSON.stringify(value);
    });
  }

  buildContext(projectConfig: ProjectConfig): GeneratorContext {
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
      serviceDescriptions: RESOURCE_DESCRIPTIONS,
      infraDescriptions: INFRA_DESCRIPTIONS,
    };
  }

  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    return Handlebars.compile(templateSource);
  }

  generateTechStack(context: GeneratorContext): string {
    const template = this.loadTemplate("TILT_TECH_STACK.star");
    return template(context);
  }

  generateServiceDefaults(context: GeneratorContext): string {
    const template = this.loadTemplate("TILT_RESOURCE_DEFAULTS.star");
    return template(context);
  }

  generateSpecMaster(context: GeneratorContext): string {
    const template = this.loadTemplate("spec.master");
    return template(context);
  }

  generateTiltfile(context: GeneratorContext): string {
    const template = this.loadTemplate("Tiltfile");
    return template(context);
  }

  generateTiltIgnore(context: GeneratorContext): string {
    const template = this.loadTemplate(".tiltignore");
    return template(context);
  }

  generateAll(projectConfig: ProjectConfig): {
    "TILT_TECH_STACK.star": string;
    "TILT_RESOURCE_DEFAULTS.star": string;
    "spec.master": string;
    "Tiltfile": string;
    ".tiltignore": string;
  } {
    const context = this.buildContext(projectConfig);

    return {
      "TILT_TECH_STACK.star": this.generateTechStack(context),
      "TILT_RESOURCE_DEFAULTS.star": this.generateServiceDefaults(context),
      "spec.master": this.generateSpecMaster(context),
      "Tiltfile": this.generateTiltfile(context),
      ".tiltignore": this.generateTiltIgnore(context),
    };
  }
}

/** List of all files generated by the template engine */
const ALL_GENERATED_FILES = [
  "TILT_TECH_STACK.star",
  "TILT_RESOURCE_DEFAULTS.star",
  "spec.master",
  "Tiltfile",
  ".tiltignore",
] as const;

/**
 * Type guard to validate if a value is a valid ProjectConfig
 */
function isProjectConfig(value: unknown): value is ProjectConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as Record<string, unknown>;

  if (typeof config.version !== "string") {
    return false;
  }

  if (!config.project || typeof config.project !== "object") {
    return false;
  }
  const project = config.project as Record<string, unknown>;
  if (typeof project.name !== "string" || typeof project.version !== "string") {
    return false;
  }

  if (!config.stacks || typeof config.stacks !== "object") {
    return false;
  }
  const stacks = config.stacks as Record<string, unknown>;
  if (typeof stacks.pre_alpha !== "object" ||
      typeof stacks.alpha !== "object" ||
      typeof stacks.beta !== "object" ||
      typeof stacks.out_of_scope !== "object") {
    return false;
  }

  if (!config.optional_infra || typeof config.optional_infra !== "object") {
    return false;
  }
  const optionalInfra = config.optional_infra as Record<string, unknown>;
  if (typeof optionalInfra.monitoring !== "boolean" ||
      typeof optionalInfra.elk !== "boolean" ||
      typeof optionalInfra.debezium !== "boolean" ||
      typeof optionalInfra.golden_image !== "boolean") {
    return false;
  }

  if (!config.discovery || typeof config.discovery !== "object") {
    return false;
  }
  const discovery = config.discovery as Record<string, unknown>;
  if (!Array.isArray(discovery.paths)) {
    return false;
  }

  return true;
}

export function readProjectConfig(projectRoot: string): ProjectConfig {
  const projectJsonPath = path.join(projectRoot, ".tdk", "project.json");

  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(`Project config not found: ${projectJsonPath}. Run 'tdk project init' first.`);
  }

  const jsonContent = fs.readFileSync(projectJsonPath, "utf-8");
  const parsed: unknown = JSON.parse(jsonContent);

  if (!isProjectConfig(parsed)) {
    throw new Error(
      "Invalid project.json: missing or invalid required fields. " +
      "Expected: version (string), project (object with name/version), " +
      "stacks (object with pre_alpha/alpha/beta/out_of_scope), " +
      "optional_infra (object with boolean flags), " +
      "discovery (object with paths array)"
    );
  }

  return parsed;
}

export function generateMasterConfigs(projectRoot: string): void {
  const projectConfig = readProjectConfig(projectRoot);

  const outputDir = path.join(projectRoot, ".tdk", ".tdk-out");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const engine = new TemplateEngine();
  const files = engine.generateAll(projectConfig);

  for (const filename of ALL_GENERATED_FILES) {
    const content = files[filename as keyof typeof files];
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✓ Generated: .tdk/.tdk-out/${filename}`);
  }

  // Copy .tiltignore to project root so Tilt uses it
  const tiltignoreSource = path.join(outputDir, ".tiltignore");
  const tiltignoreTarget = path.join(projectRoot, ".tiltignore");
  if (fs.existsSync(tiltignoreSource)) {
    fs.copyFileSync(tiltignoreSource, tiltignoreTarget);
    console.log(`✓ Copied: .tiltignore → project root`);
  }

  console.log("");
  console.log("💡 To start Tilt: tdk up");
}

export function verifyMasterConfigs(projectRoot: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const projectConfig = readProjectConfig(projectRoot);
    const engine = new TemplateEngine();
    const expectedFiles = engine.generateAll(projectConfig);

    const outputDir = path.join(projectRoot, ".tdk", ".tdk-out");

    for (const filename of ALL_GENERATED_FILES) {
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


  } catch (error: unknown) {
    errors.push(`Verification error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { valid: errors.length === 0, errors };
}
