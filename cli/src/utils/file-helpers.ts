import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';

export interface FileWriteTask {
  type: 'json' | 'text';
  filename: string;
  content: unknown;
  description: string;
  emoji: string;
}

export function writeFilesWithProgress(
  basePath: string,
  tasks: FileWriteTask[],
  onProgress?: (task: FileWriteTask, index: number, total: number) => void
): void {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    console.log(chalk.blue(`${task.emoji} ${task.description}...`));

    if (task.type === 'json') {
      writeJsonFileInDir(basePath, task.filename, task.content);
    } else {
      writeTextFileInDir(basePath, task.filename, String(task.content));
    }

    if (onProgress) {
      onProgress(task, i, tasks.length);
    }
  }
}

export function writeJsonFile(filePath: string, data: unknown, space: number = 2): void {
  const content = JSON.stringify(data, null, space) + '\n';
  writeFileSync(filePath, content, 'utf-8');
}

export function writeJsonFileInDir(
  dir: string,
  filename: string,
  data: unknown,
  space: number = 2
): void {
  const filePath = resolve(dir, filename);
  writeJsonFile(filePath, data, space);
}

export function writeTextFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf-8');
}

export function writeTextFileInDir(
  dir: string,
  filename: string,
  content: string
): void {
  const filePath = resolve(dir, filename);
  writeTextFile(filePath, content);
}

export function ensureDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}


