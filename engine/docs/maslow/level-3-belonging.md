# Level 3: Belonging — "Works With My Stack"

## The Need

After safety, developers need tools that fit their existing ecosystem.

```
┌─────────────────────────────┐
│      LEVEL 3: BELONGING     │
│                             │
│  Need: Ecosystem Fit         │
│  Question: "Does it work    │
│           with my tools?"  │
│                             │
│  Competitors: Okteto,       │
│  Testcontainers,            │
│  Docker Desktop             │
└─────────────────────────────┘
```

## What This Level Provides

### Belonging Requirements

✅ Integrates with existing tools  
✅ No vendor lock-in  
✅ Works with current stack  
✅ Incremental adoption possible  
⚠️ But often forces choices

### The Integration Promise

At Level 3, success means:
- Works alongside your tools
- Doesn't require migration
- Plays nice with your workflow
- Fits your ecosystem

**The trap:** Many Level 3 tools say "integrates" but actually mean "requires."

## Competitors at Level 3

### Okteto

**What it provides:**
- Kubernetes development environments
- Live synchronization to K8s
- Integration with K8s ecosystem

**Level 3 limitations:**
- ❌ **Forces K8s adoption** (not optional)
- ✅ Good K8s integration
- ⚠️ Still manual config work
- ⚠️ Complex setup

```yaml
# Okteto requires Kubernetes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    spec:
      containers:
        - name: app
          image: my-image
```

**The problem:** "Integrates with K8s" actually means "requires K8s."

**Our experience:** Great if you're already on K8s. We weren't ready for that jump.

### Testcontainers

**What it provides:**
- Integration with test frameworks
- Programmatic container management
- JUnit/TestNG integration

**Level 3 strengths:**
- ✅ Great test framework integration
- ✅ Works with Java, Go, Python, etc.
- ✅ Sandboxed test environments

**Level 3 limitations:**
- ⚠️ Test-scoped only (not development)
- ⚠️ Not for long-running services
- ❌ No infrastructure generation

```java
// Great for integration tests
@Testcontainers
public class DatabaseTest {
    @Container
    private static final PostgreSQLContainer<?> postgres = 
        new PostgreSQLContainer<>("postgres:14");
    
    @Test
    void testConnection() {
        // Test with real database
    }
}
// But doesn't help with development environment
```

**Our experience:** We use Testcontainers alongside our platform. Complementary, not competitive.

### Docker Desktop

**What it provides:**
- Local Docker environment
- Kubernetes (optional)
- Developer workflow integration

**Level 3 strengths:**
- ✅ Standard tool everyone has
- ✅ Good local dev experience
- ✅ Wide ecosystem support

**Level 3 limitations:**
- ⚠️ Just provides environment
- ❌ No config generation
- ❌ No orchestration
- ❌ Manual everything

```bash
# Docker Desktop gives you Docker
# You still write all configs manually
docker-compose up
# Hope your manually-written configs work
```

**Our experience:** Foundation of our stack. But needs layer on top.

### GitHub Codespaces

**What it provides:**
- Cloud-based dev environments
- GitHub integration
- Prebuilt containers

**Level 3 strengths:**
- ✅ Deep GitHub integration
- ✅ Pre-configured environments
- ✅ Shareable setups

**Level 3 limitations:**
- ⚠️ GitHub-only
- ⚠️ Cloud-dependent
- ❌ Doesn't generate service configs
- ❌ VS Code focused

```json
// .devcontainer/devcontainer.json
{
  "name": "My Project",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  }
}
// Provides environment
// Doesn't help with service configuration
```

**Our experience:** Good for onboarding. Doesn't solve infrastructure chaos.

### Backstage (Service Catalog)

**What it provides:**
- Service discovery
- Documentation hub
- Plugin ecosystem
- Scaffolder for new services

**Level 3 strengths:**
- ✅ Great service catalog
- ✅ Documentation integration
- ✅ Wide plugin ecosystem
- ✅ Tech radar, API docs

**Level 3 limitations:**
- ⚠️ Scaffolder is one-time
- ⚠️ Doesn't handle ongoing config
- ❌ No infrastructure generation
- ⚠️ Heavy to set up

```yaml
# Backstage catalog entity
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    github.com/project-slug: my-org/my-service
spec:
  type: service
  owner: team-a
  lifecycle: production
# Great for discovery
# Doesn't generate docker-compose, nginx, etc.
```

**Our experience:** We use Backstage alongside our platform. It catalogs. We generate.

### Tilt (Vanilla)

**What it provides:**
- Local development orchestration
- Live reload
- Multi-service management
- Starlark configuration

**Level 3 strengths:**
- ✅ Excellent live reload
- ✅ Great local dev experience
- ✅ Flexible with Starlark
- ✅ Docker Compose integration

**Level 3 limitations:**
- ⚠️ No config generation (just orchestration)
- ⚠️ You write all the Tiltfile logic
- ⚠️ Manual service registration
- ❌ No auto-discovery

```starlark
# You write this manually for every service
docker_build('my-service', './services/my-service')
k8s_yaml('./services/my-service/k8s.yaml')
k8s_resource('my-service', port_forwards=3000)
# Or manage it all yourself
```

**Our experience:** We love Tilt! We built on top of it. Tilt handles orchestration. We handle intelligent autogeneration.

## The "Integration" Trap

### What "Integrates" Often Means

| Tool Says | Reality |
|-----------|---------|
| "Integrates with K8s" | "Requires K8s" |
| "Integrates with Docker" | "Runs in Docker" |
| "Integrates with GitHub" | "GitHub-only" |
| "Fits your workflow" | "Use our workflow" |

### True Integration

Real Level 3 integration means:
- ✅ **Optional adoption** (not forced migration)
- ✅ **Works alongside** (not replacement)
- ✅ **Standard formats** (no lock-in)
- ✅ **Incremental** (add one service at a time)

## Why Level 3 Isn't Enough

### Integration Without Automation

Most Level 3 tools integrate well but still require **manual work**:

```
Level 3: "Works with your stack!"
Developer: "Great! I have 50 services."
Level 3: "Write configs for each one."
Developer: "But you said it integrates..."
Level 3: "It does! After you manually set everything up."
```

**The gap:** They fit your stack but don't **generate** for your stack.

### Our Level 3 Story

**What we tried:**
- Testcontainers for testing ✅
- Docker Desktop for environment ✅
- Tilt for orchestration ✅
- Backstage for catalog ✅

**What was missing:** None of them generated our 120 service configs.

## What Level 3 Feels Like

```
Developer: "I need infrastructure that works with my stack"
Level 3: "Great! Use our tool."

Developer: "But I already have Tilt/Docker/etc."
Level 3: "Stop using those. Use ours instead."

Developer: "Can I keep my existing setup?"
Level 3: "You can, but you'll need to migrate everything."

Developer: "What about my team's workflows?"
Level 3: "They'll need to learn our way."

Developer: "Is there vendor lock-in?"
Level 3: "...Have you seen our enterprise plan?"
```

## Moving to Level 4

**The realization:** Integration is good, but speed is better.

Level 4 adds:
- ✅ Developer experience
- ✅ Speed and hot reload
- ✅ Fast iteration
- ✅ 10x productivity

**[Next: Level 4 — Esteem →](./level-4-esteem.md)**

---

## Where We Are

**✅ We cover Level 3:**
- Built **on top of** Tilt (not replacing)
- Works with Docker Compose (not requiring K8s)
- Generates standard configs (no lock-in)
- Integrates with existing services
- Can adopt incrementally

**But we don't stop here.** Speed comes next.

**[See the full pyramid →](./README.md)**
