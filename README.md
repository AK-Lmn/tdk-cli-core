```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     ████████╗██████╗ ██╗  ██╗    ██████╗██╗     ██╗            ║
║     ╚══██╔══╝██╔══██╗██║ ██╔╝   ██╔════╝██║     ██║            ║
║        ██║   ██║  ██║█████╔╝    ██║     ██║     ██║            ║
║        ██║   ██║  ██║██╔═██╗    ██║     ██║     ██║            ║
║        ██║   ██████╔╝██║  ██╗██╗╚██████╗███████╗██║            ║
║        ╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝╚═╝            ║
║                                                                ║
║          Tilt Development Kit - v1.x.x                        ║
╚════════════════════════════════════════════════════════════════╝
```

# 🚀 TDK CLI

> **T**ilt **D**evelopment **K**it — All-in-one local development platform for microservices

[![npm version](https://img.shields.io/npm/v/@tdk/cli.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.2-black?logo=bun)](https://bun.sh)
[![Tilt](https://img.shields.io/badge/Tilt-latest-blue?logo=tilt)](https://tilt.dev)

---

## 🎯 Overview

TDK CLI combines everything needed for local microservice development using a clear **Project-Stack-Resource (PSR)** hierarchy.

```
📁 Project (1 per repo)
├── ⚙️  TILT_SERVICE_DEFAULTS.star   # Ports, health checks, memory
├── 🔧 TILT_TECH_STACK.star          # Bun, Vite, Prisma, NATS
│
└── 📦 Stacks (deployment groups)
    ├── 🔐 identity-stack
    │   ├── ⚡ identity-backend      # Resource
    │   └── 🎨 identity-frontend     # Resource
    │
    └── 📅 appointment-stack
        ├── ⚡ appointment-backend    # Resource
        └── 🎨 appointment-frontend   # Resource
```

---

## 📦 Installation

### One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/tdk-landscape/tdk-cli/main/install.sh | bash
```

This will:
- ✅ Check for Bun/Node.js (install Bun if missing)
- ✅ Clone the repository to `~/.tdk/tdk-cli`
- ✅ Install dependencies
- ✅ Link `tdk` command globally
- ✅ Add `~/.bun/bin` to your PATH

### Manual Install from GitHub

If you prefer manual installation:

```bash
# Using npm
npm install -g github:tdk-landscape/tdk-cli

# Using Bun
bun install -g github:tdk-landscape/tdk-cli
```

Or clone and link manually:
```bash
git clone https://github.com/tdk-landscape/tdk-cli.git ~/.tdk/tdk-cli
cd ~/.tdk/tdk-cli/cli
bun install
bun link --force
```

### Verify Installation

```bash
tdk -v
# Should print: 1.1.0

tdk --help
# Shows all available commands
```

---

## ⬆️ Upgrading

Self-update TDK CLI to the latest version:

```bash
# Check current version and upgrade if needed
tdk upgrade

# Force upgrade even if on latest
tdk upgrade --force

# Dry run - see what would happen
tdk upgrade --dry-run
```

Automatically detects installation method (npm, bun, or git) and upgrades accordingly.

---

## 🚀 Quick Start

```bash
# 1️⃣  Initialize project
tdk project

# 2️⃣  Create resources
tdk resource my-api --type backend --stack identity
tdk resource my-app --type frontend --stack identity

# 3️⃣  Start development
tdk up identity

# 4️⃣  Check status
tdk status
```

---

## 📦 Example Project

See a complete working example with Identity and Appointment stacks:

```bash
git clone https://github.com/tdk-landscape/tdk-example.git
cd tdk-example
tdk up
```

**Includes:**
- 🔐 Identity Stack (API + Frontend)
- 📅 Appointment Stack (API + Frontend)  
- Full health checks, Docker builds, React frontends

---

## 🎬 Demo

See TDK CLI in action:

```bash
$ tdk project

╔══════════════════════════════════════════╗
║     🚀  TDK - Tilt Development Kit        ║
╚══════════════════════════════════════════╝

TDK Project Configuration

Project root: /my-project

✓ TILT_SERVICE_DEFAULTS.star created
✓ TILT_TECH_STACK.star created

✅ Project configuration complete!

Next steps:
  1. Review and customize the generated files
  2. Run `tdk resource <name>` to create resources
  3. Run `tdk up` to start development
```

```bash
$ tdk stack identity

📦 Assign resources to stack: identity

⚡ Unassigned Resources:
  ☐ identity-api (backend, port 4000)
  ☐ identity-app (frontend, port 3000)

Select resources (space to toggle, enter to confirm): 
✅ Updated 2 resources

You can now run: tdk up identity
```

```bash
$ tdk up identity

🚀 Starting identity stack...

identity-api      │ Building...
identity-app      │ Building...
identity-api      │ Running on http://localhost:4000
identity-app      │ Running on http://localhost:3000

✅ All services ready! (Press Ctrl+C to stop)
```

---

## 🏗️ Project-Stack-Resource (PSR) Model

### 🌍 Project Level

```bash
# Initialize project (creates master configs)
tdk project

# Show project info
tdk projects
tdk projects --check    # CI validation
```

**Creates:**
- ⚙️ `TILT_SERVICE_DEFAULTS.star` — Platform config (ports 3000-3999 frontend, 4000-4999 backend, health checks, memory limits)
- 🔧 `TILT_TECH_STACK.star` — Tech stack lock (Bun v1.2, Vite v5, Prisma v7, NATS v2)

---

### 📦 Stack Level

```bash
# List all stacks
tdk stacks
tdk stacks --services

# Organize resources
tdk stack identity

# Start/stop
tdk up identity
tdk down
```

---

### ⚡ Resource Level

```bash
# List resources
tdk resources
tdk resources --stack identity
tdk resources --no-stack
tdk resources --ports

# Create new resource
tdk resource my-service --type backend --stack identity
```

**Creates:**
- 📄 `service.json` with auto-assigned port
- 📦 `package.json`, `tsconfig.json`, `Dockerfile`
- 💻 `src/` with starter code (Hono for backend, React for frontend)
- 🧪 `tests/` with Vitest test file

---

## 📊 Complete Command Reference

### PSR Commands

| Level | 🔨 Action | 📋 List |
|-------|-----------|---------|
| 🌍 **Project** | `tdk project` | `tdk projects` |
| 📦 **Stack** | `tdk stack` | `tdk stacks` |
| ⚡ **Resource** | `tdk resource` | `tdk resources` |

### Lifecycle Commands

| Command | Description |
|---------|-------------|
| `tdk up [stack/resource]` | 🚀 Start services |
| `tdk down` | ⏹️ Stop all services |
| `tdk status` | 📊 Show status |

### Utility Commands

| Command | Description |
|---------|-------------|
| `tdk ui` | 🎨 Interactive UI |
| `tdk doctor` | 🔍 Environment check |
| `tdk version` | ℹ️ Show version |
| `tdk upgrade` | ⬆️ Upgrade TDK CLI to latest |

---

## 📁 Repository Structure

```
tdk-cli/
├── 📦 cli/              # CLI package (@tdk/cli)
│   ├── 📁 bin/          # CLI entry point
│   ├── 📁 src/
│   │   ├── 📁 commands/ # CLI commands
│   │   ├── 📁 types/    # TypeScript types
│   │   └── 📁 utils/    # Utilities
│   └── 📄 package.json
│
├── 🔍 discovery/        # Service discovery
├── ⚙️  engine/           # Core orchestration
├── 🎨 ext/              # UI enhancements
├── 📋 specs/            # Tech stack specs
├── 📄 Tiltfile          # Tilt extension entry point
└── 📄 package.json
```

---

## 🔌 Using as Tilt Extension

```python
# In your Tiltfile
v1alpha1.extension_repo(name='tdk-cli', url='https://github.com/tdk-landscape/tdk-cli')
v1alpha1.extension(name='tdk-cli', repo_name='tdk-cli', repo_path='')

load('ext://tdk-cli', 'Utils', 'Manifest', 'Config', 'Determinism', ...)
```

---

## ✨ Features

### 🔒 Deterministic Operations

```starlark
load('ext://tdk-cli', 'Determinism')

# Deterministic file discovery (sorted results)
files = Determinism.deterministic_find('./services', 'service.json')

# Deterministic service discovery
services = Determinism.deterministic_service_discovery(['services/product'])
```

### 🔍 Environment Validation

```bash
$ tdk doctor

✅ Docker daemon running
✅ Bun v1.2 installed
✅ Tilt CLI available
✅ Required ports free
✅ Tiltfile present
✅ Master config files exist
```

---

## 🐚 Shell Completions

TDK CLI supports tab completion for bash, zsh, and fish:

```bash
# Install completions automatically
tdk completion --install --shell bash    # Bash
tdk completion --install --shell zsh     # Zsh
tdk completion --install --shell fish    # Fish

# Or generate and manually install
tdk completion --shell bash > ~/.bash_completion.d/tdk
tdk completion --shell zsh > ~/.zsh/completions/_tdk
tdk completion --shell fish > ~/.config/fish/completions/tdk.fish
```

**Features:**
- 🎯 Command completion: `tdk <TAB>` shows all commands
- 📦 Stack completion: `tdk up <TAB>` shows available stacks
- ⚡ Resource completion: `tdk up <TAB>` shows available resources
- 🔧 Flag completion: `tdk resource --<TAB>` shows options

---

## 📝 License

MIT © [TDK Landscape](https://github.com/tdk-landscape)

---

<div align="center">

**[⬆️ Back to Top](#-tdk-cli)**

Made with 💚 for developers who ship

</div>
