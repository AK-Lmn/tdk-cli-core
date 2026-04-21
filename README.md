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
# Start all services
tdk up

# Start specific services
tdk up salon-management-backend identity-management-backend

# Stop services
tdk down

# Check status
tdk status

# List services
tdk list

# Initialize new service
tdk init

# Interactive UI
tdk ui
```

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

load('ext://tdk-cli', 'Utils', 'Manifest', 'Config', ...)
```

## License

MIT
