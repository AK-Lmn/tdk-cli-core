/**
 * tdk resource command
 *
 * Create a new resource (service) from scratch.
 * Generates service.json, folder structure, and starter templates.
 * Assigns next available port from master config ranges.
 */

import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { findProjectRoot, discoverServices } from '../utils/services.js';

// Templates for different resource types
const BACKEND_TEMPLATE = {
  type: 'backend',
  port: 0, // Will be assigned
  healthCheck: '/health',
  dependencies: [],
  build: {
    dockerfile: 'Dockerfile',
    context: '.',
  },
  dev: {
    command: 'bun run dev',
    watch: ['src/**/*'],
  },
};

const FRONTEND_TEMPLATE = {
  type: 'frontend',
  port: 0, // Will be assigned
  dependencies: [],
  build: {
    dockerfile: 'Dockerfile',
    context: '.',
  },
  dev: {
    command: 'bun run dev',
    watch: ['src/**/*', 'public/**/*'],
  },
};

const WORKER_TEMPLATE = {
  type: 'worker',
  port: 0, // Will be assigned (optional for workers)
  dependencies: [],
  build: {
    dockerfile: 'Dockerfile',
    context: '.',
  },
  dev: {
    command: 'bun run worker',
    watch: ['src/**/*'],
  },
};

// Basic service.json template
function createServiceJson(name: string, type: 'backend' | 'frontend' | 'worker', stack: string, port: number) {
  const base = type === 'backend' ? BACKEND_TEMPLATE :
               type === 'frontend' ? FRONTEND_TEMPLATE : WORKER_TEMPLATE;

  return {
    ...base,
    name,
    type,
    stack,
    port,
  };
}

// Basic package.json template
function createPackageJson(name: string, type: string) {
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

// Basic tsconfig.json template
const TSCONFIG_TEMPLATE = {
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

// Basic Dockerfile template
const DOCKERFILE_TEMPLATE = `FROM oven/bun:1.2

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

// Backend index.ts template function
function getBackendIndexTemplate(name: string) {
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

// Add routes here:
// app.get('/api/resource', (c) => c.json({ data: [] }));

const port = process.env.PORT || 3000;
console.log('\n🚀 ${name} running on http://localhost:' + port);
console.log('📊 Health check: http://localhost:' + port + '/health\n');

export default {
  port,
  fetch: app.fetch,
};
`;
}

// Frontend index.html template function
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

// Frontend main.tsx template
const FRONTEND_MAIN_TEMPLATE = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

// Frontend App.tsx template function
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

// Worker index.ts template function
function getWorkerIndexTemplate(name: string) {
  return `console.log('🚀 ${name} worker started');

// Worker configuration
const CONFIG = {
  pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL || '5000'),
  maxRetries: parseInt(process.env.WORKER_MAX_RETRIES || '3'),
  batchSize: parseInt(process.env.WORKER_BATCH_SIZE || '10'),
};

async function processJob(job: unknown): Promise<void> {
  console.log('[Worker] Processing job:', job);

  // Add job processing logic here

  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('[Worker] Job completed:', job);
}

async function fetchJobs(): Promise<unknown[]> {
  // Connect to your queue (Redis, RabbitMQ, etc.) and fetch jobs
  return [];
}

// Main worker loop
async function main() {
  console.log('[Worker] Configuration:', CONFIG);

  while (true) {
    try {
      // Fetch jobs from queue
      const jobs = await fetchJobs();

      if (jobs.length === 0) {
        // No jobs - wait before polling again
        await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
        continue;
      }

      console.log('[Worker] Fetched \${jobs.length} jobs');

      // Process each job
      for (const job of jobs) {
        try {
          await processJob(job);
        } catch (error) {
          console.error('[Worker] Job failed:', error);
        }
      }
    } catch (error) {
      console.error('[Worker] Error in main loop:', error);
      // Wait before retrying to avoid tight error loops
      await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
    }
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] SIGINT received, shutting down gracefully...');
  process.exit(0);
});

main().catch(console.error);
`;
}

// Test template function
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
    try {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error(chalk.red('Error: Could not find project root (no Tiltfile found).'));
        console.error(chalk.gray('Run this from within a project that has a Tiltfile.'));
        process.exit(1);
      }

      console.log(chalk.blue('TDK Resource Creation\n'));

      // Validate or ask for resource name
      let resourceName = name;
      if (!resourceName) {
        const { inputName } = await inquirer.prompt([{
          type: 'input',
          name: 'inputName',
          message: 'Resource name (kebab-case):',
          validate: (input: string) => {
            if (!input.trim()) return 'Resource name is required';
            if (!/^[a-z0-9-]+$/.test(input)) return 'Use lowercase letters, numbers, and hyphens only';
            return true;
          }
        }]);
        resourceName = inputName;
      } else if (!/^[a-z0-9-]+$/.test(resourceName)) {
        console.error(chalk.red('Error: Resource name must be kebab-case (lowercase, numbers, hyphens only)'));
        process.exit(1);
      }

      // Validate or ask for type
      let resourceType = options.type;
      if (!['backend', 'frontend', 'worker'].includes(resourceType)) {
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
      }

      // Ask for stack
      let stackName = options.stack;
      if (stackName === 'default') {
        const existingServices = discoverServices();
        const existingStacks = [...new Set(existingServices.map(s => s.stack).filter(Boolean))];
        
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
              validate: (input: string) => {
                if (!input.trim()) return 'Stack name is required';
                if (!/^[a-z0-9-]+$/.test(input)) return 'Use kebab-case';
                return true;
              }
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
            validate: (input: string) => {
              if (!input.trim()) return 'Stack name is required';
              if (!/^[a-z0-9-]+$/.test(input)) return 'Use kebab-case';
              return true;
            }
          }]);
          stackName = newStack;
        }
      }

      // Determine resource path
      let resourcePath = options.path;
      if (!resourcePath) {
        // Default paths based on project structure
        const defaultPaths: Record<string, string> = {
          backend: `services/${stackName}/${resourceName}`,
          frontend: `apps/${resourceName}`,
          worker: `workers/${resourceName}`,
        };
        resourcePath = defaultPaths[resourceType] || `services/${resourceName}`;
      }

      const fullPath = resolve(projectRoot, resourcePath);

      // Check if directory already exists
      if (existsSync(fullPath)) {
        console.error(chalk.red(`Error: Directory already exists: ${fullPath}`));
        console.error(chalk.gray('Use --path to specify a different location'));
        process.exit(1);
      }

      // Calculate next available port
      const existingServices = discoverServices();
      const existingPorts = existingServices.map(s => s.port || 0).filter(p => p > 0);
      
      let assignedPort: number;
      const basePort = resourceType === 'frontend' ? 3000 : 4000;
      const maxPort = resourceType === 'frontend' ? 3999 : 4999;
      
      for (let port = basePort; port <= maxPort; port++) {
        if (!existingPorts.includes(port)) {
          assignedPort = port;
          break;
        }
      }
      
      if (!assignedPort!) {
        console.error(chalk.red(`Error: No available ports in range ${basePort}-${maxPort}`));
        console.error(chalk.gray('Check TILT_RESOURCE_DEFAULTS.star for port configuration'));
        process.exit(1);
      }

      // Confirm creation
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
        console.log(chalk.yellow('Cancelled.'));
        return;
      }

      // Create directory structure
      console.log(chalk.blue('\n📁 Creating directory structure...'));
      mkdirSync(fullPath, { recursive: true });
      mkdirSync(resolve(fullPath, 'src'), { recursive: true });
      mkdirSync(resolve(fullPath, 'tests'), { recursive: true });

      // Generate service.json
      console.log(chalk.blue('📝 Generating service.json...'));
      const serviceJson = createServiceJson(resourceName, resourceType, stackName, assignedPort);
      writeFileSync(
        resolve(fullPath, 'service.json'),
        JSON.stringify(serviceJson, null, 2) + '\n',
        'utf-8'
      );

      // Generate package.json
      console.log(chalk.blue('📦 Generating package.json...'));
      const packageJson = createPackageJson(resourceName, resourceType);
      writeFileSync(
        resolve(fullPath, 'package.json'),
        JSON.stringify(packageJson, null, 2) + '\n',
        'utf-8'
      );

      // Generate tsconfig.json
      console.log(chalk.blue('⚙️  Generating tsconfig.json...'));
      writeFileSync(
        resolve(fullPath, 'tsconfig.json'),
        JSON.stringify(TSCONFIG_TEMPLATE, null, 2) + '\n',
        'utf-8'
      );

      // Generate Dockerfile
      console.log(chalk.blue('🐳 Generating Dockerfile...'));
      writeFileSync(
        resolve(fullPath, 'Dockerfile'),
        DOCKERFILE_TEMPLATE,
        'utf-8'
      );

      // Generate source files based on type
      console.log(chalk.blue('💻 Generating source files...'));
      
      if (resourceType === 'backend') {
        writeFileSync(resolve(fullPath, 'src', 'index.ts'), getBackendIndexTemplate(resourceName), 'utf-8');
      } else if (resourceType === 'frontend') {
        writeFileSync(resolve(fullPath, 'index.html'), getFrontendIndexTemplate(resourceName), 'utf-8');
        writeFileSync(resolve(fullPath, 'src', 'main.tsx'), FRONTEND_MAIN_TEMPLATE, 'utf-8');
        writeFileSync(resolve(fullPath, 'src', 'App.tsx'), getFrontendAppTemplate(resourceName), 'utf-8');
      } else if (resourceType === 'worker') {
        writeFileSync(resolve(fullPath, 'src', 'index.ts'), getWorkerIndexTemplate(resourceName), 'utf-8');
      }

      // Generate test file
      console.log(chalk.blue('🧪 Generating test file...'));
      writeFileSync(
        resolve(fullPath, 'tests', `${resourceName}.test.ts`),
        getTestTemplate(resourceName),
        'utf-8'
      );

      // Success message
      console.log(chalk.green('\n✅ Resource created successfully!'));
      console.log(chalk.gray(`\nLocation: ${fullPath}`));
      console.log(chalk.gray(`\nNext steps:`));
      console.log(chalk.gray(`  cd ${resourcePath}`));
      console.log(chalk.gray(`  bun install`));
      console.log(chalk.gray(`  tdk up ${stackName}`));

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });
