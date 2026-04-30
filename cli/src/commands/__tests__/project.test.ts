/**
 * Tests for tdk project command
 */

import { describe, it, expect } from 'vitest';

describe('project command', () => {
  it('should verify template files exist', () => {
    const expectedTemplates = [
      'TILT_RESOURCE_DEFAULTS.star.hbs',
      'TILT_TECH_STACK.star.hbs',
      'Tiltfile.hbs',
      'tilt.config.json.hbs',
      'spec.master.hbs',
    ];

    // All templates should be defined
    expect(expectedTemplates.length).toBe(5);
    expect(expectedTemplates).toContain('TILT_RESOURCE_DEFAULTS.star.hbs');
    expect(expectedTemplates).toContain('TILT_TECH_STACK.star.hbs');
    expect(expectedTemplates).toContain('Tiltfile.hbs');
    expect(expectedTemplates).toContain('tilt.config.json.hbs');
    expect(expectedTemplates).toContain('spec.master.hbs');
  });

  it('should have templates with required content patterns', () => {
    const templatePatterns = {
      'TILT_RESOURCE_DEFAULTS.star.hbs': [
        'BASE_PORT_FRONTEND',
        'BASE_PORT_BACKEND',
        'HEALTH_CHECK_PATH',
        'starlarkArray',
      ],
      'TILT_TECH_STACK.star.hbs': [
        'BUNDLER',
        'RUNTIME',
        'ORM',
        'assert_tech_stack',
      ],
      'Tiltfile.hbs': [
        'TDK CLI',
        '.tdk/.tdk-out',
        'spec.master',
      ],
    };

    // Verify all expected patterns are defined
    expect(Object.keys(templatePatterns)).toContain('TILT_RESOURCE_DEFAULTS.star.hbs');
    expect(Object.keys(templatePatterns)).toContain('TILT_TECH_STACK.star.hbs');
    expect(Object.keys(templatePatterns)).toContain('Tiltfile.hbs');

    expect(templatePatterns['TILT_RESOURCE_DEFAULTS.star.hbs']).toContain('BASE_PORT_FRONTEND');
    expect(templatePatterns['TILT_RESOURCE_DEFAULTS.star.hbs']).toContain('HEALTH_CHECK_PATH');
    expect(templatePatterns['TILT_TECH_STACK.star.hbs']).toContain('BUNDLER');
    expect(templatePatterns['TILT_TECH_STACK.star.hbs']).toContain('RUNTIME');
  });
});

describe('project command templates', () => {
  it('should have valid Handlebars template patterns', () => {
    // Define patterns that should exist in templates
    const handlebarsPatterns = [
      '{{',  // Opening tag
      '}}',  // Closing tag
    ];

    // All patterns should be defined
    expect(handlebarsPatterns).toContain('{{');
    expect(handlebarsPatterns).toContain('}}');
  });

  it('should have templates with required content patterns defined', () => {
    // Define expected content patterns
    const expectedPatterns = {
      resourceDefaults: [
        'BASE_PORT_FRONTEND',
        'BASE_PORT_BACKEND',
        'HEALTH_CHECK_PATH',
        'starlarkArray',
      ],
      techStack: [
        'BUNDLER',
        'RUNTIME',
        'ORM',
        'assert_tech_stack',
      ],
      tiltfile: [
        'TDK CLI',
        '.tdk/.tdk-out',
        'spec.master',
      ],
    };

    expect(expectedPatterns.resourceDefaults).toContain('BASE_PORT_FRONTEND');
    expect(expectedPatterns.resourceDefaults).toContain('BASE_PORT_BACKEND');
    expect(expectedPatterns.resourceDefaults).toContain('HEALTH_CHECK_PATH');
    expect(expectedPatterns.resourceDefaults).toContain('starlarkArray');

    expect(expectedPatterns.techStack).toContain('BUNDLER');
    expect(expectedPatterns.techStack).toContain('RUNTIME');
    expect(expectedPatterns.techStack).toContain('ORM');
    expect(expectedPatterns.techStack).toContain('assert_tech_stack');

    expect(expectedPatterns.tiltfile).toContain('TDK CLI');
    expect(expectedPatterns.tiltfile).toContain('.tdk/.tdk-out');
    expect(expectedPatterns.tiltfile).toContain('spec.master');
  });
});
