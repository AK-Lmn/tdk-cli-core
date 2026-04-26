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
  
  try {
    const traefikLabels = execSync(
      'docker ps --filter "label=traefik.enable=true" --format "{{.Labels}}" 2>/dev/null | head -1',
      { encoding: 'utf-8' }
    );
    const domainMatch = traefikLabels.match(/traefik\.http\.routers\.[\w-]+\.rule=Host\(`([^`]+)`\)/);
    if (domainMatch) {
      return domainMatch[1];
    }
  } catch {
    // Ignore
  }
  
  return 'localhost';
}

// Check if a service is running
function checkServiceStatus(serviceName: string): 'running' | 'stopped' | 'unknown' {
  try {
    const containerName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const result = execSync(
      `docker ps --filter "name=${containerName}" --format "{{.Names}}" 2>/dev/null`,
      { encoding: 'utf-8' }
    ).trim();
    
    if (result.includes(containerName)) {
      return 'running';
    }
    return 'stopped';
  } catch {
    return 'unknown';
  }
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
        const status = checkServiceStatus(s.name);
        
        return {
          name: s.name,
          stack: s.stack,
          basePath: s.config!.basePath!,
          url,
          port: s.config?.port,
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
      console.log(chalk.yellow('💡 Tip: Set custom domain with:'));
      console.log(chalk.cyan('   export TDK_PUBLIC_HOST=beauty-crm.localhost'));
    }
    
    console.log();
  });

function getStackEmoji(stackName: string): string {
  const emojiMap: Record<string, string> = {
    'identity': '🔐',
    'appointment': '📅',
    'payment': '💳',
    'staff': '👥',
    'inventory': '📦',
    'salon': '💈',
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
