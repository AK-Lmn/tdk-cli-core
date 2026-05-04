import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import type { FileGenerationTask } from '../types/index.js';
import { writeJsonFileInDir, writeTextFileInDir } from './file-helpers.js';

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
