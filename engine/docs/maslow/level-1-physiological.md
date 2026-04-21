# Level 1: Physiological — "It Works"

## The Need

At the most basic level, developers need infrastructure configs that work.

```
┌─────────────────────────────┐
│     LEVEL 1: PHYSIOLOGICAL  │
│                             │
│  Need: It Works            │
│  Question: "Does it        │
│           generate        │
│           configs?"        │
│                             │
│  Competitors: Docker       │
│  Compose, Helm, etc.       │
└─────────────────────────────┘
```

## What This Level Provides

### Basic Requirements

✅ Configuration files are generated  
✅ Services can start  
✅ Basic connectivity exists  
✅ Fundamentally functional

### The Bar is Low

At Level 1, success means:
- `docker-compose up` doesn't crash immediately
- Service responds to health checks
- Basic networking works

**It doesn't mean:**
- ❌ Configs are correct
- ❌ No conflicts exist
- ❌ It scales beyond one service
- ❌ Production-ready

## Competitors at Level 1

### Docker Compose

**What it provides:**
- Manual YAML configuration
- Container orchestration
- Service networking

**Level 1 limitations:**
- ❌ No generation (you write everything)
- ❌ No validation
- ❌ No conflict detection
- ❌ Linear effort with service count

```yaml
# You write this manually for every service
version: '3.8'
services:
  service1:
    ports:
      - "3000:3000"  # Hope nothing else uses 3000!
  service2:
    ports:
      - "3000:3000"  # Oops, conflict!
```

**Our experience:** We started here. It works for 1-5 services. Falls apart at 10+.

### Helm

**What it provides:**
- Kubernetes package management
- Template-based config generation
- Values files for customization

**Level 1 limitations:**
- ❌ Static templates only
- ❌ No system-wide context
- ❌ Manual value management
- ❌ K8s-only (no local dev)

```yaml
# Helm template
template:
  spec:
    ports:
      - containerPort: {{ .Values.port }}
# But what if that port is taken?
# Helm doesn't know about other services
```

**Our experience:** Great for K8s deployment. Doesn't solve local development.

### Cookiecutter / Yeoman

**What it provides:**
- Project scaffolding
- One-time file generation
- Boilerplate reduction

**Level 1 limitations:**
- ❌ One-time only (not ongoing)
- ❌ No system awareness
- ❌ No updates/maintenance
- ❌ Just initial setup

```bash
# Generate once
cookiecutter template
# Now manually maintain forever
```

**Our experience:** Useful for starting. Not for ongoing infrastructure.

### Make / Shell Scripts

**What it provides:**
- Command automation
- Basic orchestration
- Script-based workflows

**Level 1 limitations:**
- ❌ No config generation
- ❌ No validation
- ❌ Brittle and error-prone
- ❌ Doesn't scale

```bash
# Works for one service
# Breaks for 10
# Nightmare for 50
```

## Why Level 1 Fails

### The Scaling Problem

| Services | Time per service | Total time | Success rate |
|----------|-----------------|------------|--------------|
| 1 | 1 hour | 1 hour | 90% |
| 5 | 1 hour | 5 hours | 70% |
| 10 | 2 hours | 20 hours | 50% |
| 20 | 4 hours | 80 hours | 30% |
| 50 | 8 hours | 400 hours | 10% |

**Level 1 tools don't scale because:**
1. Manual effort is linear
2. No conflict detection
3. No system-wide view
4. Humans make mistakes

### Our Level 1 Story

**Month 1:** "Docker Compose is great!"  
**Month 3:** "Why does everything break?"  
**Month 6:** "We need something better."

**The 10,000 fixes started here.**

## What Level 1 Feels Like

```
Developer: "I'm adding a new service"
Level 1: "Great! Write docker-compose.yml, 
          nginx.conf, .env, vite.config..."

Developer: "That's a lot of files"
Level 1: "Yes. And if you get any wrong,
          everything breaks."

Developer: "What about port conflicts?"
Level 1: "Check manually. Hope for the best."

Developer: "What if I forget a dependency?"
Level 1: "Production will tell you."
```

## Moving to Level 2

**The realization:** "It works" isn't enough. It needs to work reliably.

Level 2 adds:
- ✅ Validation
- ✅ Basic error checking
- ⚠️ Still manual, but with guardrails

**[Next: Level 2 — Safety →](./level-2-safety.md)**

---

## Where We Are

**✅ We cover Level 1:**
- Generate Docker Compose configs
- Generate Nginx configs
- Generate Vite configs
- Generate environment files

**But we don't stop here.** We built all 5 levels.

**[See the full pyramid →](./README.md)**
