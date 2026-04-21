#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'node:module';
import { listCommand } from './commands/list.js';
import { upCommand } from './commands/up.js';
import { downCommand } from './commands/down.js';
import { statusCommand } from './commands/status.js';
import { initCommand } from './commands/init.js';
import { watchCommand } from './commands/watch.js';
import { uiCommand } from './commands/ui.js';
import { versionCommand } from './commands/version.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('tdk')
  .description('Tilt Development Kit - Stack filtering on top of Tilt')
  .version(pkg.version, '-v, --version', 'Display version number')
  .option('--verbose', 'Enable verbose output', false)
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str))
  });

// Public CLI commands
program.addCommand(listCommand);
program.addCommand(upCommand);
program.addCommand(downCommand);
program.addCommand(statusCommand);
program.addCommand(initCommand);
program.addCommand(watchCommand);
program.addCommand(uiCommand);
program.addCommand(versionCommand);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();
