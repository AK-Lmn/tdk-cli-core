# Level 2: Safety — "It Doesn't Break"

## The Need

After basic functionality, developers need reliability and safety.

```
┌─────────────────────────────┐
│       LEVEL 2: SAFETY       │
│                             │
│  Need: Reliability           │
│  Question: "Will it break   │
│           in production?"   │
│                             │
│  Competitors: Garden,       │
│  Skaffold, Terraform        │
└─────────────────────────────┘
```

## What This Level Provides

### Safety Requirements

✅ Configs are validated  
✅ Errors are caught early  
✅ Basic conflict detection  
✅ Some guardrails exist  
⚠️ But limited to single configs

### The Bar is Higher

At Level 2, success means:
- Syntax validation passes
- Required fields are present
- Basic type checking works
- Some errors prevented

**It doesn't mean:**
- ❌ System-wide validation
- ❌ Context-aware checking
- ❌ Semantic validation
- ❌ Won't break at scale

## Competitors at Level 2

### Garden

**What it provides:**
- YAML template validation
- Module dependency checking
- Basic error reporting

**Level 2 limitations:**
- ⚠️ Validates syntax, not semantics
- ⚠️ No system-wide context
- ⚠️ K8s-only
- ❌ Breaks at 20-50 services

```yaml
# Garden validates this structure
modules:
  - name: my-service
    type: container
    services:
      - name: api
        ports:
          - name: http
            containerPort: 3000
        
# But doesn't check if 3000 is already used
# by another service in your system
```

**Our experience:** Better than Level 1, but still context-blind.

### Skaffold

**What it provides:**
- Profile-based configuration
- Basic schema validation
- Deployment health checks

**Level 2 limitations:**
- ⚠️ Profile validation only
- ⚠️ No cross-service awareness
- ⚠️ K8s-first architecture
- ❌ Manual config management

```yaml
# Skaffold validates profiles
profiles:
  - name: local
    build:
      artifacts:
        - image: my-app
          docker:
            dockerfile: Dockerfile
            
# But each profile is isolated
# No system-wide validation
```

**Our experience:** Good for K8s workflows. Doesn't solve the root problem.

### Terraform

**What it provides:**
- Plan before apply
- State validation
- Dependency graph

**Level 2 limitations:**
- ✅ Strong validation (best at Level 2)
- ⚠️ Infrastructure-only (not app configs)
- ⚠️ Heavy and complex
- ⚠️ Still manual HCL writing

```hcl
# Terraform validates before apply
resource "docker_container" "app" {
  name  = "my-app"
  image = docker_image.app.latest
  
  ports {
    internal = 3000
    external = 3000
  }
}
# But you manually define everything
# And it's infrastructure-focused
```

**Our experience:** Best-in-class for Level 2. But still manual and heavy.

### Backstage Scaffolder

**What it provides:**
- Template validation
- Parameter checking
- Required field enforcement

**Level 2 limitations:**
- ⚠️ One-time validation only
- ⚠️ Scaffolding, not ongoing
- ⚠️ No system state awareness
- ❌ Doesn't handle updates

```yaml
# Backstage validates template parameters
parameters:
  - title: Service Name
    required: true
    type: string
    validation:
      pattern: '^[a-z0-9-]+$'
      
# Validates when creating
# But doesn't validate ongoing changes
```

**Our experience:** Good for bootstrapping. Not for maintenance.

## Why Level 2 Fails at Scale

### The Context Problem

Level 2 tools validate **individual configs** but don't understand **the system**:

```
Service A config: ✅ Valid
Service B config: ✅ Valid
Service A + B together: ❌ CONFLICT!
```

**Example:**
```yaml
# Service A (valid)
ports:
  - "3000:3000"

# Service B (valid)
ports:
  - "3000:3000"  # Same port!
  
# Both pass Level 2 validation
# Both fail when run together
```

### The Scaling Problem

| Services | Level 2 validation | Actual conflicts | Firefighting |
|----------|-------------------|------------------|--------------|
| 5 | ✅ Passes | 0 | Low |
| 10 | ✅ Passes | 2 | Medium |
| 20 | ⚠️ Warnings | 8 | High |
| 50 | ❌ Overwhelmed | 25 | Crisis |

**Level 2 catches some errors, but misses:**
1. Cross-service conflicts
2. System-wide resource contention
3. Semantic (not just syntactic) errors
4. Context-dependent issues

### Our Level 2 Story

**Year 1:** "Let's add basic validation scripts"

```python
# Our Level 2 attempt
def validate_service(service):
    if not service.get('port'):
        raise ValueError("Port required")
    if not isinstance(service['port'], int):
        raise ValueError("Port must be int")
    return True
```

**Result:**
- Better than Level 1
- Still breaking weekly
- 2,000 fixes at 50 services
- **Need Level 3: Context awareness**

## What Level 2 Feels Like

```
Developer: "I'm adding a new service"
Level 2: "Great! Let me validate it..."

Developer: "Will it conflict?"
Level 2: "Not in this file. But I don't know
          about other files."

Developer: "What about the port?"
Level 2: "It's a valid port number!
          Whether it's available? 🤷"

Developer: "Will it work in production?"
Level 2: "¯\_(ツ)_/¯"
```

## Moving to Level 3

**The realization:** Validation needs context. Single-file checking isn't enough.

Level 3 adds:
- ✅ System-wide awareness
- ✅ Context-aware validation
- ✅ Cross-service conflict detection
- ✅ Full system state

**[Next: Level 3 — Belonging →](./level-3-belonging.md)**

---

## Where We Are

**✅ We cover Level 2:**
- 5-step validation pipeline
- Structure validation (required fields, types)
- Syntax validation (YAML, Nginx, TypeScript)
- Semantic validation (port ranges, valid references)

**But we don't stop here.**

**[See the full pyramid →](./README.md)**
