/**
 * Tests for tdk project command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('project command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = join(tmpdir(), `tdk-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
    // Create a minimal Tiltfile
    writeFileSync(join(tempDir, 'Tiltfile'), '# Test Tiltfile\n', 'utf-8');
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should verify test environment setup', () => {
    expect(existsSync(join(tempDir, 'Tiltfile'))).toBe(true);
    // macOS adds /private prefix to temp paths, so check suffix instead
    expect(process.cwd()).toContain(tempDir.replace('/private', ''));
  });

  it('should create and read files in temp directory', () => {
    const testFile = join(tempDir, 'test.txt');
    writeFileSync(testFile, 'test content', 'utf-8');
    expect(existsSync(testFile)).toBe(true);
    expect(readFileSync(testFile, 'utf-8')).toBe('test content');
  });
});

describe('project command templates', () => {
  it('should have valid Handlebars templates', () => {
    // Check that template files exist
    const { existsSync } = require('node:fs');
    const { join } = require('node:path');
    
    // Templates are in cli/templates/, not src/templates/
    const templatesDir = join(__dirname, '..', '..', '..', 'templates');
    
    expect(existsSync(join(templatesDir, 'TILT_SERVICE_DEFAULTS.star.hbs'))).toBe(true);
    expect(existsSync(join(templatesDir, 'TILT_TECH_STACK.star.hbs'))).toBe(true);
    expect(existsSync(join(templatesDir, 'Tiltfile.hbs'))).toBe(true);
    expect(existsSync(join(templatesDir, 'tilt.config.json.hbs'))).toBe(true);
    expect(existsSync(join(templatesDir, 'spec.master.hbs'))).toBe(true);
  });

  it('should have templates with required content', () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    
    // Templates are in cli/templates/
    const templatesDir = join(__dirname, '..', '..', '..', 'templates');
    
    // Check TILT_SERVICE_DEFAULTS.star.hbs
    const serviceDefaults = readFileSync(join(templatesDir, 'TILT_SERVICE_DEFAULTS.star.hbs'), 'utf-8');
    expect(serviceDefaults).toContain('BASE_PORT_FRONTEND');
    expect(serviceDefaults).toContain('BASE_PORT_BACKEND');
    expect(serviceDefaults).toContain('HEALTH_CHECK_PATH');
    expect(serviceDefaults).toContain('starlarkArray');
    
    // Check TILT_TECH_STACK.star.hbs
    const techStack = readFileSync(join(templatesDir, 'TILT_TECH_STACK.star.hbs'), 'utf-8');
    expect(techStack).toContain('BUNDLER');
    expect(techStack).toContain('RUNTIME');
    expect(techStack).toContain('ORM');
    expect(techStack).toContain('assert_tech_stack');
    
    // Check Tiltfile.hbs
    const tiltfile = readFileSync(join(templatesDir, 'Tiltfile.hbs'), 'utf-8');
    expect(tiltfile).toContain('TDK CLI');
    expect(tiltfile).toContain('.tdk/.tdk-out');
    expect(tiltfile).toContain('spec.master');
  });
});
