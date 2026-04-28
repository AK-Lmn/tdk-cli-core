# TDK CLI
## Kubernetes-Free Microservice Development

**The Problem:** 70% of developers don't understand Kubernetes. Yet every microservice tool forces them to learn it. Teams give up and pay for expensive cloud dev environments.

**The Solution:** TDK CLI lets you run 5-120+ microservices locally without touching Kubernetes.

---

## What Makes TDK Different

| Feature | TDK CLI | Others |
|---------|---------|--------|
| **Setup** | Simple `service.json` | Complex YAML configs |
| **Kubernetes** | ❌ Not required | ✅ Required (or leaks concepts) |
| **Auto-Generate** | Docker, Vite, TSConfig, nginx, Tiltfile | Manual setup |
| **Golden Images** | Production-ready L1-L4 layering | DIY Dockerfiles |
| **Auto-Discovery** | Scans directories automatically | Manual registration |

---

## Who Uses TDK

- **Full-Stack Developers** who don't know K8s and don't want to
- **Product Teams** who need to run the whole stack locally
- **Startups** that outgrew "works on my machine" but aren't ready for platform engineering overhead

---

## Messaging

**Say this:**
> "Run your microservices locally without learning Kubernetes"

**Don't say this:**
> "Manifest-driven local development orchestration framework"

---

## Built on Solid Ground

TDK stands on **Tilt** (9.4k GitHub stars) — the gold standard for local dev tooling. We add:
- Manifest-driven configuration (unique in local-dev space)
- Automatic config generation
- Golden Docker images with smart layering
- Service auto-discovery

---

## The Real Competition

It's not Garden, Skaffold, or DevSpace. It's:
- "Works on my machine" chaos
- Teams surrendering to $500/mo cloud dev environments
- Manual Docker Compose maintenance hell

**Closest competitor:** Garden.io — but they require cluster knowledge and leak K8s concepts everywhere.

---

**TDK CLI: Run your stack locally. No Kubernetes required.**
