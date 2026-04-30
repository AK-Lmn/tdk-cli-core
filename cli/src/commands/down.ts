/** tdk down command */

import { Command } from 'commander';
import chalk from 'chalk';
import { runTilt, buildTiltDownArgs, isTiltAvailable } from '../utils/tilt.js';
import { runCommand, errorFactories } from '../utils/errors.js';

export const downCommand = new Command('down')
  .description('Stop all tilt resources')
  .option('-v, --verbose', 'Enable verbose output', false)
  .option('-f, --force', 'Skip confirmation', false)
  .option('--dry-run', 'Show what would be stopped without stopping', false)
  .action(async (options) => {
    await runCommand(async () => {
      if (!await isTiltAvailable()) {
        errorFactories.tiltNotInstalled().display();
        process.exit(1);
      }

      if (options.dryRun) {
        console.log(chalk.gray('Dry run - not stopping resources.'));
        console.log(chalk.gray('Would run: tilt down'));
        return;
      }

      const tiltArgs = buildTiltDownArgs({
        force: options.force
      });

      console.log(chalk.blue('Stopping all tilt resources...'));

      if (options.verbose) {
        console.log(chalk.gray('Running: tilt down -f .tdk/.tdk-out/Tiltfile'));
      }

      const result = await runTilt('down', tiltArgs, {
        verbose: options.verbose,
        inheritStdio: true  // Pass through tilt's output
      });

      if (result.exitCode !== 0) {
        console.error(chalk.red(`\ntilt down failed with exit code ${result.exitCode}`));
        process.exit(result.exitCode);
      }
    });
  });
