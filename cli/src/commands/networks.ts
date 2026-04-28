/**
 * tdk networks command
 *
 * Show all Traefik-routed URLs for services with basePath.
 * Design spec: networks-design.md
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
import { findProjectRoot, discoverServices } from '../utils/services.js';
import { readProjectConfig } from '../generator/template-engine.js';

interface ServiceUrl {
  name: string;
  stack?: string;
  basePath: string;
  url: string;
  port?: number;
  status: 'running' | 'stopped' | 'unknown';
}

const BOX_WIDTH = 62;

// Get base domain from environment or auto-detect
function getBaseDomain(): string {
  if (process.env.TDK_PUBLIC_HOST) {
    return process.env.TDK_PUBLIC_HOST;
  }

  // Try to read from project config first (most reliable)
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
    const domainRegex = /traefik\.http\.routers\.[\w-]+\.rule=Host\(`([^`]+)`\)/g;
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

// Check if a service is responding (via HTTP health check or port check)
function checkServiceStatus(serviceName: string, port?: number, url?: string): 'running' | 'stopped' | 'unknown' {
  // Method 1: Check if service responds on its URL via Traefik (most reliable)
  // This tells us if the service is actually accessible through the proxy
  if (url) {
    try {
      // Quick curl to check if service is up (silent, follow redirects, timeout 2s)
      const statusCode = execSync(
        `curl -s -o /dev/null -w "%{http_code}" --max-time 2 "${url}" 2>/dev/null || echo "000"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim();

      // Check if status code starts with 2 or 3 (success or redirect)
      if (statusCode.match(/^[23]\d\d$/)) {
        return 'running';
      }

      // If we got a 4xx or 5xx, the route exists but service isn't responding
      // This means the service is configured in Traefik but not actually running
      if (statusCode.match(/^[45]\d\d$/)) {
        return 'stopped';
      }

      // Connection refused or other error - service not accessible
      if (statusCode === '000') {
        return 'stopped';
      }
    } catch {
      // HTTP check failed completely - service not accessible
      return 'stopped';
    }
  }

  // Method 2: Check if the specific port is listening (fallback when no URL)
  // Only use this if we couldn't check via HTTP (no URL configured)
  if (port) {
    try {
      // Check if anything is listening on the port using lsof
      execSync(
        `lsof -Pi :${port} -sTCP:LISTEN 2>/dev/null | grep -q LISTEN`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      return 'running';
    } catch {
      // Try netstat as fallback
      try {
        execSync(
          `netstat -tlnp 2>/dev/null | grep -q ":${port} "`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        return 'running';
      } catch {
        // Port check failed
      }
    }
  }

  // Method 3: Check Docker container (fallback for containerized services)
  try {
    const containerName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const result = execSync(
      `docker ps --filter "name=${containerName}" --format "{{.Names}}" 2>/dev/null`,
      { encoding: 'utf-8' }
    ).trim();

    if (result && result.length > 0) {
      return 'running';
    }
  } catch {
    // Docker check failed
  }

  return 'stopped';
}

// Helper to create a line of box characters
function line(char: string, width: number = BOX_WIDTH): string {
  return char.repeat(width);
}

// Center text in a box
function center(text: string, width: number = BOX_WIDTH - 2): string {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

// Pad text to exact width
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
    const services = discoverServices();
    
    const servicesWithUrls: ServiceUrl[] = services
      .filter(s => s.config?.basePath)
      .map(s => {
        const basePath = s.config!.basePath!.replace(/^\//, '');
        const url = `http://${baseDomain}/${basePath}`;
        const port = s.config?.port;
        const status = checkServiceStatus(s.name, port, url);

        return {
          name: s.name,
          stack: s.stack,
          basePath: s.config!.basePath!,
          url,
          port,
          status,
        };
      });
    
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
        const statusEmoji = service.status === 'running' ? chalk.green('●') : 
                           service.status === 'stopped' ? chalk.red('●') : chalk.gray('○');
        
        const namePart = pad(service.name, 22);
        const urlPart = chalk.cyan.underline(service.url);
        
        console.log(`  ${statusEmoji} ${chalk.white(namePart)}  ${urlPart}`);
      }
    }
    
    // Footer
    console.log();
    console.log(chalk.gray(line('─', BOX_WIDTH - 2)));
    console.log(chalk.gray('🖱️  Click any URL above to open in browser'));
    console.log(chalk.gray('📊 Status: ') + chalk.green('● Running') + ' | ' + chalk.red('● Stopped') + ' | ' + chalk.gray('○ Unknown'));
    
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
