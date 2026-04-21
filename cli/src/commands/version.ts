import { Command } from 'commander';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export const versionCommand = new Command('version')
  .description('Display version number')
  .alias('v')
  .action(() => {
    console.log(pkg.version);
  });
