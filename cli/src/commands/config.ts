/**
 * tdk config command
 *
 * Manage project configuration and regenerate master config files.
 * Subcommands: regenerate, verify, edit
 */

import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { findProjectRoot } from '../utils/services.js';
import { generateMasterConfigs, verifyMasterConfigs, readProjectConfig, TemplateEngine } from '../generator/template-engine.js';

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
            console.log(chalk.blue('🔍 Dry run - comparing current files with new configuration...\n'));

            const projectConfig = readProjectConfig(projectRoot);
            const engine = new TemplateEngine();
            const newFiles = engine.generateAll(projectConfig);

            const outputDir = join(projectRoot, '.tdk', '.tdk-out');
            const filesToCheck = [
              'tilt.config.json',
              'TILT_TECH_STACK.star',
              'TILT_RESOURCE_DEFAULTS.star',
              'spec.master',
            ];

            let hasChanges = false;

            for (const filename of filesToCheck) {
              const newContent = newFiles[filename as keyof typeof newFiles];
              const filePath = join(outputDir, filename);

              if (!existsSync(filePath)) {
                console.log(chalk.yellow(`📁 ${filename}`));
                console.log(chalk.gray('   Status: NEW (file does not exist)\n'));
                hasChanges = true;
                continue;
              }

              const currentContent = readFileSync(filePath, 'utf-8');

              if (currentContent === newContent) {
                console.log(chalk.green(`✓ ${filename}`));
                console.log(chalk.gray('   Status: No changes\n'));
              } else {
                console.log(chalk.yellow(`📝 ${filename}`));
                console.log(chalk.gray('   Status: MODIFIED'));

                // Show simple diff stats
                const currentLines = currentContent.split('\n').length;
                const newLines = newContent.split('\n').length;
                const lineDiff = newLines - currentLines;

                if (lineDiff > 0) {
                  console.log(chalk.gray(`   Lines: ${currentLines} → ${newLines} (+${lineDiff})`));
                } else if (lineDiff < 0) {
                  console.log(chalk.gray(`   Lines: ${currentLines} → ${newLines} (${lineDiff})`));
                } else {
                  console.log(chalk.gray(`   Lines: ${currentLines} (content changed)`));
                }

                // Show first difference context (up to 3 lines)
                const currentLinesArr = currentContent.split('\n');
                const newLinesArr = newContent.split('\n');
                let firstDiffLine = -1;

                for (let i = 0; i < Math.max(currentLinesArr.length, newLinesArr.length); i++) {
                  if (currentLinesArr[i] !== newLinesArr[i]) {
                    firstDiffLine = i;
                    break;
                  }
                }

                if (firstDiffLine >= 0) {
                  console.log(chalk.gray('   First change around line ' + (firstDiffLine + 1) + ':'));
                  const contextStart = Math.max(0, firstDiffLine - 1);
                  const contextEnd = Math.min(currentLinesArr.length, firstDiffLine + 2);

                  for (let i = contextStart; i < contextEnd; i++) {
                    const line = currentLinesArr[i];
                    const newLine = newLinesArr[i];
                    if (line !== newLine) {
                      if (line !== undefined) {
                        console.log(chalk.red(`     - ${line.substring(0, 60)}${line.length > 60 ? '...' : ''}`));
                      }
                      if (newLine !== undefined) {
                        console.log(chalk.green(`     + ${newLine.substring(0, 60)}${newLine.length > 60 ? '...' : ''}`));
                      }
                    } else {
                      console.log(chalk.gray(`       ${line.substring(0, 60)}${line.length > 60 ? '...' : ''}`));
                    }
                  }
                }

                console.log('');
                hasChanges = true;
              }
            }

            if (hasChanges) {
              console.log(chalk.blue('💡 Run without --dry-run to apply these changes.\n'));
            } else {
              console.log(chalk.green('✅ All files are already up to date!\n'));
            }

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
