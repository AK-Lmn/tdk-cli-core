import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { writeJsonFileInDir, writeTextFileInDir } from './file-helpers.js';

/**
 * Type of file to generate during resource creation.
 */
export type ResourceFileType = 'json' | 'text';

/**
 * Description of a file to generate.
 */
export interface FileGenerationTask {
  type: ResourceFileType;
  filename: string;
  content: unknown;
  description: string;
  emoji: string;
}

/**
 * Generate multiple files in a resource directory with consistent logging.
 *
 * @param basePath - Base directory path for the resource
 * @param tasks - Array of file generation tasks
 */
export function generateResourceFiles(
  basePath: string,
  tasks: FileGenerationTask[]
): void {
  for (const task of tasks) {
    console.log(chalk.blue(`${task.emoji} Generating ${task.description}...`));

    if (task.type === 'json') {
      writeJsonFileInDir(basePath, task.filename, task.content);
    } else {
      writeTextFileInDir(basePath, task.filename, String(task.content));
    }
  }
}

/**
 * Create standard directory structure for a new resource.
 *
 * @param basePath - Base directory for the resource
 * @param subdirectories - Additional subdirectories to create (default: ['src', 'tests'])
 */
export function createResourceDirectories(
  basePath: string,
  subdirectories: string[] = ['src', 'tests']
): void {
  console.log(chalk.blue('\n📁 Creating directory structure...'));

  mkdirSync(basePath, { recursive: true });

  for (const subdir of subdirectories) {
    mkdirSync(resolve(basePath, subdir), { recursive: true });
  }
}
