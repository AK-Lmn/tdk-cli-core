# Pitch Documentation

Sales and technical documentation for the Manifest-Driven Development Platform.

## Quick Navigation

### 🚀 Start Here
- [README](./README.md) - Overview and quick links
- [Getting Started](./getting-started.md) - 30-second tutorial

### 📖 Understanding the Problem
- [The Problem](./problem.md) - Why infrastructure autogeneration fails
- [Our Journey](./journey.md) - From 10,000 fixes to 0 fixes
- [ROI](./roi.md) - The real cost of infrastructure chaos

### 🛠️ The Solution
- [Solution](./solution.md) - Level 3 intelligent autogeneration
- [Technical Deep Dive](./technical.md) - How it actually works
- [Manifest Format](./manifest-format.md) - service.json specification
- [FAQ](./faq.md) - Common questions answered

### 🏢 Competitive Analysis
- [Competitors](./competitors.md) - What we evaluated and why they failed

## Reading Paths

### 🎯 For Executives (5 minutes)
1. [README](./README.md) - Overview
2. [ROI](./roi.md) - Business case
3. [Competitors](./competitors.md) - Why us vs. them

### 👨‍💻 For Engineers (15 minutes)
1. [README](./README.md) - Overview
2. [The Problem](./problem.md) - Understand the pain
3. [Solution](./solution.md) - See how it works
4. [Technical Deep Dive](./technical.md) - Architecture details

### 🚀 For Teams Ready to Try (30 minutes)
1. [Getting Started](./getting-started.md) - Hands-on tutorial
2. [Manifest Format](./manifest-format.md) - Write your first service.json
3. [FAQ](./faq.md) - Answer your questions

### 📚 For Deep Dives (1 hour)
Read everything in order:
1. Problem → 2. Journey → 3. Solution → 4. Technical → 5. Competitors → 6. ROI

## Document Stats

| Document | Lines | Purpose |
|----------|-------|---------|
| README | 78 | Entry point |
| Problem | 166 | Pain points |
| Journey | 237 | Origin story |
| Solution | 265 | How it works |
| Competitors | 267 | Competitive analysis |
| Technical | 498 | Deep technical details |
| Getting Started | 462 | Tutorial |
| ROI | 276 | Business case |
| Manifest Format | 537 | API reference |
| FAQ | 250 | Q&A |
| **Total** | **3,036** | Complete documentation |

## Key Insights by Document

### README
- One file → Complete infrastructure
- 30 seconds. Zero fixes. 500+ services.

### Problem
- AI writes features fast, breaks infrastructure faster
- 3 levels of autogeneration: Only Level 3 actually scales

### Journey  
- 2 years, 10,000 fixes, $500K lesson
- Built Level 3 after everything else failed

### Solution
- 5-step pipeline: Validate → Resolve → Generate → Verify → Atomic Write
- Context-aware Starlark generators

### Competitors
- Evaluated 7 tools: Garden, Skaffold, LocalStack, Backstage, Tilt, Testcontainers, Okteto
- None offer Level 3. We built what we needed.

### Technical
- Context object: Full system state for every generator
- Starlark: Python-like, sandboxed, deterministic
- Auto-discovery + Hot reload

### Getting Started
- Install → Create service.json → Run `tilt up`
- 30 seconds from zero to running service

### ROI
- Before: $500K/year in config fixes
- After: $15K/year with platform
- Savings: $485K/year + team sanity

### Manifest Format
- Complete service.json specification
- All service types: api, web, worker, library, sdk
- Environment variables, dependencies, routes

### FAQ
- How this differs from Docker Compose, Kubernetes, Garden
- Can AI write service.json? Yes!
- Is there vendor lock-in? No.

## Writing Style

**Inverted Pyramid Structure** (journalism style):
- Most important information first
- Then supporting details
- Background/context last
- Each document follows this pattern

**Technical Writing** (Karpathy-inspired):
- Code examples over buzzwords
- First principles explanations
- Real numbers and data
- Honest about failures and lessons

---

**Built by a team that spent 2 years and $500K learning why infrastructure autogeneration fails. Then we solved it.**

*10,000 lessons. One platform. Zero regrets.*
