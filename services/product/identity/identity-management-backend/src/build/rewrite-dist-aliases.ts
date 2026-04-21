import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

const aliasMappings: Array<{ aliasPrefix: string; distPrefix: string }> = [
  { aliasPrefix: '@/', distPrefix: '' },
  { aliasPrefix: '@application/', distPrefix: 'application/' },
  { aliasPrefix: '@domain/', distPrefix: 'domain/' },
  { aliasPrefix: '@infrastructure/', distPrefix: 'infrastructure/' },
  { aliasPrefix: '@presentation/', distPrefix: 'presentation/' },
];

function toPosixPath(value: string): string {
  return value.replaceAll(path.sep, '/');
}

function rewriteSpecifier(
  specifier: string,
  currentFilePath: string,
): string | null {
  const mapping = aliasMappings.find(({ aliasPrefix }) =>
    specifier.startsWith(aliasPrefix),
  );

  if (!mapping) {
    return null;
  }

  const suffix = specifier.slice(mapping.aliasPrefix.length);
  const targetPath = path.resolve(DIST_DIR, mapping.distPrefix, suffix);
  let relativePath = toPosixPath(path.relative(path.dirname(currentFilePath), targetPath));

  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

function rewriteFileContent(content: string, filePath: string): [string, number] {
  let replacements = 0;

  const replaceSpecifier = (specifier: string): string => {
    const rewritten = rewriteSpecifier(specifier, filePath);
    if (!rewritten || rewritten === specifier) {
      return specifier;
    }
    replacements += 1;
    return rewritten;
  };

  let updated = content.replace(
    /(\bfrom\s+)(['"])([^'"]+)\2/g,
    (_match, prefix: string, quote: string, specifier: string) =>
      `${prefix}${quote}${replaceSpecifier(specifier)}${quote}`,
  );

  updated = updated.replace(
    /(^|[\r\n])(\s*import\s+)(['"])([^'"]+)\3/g,
    (_match, lineStart: string, importToken: string, quote: string, specifier: string) =>
      `${lineStart}${importToken}${quote}${replaceSpecifier(specifier)}${quote}`,
  );

  updated = updated.replace(
    /(\bimport\s*\(\s*)(['"])([^'"]+)\2(\s*\))/g,
    (_match, prefix: string, quote: string, specifier: string, suffix: string) =>
      `${prefix}${quote}${replaceSpecifier(specifier)}${quote}${suffix}`,
  );

  return [updated, replacements];
}

async function collectTargetFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTargetFiles(fullPath)));
      continue;
    }

    if (
      fullPath.endsWith('.js') ||
      fullPath.endsWith('.mjs') ||
      fullPath.endsWith('.cjs') ||
      fullPath.endsWith('.d.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  try {
    const stat = await fs.stat(DIST_DIR);
    if (!stat.isDirectory()) {
      throw new Error(`Expected a directory at ${DIST_DIR}`);
    }
  } catch {
    console.warn(`[build] dist directory does not exist, skipping alias rewrite (${DIST_DIR})`);
    return;
  }

  const targetFiles = await collectTargetFiles(DIST_DIR);
  let modifiedFiles = 0;
  let totalReplacements = 0;

  for (const filePath of targetFiles) {
    const current = await fs.readFile(filePath, 'utf8');
    const [updated, replacements] = rewriteFileContent(current, filePath);
    if (replacements === 0 || updated === current) {
      continue;
    }

    await fs.writeFile(filePath, updated, 'utf8');
    modifiedFiles += 1;
    totalReplacements += replacements;
  }

  console.log(
    `[build] Rewrote ${totalReplacements} alias import(s) across ${modifiedFiles} dist file(s).`,
  );
}

void main();
