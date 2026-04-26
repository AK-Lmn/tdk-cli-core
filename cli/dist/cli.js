#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'node:module';
import { stacksCommand } from './commands/stacks.js';
import { resourcesCommand } from './commands/resources.js';
import { projectsCommand } from './commands/projects.js';
import { upCommand } from './commands/up.js';
import { downCommand } from './commands/down.js';
import { statusCommand } from './commands/status.js';
import { stackCommand } from './commands/stack.js';
import { uiCommand } from './commands/ui.js';
import { versionCommand } from './commands/version.js';
import { doctorCommand } from './commands/doctor.js';
import { projectCommand } from './commands/project.js';
import { resourceCommand } from './commands/resource.js';
import { completionCommand } from './commands/completion.js';
import { upgradeCommand } from './commands/upgrade.js';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');
// ASCII art banner for tdk
const TDK_BANNER = `
╔══════════════════════════════════════════╗
║                                          ║
║     🚀  TDK - Tilt Development Kit        ║
║                                          ║
║     Project → Stack → Resource           ║
║                                          ║
╚══════════════════════════════════════════╝
`;
const program = new Command();
program
    .name('tdk')
    .description('Tilt Development Kit - Project/Stack/Resource management')
    .version(pkg.version, '-v, --version', 'Display version number')
    .option('--verbose', 'Enable verbose output', false)
    .configureOutput({
    outputError: (str, write) => write(chalk.red(str))
})
    .hook('preAction', (thisCommand) => {
    // Show banner on certain commands
    const commandName = thisCommand.args[0];
    if (!commandName || ['help', '-h', '--help'].includes(commandName)) {
        console.log(chalk.cyan(TDK_BANNER));
    }
});
// Public CLI commands
// List commands
program.addCommand(stacksCommand);
program.addCommand(resourcesCommand);
program.addCommand(projectsCommand);
// Lifecycle commands
program.addCommand(upCommand);
program.addCommand(downCommand);
program.addCommand(statusCommand);
// Management commands
program.addCommand(stackCommand);
program.addCommand(resourceCommand);
program.addCommand(projectCommand);
// Utility commands
program.addCommand(uiCommand);
program.addCommand(versionCommand);
program.addCommand(doctorCommand);
program.addCommand(completionCommand);
program.addCommand(upgradeCommand);
// Show help if no command provided
if (process.argv.length === 2) {
    program.help();
}
program.parse();
//# sourceMappingURL=cli.js.map