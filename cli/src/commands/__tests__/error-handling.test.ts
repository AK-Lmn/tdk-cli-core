/**
 * Tests for error handling and edge cases
 */

import { describe, it, expect } from 'vitest';

describe('error handling', () => {
  describe('invalid resource types', () => {
    it('should validate resource type is one of allowed values', () => {
      const allowedTypes = ['backend', 'frontend', 'worker'];

      function validateResourceType(type: string): { valid: boolean; error?: string } {
        if (!allowedTypes.includes(type)) {
          return {
            valid: false,
            error: `Invalid resource type: ${type}. Must be one of: ${allowedTypes.join(', ')}`,
          };
        }
        return { valid: true };
      }

      // Valid types
      expect(validateResourceType('backend')).toEqual({ valid: true });
      expect(validateResourceType('frontend')).toEqual({ valid: true });
      expect(validateResourceType('worker')).toEqual({ valid: true });

      // Invalid types
      expect(validateResourceType('api')).toEqual({
        valid: false,
        error: 'Invalid resource type: api. Must be one of: backend, frontend, worker',
      });

      expect(validateResourceType('microservice')).toEqual({
        valid: false,
        error: 'Invalid resource type: microservice. Must be one of: backend, frontend, worker',
      });

      expect(validateResourceType('')).toEqual({
        valid: false,
        error: 'Invalid resource type: . Must be one of: backend, frontend, worker',
      });
    });
  });

  describe('port assignment', () => {
    it('should validate port is within valid range', () => {
      function validatePort(port: number): { valid: boolean; error?: string } {
        if (port < 1024 || port > 65535) {
          return {
            valid: false,
            error: `Invalid port: ${port}. Must be between 1024 and 65535`,
          };
        }
        return { valid: true };
      }

      // Valid ports
      expect(validatePort(3000)).toEqual({ valid: true });
      expect(validatePort(8080)).toEqual({ valid: true });
      expect(validatePort(1024)).toEqual({ valid: true });
      expect(validatePort(65535)).toEqual({ valid: true });

      // Invalid ports
      expect(validatePort(1023)).toEqual({
        valid: false,
        error: 'Invalid port: 1023. Must be between 1024 and 65535',
      });
      expect(validatePort(65536)).toEqual({
        valid: false,
        error: 'Invalid port: 65536. Must be between 1024 and 65535',
      });
      expect(validatePort(0)).toEqual({
        valid: false,
        error: 'Invalid port: 0. Must be between 1024 and 65535',
      });
      expect(validatePort(-1)).toEqual({
        valid: false,
        error: 'Invalid port: -1. Must be between 1024 and 65535',
      });
    });

    it('should allow port 0 for workers', () => {
      function validatePortForType(port: number, type: string): { valid: boolean; error?: string } {
        if (type === 'worker' && port === 0) {
          return { valid: true };
        }
        if (port < 1024 || port > 65535) {
          return {
            valid: false,
            error: `Invalid port: ${port}. Must be between 1024 and 65535`,
          };
        }
        return { valid: true };
      }

      // Workers can have port 0
      expect(validatePortForType(0, 'worker')).toEqual({ valid: true });

      // Other types need valid ports
      expect(validatePortForType(0, 'backend')).toEqual({
        valid: false,
        error: 'Invalid port: 0. Must be between 1024 and 65535',
      });
    });
  });

  describe('missing manifest handling', () => {
    it('should handle missing manifest gracefully', () => {
      interface ManifestResult {
        valid: boolean;
        error?: string;
        warnings?: string[];
      }

      function validateManifest(manifest: unknown): ManifestResult {
        if (!manifest) {
          return {
            valid: false,
            error: 'Manifest is missing or null',
          };
        }

        const warnings: string[] = [];
        const m = manifest as Record<string, unknown>;

        if (!m.appName) {
          warnings.push('Missing appName field');
        }
        if (!m.appType) {
          warnings.push('Missing appType field');
        }
        if (!m.stack) {
          warnings.push('Missing stack field');
        }

        // In lenient mode, we allow with warnings
        if (warnings.length > 0) {
          return {
            valid: true,
            warnings,
          };
        }

        return { valid: true };
      }

      // Missing manifest
      expect(validateManifest(null)).toEqual({
        valid: false,
        error: 'Manifest is missing or null',
      });

      expect(validateManifest(undefined)).toEqual({
        valid: false,
        error: 'Manifest is missing or null',
      });

      // Incomplete manifest (with warnings)
      const incompleteManifest = {
        appName: 'test-service',
        // missing appType and stack
      };

      const result = validateManifest(incompleteManifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Missing appType field');
      expect(result.warnings).toContain('Missing stack field');
    });
  });

  describe('stack name validation', () => {
    it('should validate stack name format', () => {
      const validNames = [
        'main',
        'api-services',
        'v1-stack',
        'test123',
      ];

      const invalidNames = [
        'My Stack',       // space
        'my_stack',       // underscore
        'MyStack',        // camelCase
        '',               // empty
      ];

      function validateStackName(name: string): { valid: boolean; error?: string } {
        if (!name.trim()) {
          return { valid: false, error: 'Stack name is required' };
        }
        if (!/^[a-z0-9-]+$/.test(name)) {
          return { valid: false, error: 'Use kebab-case (lowercase, numbers, hyphens only)' };
        }
        return { valid: true };
      }

      for (const name of validNames) {
        expect(validateStackName(name)).toEqual({ valid: true });
      }

      for (const name of invalidNames) {
        expect(validateStackName(name).valid).toBe(false);
      }
    });
  });
});
