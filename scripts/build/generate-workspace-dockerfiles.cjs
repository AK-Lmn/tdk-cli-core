#!/usr/bin/env node

/**
 * Generates workspace-based Dockerfiles for all Beauty CRM backend services
 * This ensures consistent transitive dependency resolution across all services
 */

const fs = require('node:fs');
const path = require('node:path');

// Define all backend services and their paths
const BACKEND_SERVICES = [
  {
    description: 'Staff Management Service',
    name: 'staff-management-backend',
    path: 'services/staff/staff-management-backend',
  },
  {
    description: 'Appointment Management Service',
    name: 'appointment-management-backend',
    path: 'services/appointment/appointment-management-backend',
  },
  {
    description: 'Salon Management Service',
    name: 'salon-management-backend',
    path: 'services/salon/salon-management-backend',
  },
  {
    description: 'Treatment Management Service',
    name: 'treatment-management-backend',
    path: 'services/treatment/treatment-management-backend',
  },
  {
    description: 'Client Management Service',
    name: 'client-management-backend',
    path: 'services/client/client-management-backend',
  },
  {
    description: 'Authentication Service',
    name: 'auth-management-backend',
    path: 'services/auth/auth-management-backend',
  },
  {
    description: 'Planner Service',
    name: 'planner-management-backend',
    path: 'services/planner/planner-management-backend',
  },
];

function generateDockerfile(service) {
  console.log(
    `📦 Generating workspace Dockerfile for ${service.description}...`,
  );

  // Read the template
  const templatePath = path.join(
    __dirname,
    '../shared-platform-engineering/docker-templates/Dockerfile.workspace.template',
  );
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    return false;
  }

  let template = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders
  template = template.replace(/\{\{SERVICE_PATH\}\}/g, service.path);

  // Add service-specific header comment
  const header = `# Workspace-based Dockerfile for ${service.description}
# Generated from template - ensures proper transitive dependency resolution
# All @beauty-crm/* file path dependencies are resolved through Bun workspaces

`;

  template = header + template;

  // Write to service directory
  const outputPath = path.join(
    __dirname,
    '..',
    service.path,
    'Dockerfile.workspace',
  );
  const outputDir = path.dirname(outputPath);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    console.log(`📁 Creating directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, template);
  console.log(`✅ Generated: ${outputPath}`);

  return true;
}

function generateAllDockerfiles() {
  console.log(
    '🚀 Generating workspace Dockerfiles for all Beauty CRM backend services...\n',
  );

  let successCount = 0;
  const totalCount = BACKEND_SERVICES.length;

  for (const service of BACKEND_SERVICES) {
    if (generateDockerfile(service)) {
      successCount++;
    }
  }

  console.log(
    `\n📊 Results: ${successCount}/${totalCount} Dockerfiles generated successfully`,
  );

  if (successCount === totalCount) {
    console.log('✅ All workspace Dockerfiles generated successfully!');
    console.log('\n🔧 Next steps:');
    console.log(
      '1. Test each service build: docker build -f services/*/Dockerfile.workspace .',
    );
    console.log('2. Update Docker Compose files to use workspace images');
    console.log('3. Run validation tests for each service');
  } else {
    console.log(
      '❌ Some Dockerfiles failed to generate. Please check the errors above.',
    );
    process.exit(1);
  }
}

// Run the generator
generateAllDockerfiles();
