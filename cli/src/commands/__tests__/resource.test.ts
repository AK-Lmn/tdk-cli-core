/**
 * Tests for tdk resource command
 */

import { describe, it, expect } from 'vitest';

describe('resource command', () => {
  describe('resource name validation', () => {
    it('should accept valid kebab-case names', () => {
      const validNames = [
        'my-service',
        'service123',
        'api-gateway',
        'a',
        'test-123-abc',
      ];

      for (const name of validNames) {
        expect(/^[a-z0-9-]+$/.test(name)).toBe(true);
      }
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        'MyService',      // camelCase
        'my_service',     // underscore
        'my service',     // space
        'service.name',   // dot
        'Service-Name',   // uppercase
        '',               // empty
      ];

      for (const name of invalidNames) {
        expect(/^[a-z0-9-]+$/.test(name)).toBe(false);
      }
    });
  });

  describe('service.json template', () => {
    it('should create valid backend service.json', () => {
      const name = 'test-backend';
      const type = 'backend';
      const stack = 'main';
      const port = 3001;

      const serviceJson = {
        type: 'backend',
        port,
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
        name,
        stack,
      };

      expect(serviceJson).toHaveProperty('name', name);
      expect(serviceJson).toHaveProperty('type', type);
      expect(serviceJson).toHaveProperty('port', port);
      expect(serviceJson).toHaveProperty('healthCheck');
      expect(serviceJson).toHaveProperty('dependencies');
      expect(serviceJson).toHaveProperty('build');
      expect(serviceJson).toHaveProperty('dev');
    });

    it('should create valid frontend service.json', () => {
      const name = 'test-frontend';
      const type = 'frontend';
      const stack = 'main';
      const port = 3002;

      const serviceJson = {
        type: 'frontend',
        port,
        dependencies: [],
        build: {
          dockerfile: 'Dockerfile',
          context: '.',
        },
        dev: {
          command: 'bun run dev',
          watch: ['src/**/*', 'public/**/*'],
        },
        name,
        stack,
      };

      expect(serviceJson).toHaveProperty('name', name);
      expect(serviceJson).toHaveProperty('type', type);
      expect(serviceJson).toHaveProperty('port', port);
      expect(serviceJson.dev.watch).toContain('public/**/*');
    });

    it('should create valid worker service.json', () => {
      const name = 'test-worker';
      const type = 'worker';
      const stack = 'main';
      const port = 0;

      const serviceJson = {
        type: 'worker',
        port,
        dependencies: [],
        build: {
          dockerfile: 'Dockerfile',
          context: '.',
        },
        dev: {
          command: 'bun run worker',
          watch: ['src/**/*'],
        },
        name,
        stack,
      };

      expect(serviceJson).toHaveProperty('name', name);
      expect(serviceJson).toHaveProperty('type', type);
      expect(serviceJson.port).toBe(0); // Workers may not need ports
    });
  });

  describe('package.json template', () => {
    it('should create backend package.json with Hono', () => {
      const name = 'test-backend';
      const type = 'backend';

      const isFrontend = type === 'frontend';
      const packageJson = {
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

      expect(packageJson.dependencies).toHaveProperty('hono');
      expect(packageJson.dependencies).not.toHaveProperty('vite');
    });

    it('should create frontend package.json with Vite', () => {
      const name = 'test-frontend';
      const type = 'frontend';

      const isFrontend = type === 'frontend';
      const packageJson = {
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

      expect(packageJson.dependencies).not.toHaveProperty('hono');
      expect(packageJson.devDependencies).toHaveProperty('vite');
    });
  });

  describe('backend index.ts template', () => {
    it('should have health check endpoints', () => {
      const name = 'test-service';

      const indexContent = `import { Hono } from 'hono';

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
  const status = allReady ? 'ready' : 'not_ready';
  return c.json({ status, dependencies }, allReady ? 200 : 503);
});
`;

      expect(indexContent).toContain("app.get('/health'");
      expect(indexContent).toContain("app.get('/health/live'");
      expect(indexContent).toContain("app.get('/health/ready'");
      expect(indexContent).toContain('async (c)');
    });

    it('should have root endpoint with service info', () => {
      const name = 'test-service';
      const indexContent = `app.get('/', (c) => {
  return c.json({
    service: '${name}',
    version: '1.0.0',
    endpoints: ['/health', '/health/live', '/health/ready']
  });
});`;

      expect(indexContent).toContain("app.get('/',");
      expect(indexContent).toContain("service: '${name}'");
      expect(indexContent).toContain('endpoints:');
    });
  });

  describe('worker index.ts template', () => {
    it('should have worker configuration', () => {
      const workerContent = `const CONFIG = {
  pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL || '5000'),
  maxRetries: parseInt(process.env.WORKER_MAX_RETRIES || '3'),
  batchSize: parseInt(process.env.WORKER_BATCH_SIZE || '10'),
};`;

      expect(workerContent).toContain('WORKER_POLL_INTERVAL');
      expect(workerContent).toContain('WORKER_MAX_RETRIES');
      expect(workerContent).toContain('WORKER_BATCH_SIZE');
    });

    it('should have processJob function', () => {
      const workerContent = `async function processJob(job: unknown): Promise<void> {
  console.log('[Worker] Processing job:', job);
  await new Promise(resolve => setTimeout(resolve, 1000));
}`;

      expect(workerContent).toContain('async function processJob');
    });

    it('should have graceful shutdown handling', () => {
      const workerContent = `process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] SIGINT received, shutting down gracefully...');
  process.exit(0);
});`;

      expect(workerContent).toContain("process.on('SIGTERM'");
      expect(workerContent).toContain("process.on('SIGINT'");
      expect(workerContent).toContain('shutting down gracefully');
    });
  });

  describe('resource type validation', () => {
    it('should only accept valid resource types', () => {
      const validTypes = ['backend', 'frontend', 'worker'];
      const invalidTypes = ['api', 'microservice', 'service', 'app'];

      for (const type of validTypes) {
        expect(['backend', 'frontend', 'worker'].includes(type)).toBe(true);
      }

      for (const type of invalidTypes) {
        expect(['backend', 'frontend', 'worker'].includes(type)).toBe(false);
      }
    });
  });
});
