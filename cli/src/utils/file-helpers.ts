import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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


