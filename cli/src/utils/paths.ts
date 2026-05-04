import { existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { cwd } from 'node:process';

export function findProjectRoot(startDir: string = cwd()): string | null {
  let currentDir = resolve(startDir);
  const root = resolve('/');

  while (currentDir !== root) {
    if (existsSync(join(currentDir, '.tdk', 'project.json'))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return null;
}
