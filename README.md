# TDK CLI

Tilt Development Kit - All-in-one local development platform for microservices.

## Overview

TDK CLI combines everything needed for local microservice development:
- **Engine**: Core orchestration logic
- **Discovery**: Service discovery and manifest management
- **Specs**: Tech stack definitions and standards
- **CLI**: Command-line interface (`tdk up`, `tdk down`, etc.)
- **Ext**: UI enhancements and IDE components

## Quick Start

### Install the CLI

```bash
npm install -g @tdk/cli
```

### Usage

```bash
# Initialize project (creates master configs)
tdk project

# Create a new resource
tdk resource my-service --type backend --stack identity

# Organize resources into stacks
tdk stack identity

# List commands
tdk projects      # Show project info
tdk stacks        # List all stacks
tdk resources     # List all resources

# Lifecycle commands
tdk up identity              # Start a stack
tdk down                     # Stop all services
tdk status                   # Check service status

# Utility commands
tdk ui                       # Interactive UI
tdk doctor                   # Check environment
```

## Project-Stack-Resource (PSR) Model

TDK organizes your services using a clear hierarchy:

```
Project (1 per repo)
├── TILT_SERVICE_DEFAULTS.star  (ports, health checks)
├── TILT_TECH_STACK.star          (Bun, Vite, Prisma)
└── Stacks (deployment groups)
    ├── identity-stack
    │   ├── identity-backend      (resource)
    │   └── identity-frontend     (resource)
    └── appointment-stack
        ├── appointment-backend   (resource)
        └── appointment-frontend  (resource)
```

### PSR Commands

| Level | Action | List |
|-------|--------|------|
| **Project** | `tdk project` | `tdk projects` |
| **Stack** | `tdk stack` | `tdk stacks` |
| **Resource** | `tdk resource` | `tdk resources` |

## Repository Structure

```
tdk-cli/
├── cli/              # CLI package (@tdk/cli)
│   ├── bin/          # CLI entry point
│   ├── src/          # CLI source code
│   │   ├── commands/ # CLI commands (up, down, list, etc.)
│   │   ├── types/    # TypeScript types
│   │   └── utils/    # Utilities
│   ├── package.json
│   └── tsconfig.json
├── discovery/        # Service discovery logic
├── engine/           # Core orchestration
├── ext/              # UI enhancements
├── specs/            # Tech stack specs
├── Tiltfile          # Tilt extension entry point
└── package.json      # Root workspace config
```

## Using as Tilt Extension

```python
# In your Tiltfile
v1alpha1.extension_repo(name='tdk-cli', url='https://github.com/tdk-landscape/tdk-cli')
v1alpha1.extension(name='tdk-cli', repo_name='tdk-cli', repo_path='')

load('ext://tdk-cli', 'Utils', 'Manifest', 'Config', 'Determinism', ...)
```

## Features

### 🔒 Deterministic Operations

Use `Determinism` for reproducible builds:

```starlark
load('ext://tdk-cli', 'Determinism')

# Deterministic file discovery (sorted results)
files = Determinism.deterministic_find('./services', 'service.json')

# Deterministic service discovery
services = Determinism.deterministic_service_discovery(['services/product'])

# Check deterministic mode
if Determinism.is_deterministic_mode():
    print("Running in deterministic mode")
```

### 🔍 Environment Validation

Use `tdk doctor` to check your environment:

```bash
tdk doctor
```

Checks for:
- Docker daemon running
- Bun runtime installed
- Tilt CLI available
- Required ports free
- Tiltfile present
- Master config files (TILT_SERVICE_DEFAULTS.star, TILT_TECH_STACK.star)

## License

MIT
