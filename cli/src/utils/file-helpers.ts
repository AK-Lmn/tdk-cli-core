import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Write a JSON object to a file with consistent formatting.
 * Automatically adds trailing newline for POSIX compliance.
 */
export function writeJsonFile(filePath: string, data: unknown, space: number = 2): void {
  const content = JSON.stringify(data, null, space) + '\n';
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Write a JSON object to a file within a directory.
 * Convenience wrapper for writeJsonFile with path resolution.
 */
export function writeJsonFileInDir(
  dir: string,
  filename: string,
  data: unknown,
  space: number = 2
): void {
  const filePath = resolve(dir, filename);
  writeJsonFile(filePath, data, space);
}

/**
 * Write text content to a file with consistent encoding.
 */
export function writeTextFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Write text content to a file within a directory.
 * Convenience wrapper for writeTextFile with path resolution.
 */
export function writeTextFileInDir(
  dir: string,
  filename: string,
  content: string
): void {
  const filePath = resolve(dir, filename);
  writeTextFile(filePath, content);
}

/**
 * Ensure a directory exists, creating it if necessary.
 * Wraps mkdirSync with recursive option for consistent directory creation.
 *
 * @param dirPath - Directory path to ensure exists
 */
export function ensureDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}


