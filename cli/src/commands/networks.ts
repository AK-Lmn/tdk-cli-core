/**
 * tdk networks command
 *
 * Show all Traefik-routed URLs for services with basePath.
 * URLs are clickable in modern terminals.
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
  // Check environment variable first
  if (process.env.TDK_PUBLIC_HOST) {
    return process.env.TDK_PUBLIC_HOST;
  }
  
  // Try to detect from Traefik labels if running
  try {
    const traefikLabels = execSync(
      'docker ps --filter "label=traefik.enable=true" --format "{{.Labels}}" 2>/dev/null | head -1',
      { encoding: 'utf-8' }
    );
    // Extract domain from traefik labels if present
    const domainMatch = traefikLabels.match(/traefik\.http\.routers\.[\w-]+\.rule=Host\(`([^`]+)`\)/);
    if (domainMatch) {
      return domainMatch[1];
    }
  } catch {
    // Ignore errors, use default
  }
  
  // Default to localhost
  return 'localhost';
}

// Check if a service is running
function checkServiceStatus(serviceName: string): 'running' | 'stopped' | 'unknown' {
  try {
    // Check if container is running
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

// Generate clickable URL using ANSI escape codes
function makeClickable(url: string, text?: string): string {
  const displayText = text || url;
  // ANSI hyperlink escape sequence: \e]8;;URL\e\\TEXT\e]8;;\e\\
  return `\u001b]8;;${url}\u001b\\${displayText}\u001b]8;;\u001b\\`;
}

export const networksCommand = new Command('networks')
  .description('Show Traefik-routed URLs for all services')
  .alias('urls')
  .alias('traefik')
  .option('-s, --stack <stack>', 'Filter by stack name')
  .option('-o, --open', 'Open URLs in browser (shows list to choose from)')
  .option('--json', 'Output as JSON')
  .option('--raw', 'Output raw URLs only (no formatting)')
  .action(async (options) => {
    const projectRoot = findProjectRoot();
    
    if (!projectRoot) {
      console.error(chalk.red('❌ Not in a TDK project directory'));
      process.exit(1);
    }
    
    const baseDomain = getBaseDomain();
    const services = discoverServices();
    
    // Filter services with basePath
    const servicesWithUrls: ServiceUrl[] = services
      .filter(s => s.config?.basePath)
      .map(s => {
        const basePath = s.config!.basePath!.replace(/^\//, ''); // Remove leading slash
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
    
    // Filter by stack if specified
    const filteredServices = options.stack
      ? servicesWithUrls.filter(s => s.stack === options.stack)
      : servicesWithUrls;
    
    if (filteredServices.length === 0) {
      if (options.stack) {
        console.log(chalk.yellow(`⚠️  No services with basePath found in stack "${options.stack}"`));
      } else {
        console.log(chalk.yellow('⚠️  No services with basePath found'));
        console.log(chalk.gray('\nAdd basePath to your service.json to generate URLs:'));
        console.log(chalk.gray('  "basePath": "/my-service"'));
      }
      process.exit(0);
    }
    
    // JSON output
    if (options.json) {
      console.log(JSON.stringify(filteredServices, null, 2));
      process.exit(0);
    }
    
    // Raw output
    if (options.raw) {
      for (const service of filteredServices) {
        console.log(service.url);
      }
      process.exit(0);
    }
    
    // Pretty output
    console.log();
    console.log(chalk.cyan.bold('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║') + chalk.white.bold('           🌐 Traefik Network URLs') + ' '.repeat(21) + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('╠════════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan.bold('║') + chalk.gray(`  Base Domain: ${baseDomain}`).padEnd(58) + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝'));
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
      // Stack header
      const stackEmoji = getStackEmoji(stackName);
      console.log(chalk.bold(`${stackEmoji} ${stackName}`));
      console.log(chalk.gray('  ' + '─'.repeat(56)));
      
      // Services in stack
      for (const service of stackServices) {
        const statusEmoji = service.status === 'running' ? '🟢' : 
                           service.status === 'stopped' ? '🔴' : '⚪';
        const clickableUrl = makeClickable(service.url, chalk.underline.cyan(service.url));
        
        console.log(`  ${statusEmoji} ${chalk.white(service.name.padEnd(24))} ${clickableUrl}`);
      }
      
      console.log();
    }
    
    // Footer
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('🖱️  Click URLs to open in browser'));
    console.log(chalk.gray('📊 Status: 🟢 Running | 🔴 Stopped | ⚪ Unknown'));
    
    if (baseDomain === 'localhost') {
      console.log();
      console.log(chalk.yellow('💡 Tip: Set custom domain with:'));
      console.log(chalk.cyan('   export TDK_PUBLIC_HOST=beauty-crm.localhost'));
    }
    
    console.log();
    
    // Open option
    if (options.open) {
      console.log(chalk.yellow('Use Ctrl+Click on URLs above to open in browser'));
      console.log(chalk.gray('Or run with specific URL: tdk networks | xargs open'));
    }
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
