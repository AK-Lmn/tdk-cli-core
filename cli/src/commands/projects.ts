/**
 * tdk projects command
 *
 * Shows project-level information and configuration status.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { findProjectRoot, discoverServices, getAllStacks } from '../utils/services.js';

export const projectsCommand = new Command('projects')
  .description('Show project information and configuration status')
  .alias('info')
  .option('--check', 'Check if project is properly configured', false)
  .action(async (options) => {
    try {
      const projectRoot = findProjectRoot();
      
      if (!projectRoot) {
        console.error(chalk.red('Error: Could not find project root (no Tiltfile found).'));
        console.error(chalk.gray('Run this from within a project that has a Tiltfile.'));
        process.exit(1);
      }

      console.log(chalk.blue('Project Information\n'));
      
      // Basic project info
      console.log(chalk.bold('Project Root:'));
      console.log(chalk.gray(`  ${projectRoot}`));
      console.log();

      // Check master configs
      const defaultsPath = resolve(projectRoot, 'TILT_RESOURCE_DEFAULTS.star');
      const techStackPath = resolve(projectRoot, 'TILT_TECH_STACK.star');
      
      const defaultsExists = existsSync(defaultsPath);
      const techStackExists = existsSync(techStackPath);

      console.log(chalk.bold('Master Configuration:'));
      if (defaultsExists) {
        console.log(chalk.green(`  ✓ TILT_RESOURCE_DEFAULTS.star`));
      } else {
        console.log(chalk.red(`  ✗ TILT_RESOURCE_DEFAULTS.star (missing)`));
      }
      
      if (techStackExists) {
        console.log(chalk.green(`  ✓ TILT_TECH_STACK.star`));
      } else {
        console.log(chalk.red(`  ✗ TILT_TECH_STACK.star (missing)`));
      }
      console.log();

      // Discovery stats
      const resources = discoverServices();
      const stackNames = getAllStacks(resources);

      console.log(chalk.bold('Project Stats:'));
      console.log(chalk.gray(`  Resources: ${resources.length}`));
      console.log(chalk.gray(`  Stacks:    ${stackNames.length}`));
      
      const withoutStack = resources.filter(r => !r.stack).length;
      if (withoutStack > 0) {
        console.log(chalk.yellow(`  ⚠ Unassigned: ${withoutStack} resource${withoutStack === 1 ? '' : 's'}`));
      }
      console.log();

      // Show stacks list if any
      if (stackNames.length > 0) {
        console.log(chalk.bold('Stacks:'));
        for (const name of stackNames.sort()) {
          const count = resources.filter(r => r.stack === name).length;
          console.log(chalk.gray(`  ${name} (${count} resource${count === 1 ? '' : 's'})`));
        }
        console.log();
      }

      // Quick help
      if (!defaultsExists || !techStackExists) {
        console.log(chalk.yellow('Project not fully configured!'));
        console.log(chalk.gray('Run "tdk project" to create master config files.\n'));
      } else {
        console.log(chalk.gray('Quick commands:'));
        console.log(chalk.gray('  tdk resource    - Create a new resource'));
        console.log(chalk.gray('  tdk stack       - Organize resources into stacks'));
        console.log(chalk.gray('  tdk up <stack>  - Start a stack'));
      }

      // Exit code for --check mode
      if (options.check) {
        const isConfigured = defaultsExists && techStackExists;
        process.exit(isConfigured ? 0 : 1);
      }

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });
