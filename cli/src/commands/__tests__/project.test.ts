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
    expect(process.cwd()).toBe(tempDir);
  });

  it('should create and read files in temp directory', () => {
    const testFile = join(tempDir, 'test.txt');
    writeFileSync(testFile, 'test content', 'utf-8');
    expect(existsSync(testFile)).toBe(true);
    expect(readFileSync(testFile, 'utf-8')).toBe('test content');
  });
});

describe('project command templates', () => {
  it('should have valid TILT_SERVICE_DEFAULTS.star template structure', () => {
    // Verify the template contains expected sections
    const { PLATFORM_CONFIG_TEMPLATE } = require('../project.js');
    
    expect(PLATFORM_CONFIG_TEMPLATE).toContain('BASE_PORT_FRONTEND');
    expect(PLATFORM_CONFIG_TEMPLATE).toContain('BASE_PORT_BACKEND');
    expect(PLATFORM_CONFIG_TEMPLATE).toContain('HEALTH_CHECK_PATH');
    expect(PLATFORM_CONFIG_TEMPLATE).toContain('MEMORY_LIMITS');
    expect(PLATFORM_CONFIG_TEMPLATE).toContain('DOCKER_BASE_IMAGES');
  });

  it('should have valid TILT_TECH_STACK.star template structure', () => {
    const { TECH_STACK_TEMPLATE } = require('../project.js');
    
    expect(TECH_STACK_TEMPLATE).toContain('RUNTIME');
    expect(TECH_STACK_TEMPLATE).toContain('BUNDLER');
    expect(TECH_STACK_TEMPLATE).toContain('ORM');
    expect(TECH_STACK_TEMPLATE).toContain('TESTING');
    expect(TECH_STACK_TEMPLATE).toContain('assert_tech_stack');
  });
});
