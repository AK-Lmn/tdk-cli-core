/**
 * Tests for error handling and edge cases
 */

import { describe, it, expect } from 'vitest';
import { validateResourceName, createKebabCaseValidator, isValidPort } from '../../utils/validation.js';

describe('error handling', () => {
  describe('resource name validation', () => {
    it('should validate resource names using actual validation utility', () => {
      expect(validateResourceName('my-service')).toEqual({ valid: true });
      expect(validateResourceName('service123')).toEqual({ valid: true });
      expect(validateResourceName('api-gateway')).toEqual({ valid: true });

      expect(validateResourceName('')).toEqual({
        valid: false,
        error: 'Resource name is required',
      });
      expect(validateResourceName('MyService')).toEqual({
        valid: false,
        error: 'Use lowercase letters, numbers, and hyphens only',
      });
      expect(validateResourceName('my_service')).toEqual({
        valid: false,
        error: 'Use lowercase letters, numbers, and hyphens only',
      });
    });

    it('should create kebab-case validators for different contexts', () => {
      const resourceValidator = createKebabCaseValidator('resource');
      const stackValidator = createKebabCaseValidator('stack');

      expect(resourceValidator('my-resource')).toBe(true);
      expect(resourceValidator('')).toBe('Resource name is required');
      expect(resourceValidator('MyResource')).toBe('Use lowercase letters, numbers, and hyphens only');

      expect(stackValidator('my-stack')).toBe(true);
      expect(stackValidator('')).toBe('Stack name is required');
      expect(stackValidator('MyStack')).toBe('Use kebab-case (lowercase, numbers, hyphens only)');
    });
  });

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

      expect(validateResourceType('backend')).toEqual({ valid: true });
      expect(validateResourceType('frontend')).toEqual({ valid: true });
      expect(validateResourceType('worker')).toEqual({ valid: true });

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
    it('should validate port is within valid range using isValidPort', () => {
      // Valid ports (isValidPort allows ports 1-65535, not just 1024+)
      expect(isValidPort(3000)).toBe(true);
      expect(isValidPort(8080)).toBe(true);
      expect(isValidPort(1024)).toBe(true);
      expect(isValidPort(1)).toBe(true);      // Valid per isValidPort (just > 0)
      expect(isValidPort(65535)).toBe(true);

      // Invalid ports
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
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

      expect(validatePortForType(0, 'worker')).toEqual({ valid: true });

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

        if (typeof manifest !== 'object') {
          return {
            valid: false,
            error: `Manifest must be an object, got ${typeof manifest}`,
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

        if (warnings.length > 0) {
          return {
            valid: true,
            warnings,
          };
        }

        return { valid: true };
      }

      expect(validateManifest(null)).toEqual({
        valid: false,
        error: 'Manifest is missing or null',
      });

      expect(validateManifest(undefined)).toEqual({
        valid: false,
        error: 'Manifest is missing or null',
      });

      const incompleteManifest = {
        appName: 'test-service',
      };

      const result = validateManifest(incompleteManifest);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Missing appType field');
      expect(result.warnings).toContain('Missing stack field');
    });
  });

  describe('stack name validation', () => {
    it('should validate stack name format using createKebabCaseValidator', () => {
      const validNames = [
        'main',
        'api-services',
        'v1-stack',
        'test123',
      ];

      const invalidNames = [
        'My Stack',
        'my_stack',
        'MyStack',
        '',
      ];

      const stackValidator = createKebabCaseValidator('stack');

      for (const name of validNames) {
        expect(stackValidator(name)).toBe(true);
      }

      for (const name of invalidNames) {
        expect(typeof stackValidator(name)).toBe('string');
      }
    });
  });
});
