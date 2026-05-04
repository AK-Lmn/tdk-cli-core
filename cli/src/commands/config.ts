import { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import chalk from 'chalk';
import { requireProjectRoot, runCommand } from '../utils/errors.js';
import { assertValid } from '../utils/command-helpers.js';
import { generateMasterConfigs, verifyMasterConfigs, readProjectConfig, TemplateEngine } from '../generator/template-engine.js';
import { MASTER_CONFIG_FILES } from '../utils/constants.js';
import { validateOptionalInfraService } from '../utils/validation.js';
import { showCommandHeader } from '../utils/formatting.js';
import { writeJsonFile } from '../utils/file-helpers.js';

export const configCommand = new Command('config')
  .description('Manage project configuration and regenerate master files')
  .addCommand(
    new Command('regenerate')
      .description('Regenerate all 4 master config files from .tdk/project.json')
      .option('--dry-run', 'Show what would change without writing files')
      .action(async (options) => {
        await runCommand(async () => {
          const projectRoot = requireProjectRoot();

          if (options.dryRun) {
            console.log(chalk.blue('🔍 Dry run - comparing current files with new configuration...\n'));

            const projectConfig = readProjectConfig(projectRoot);
            const engine = new TemplateEngine();
            const newFiles = engine.generateAll(projectConfig);

            const outputDir = join(projectRoot, '.tdk', '.tdk-out');
            const filesToCheck = MASTER_CONFIG_FILES;
            type MasterConfigFileName = typeof MASTER_CONFIG_FILES[number];

            let hasChanges = false;

            for (const filename of filesToCheck) {
              const newContent = newFiles[filename as MasterConfigFileName];
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
        });
      })
  )
  .addCommand(
    new Command('verify')
      .description('Verify that generated files match .tdk/project.json')
      .action(async () => {
        await runCommand(async () => {
          const projectRoot = requireProjectRoot();

          console.log(chalk.blue('🔍 Verifying configuration...\n'));
          const result = verifyMasterConfigs(projectRoot);

          if (result.valid) {
            console.log(chalk.green('✅ All files are in sync!'));
            return;
          } else {
            console.log(chalk.yellow('⚠️  Configuration issues found:'));
            for (const error of result.errors) {
              console.log(chalk.gray(`   - ${error}`));
            }
            console.log(chalk.gray('\nRun `tdk config regenerate` to fix.'));
            process.exit(1);
          }
        });
      })
  )
  .addCommand(
    new Command('edit')
      .description('Open .tdk/project.json in your $EDITOR')
      .action(async () => {
        await runCommand(async () => {
          const projectRoot = requireProjectRoot();

          const projectJsonPath = join(projectRoot, '.tdk', 'project.json');
          if (!existsSync(projectJsonPath)) {
            throw new Error('.tdk/project.json not found');
          }

          const editor = process.env.EDITOR || 'vi';
          console.log(chalk.blue(`Opening ${projectJsonPath} in ${editor}...`));

          const editorParts = editor.trim().split(/\s+/);
          const editorCmd = editorParts[0];
          const editorArgs = [...editorParts.slice(1), projectJsonPath];

          const allowedEditors = ['vi', 'vim', 'nano', 'emacs', 'code', 'subl', 'atom', 'mate', 'pico', 'micro', 'hx'];
          const editorBase = editorCmd.replace(/.*\//, ''); // Remove path prefix for validation
          if (!allowedEditors.includes(editorBase)) {
            console.error(chalk.yellow(`Warning: Unknown editor "${editorCmd}". Using 'vi' instead.`));
            spawnSync('vi', [projectJsonPath], { stdio: 'inherit' });
          } else {
            spawnSync(editorCmd, editorArgs, { stdio: 'inherit' });
          }

          console.log(chalk.green('\n✅ Editor closed.'));
          console.log(chalk.gray('Run `tdk config regenerate` to apply changes.'));
        });
      })
  )
/**
 * Toggle an optional infrastructure service on or off.
 * Shared logic for enable-infra and disable-infra commands.
 *
 * @param service - The service name to toggle
 * @param enabled - Whether to enable (true) or disable (false) the service
 */
async function toggleInfraService(service: string, enabled: boolean): Promise<void> {
  const projectRoot = requireProjectRoot();

  const validation = validateOptionalInfraService(service);
  assertValid(validation);

  const config = readProjectConfig(projectRoot);
  // After validation, service is guaranteed to be a key of optional_infra
  type OptionalInfraKey = keyof typeof config.optional_infra;
  config.optional_infra[service as OptionalInfraKey] = enabled;

  const projectJsonPath = join(projectRoot, '.tdk', 'project.json');
  writeJsonFile(projectJsonPath, config);

  const action = enabled ? 'Enabled' : 'Disabled';
  console.log(chalk.green(`✓ ${action}: ${service}`));
  console.log(chalk.gray('Run `tdk config regenerate` to apply.'));
}

configCommand
  .addCommand(
    new Command('enable-infra')
      .description('Enable optional infrastructure service')
      .argument('<service>', 'Service name (monitoring, elk, debezium, golden_image)')
      .action(async (service) => {
        await runCommand(async () => {
          await toggleInfraService(service, true);
        });
      })
  )
  .addCommand(
    new Command('disable-infra')
      .description('Disable optional infrastructure service')
      .argument('<service>', 'Service name (monitoring, elk, debezium, golden_image)')
      .action(async (service) => {
        await runCommand(async () => {
          await toggleInfraService(service, false);
        });
      })
  );
