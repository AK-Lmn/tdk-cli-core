# 🚀 TDK CLI

> **T**ilt **D**evelopment **K**it — All-in-one local development platform for microservices

[![npm version](https://img.shields.io/npm/v/@tdk/cli.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

```bash
# Using npm
npm install -g @tdk/cli

# Using Bun (recommended)
bun install -g @tdk/cli
```

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

## 📝 License

MIT © [TDK Landscape](https://github.com/tdk-landscape)

---

<div align="center">

**[⬆️ Back to Top](#-tdk-cli)**

Made with 💚 for developers who ship

</div>
