/**
 * tdk project command
 *
 * Initialize or validate project-level master configuration.
 * Creates .tdk/project.json and generates all 4 master config files from templates.
 */

import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { findProjectRoot } from '../utils/services.js';
import { generateMasterConfigs, readProjectConfig } from '../generator/template-engine.js';

// Default project configuration template
const DEFAULT_PROJECT_JSON = {
  version: "1.0",
  project: {
    name: "",
    version: "1.0.0"
  },
  stacks: {
    pre_alpha: {
      name: "Pre-Alpha",
      description: "Core infrastructure and MVP services",
      services: ["identity"]
    },
    alpha: {
      name: "Alpha",
      description: "Essential business services",
      services: []
    },
    beta: {
      name: "Beta",
      description: "Extended features",
      services: []
    },
    out_of_scope: {
      name: "Out of Scope",
      description: "Future releases",
      services: []
    }
  },
  optional_infra: {
    monitoring: false,
    elk: false,
    debezium: false,
    golden_image: true
  },
  discovery: {
    paths: ["services/product/*", "services/platform/*"]
  },
  overrides: {}
};

export const projectCommand = new Command('project')
  .description('Initialize or validate project-level master configuration')
  .option('--check', 'Check if master configs exist and are in sync')
  .option('--force', 'Overwrite existing configuration (dangerous)')
  .option('--yes', 'Non-interactive mode (use defaults)')
  .option('--config-file <path>', 'Load project config from existing JSON file')
  .action(async (options) => {
    try {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error(chalk.red('Error: Not in a TDK project (no Tiltfile found)'));
        process.exit(1);
      }

      const tdkDir = join(projectRoot, '.tdk');
      const projectJsonPath = join(tdkDir, 'project.json');

      // Check mode - verify files exist and are in sync
      if (options.check) {
        const allFilesExist = ['tilt.config.json', 'TILT_TECH_STACK.star', 'TILT_SERVICE_DEFAULTS.star', 'spec.master']
          .every(f => existsSync(join(projectRoot, '.tdk', '.tdk-out', f)));
        const projectJsonExists = existsSync(projectJsonPath);

        if (allFilesExist && projectJsonExists) {
          // Verify files are in sync
          try {
            const projectConfig = readProjectConfig(projectRoot);
            console.log(chalk.green('✅ Project configuration is valid'));
            console.log(chalk.gray(`   Project: ${projectConfig.project.name}`));
            console.log(chalk.gray(`   Stacks: ${Object.keys(projectConfig.stacks).join(', ')}`));
            process.exit(0);
          } catch (err) {
            console.log(chalk.yellow('⚠️  Project configuration out of sync'));
            console.log(chalk.gray(`   Error: ${err instanceof Error ? err.message : String(err)}`));
            console.log(chalk.gray('\nRun `tdk project` to regenerate.'));
            process.exit(1);
          }
        } else {
          console.log(chalk.yellow('⚠️  Project configuration incomplete:'));
          if (!projectJsonExists) console.log(chalk.gray('   - .tdk/project.json (not found)'));
          if (!allFilesExist) {
            ['tilt.config.json', 'TILT_TECH_STACK.star', 'TILT_SERVICE_DEFAULTS.star', 'spec.master']
              .filter(f => !existsSync(join(projectRoot, '.tdk/.tdk-out', f)))
              .forEach(f => console.log(chalk.gray(`   - .tdk/.tdk-out/${f} (not found)`)));
          }
          console.log(chalk.gray('\nRun `tdk project` to create them.'));
          process.exit(1);
        }
      }

      // Normal mode - create/update files
      console.log(chalk.blue('TDK Project Configuration\n'));
      console.log(chalk.gray(`Project root: ${projectRoot}\n`));

      // Ensure .tdk directory exists
      if (!existsSync(tdkDir)) {
        mkdirSync(tdkDir, { recursive: true });
        console.log(chalk.green('✓ Created: .tdk/ directory'));
      }

      // Check if project.json exists
      const projectJsonExists = existsSync(projectJsonPath);

      if (projectJsonExists && !options.force) {
        // Project already configured - just regenerate files
        console.log(chalk.green('✓ .tdk/project.json exists'));
        console.log(chalk.blue('\n📋 Regenerating master configuration files...\n'));

        try {
          generateMasterConfigs(projectRoot);
      console.log(chalk.green('\n✅ Project configuration regenerated!'));
      console.log(chalk.gray('\nGenerated in .tdk/.tdk-out/:'));
      console.log(chalk.gray('  - tilt.config.json (Tilt UI settings)'));
      console.log(chalk.gray('  - TILT_TECH_STACK.star (tech stack constants)'));
      console.log(chalk.gray('  - TILT_SERVICE_DEFAULTS.star (service defaults)'));
      console.log(chalk.gray('  - spec.master (stack definitions)'));
          return;
        } catch (err) {
          console.error(chalk.red(`\n❌ Error generating files: ${err instanceof Error ? err.message : String(err)}`));
          process.exit(1);
        }
      }

      // Need to create project.json
      if (projectJsonExists && options.force) {
        console.log(chalk.red('\n⚠️  WARNING: --force will overwrite .tdk/project.json!'));
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'This will reset your project configuration. Continue?',
          default: false
        }]);
        if (!confirm) {
          console.log(chalk.yellow('Cancelled.'));
          return;
        }
      }

      // Interactive wizard or load from file
      let projectConfig: typeof DEFAULT_PROJECT_JSON;

      if (options.configFile) {
        // Load from existing file
        const configFilePath = resolve(options.configFile);
        if (!existsSync(configFilePath)) {
          console.error(chalk.red(`Error: Config file not found: ${configFilePath}`));
          process.exit(1);
        }
        const configContent = await import('node:fs').then(fs => fs.readFileSync(configFilePath, 'utf-8'));
        projectConfig = JSON.parse(configContent);
        console.log(chalk.green(`✓ Loaded config from: ${configFilePath}`));
      } else if (options.yes) {
        // Non-interactive mode with defaults
        projectConfig = JSON.parse(JSON.stringify(DEFAULT_PROJECT_JSON));
        projectConfig.project.name = projectRoot.split('/').pop() || 'my-project';
        console.log(chalk.gray('Using default configuration (non-interactive mode)'));
      } else {
        // Interactive wizard
        console.log(chalk.blue('📝 Project Setup Wizard\n'));

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            default: projectRoot.split('/').pop() || 'my-project',
            validate: (input: string) => input.trim() !== '' || 'Project name is required'
          },
          {
            type: 'input',
            name: 'version',
            message: 'Project version:',
            default: '1.0.0-alpha'
          },
          {
            type: 'checkbox',
            name: 'preAlphaServices',
            message: 'Select Pre-Alpha services (core infrastructure):',
            choices: [
              { name: 'identity (Authentication)', value: 'identity', checked: true },
              { name: 'proxy (Traefik)', value: 'proxy' },
              { name: 'verdaccio (NPM registry)', value: 'verdaccio' },
              { name: 'infisical (Secrets)', value: 'infisical' },
              { name: 'database-management (PostgreSQL)', value: 'database-management' },
              { name: 'mdblaster (Docs)', value: 'mdblaster' }
            ]
          },
          {
            type: 'checkbox',
            name: 'alphaServices',
            message: 'Select Alpha services (core business):',
            choices: [
              { name: 'appointment', value: 'appointment' },
              { name: 'appointment-planner', value: 'appointment-planner' },
              { name: 'salon', value: 'salon' },
              { name: 'gdpr', value: 'gdpr' }
            ]
          },
          {
            type: 'checkbox',
            name: 'betaServices',
            message: 'Select Beta services (extended features):',
            choices: [
              { name: 'accounting', value: 'accounting' },
              { name: 'website', value: 'website' },
              { name: 'payment', value: 'payment' },
              { name: 'reporting', value: 'reporting' },
              { name: 'billing', value: 'billing' }
            ]
          },
          {
            type: 'checkbox',
            name: 'optionalInfra',
            message: 'Enable optional infrastructure (high resource):',
            choices: [
              { name: 'monitoring (SigNoz/SkyWalking)', value: 'monitoring' },
              { name: 'elk (Elasticsearch stack)', value: 'elk' },
              { name: 'debezium (CDC)', value: 'debezium' },
              { name: 'golden_image (One-time build)', value: 'golden_image', checked: true }
            ]
          }
        ]);

        projectConfig = JSON.parse(JSON.stringify(DEFAULT_PROJECT_JSON));
        projectConfig.project.name = answers.name;
        projectConfig.project.version = answers.version;
        projectConfig.stacks.pre_alpha.services = answers.preAlphaServices;
        projectConfig.stacks.alpha.services = answers.alphaServices;
        projectConfig.stacks.beta.services = answers.betaServices;
        projectConfig.optional_infra.monitoring = answers.optionalInfra.includes('monitoring');
        projectConfig.optional_infra.elk = answers.optionalInfra.includes('elk');
        projectConfig.optional_infra.debezium = answers.optionalInfra.includes('debezium');
        projectConfig.optional_infra.golden_image = answers.optionalInfra.includes('golden_image');
      }

      // Write project.json
      console.log(chalk.blue('\n📋 Creating project configuration...\n'));
      writeFileSync(projectJsonPath, JSON.stringify(projectConfig, null, 2), 'utf-8');
      console.log(chalk.green(`✓ Created: .tdk/project.json`));
      console.log(chalk.gray(`  → Project: ${projectConfig.project.name}`));

      // Generate all 4 master config files
      console.log(chalk.blue('\n📋 Generating master configuration files...\n'));
      generateMasterConfigs(projectRoot);

      console.log(chalk.green('\n✅ Project configuration complete!'));
      console.log(chalk.gray('\nGenerated files in .tdk/.tdk-out/:'));
      console.log(chalk.gray('  - tilt.config.json (Tilt UI settings)'));
      console.log(chalk.gray('  - TILT_TECH_STACK.star (tech stack constants)'));
      console.log(chalk.gray('  - TILT_SERVICE_DEFAULTS.star (service defaults)'));
      console.log(chalk.gray('  - spec.master (stack definitions)'));
      console.log(chalk.gray('\nSource file:'));
      console.log(chalk.gray('  - .tdk/project.json (edit this to change project structure)'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Run `tdk config regenerate` after editing .tdk/project.json'));
      console.log(chalk.gray('  2. Run `tdk stack` to manage services in stacks'));
      console.log(chalk.gray('  3. Run `tdk up` to start development'));

    } catch (err) {
      console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
  });

export default projectCommand;
