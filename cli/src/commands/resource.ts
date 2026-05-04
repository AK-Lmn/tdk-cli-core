import { Command } from 'commander';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { CreatableResourceType, ResourceType, JsonValue } from '../types/index.js';
import { CREATABLE_RESOURCE_TYPES, isCreatableResourceType } from '../types/index.js';
import { discoverResources } from '../utils/services.js';
import { requireProjectRoot, runCommand, showErrorAndExit } from '../utils/errors.js';
import { validateResourceName, createKebabCaseValidator } from '../utils/validation.js';
import { formatCount, showCancelled, showCommandHeader } from '../utils/formatting.js';
import { PORT_RANGES } from '../utils/constants.js';
import { assignPort } from '../utils/port-assignment.js';
import { writeJsonFileInDir, writeTextFileInDir } from '../utils/file-helpers.js';

export const BASE_TEMPLATE = {
  port: 0, // Will be assigned
  dependencies: [],
  build: {
    dockerfile: 'Dockerfile',
    context: '.',
  },
  dev: {
    command: 'bun run dev',
    watch: ['src/**/*'],
  },
} as const;

interface TypeSpecificConfig {
  healthCheck?: string;
  dev?: {
    command: string;
    watch: string[];
  };
}

export const TYPE_SPECIFIC: Record<CreatableResourceType, TypeSpecificConfig> = {
  backend: {
    healthCheck: '/health',
  },
  frontend: {
    dev: {
      command: 'bun run dev',
      watch: ['src/**/*', 'public/**/*'],
    },
  },
  worker: {
    dev: {
      command: 'bun run worker',
      watch: ['src/**/*'],
    },
  },
};

export function createServiceJson(name: string, type: CreatableResourceType, stack: string, port: number) {
  const typeSpecific = TYPE_SPECIFIC[type];

  const base = JSON.parse(JSON.stringify(BASE_TEMPLATE));
  for (const [key, value] of Object.entries(typeSpecific)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      base[key] = { ...base[key], ...value };
    } else {
      base[key] = value;
    }
  }

  return {
    ...base,
    name,
    type,
    stack,
    port,
  };
}

export function createPackageJson(name: string, type: string) {
  const isFrontend = type === 'frontend';

  return {
    name: `@project/${name}`,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: isFrontend ? 'vite' : 'bun run --watch src/index.ts',
      build: isFrontend ? 'tsc && vite build' : 'tsc',
      test: 'vitest',
      lint: 'biome check .',
      'lint:fix': 'biome check . --write',
    },
    dependencies: {
      ...(isFrontend ? {} : { hono: '^4.0.0' }),
    },
    devDependencies: {
      '@types/bun': 'latest',
      typescript: '^5.0.0',
      vitest: '^1.0.0',
      '@biomejs/biome': '^1.5.0',
      ...(isFrontend ? { vite: '^5.0.0' } : {}),
    },
  };
}

export const TSCONFIG_TEMPLATE = {
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    outDir: './dist',
    rootDir: './src',
    declaration: true,
    declarationMap: true,
    sourceMap: true,
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist'],
};

export const DOCKERFILE_TEMPLATE = `FROM oven/bun:1.2

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build if needed
RUN bun run build

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["bun", "run", "start"]
`;

export function getBackendIndexTemplate(name: string) {
  return `import { Hono } from 'hono';

const app = new Hono();

// Health check endpoint (required by TILT_RESOURCE_DEFAULTS.star)
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: '${name}' });
});

app.get('/health/live', (c) => {
  return c.json({ status: 'alive', timestamp: Date.now() });
});

app.get('/health/ready', async (c) => {
  const dependencies: Record<string, string> = {};
  let allReady = true;

  // Add dependency checks here (database, cache, etc.)
  // Mark allReady = false if any dependency is unhealthy

  const status = allReady ? 'ready' : 'not_ready';
  return c.json({ status, dependencies }, allReady ? 200 : 503);
});

app.get('/', (c) => {
  return c.json({
    service: '${name}',
    version: '1.0.0',
    endpoints: ['/health', '/health/live', '/health/ready']
  });
});

const port = process.env.PORT || 3000;
console.log('\n🚀 ${name} running on http://localhost:' + port);
console.log('📊 Health check: http://localhost:' + port + '/health\n');

export default {
  port,
  fetch: app.fetch,
};
`;
}

function getFrontendIndexTemplate(name: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

const FRONTEND_MAIN_TEMPLATE = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

function getFrontendAppTemplate(name: string) {
  return `function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>${name}</h1>
      <p>Frontend resource created with TDK</p>
    </div>
  );
}

export default App;
`;}

export function getWorkerIndexTemplate(name: string) {
  return `console.log('🚀 ${name} worker started');

interface Job {
  id: string;
  type: string;
  payload: Record<string, JsonValue>;
  priority?: number;
  timestamp?: string;
}

const CONFIG = {
  pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL || '5000'),
  maxRetries: parseInt(process.env.WORKER_MAX_RETRIES || '3'),
  batchSize: parseInt(process.env.WORKER_BATCH_SIZE || '10'),
};

async function processJob(job: Job): Promise<void> {
  console.log('[Worker] Processing job:', job.id, 'type:', job.type);

  // Add job processing logic here using job.payload

  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[Worker] Job completed:', job.id);
}

async function fetchJobs(): Promise<Job[]> {
  // Connect to your queue (Redis, RabbitMQ, etc.) and fetch jobs
  return [];
}

async function main() {
  console.log('[Worker] Configuration:', CONFIG);

  while (true) {
    try {
      const jobs = await fetchJobs();

      if (jobs.length === 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
        continue;
      }

      console.log('[Worker] Fetched \${jobs.length} jobs');

      for (const job of jobs) {
        try {
          await processJob(job);
        } catch (error: unknown) {
          console.error('[Worker] Job failed:', error);
        }
      }
    } catch (error: unknown) {
      console.error('[Worker] Error in main loop:', error);
      // Wait before retrying to avoid tight error loops
      await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
    }
  }
}

      process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] SIGINT received, shutting down gracefully...');
  process.exit(0);
});

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
`;
}

function getTestTemplate(name: string) {
  return `import { describe, it, expect } from 'vitest';

describe('${name}', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });
});
`;}

export const resourceCommand = new Command('resource')
  .description('Create a new resource (service) from scratch')
  .argument('[name]', 'Resource name (kebab-case)')
  .option('-t, --type <type>', 'Resource type: backend, frontend, worker', 'backend')
  .option('-s, --stack <stack>', 'Stack to assign resource to', 'default')
  .option('-p, --path <path>', 'Custom path for resource directory')
  .action(async (name, options) => {
    await runCommand(async () => {
      const projectRoot = requireProjectRoot();

      showCommandHeader('Resource Creation');

      const allResources = discoverResources();

      let resourceName = name;
      if (!resourceName) {
        const { inputName } = await inquirer.prompt([{
          type: 'input',
          name: 'inputName',
          message: 'Resource name (kebab-case):',
          validate: createKebabCaseValidator('resource')
        }]);
        resourceName = inputName;
      } else {
        const validation = validateResourceName(resourceName);
        if (!validation.valid) {
          showErrorAndExit(validation.error ?? 'Invalid resource name');
        }
      }

      let resourceType: CreatableResourceType;
      if (!isCreatableResourceType(options.type)) {
        const { selectedType } = await inquirer.prompt([{
          type: 'list',
          name: 'selectedType',
          message: 'Resource type:',
          choices: [
            { name: 'backend - API service with HTTP endpoints', value: 'backend' },
            { name: 'frontend - Web application/UI', value: 'frontend' },
            { name: 'worker - Background job processor', value: 'worker' },
          ]
        }]);
        resourceType = selectedType;
      } else {
        resourceType = options.type;
      }

      let stackName = options.stack;
      if (stackName === 'default') {
        const existingResources = allResources;
        const stackSet = new Set<string>();
        for (const r of existingResources) {
          if (r.stack) stackSet.add(r.stack);
        }
        const existingStacks = Array.from(stackSet);

        if (existingStacks.length > 0) {
          const { selectedStack } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedStack',
            message: 'Assign to stack:',
            choices: [
              ...existingStacks.map(s => ({ name: s, value: s })),
              { name: 'Create new stack', value: '__new__' },
            ]
          }]);
          
          if (selectedStack === '__new__') {
            const { newStack } = await inquirer.prompt([{
              type: 'input',
              name: 'newStack',
              message: 'New stack name:',
              validate: createKebabCaseValidator('stack')
            }]);
            stackName = newStack;
          } else {
            stackName = selectedStack;
          }
        } else {
          const { newStack } = await inquirer.prompt([{
            type: 'input',
            name: 'newStack',
            message: 'Stack name (first resource):',
            default: 'main',
            validate: createKebabCaseValidator('stack')
          }]);
          stackName = newStack;
        }
      }

      let resourcePath = options.path;
      if (!resourcePath) {
        const defaultPaths: Record<CreatableResourceType, string> = {
          backend: `services/${stackName}/${resourceName}`,
          frontend: `apps/${resourceName}`,
          worker: `workers/${resourceName}`,
        };
        resourcePath = defaultPaths[resourceType];
      }

      const fullPath = resolve(projectRoot, resourcePath);

      // Prevent path traversal attacks
      const relativePath = relative(projectRoot, fullPath);
      if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
        console.error(chalk.red(`Error: Invalid path - must be within project directory`));
        console.error(chalk.gray(`Resolved path: ${fullPath}`));
        console.error(chalk.gray(`Project root: ${projectRoot}`));
        process.exit(1);
      }

      if (resourcePath.includes('\0') || /[<>:"|?*]/.test(resourcePath)) {
        showErrorAndExit('Path contains invalid characters');
      }

      if (existsSync(fullPath)) {
        console.error(chalk.red(`Error: Directory already exists: ${fullPath}`));
        console.error(chalk.gray('Use --path to specify a different location'));
        process.exit(1);
      }

      const assignedPort = assignPort(resourceType, allResources);

      console.log(chalk.gray('\nResource details:'));
      console.log(chalk.gray(`  Name:  ${resourceName}`));
      console.log(chalk.gray(`  Type:  ${resourceType}`));
      console.log(chalk.gray(`  Stack: ${stackName}`));
      console.log(chalk.gray(`  Port:  ${assignedPort}`));
      console.log(chalk.gray(`  Path:  ${resourcePath}`));

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: '\nCreate resource?',
        default: true
      }]);

      if (!confirm) {
        showCancelled();
        return;
      }

      console.log(chalk.blue('\n📁 Creating directory structure...'));
      mkdirSync(fullPath, { recursive: true });
      mkdirSync(resolve(fullPath, 'src'), { recursive: true });
      mkdirSync(resolve(fullPath, 'tests'), { recursive: true });

      console.log(chalk.blue('📝 Generating service.json...'));
      const serviceJson = createServiceJson(resourceName, resourceType, stackName, assignedPort);
      writeJsonFileInDir(fullPath, 'service.json', serviceJson);

      console.log(chalk.blue('📦 Generating package.json...'));
      const packageJson = createPackageJson(resourceName, resourceType);
      writeJsonFileInDir(fullPath, 'package.json', packageJson);

      console.log(chalk.blue('⚙️  Generating tsconfig.json...'));
      writeJsonFileInDir(fullPath, 'tsconfig.json', TSCONFIG_TEMPLATE);

      console.log(chalk.blue('🐳 Generating Dockerfile...'));
      writeTextFileInDir(fullPath, 'Dockerfile', DOCKERFILE_TEMPLATE);

      console.log(chalk.blue('💻 Generating source files...'));

      if (resourceType === 'backend') {
        writeTextFileInDir(fullPath, 'src/index.ts', getBackendIndexTemplate(resourceName));
      } else if (resourceType === 'frontend') {
        writeTextFileInDir(fullPath, 'index.html', getFrontendIndexTemplate(resourceName));
        writeTextFileInDir(fullPath, 'src/main.tsx', FRONTEND_MAIN_TEMPLATE);
        writeTextFileInDir(fullPath, 'src/App.tsx', getFrontendAppTemplate(resourceName));
      } else if (resourceType === 'worker') {
        writeTextFileInDir(fullPath, 'src/index.ts', getWorkerIndexTemplate(resourceName));
      }

      console.log(chalk.blue('🧪 Generating test file...'));
      writeTextFileInDir(fullPath, `tests/${resourceName}.test.ts`, getTestTemplate(resourceName));

      console.log(chalk.green('\n✅ Resource created successfully!'));
      console.log(chalk.gray(`\nLocation: ${fullPath}`));
      console.log(chalk.gray(`\nNext steps:`));
      console.log(chalk.gray(`  cd ${resourcePath}`));
      console.log(chalk.gray(`  bun install`));
      console.log(chalk.gray(`  tdk up ${stackName}`));
    });
  });
