import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { cwd } from 'node:process';
import { fileURLToPath } from 'node:url';

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

/**
 * Package info cache to avoid reading package.json multiple times
 */
interface PackageInfo {
  name: string;
  version: string;
  fullPackage: Record<string, unknown>;
}

let packageCache: PackageInfo | null = null;

/**
 * Read and parse package.json from the CLI package
 *
 * @returns Parsed package.json content with name, version, and full package data
 */
function getPackageInfo(): PackageInfo {
  if (packageCache) {
    return packageCache;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packagePath = resolve(__dirname, '..', '..', 'package.json');

  const content = readFileSync(packagePath, 'utf-8');
  const pkg = JSON.parse(content) as Record<string, unknown>;

  packageCache = {
    name: String(pkg.name ?? '@tdk/cli'),
    version: String(pkg.version ?? '0.0.0'),
    fullPackage: pkg,
  };

  return packageCache;
}

/**
 * Get the current CLI version from package.json
 *
 * @returns The version string (e.g., "1.1.0")
 */
export function getPackageVersion(): string {
  return getPackageInfo().version;
}
