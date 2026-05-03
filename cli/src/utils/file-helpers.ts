import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { JsonValue } from '../types/index.js';

/**
 * Write a JSON object to a file with consistent formatting
 * Automatically adds trailing newline for POSIX compliance
 *
 * @param filePath - Absolute or relative path to the file
 * @param data - Data to serialize as JSON
 * @param space - Indentation spaces (default: 2)
 */
function writeJsonFile(
  filePath: string,
  data: JsonValue,
  space: number = 2
): void {
  const content = JSON.stringify(data, null, space) + '\n';
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Write a JSON object to a file within a directory
 * Convenience wrapper for writeJsonFile with path resolution
 *
 * @param dir - Base directory
 * @param filename - File name
 * @param data - Data to serialize
 * @param space - Indentation spaces (default: 2)
 */
export function writeJsonFileInDir(
  dir: string,
  filename: string,
  data: JsonValue,
  space: number = 2
): void {
  const filePath = resolve(dir, filename);
  writeJsonFile(filePath, data, space);
}

/**
 * Write text content to a file
 * Simple wrapper with consistent encoding
 *
 * @param filePath - Path to the file
 * @param content - Text content to write
 */
function writeTextFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Write text content to a file within a directory
 * Convenience wrapper for writeTextFile with path resolution
 *
 * @param dir - Base directory
 * @param filename - File name
 * @param content - Text content to write
 */
export function writeTextFileInDir(
  dir: string,
  filename: string,
  content: string
): void {
  const filePath = resolve(dir, filename);
  writeTextFile(filePath, content);
}
