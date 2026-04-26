/**
 * tdk networks command
 *
 * Show all Traefik-routed URLs for services with basePath.
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

// Get base domain from environment or default
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
    console.log(chalk.cyan('┌────────────────────────────────────────────────────────────┐'));
    console.log(chalk.cyan('│') + '  🌐  ' + chalk.bold.white('Traefik Network URLs') + ' '.repeat(35) + chalk.cyan('│'));
    console.log(chalk.cyan('├────────────────────────────────────────────────────────────┤'));
    console.log(chalk.cyan('│') + chalk.gray(`  Domain: http://${baseDomain}`).padEnd(59) + chalk.cyan('│'));
    console.log(chalk.cyan('└────────────────────────────────────────────────────────────┘'));
    console.log();
    
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
    for (const [stackName, stackServices] of stacks) {
      const emoji = getStackEmoji(stackName);
      console.log(chalk.bold(`${emoji} ${stackName}`));
      console.log(chalk.gray('  ' + '─'.repeat(56)));
      
      for (const service of stackServices) {
        const statusEmoji = service.status === 'running' ? '🟢' : 
                           service.status === 'stopped' ? '🔴' : '⚪';
        const namePadded = service.name.slice(0, 28).padEnd(28);
        
        console.log(`  ${statusEmoji} ${chalk.white(namePadded)} ${chalk.cyan.underline(service.url)}`);
      }
      
      console.log();
    }
    
    // Footer
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('🖱️  Click any URL to open in browser'));
    console.log(chalk.gray('📊 Status: 🟢 Running | 🔴 Stopped | ⚪ Unknown'));
    
    if (baseDomain === 'localhost') {
      console.log();
      console.log(chalk.yellow('💡 Tip: Set custom domain:'));
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
