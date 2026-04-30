/**
 * tdk networks command
 *
 * Show all Traefik-routed URLs for services with basePath.
 * Design spec: networks-design.md
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync, spawn } from 'node:child_process';
import { findProjectRoot, discoverResources } from '../utils/services.js';
import { readProjectConfig } from '../generator/template-engine.js';
import { sanitizeForShell, isValidPort } from '../utils/validation.js';
import { requireProjectRoot } from '../utils/errors.js';
import type { ServiceUrl } from '../types/index.js';

/**
 * Execute a shell command safely using spawn instead of execSync
 * to prevent shell injection vulnerabilities.
 */
function execSafe(command: string, args: string[], options: { encoding?: string; timeout?: number } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      timeout: options.timeout || 5000,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}

const BOX_WIDTH = 62;

function getBaseDomain(): string {
  if (process.env.TDK_PUBLIC_HOST) {
    return process.env.TDK_PUBLIC_HOST;
  }

  try {
    const projectRoot = findProjectRoot();
    if (projectRoot) {
      const projectConfig = readProjectConfig(projectRoot);
      const projectName = projectConfig.project?.name;
      if (projectName && projectName !== 'tdk-project') {
        return `${projectName}.localhost`;
      }
    }
  } catch {
    // Ignore - config might not exist or be readable
  }

  // Collect all unique domains from Traefik containers
  const domains = new Set<string>();
  try {
    const traefikLabels = execSync(
      'docker ps --filter "label=traefik.enable=true" --format "{{.Labels}}" 2>/dev/null',
      { encoding: 'utf-8' }
    );

    // Extract all Host() domains from all containers
    // Use a simplified regex to avoid ReDoS - limit pattern length and use fixed patterns
    const domainRegex = /traefik\.http\.routers\.[a-zA-Z0-9_-]{1,50}\.rule=Host\(`([a-zA-Z0-9_.-]{1,100})`\)/g;
    let match;
    while ((match = domainRegex.exec(traefikLabels)) !== null) {
      domains.add(match[1]);
    }
  } catch {
    // Ignore - docker might not be running
  }

  // Filter out service-specific domains (ones that look like individual services)
  // Service domains typically contain the full service name like "identity-management-frontend.localhost"
  const domainList = Array.from(domains);
  const projectDomains = domainList.filter(domain => {
    // Skip domains that look like specific service instances
    // These are long, hyphen-heavy domains for individual services
    const servicePatterns = [
      /\w+-\w+-frontend\.localhost$/,
      /\w+-\w+-backend\.localhost$/,
      /\w+-\w+-worker\.localhost$/,
      /\w+-\w+-migrator\.localhost$/,
    ];
    return !servicePatterns.some(pattern => pattern.test(domain));
  });

  // Prefer project-level domains (shorter, simpler ones)
  if (projectDomains.length > 0) {
    // Sort by length - shortest is likely the project domain
    projectDomains.sort((a, b) => a.length - b.length);
    return projectDomains[0];
  }

  // If only service-specific domains found, extract base from first one
  // e.g., "identity-management-frontend.localhost" -> try to find "beauty-crm.localhost"
  if (domainList.length > 0) {
    const firstDomain = domainList[0];
    const localhostMatch = firstDomain.match(/([\w-]+)\.localhost$/);
    if (localhostMatch) {
      const prefix = localhostMatch[1];
      // If it looks like a service domain, try common project names
      const commonProjects = ['beauty-crm', 'tdk', 'project', 'app', 'api'];
      for (const project of commonProjects) {
        const testDomain = `${project}.localhost`;
        if (domainList.includes(testDomain)) {
          return testDomain;
        }
      }
    }
  }

  return 'localhost';
}

async function checkServiceStatus(serviceName: string, port?: number, url?: string): Promise<'running' | 'stopped' | 'unknown'> {
  if (url) {
    try {
      const validUrl = new URL(url);
      if (validUrl.protocol !== 'http:' && validUrl.protocol !== 'https:') {
        return 'stopped';
      }

      // Quick curl to check if service is up (silent, follow redirects, timeout 2s)
      const statusCode = await execSafe('curl', [
        '-s', '-o', '/dev/null',
        '-w', '%{http_code}',
        '--max-time', '2',
        validUrl.toString()
      ], { timeout: 3000 });

      const code = statusCode.trim();

      if (/^[23]\d\d$/.test(code)) {
        return 'running';
      }

      if (/^[45]\d\d$/.test(code)) {
        return 'stopped';
      }

      // Connection refused or other error - service not accessible
      if (code === '000') {
        return 'stopped';
      }
    } catch {
      // HTTP check failed completely - service not accessible
      return 'stopped';
    }
  }

  if (port && isValidPort(port)) {
    try {
      await execSafe('lsof', ['-Pi', `:${port}`, '-sTCP:LISTEN'], { timeout: 3000 });
      return 'running';
    } catch {
      try {
        await execSafe('netstat', ['-tlnp'], { timeout: 3000 });
        // If netstat succeeds, we need to grep for the port
        // Using execSync here is safe since port is validated as numeric
        try {
          execSync(`grep -q ":${port} "`, { encoding: 'utf-8', stdio: 'pipe', input: '' });
        } catch {
          // Port not found
        }
      } catch {
        // No process listening
      }
    }
  }

  try {
    const containerName = sanitizeForShell(serviceName);
    const result = await execSafe('docker', [
      'ps',
      '--filter', `name=${containerName}`,
      '--format', '{{.Names}}'
    ], { timeout: 5000 });

    if (result && result.trim().length > 0) {
      return 'running';
    }
  } catch {
    // Docker check failed
  }

  return 'stopped';
}

function line(char: string, width: number = BOX_WIDTH): string {
  return char.repeat(width);
}

function center(text: string, width: number = BOX_WIDTH - 2): string {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

function pad(text: string, width: number): string {
  if (text.length > width) {
    return text.slice(0, width - 1) + '…';
  }
  return text.padEnd(width);
}

export const networksCommand = new Command('networks')
  .description('Show Traefik-routed URLs for all services')
  .alias('urls')
  .alias('traefik')
  .option('-s, --stack <stack>', 'Filter by stack name')
  .option('--json', 'Output as JSON')
  .option('--raw', 'Output raw URLs only')
  .action(async (options) => {
    const projectRoot = findProjectRoot();
    
    if (!projectRoot) {
      console.error(chalk.red('❌ Not in a TDK project directory'));
      process.exit(1);
    }
    
    const baseDomain = getBaseDomain();
    const services = discoverResources();
    
    // Check service status asynchronously for all services
    const servicesWithUrls: ServiceUrl[] = await Promise.all(
      services
        .filter(s => s.config?.basePath)
        .map(async (s) => {
          const basePath = s.config!.basePath!.replace(/^\//, '');
          const url = `http://${baseDomain}/${basePath}`;
          const port = s.config?.port;
          const status = await checkServiceStatus(s.name, port, url);

          return {
            name: s.name,
            stack: s.stack,
            basePath: s.config!.basePath!,
            url,
            port,
            status,
          };
        })
    );
    
    const filteredServices = options.stack
      ? servicesWithUrls.filter(s => s.stack === options.stack)
      : servicesWithUrls;
    
    if (filteredServices.length === 0) {
      if (options.stack) {
        console.log(chalk.yellow(`⚠️ No services with basePath found in stack "${options.stack}"`));
      } else {
        console.log(chalk.yellow('⚠️ No services with basePath found'));
        console.log(chalk.gray('\nAdd basePath to your service.json:'));
        console.log(chalk.gray('  "basePath": "/my-service"'));
      }
      process.exit(0);
    }
    
    if (options.json) {
      console.log(JSON.stringify(filteredServices, null, 2));
      process.exit(0);
    }
    
    if (options.raw) {
      for (const service of filteredServices) {
        console.log(service.url);
      }
      process.exit(0);
    }
    
    // Header
    console.log();
    console.log(chalk.cyan('╭' + line('─', BOX_WIDTH - 2) + '╮'));
    console.log(chalk.cyan('│') + chalk.bold.white(center('🌐  TRAEFIK NETWORKS')) + chalk.cyan('│'));
    console.log(chalk.cyan('├' + line('─', BOX_WIDTH - 2) + '┤'));
    console.log(chalk.cyan('│') + chalk.gray(center(`Domain: http://${baseDomain}`)) + chalk.cyan('│'));
    console.log(chalk.cyan('╰' + line('─', BOX_WIDTH - 2) + '╯'));
    
    // Group by stack
    const stacks = new Map<string, ServiceUrl[]>();
    for (const service of filteredServices) {
      const stackName = service.stack || 'default';
      if (!stacks.has(stackName)) {
        stacks.set(stackName, []);
      }
      stacks.get(stackName)!.push(service);
    }
    
    // Display by stack
    let isFirstStack = true;
    for (const [stackName, stackServices] of stacks) {
      if (!isFirstStack) {
        console.log();
      }
      isFirstStack = false;
      
      const emoji = getStackEmoji(stackName);
      const stackTitle = `${emoji}  ${stackName.toUpperCase()} STACK`;
      
      console.log();
      console.log(chalk.bold.white(stackTitle));
      console.log(chalk.gray(line('━', BOX_WIDTH - 4)));
      
      for (const service of stackServices) {
        // Use both color AND symbol for clarity
        const statusSymbol = service.status === 'running' ? '✓' :
                            service.status === 'stopped' ? '✗' : '?';
        const statusEmoji = service.status === 'running' ? chalk.green(statusSymbol) :
                           service.status === 'stopped' ? chalk.red(statusSymbol) : chalk.gray(statusSymbol);

        const namePart = pad(service.name, 22);
        const urlPart = service.status === 'running'
          ? chalk.cyan.underline(service.url)
          : chalk.gray(service.url);  // Gray out URL if stopped

        const statusLabel = service.status !== 'running'
          ? chalk.gray(` [${service.status}]`)
          : '';

        console.log(`  ${statusEmoji} ${chalk.white(namePart)}  ${urlPart}${statusLabel}`);
      }
    }
    
    // Footer
    console.log();
    console.log(chalk.gray(line('─', BOX_WIDTH - 2)));
    console.log(chalk.gray('🖱️  Click any URL above to open in browser'));
    console.log(chalk.gray('📊 Status: ') + chalk.green('✓ Running') + ' | ' + chalk.red('✗ Stopped') + ' | ' + chalk.gray('? Unknown'));
    
    if (baseDomain === 'localhost') {
      console.log();
      try {
        const projectConfig = readProjectConfig(projectRoot);
        const projectName = projectConfig.project.name;
        console.log(chalk.yellow('💡 Tip: Set custom domain with:'));
        console.log(chalk.cyan(`   export TDK_PUBLIC_HOST=${projectName}.localhost`));
      } catch {
        console.log(chalk.yellow('💡 Tip: Set custom domain with:'));
        console.log(chalk.cyan('   export TDK_PUBLIC_HOST=localhost'));
      }
    }
    
    console.log();
  });

function getStackEmoji(stackName: string): string {
  const emojiMap: Record<string, string> = {
    'identity': '🔐',
    'order': '📅',
    'payment': '💳',
    'staff': '👥',
    'inventory': '📦',
    'user': '💈',
    'website': '🌐',
    'treatment': '💆',
    'gdpr': '🔒',
    'orchestrator': '⚙️',
  };
  
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (stackName.toLowerCase().includes(key)) {
      return emoji;
    }
  }
  
  return '📦';
}
