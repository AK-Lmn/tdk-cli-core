/**
 * tdk upgrade command
 *
 * Self-update the TDK CLI to the latest version.
 * Detects installation method (npm, bun, or git) and upgrades accordingly.
 */

import { Command } from 'commander';
import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import ora from 'ora';

interface InstallInfo {
  method: 'npm' | 'bun' | 'git' | 'unknown';
  path?: string;
  version?: string;
}

// Detect how tdk was installed
function detectInstallation(): InstallInfo {
  try {
    const tdkPath = execSync('which tdk', { encoding: 'utf-8' }).trim();
    
    // Check if it's a symlink to a local git repo (bun link / npm link)
    try {
      const realPath = execSync('readlink -f ' + tdkPath, { encoding: 'utf-8' }).trim();
      // If the real path contains tdk-cli and has .git, it's a linked git install
      if (realPath.includes('tdk-cli')) {
        const possibleGitRoot = resolve(realPath, '..', '..', '..');
        if (existsSync(join(possibleGitRoot, '.git'))) {
          return { method: 'git', path: possibleGitRoot };
        }
      }
    } catch {
      // readlink failed, not a symlink
    }
    
    // Check if it's in a global npm/bun directory (actual install, not link)
    if (tdkPath.includes('node_modules') || tdkPath.includes('.npm') || tdkPath.includes('.bun')) {
      // Check if bun was used
      if (tdkPath.includes('.bun')) {
        return { method: 'bun', path: tdkPath };
      }
      return { method: 'npm', path: tdkPath };
    }
    
    // Check if current file is in a git repo (development)
    const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    if (existsSync(join(cliRoot, '.git'))) {
      return { method: 'git', path: cliRoot };
    }
    
    return { method: 'unknown', path: tdkPath };
  } catch {
    return { method: 'unknown' };
  }
}

function getCurrentVersion(): string {
  try {
    const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Check for latest version from npm or git
async function getLatestVersion(): Promise<string | null> {
  const spinner = ora('Checking for latest version...').start();
  
  try {
    const result = execSync('npm view @tdk/cli version', { 
      encoding: 'utf-8',
      timeout: 10000 
    }).trim();
    spinner.succeed(`Latest version: ${chalk.green(result)}`);
    return result;
  } catch {
    // npm registry failed - package not published yet
    spinner.warn('Package not yet published to npm registry');
    console.log(chalk.yellow('\n💡 For now, please upgrade manually from GitHub:'));
    console.log(chalk.cyan('   npm install -g github:tdk-landscape/tdk-cli'));
    console.log(chalk.cyan('   bun install -g github:tdk-landscape/tdk-cli'));
    console.log(chalk.gray('\n   (npm package will be available soon)'));
    return null;
  }
}

// Upgrade via npm (GitHub fallback)
async function upgradeViaNpm(): Promise<boolean> {
  const spinner = ora('Upgrading via npm...').start();
  
  try {
    execSync('npm install -g @tdk/cli@latest', {
      stdio: 'inherit',
      timeout: 120000,
    });
    spinner.succeed('Upgraded successfully via npm');
    return true;
  } catch {
    // Fall back to GitHub
    spinner.text = 'npm registry failed, trying GitHub...';
    try {
      execSync('npm install -g github:tdk-landscape/tdk-cli', {
        stdio: 'inherit',
        timeout: 120000,
      });
      spinner.succeed('Upgraded successfully via GitHub');
      return true;
    } catch (err) {
      spinner.fail(`Upgrade failed: ${err}`);
      return false;
    }
  }
}

// Upgrade via bun (GitHub fallback)
async function upgradeViaBun(): Promise<boolean> {
  const spinner = ora('Upgrading via bun...').start();
  
  try {
    execSync('bun install -g @tdk/cli@latest', {
      stdio: 'inherit',
      timeout: 120000,
    });
    spinner.succeed('Upgraded successfully via bun');
    return true;
  } catch {
    // Fall back to GitHub
    spinner.text = 'npm registry failed, trying GitHub...';
    try {
      execSync('bun install -g github:tdk-landscape/tdk-cli', {
        stdio: 'inherit',
        timeout: 120000,
      });
      spinner.succeed('Upgraded successfully via GitHub');
      return true;
    } catch (err) {
      spinner.fail(`Upgrade failed: ${err}`);
      return false;
    }
  }
}

// Upgrade via git pull
async function upgradeViaGit(path: string): Promise<boolean> {
  const spinner = ora('Pulling latest changes from git...').start();
  
  try {
    // Check if we're in a git repo
    execSync('git rev-parse --git-dir', { 
      cwd: path,
      stdio: 'pipe'
    });
    
    // Fetch latest
    spinner.text = 'Fetching from origin...';
    execSync('git fetch origin', { 
      cwd: path,
      stdio: 'pipe',
      timeout: 30000
    });
    
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      cwd: path,
      encoding: 'utf-8' 
    }).trim();
    
    // Pull latest
    spinner.text = `Pulling latest on ${branch}...`;
    execSync(`git pull origin ${branch}`, { 
      cwd: path,
      stdio: 'pipe',
      timeout: 30000
    });
    
    // Rebuild if needed
    if (existsSync(join(path, 'cli', 'package.json'))) {
      spinner.text = 'Rebuilding CLI...';
      execSync('bun install && bun run build', {
        cwd: join(path, 'cli'),
        stdio: 'pipe',
        timeout: 60000
      });
    }
    
    // Re-link to ensure tdk command is available
    spinner.text = 'Re-linking CLI...';
    try {
      execSync('bun link --force', {
        cwd: join(path, 'cli'),
        stdio: 'pipe',
        timeout: 30000
      });
    } catch {
      // Link might fail if already linked, that's ok
    }
    
    spinner.succeed('Upgraded successfully via git pull');
    return true;
  } catch (err) {
    spinner.fail(`Git upgrade failed: ${err}`);
    return false;
  }
}

export const upgradeCommand = new Command('upgrade')
  .description('Upgrade TDK CLI to the latest version')
  .option('-f, --force', 'Force upgrade even if already on latest', false)
  .option('--dry-run', 'Show what would be upgraded without actually doing it', false)
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .action(async (options) => {
    console.log(chalk.cyan('🚀 TDK CLI Upgrade\n'));
    
    const currentVersion = getCurrentVersion();
    console.log(chalk.gray(`Current version: ${currentVersion}`));
    
    // Detect installation method
    const installInfo = detectInstallation();
    console.log(chalk.gray(`Installation method: ${installInfo.method}`));
    console.log();
    
    if (installInfo.method === 'unknown') {
      console.error(chalk.red('❌ Could not detect installation method'));
      console.log(chalk.yellow('\n💡 Manual upgrade (package not on npm yet, use GitHub):'));
      console.log(chalk.cyan('   npm:  npm install -g github:tdk-landscape/tdk-cli'));
      console.log(chalk.cyan('   bun:  bun install -g github:tdk-landscape/tdk-cli'));
      console.log(chalk.cyan('   git:  cd /path/to/tdk-cli && git pull && bun link --force'));
      process.exit(1);
    }
    
    let latestVersion: string | null = null;
    
    // For git installs, skip npm check and use git to check for updates
    if (installInfo.method === 'git' && installInfo.path) {
      console.log(chalk.blue('📦 Git installation detected - will pull latest from origin'));
      
      try {
        // Check if there are updates
        execSync('git fetch origin', { cwd: installInfo.path, stdio: 'pipe' });
        const localHash = execSync('git rev-parse HEAD', { cwd: installInfo.path, encoding: 'utf-8' }).trim();
        const remoteHash = execSync('git rev-parse origin/main', { cwd: installInfo.path, encoding: 'utf-8' }).trim();
        
        if (localHash === remoteHash && !options.force) {
          console.log(chalk.green('\n✅ Already up to date with origin/main!'));
          console.log(chalk.gray(`   Current: ${localHash.substring(0, 7)}`));
          console.log(chalk.gray('\n   Tip: Use --force to pull and rebuild anyway'));
          process.exit(0);
        }
        
        if (localHash !== remoteHash) {
          console.log(chalk.yellow(`\n⬆️  Updates available:`));
          console.log(chalk.gray(`   Local:  ${localHash.substring(0, 7)}`));
          console.log(chalk.gray(`   Remote: ${remoteHash.substring(0, 7)}`));
        } else {
          console.log(chalk.yellow(`\n🔄 Force upgrade requested`));
        }
        
        latestVersion = remoteHash.substring(0, 7);
      } catch (err) {
        console.warn(chalk.yellow('⚠️  Could not check git remote, will attempt upgrade anyway'));
        latestVersion = 'latest';
      }
    } else {
      // For npm/bun installs, check registry
      latestVersion = await getLatestVersion();
      
      if (!latestVersion) {
        console.error(chalk.red('\n❌ Could not determine latest version'));
        process.exit(1);
      }
      
      // Compare versions
      if (currentVersion === latestVersion && !options.force) {
        console.log(chalk.green('\n✅ You are already on the latest version!'));
        console.log(chalk.gray(`   ${currentVersion} (current) = ${latestVersion} (latest)`));
        process.exit(0);
      }
      
      if (currentVersion !== latestVersion) {
        console.log(chalk.yellow(`\n⬆️  Upgrade available: ${currentVersion} → ${latestVersion}`));
      } else if (options.force) {
        console.log(chalk.yellow(`\n🔄 Force upgrade requested (currently ${currentVersion})`));
      }
    }
    
    // Dry run mode
    if (options.dryRun) {
      console.log(chalk.blue('\n📋 Dry run mode - would perform:'));
      console.log(chalk.gray(`   Method: ${installInfo.method}`));
      if (installInfo.path) {
        console.log(chalk.gray(`   Path: ${installInfo.path}`));
      }
      if (installInfo.method === 'git') {
        console.log(chalk.gray('   Action: git pull origin main && bun install && bun link --force'));
      } else {
        console.log(chalk.gray(`   Action: Upgrade to ${latestVersion}`));
      }
      console.log(chalk.yellow('\n   (Not actually upgrading due to --dry-run)'));
      process.exit(0);
    }
    
    // Confirm upgrade (unless --yes flag)
    if (!options.yes) {
      console.log();
      const { confirm } = await import('inquirer').then(m => m.default.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with upgrade?',
        default: true
      }]));
      
      if (!confirm) {
        console.log(chalk.yellow('Cancelled.'));
        process.exit(0);
      }
    } else {
      console.log(chalk.gray('⚡ Auto-confirming (--yes flag)\n'));
    }
    
    console.log();
    
    // Perform upgrade
    let success = false;
    
    switch (installInfo.method) {
      case 'npm':
        success = await upgradeViaNpm();
        break;
      case 'bun':
        success = await upgradeViaBun();
        break;
      case 'git':
        if (installInfo.path) {
          success = await upgradeViaGit(installInfo.path);
        }
        break;
    }
    
    if (!success) {
      console.error(chalk.red('\n❌ Upgrade failed'));
      console.log(chalk.yellow('\n💡 Try manual upgrade (use GitHub until npm package is published):'));
      if (installInfo.method === 'npm') {
        console.log(chalk.cyan('   npm install -g github:tdk-landscape/tdk-cli'));
      } else if (installInfo.method === 'bun') {
        console.log(chalk.cyan('   bun install -g github:tdk-landscape/tdk-cli'));
      } else if (installInfo.method === 'git') {
        console.log(chalk.cyan(`   cd ${installInfo.path} && git pull && bun link --force`));
      }
      process.exit(1);
    }
    
    // Verify new version
    console.log();
    const verifySpinner = ora('Verifying upgrade...').start();
    
    try {
      // Small delay to ensure filesystem reflects changes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newVersion = execSync('tdk version', { encoding: 'utf-8' }).trim();
      verifySpinner.succeed(`Verified: now running ${chalk.green(newVersion)}`);
      
      console.log();
      console.log(chalk.green.bold('✨ Upgrade complete!'));
      console.log(chalk.gray(`   Version: ${currentVersion} → ${newVersion}`));
      
      // Show installation details
      console.log();
      console.log(chalk.cyan.bold('📍 Installation Details:'));
      if (installInfo.method === 'git' && installInfo.path) {
        console.log(chalk.gray(`   Location: ${installInfo.path}`));
        console.log(chalk.gray(`   Method:   git clone + bun link`));
      } else {
        console.log(chalk.gray(`   Method:   ${installInfo.method}`));
      }
      console.log(chalk.gray(`   Binary:   ${execSync('which tdk', { encoding: 'utf-8' }).trim()}`));
      
      // Next steps
      console.log();
      console.log(chalk.cyan.bold('🚀 Quick Start:'));
      console.log(chalk.white(`   tdk --help         Show all commands`));
      console.log(chalk.white(`   tdk networks       View service URLs`));
      console.log(chalk.white(`   tdk doctor         Check environment`));
      
      if (newVersion === currentVersion && !options.force) {
        console.log();
        console.log(chalk.yellow('💡 Tip: Version appears unchanged. You may need to restart your terminal.'));
      }
      
      console.log();
      console.log(chalk.green('Happy coding! 🎉'));
      
    } catch {
      verifySpinner.warn('Could not verify new version');
      console.log();
      console.log(chalk.green.bold('✨ Upgrade likely complete!'));
      console.log();
      console.log(chalk.yellow('💡 Next steps:'));
      console.log(chalk.white('   1. Restart your terminal'));
      console.log(chalk.white('   2. Run: tdk -v'));
      console.log(chalk.white('   3. Run: tdk --help'));
    }
  });
