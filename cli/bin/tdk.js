#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the compiled CLI entry point
const cliPath = join(__dirname, '..', 'dist', 'cli.js');

// Run the CLI
import(cliPath).catch((err) => {
  console.error('Failed to start TDK:', err);
  process.exit(1);
});
