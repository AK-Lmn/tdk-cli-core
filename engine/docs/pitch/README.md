# Manifest-Driven Development Platform

> **One `service.json` → Complete infrastructure. Actually works at scale.**

## TL;DR

We built the only infrastructure platform that scales to 500+ services. After 2 years and 10,000 fixes, we learned AI writes features fast but breaks infrastructure faster.

**Our solution:** One `service.json` file generates Docker, Nginx, Vite, and environment configs automatically—validated, conflict-free, and production-ready.

**Key result:** 30 seconds to add a service. Zero manual config fixes. Works at any scale.

## Quick Links

- [The Problem](./problem.md) — Why infrastructure autogeneration fails
- [The Solution](./solution.md) — Level 3 intelligent autogeneration
- [Our Journey](./journey.md) — From 10,000 fixes to 0 fixes
- [Competitors](./competitors.md) — What we evaluated and why they failed
- [Technical Deep Dive](./technical.md) — How it actually works
- [Getting Started](./getting-started.md) — 30-second tutorial
- [ROI](./roi.md) — The real cost of infrastructure chaos
- [Manifest Format](./manifest-format.md) — service.json specification

## The Core Insight

Infrastructure configs are code. They need the same tooling as your application:
- ✅ Validation
- ✅ Dependencies  
- ✅ Testing
- ✅ Context awareness

Most tools offer Level 1 (templates) or Level 2 (scripts). Both break past 20 services.

**This is Level 3:** Context-aware, validated, atomic autogeneration using Starlark.

## Current State

| Metric | Value |
|--------|-------|
| **Product** | Mature, battle-tested |
| **Services in production** | 120+ |
| **Architecture tested to** | 500+ services |
| **Infrastructure fixes needed** | 0 |
| **Status** | Open source, seeking design partners |

## One-Minute Demo

```bash
# 1. Define service
cat > service.json << 'EOF'
{
  "name": "my-api",
  "port": 3000,
  "type": "api"
}
EOF

# 2. Run
tilt up

# 3. Done ✅
# Platform generates docker-compose, nginx, vite configs automatically
```

**Time:** 30 seconds. **Fixes needed:** 0.

## Who This Is For

- **Teams with 10+ microservices** — Drowning in configuration
- **AI-native developers (vibe coders)** — Ship AI features without infrastructure chaos
- **Solo founders** — Enterprise-grade infrastructure without DevOps expertise
- **Platform engineers** — Stop being a "config repair shop"

---

*Built by a team that spent 2 years and $500K learning why infrastructure autogeneration fails. Then we solved it.*

**[Start here →](./getting-started.md)**
