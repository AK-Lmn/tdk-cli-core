#!/usr/bin/env bun

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, '..', 'src', 'cli.ts');

import(cliPath).catch((err) => {
  console.error('Failed to start TDK:', err);
  process.exit(1);
});
