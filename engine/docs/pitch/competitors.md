# Competitors: What We Evaluated

## Summary

**Every tool we evaluated was Level 1 or 2.** None offered Level 3 intelligent autogeneration with context awareness, validation, and atomic updates.

**We needed Level 3 to scale past 100 services. So we built it.**

---

## Garden

**What it is:** Kubernetes development platform  
**Category:** Local development orchestration  
**Their autogen:** YAML-based templates (Level 1)

### What They Do
- Kubernetes-focused local development
- YAML templates with variable substitution
- Service dependency management

### Why We Didn't Use It

**Level 1 Problems:**
```yaml
# Garden template
services:
  {{name}}:
    ports: ["{{port}}:{{port}}"]
```

- ❌ Static templates (no logic)
- ❌ Kubernetes-only (we needed Docker Compose)
- ❌ No conflict detection
- ❌ No validation pipeline
- ❌ Would break at 20 services (like our templates did)

### Our Verdict
**Complementary, not a replacement.** Garden is good for K8s teams. We needed something that works without K8s and has intelligent autogeneration.

---

## Skaffold

**What it is:** Google-built Kubernetes dev workflow  
**Category:** CI/CD + local dev  
**Their autogen:** skaffold.yaml profiles (Level 1)

### What They Do
- Google Cloud focused
- Profile-based configuration
- K8s deployment automation

### Why We Didn't Use It

**K8s-First Limitation:**
- ❌ Kubernetes-only architecture
- ❌ Profile-based, not manifest-driven
- ❌ No multi-target generation (just K8s)
- ❌ No context-aware conflict resolution

### Our Verdict
**Wrong abstraction.** We weren't on Kubernetes yet. Even if we were, Skaffold doesn't offer the intelligent autogeneration we needed.

---

## LocalStack

**What it is:** AWS service emulator  
**Category:** Cloud service emulation  
**Their autogen:** ❌ None (Level 0)

### What They Do
- Emulates 100+ AWS services locally
- S3, DynamoDB, Lambda, etc.
- Testing and development

### Why We Didn't Use It

**No Autogeneration:**
- ❌ No config generation at all
- ❌ Just emulates AWS APIs
- ❌ No Docker Compose generation
- ❌ No service orchestration

### Our Verdict
**Different problem space.** LocalStack emulates cloud services. We needed infrastructure config generation. These are complementary tools.

**Note:** We actually use LocalStack alongside our platform for AWS emulation.

---

## Backstage

**What it is:** Spotify's developer portal (CNCF project)  
**Category:** Developer portal / Service catalog  
**Their autogen:** ⚠️ Limited scaffolder (not ongoing)

### What They Do
- Service catalog and discovery
- Scaffolder for new services (one-time)
- Plugin ecosystem
- Documentation hub

### Why We Didn't Use It

**Scaffolder ≠ Autogenerator:**
- ✅ Creates initial service templates (one-time)
- ❌ No ongoing config generation
- ❌ No infrastructure config generation
- ❌ Catalog-focused, not orchestration
- ❌ No validation or conflict resolution

### Our Verdict
**Complementary, not competitive.** Backstage is great for service discovery and documentation. We use it alongside our platform. But it doesn't solve the infrastructure config problem.

---

## Tilt (Vanilla)

**What it is:** Local development orchestrator  
**Category:** Development environment  
**Their autogen:** ❌ None (we built it on top)

### What They Do
- Excellent live reload
- Multi-service orchestration
- Starlark support (Python-like config language)
- Docker Compose integration

### Why We Built On It

**Tilt is the orchestration layer. We built the autogeneration layer on top.**

- ✅ Excellent live reload (`live_update`)
- ✅ Multi-service dependency management
- ✅ Starlark support for custom logic
- ✅ Docker Compose integration
- ✅ Hot reload without restart

### What We Added

**The entire manifest-driven autogeneration system:**
- `service.json` manifest format
- Context-aware generators
- 5-step validation pipeline
- Auto-discovery of services
- Multi-target config generation (Docker, Nginx, Vite)
- Atomic updates

### Our Verdict
**Perfect foundation.** Tilt handles orchestration. Our platform handles intelligent config generation. Together: Level 3 autogeneration.

---

## Testcontainers

**What it is:** Integration testing library  
**Category:** Testing  
**Their autogen:** ❌ None

### What They Do
- Programmatic container management for tests
- 50+ modules (Postgres, Redis, Kafka, etc.)
- JUnit/TestNG integration

### Why We Didn't Use It

**Test-Scoped Only:**
- ❌ No development orchestration
- ❌ No config generation
- ❌ Per-test lifecycle, not long-running
- ❌ Different use case entirely

### Our Verdict
**Different purpose.** Testcontainers is for integration tests. We needed development environment orchestration. These solve different problems.

---

## Okteto

**What it is:** Kubernetes development environment  
**Category:** Cloud dev environments  
**Their autogen:** okteto.yaml (Level 1)

### What They Do
- Production-like K8s dev environments
- Hot reload in K8s
- Service synchronization

### Why We Didn't Use It

**K8s-Only Limitation:**
- ❌ Kubernetes-only
- ❌ No manifest-driven codegen
- ❌ No conflict resolution
- ❌ No validation pipeline

### Our Verdict
**Wrong deployment target.** We weren't ready for Kubernetes. Even if we were, Okteto doesn't offer intelligent autogeneration.

---

## Why We Built Instead of Bought

### What We Needed

✅ Context-aware conflict resolution  
✅ Validation pipeline  
✅ Atomic updates  
✅ Starlark-based generation  
✅ No Kubernetes requirement  
✅ Multi-target generation (Docker, Nginx, Vite)  

### What Exists

❌ **None of the above**

Every tool we evaluated:
- Used static templates (Level 1) OR
- Used basic scripts (Level 2)

**None offered Level 3:** Context-aware, validated, atomic autogeneration.

### The Gap

```
Level 1: Templates (Garden, Skaffold)     → Breaks at 20 services
Level 2: Scripts (Basic generators)         → Breaks at 50 services
Level 3: Intelligent (What we built)     → Works at 500+ services ✅
```

**We needed Level 3. Nobody had built it. So we did.**

---

## Comparison Table

| Tool | Level | Context | Validation | Atomic | K8s Req | Scale |
|------|-------|---------|------------|--------|---------|-------|
| **Garden** | 1 | ❌ | ❌ | ❌ | ✅ | ~20 |
| **Skaffold** | 1 | ❌ | ❌ | ❌ | ✅ | ~20 |
| **LocalStack** | 0 | ❌ | ❌ | ❌ | ❌ | N/A |
| **Backstage** | 1 | ⚠️ | ❌ | ❌ | ❌ | N/A |
| **Tilt** | 0* | ❌ | ❌ | ❌ | ❌ | N/A |
| **Testcontainers** | 0 | ❌ | ❌ | ❌ | ❌ | N/A |
| **Okteto** | 1 | ❌ | ❌ | ❌ | ✅ | ~20 |
| **Ours** | **3** | ✅ | ✅ | ✅ | ❌ | **500+** |

*We built Level 3 on top of Tilt

---

## What We Use Today

**Core Platform:** Our manifest-driven autogeneration (Level 3)  
**Orchestration:** Tilt (for live reload and service management)  
**Service Catalog:** Backstage (for documentation and discovery)  
**AWS Emulation:** LocalStack (for testing cloud services)  
**Testing:** Testcontainers (for integration tests)

**Best of breed. Each tool solves one problem well.**

---

**[See the technical details →](./technical.md)**  
**[Try it yourself →](./getting-started.md)**
