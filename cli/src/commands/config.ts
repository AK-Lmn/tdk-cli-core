/**
 * tdk config command
 *
 * Manage project configuration and regenerate master config files.
 * Subcommands: regenerate, verify, edit
 */

import { Command } from 'commander';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { findProjectRoot } from '../utils/services.js';
import { generateMasterConfigs, verifyMasterConfigs, readProjectConfig } from '../generator/template-engine.js';

export const configCommand = new Command('config')
  .description('Manage project configuration and regenerate master files')
  .addCommand(
    new Command('regenerate')
      .description('Regenerate all 4 master config files from .tdk/project.json')
      .option('--dry-run', 'Show what would change without writing files')
      .action(async (options) => {
        try {
          const projectRoot = findProjectRoot();
          if (!projectRoot) {
            console.error(chalk.red('Error: Not in a TDK project'));
            process.exit(1);
          }

          if (options.dryRun) {
            console.log(chalk.blue('🔍 Dry run - showing changes...\n'));
            // TODO: Implement diff logic
            console.log(chalk.gray('Would regenerate:'));
            console.log(chalk.gray('  - tilt.config.json'));
            console.log(chalk.gray('  - TILT_TECH_STACK.star'));
            console.log(chalk.gray('  - TILT_RESOURCE_DEFAULTS.star'));
            console.log(chalk.gray('  - spec.master'));
            return;
          }

          console.log(chalk.blue('📋 Regenerating master configuration files...\n'));
          generateMasterConfigs(projectRoot);
          console.log(chalk.green('\n✅ Configuration regenerated!'));
        } catch (err) {
          console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('verify')
      .description('Verify that generated files match .tdk/project.json')
      .action(async () => {
        try {
          const projectRoot = findProjectRoot();
          if (!projectRoot) {
            console.error(chalk.red('Error: Not in a TDK project'));
            process.exit(1);
          }

          console.log(chalk.blue('🔍 Verifying configuration...\n'));
          const result = verifyMasterConfigs(projectRoot);

          if (result.valid) {
            console.log(chalk.green('✅ All files are in sync!'));
            process.exit(0);
          } else {
            console.log(chalk.yellow('⚠️  Configuration issues found:'));
            for (const error of result.errors) {
              console.log(chalk.gray(`   - ${error}`));
            }
            console.log(chalk.gray('\nRun `tdk config regenerate` to fix.'));
            process.exit(1);
          }
        } catch (err) {
          console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('edit')
      .description('Open .tdk/project.json in your $EDITOR')
      .action(async () => {
        try {
          const projectRoot = findProjectRoot();
          if (!projectRoot) {
            console.error(chalk.red('Error: Not in a TDK project'));
            process.exit(1);
          }

          const projectJsonPath = join(projectRoot, '.tdk', 'project.json');
          if (!existsSync(projectJsonPath)) {
            console.error(chalk.red('Error: .tdk/project.json not found'));
            process.exit(1);
          }

          const editor = process.env.EDITOR || 'vi';
          console.log(chalk.blue(`Opening ${projectJsonPath} in ${editor}...`));
          execSync(`${editor} "${projectJsonPath}"`, { stdio: 'inherit' });

          console.log(chalk.green('\n✅ Editor closed.'));
          console.log(chalk.gray('Run `tdk config regenerate` to apply changes.'));
        } catch (err) {
          console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('enable-infra')
      .description('Enable optional infrastructure service')
      .argument('<service>', 'Service name (monitoring, elk, debezium, golden_image)')
      .action(async (service) => {
        try {
          const projectRoot = findProjectRoot();
          if (!projectRoot) {
            console.error(chalk.red('Error: Not in a TDK project'));
            process.exit(1);
          }

          const validServices = ['monitoring', 'elk', 'debezium', 'golden_image'];
          if (!validServices.includes(service)) {
            console.error(chalk.red(`Error: Invalid service. Must be one of: ${validServices.join(', ')}`));
            process.exit(1);
          }

          const config = readProjectConfig(projectRoot);
          config.optional_infra[service as keyof typeof config.optional_infra] = true;

          const projectJsonPath = join(projectRoot, '.tdk', 'project.json');
          writeFileSync(projectJsonPath, JSON.stringify(config, null, 2), 'utf-8');

          console.log(chalk.green(`✓ Enabled: ${service}`));
          console.log(chalk.gray('Run `tdk config regenerate` to apply.'));
        } catch (err) {
          console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('disable-infra')
      .description('Disable optional infrastructure service')
      .argument('<service>', 'Service name (monitoring, elk, debezium, golden_image)')
      .action(async (service) => {
        try {
          const projectRoot = findProjectRoot();
          if (!projectRoot) {
            console.error(chalk.red('Error: Not in a TDK project'));
            process.exit(1);
          }

          const validServices = ['monitoring', 'elk', 'debezium', 'golden_image'];
          if (!validServices.includes(service)) {
            console.error(chalk.red(`Error: Invalid service. Must be one of: ${validServices.join(', ')}`));
            process.exit(1);
          }

          const config = readProjectConfig(projectRoot);
          config.optional_infra[service as keyof typeof config.optional_infra] = false;

          const projectJsonPath = join(projectRoot, '.tdk', 'project.json');
          writeFileSync(projectJsonPath, JSON.stringify(config, null, 2), 'utf-8');

          console.log(chalk.green(`✓ Disabled: ${service}`));
          console.log(chalk.gray('Run `tdk config regenerate` to apply.'));
        } catch (err) {
          console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
          process.exit(1);
        }
      })
  );

export default configCommand;
