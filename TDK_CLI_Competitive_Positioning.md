# TDK CLI Competitive Positioning

**The Kubernetes-Free Alternative for Local Microservice Development**

---

## 1. Title

**TDK CLI Competitive Positioning**  
The Kubernetes-Free Alternative for Local Microservice Development

---

## 2. The Problem: The Kubernetes Learning Curve

70% of developers don't understand Kubernetes.  
Yet every microservice tool forces them to learn it.

| Tool | The Promise | The Reality |
|------|-------------|-------------|
| **Garden** | "Production-like environments" | Hidden complexity |
| **Skaffold** | Google-backed tooling | Requires K8s cluster expertise |
| **DevSpace** | "Cloud-native dev environments" | Deprecated, pivoted to AI agents |
| **Okteto** | "Dev environments in Kubernetes" | Requires remote cluster |

**Result:** Cognitive overload. Teams give up and use expensive cloud dev environments.

**Speaker Note:** The Kubernetes learning curve is real. Most developers didn't sign up to become DevOps engineers. Yet every microservice tool out there—Garden, Skaffold, DevSpace—forces them to learn K8s concepts.

---

## 3. What Developers Actually Hear

### Garden says:
> "Spin up production-like environments for development, testing, and CI on demand"

### Developer hears:
> "Learn Kubernetes, namespaces, ingress, contexts, deployments..."

**Result:** Cognitive overload. They give up and use expensive cloud dev environments.

**TDK's approach:** Pure Docker + Tilt. No K8s concepts leaked.

**Speaker Note:** This is the translation problem. Garden's marketing says 'production-like environments' but what developers actually hear is 'learn namespaces, ingress, contexts, and deployments.'

---

## 4. The Competitive Landscape

| Tool | Position | Kubernetes |
|------|----------|------------|
| **Tilt** | Foundation layer | TDK is built ON Tilt (not competing) |
| **Garden** | Manifest-driven but leaks K8s | Requires cluster knowledge |
| **Skaffold** | Pure K8s tool | No auto-generation, complex YAML |
| **DevSpace** | Deprecated/pivoted | Now an AI agent company |
| **Okteto** | Remote clusters only | Requires cloud infrastructure |
| **TDK CLI** | Manifest-driven, K8s-free | Docker only, auto-generates configs |

**Speaker Note:** Let's map the competitive landscape. Tilt is our foundation—we're built ON Tilt, not competing with it. Garden is our closest competitor but they leak K8s concepts.

---

## 5. TDK vs. Garden: Head-to-Head

| Feature | TDK CLI | Garden |
|---------|---------|--------|
| **Manifest-driven** | Simple service.json | Complex garden.yml |
| **Auto-generate configs** | Docker, Vite, TSConfig, nginx, 10+ files | Manual setup, limited auto-gen |
| **K8s Required** | No (Docker only) | Yes/Optional (leaks concepts) |
| **Learning curve** | Low | High |
| **Setup time** | Minutes | Days |
| **Scale proven** | 120+ services locally | Enterprise-focused |

**Winner:** TDK for developers who don't know K8s. Garden for platform teams who do.

**Speaker Note:** Head-to-head comparison. Garden requires you to write garden.yml and understand K8s concepts. TDK uses a simple service.json. The biggest difference: Garden eventually requires cluster knowledge, TDK never does for local dev.

---

## 6. TDK's Unique Position

**What makes TDK different:**

1. **Generates configs from manifests** (service.json → 10+ files)
2. **Works WITHOUT Kubernetes** (pure Docker + Tilt)
3. **Scales to 120+ services locally** (proven at that scale)
4. **Auto-discovers services** from directory structure
5. **Provides golden Docker images** (L1-L4 layering)

**The only tool that is:**
- Manifest-driven AND
- Kubernetes-free AND  
- Auto-generates configs AND
- Proven at scale

**Speaker Note:** Here's what makes TDK unique. We're the only tool that generates configs from manifests WITHOUT requiring Kubernetes. We've proven this scales to 120+ services locally.

---

## 7. Who Uses What Tool

| Role | Tool | Why |
|------|------|-----|
| **Platform Engineers** | Garden, DevSpace | They WANT K8s-native tools |
| **Senior Backend Devs** | Tilt, Skaffold | They tolerate K8s complexity |
| **Full-Stack/Product Devs** | **TDK** | They don't know K8s, don't want to |
| **Startups** | **TDK** | Need speed without platform team |

**TDK's target:** Developers who just want to write code.

**Speaker Note:** Audience segmentation matters. Platform engineers WANT K8s—they'll pick Garden or DevSpace. But full-stack and product developers DON'T know K8s and DON'T want to learn it. That's our target market.

---

## 8. Positioning Statement

> **TDK CLI** is the **Kubernetes-free alternative** for local microservice development.
>
> **For:** Teams building microservices who don't want to learn Kubernetes  
> **Who:** Need to run 5-120+ services locally  
> **Unlike:** Garden (requires cluster knowledge)  
> **We:** Provide Docker-only simplicity with manifest-driven speed

**Key differentiators:**
- Docker-only (no K8s required)
- 120+ services proven at scale
- Auto-generates 10+ config files
- Golden Docker images included

**Speaker Note:** Here's our positioning statement. This is our North Star for all messaging.

---

## 9. Marketing Messaging

### DO say this:
> "Run your microservices locally without learning Kubernetes"

> "One service.json file generates 10+ configurations automatically"

> "For developers who want to focus on code, not infrastructure"

### DON'T say this:
> "Manifest-driven local development orchestration framework" (jargon)

> "For stupid developers who don't know K8s" (insulting)

> "Zero K8s tax" (awkward phrasing)

**Key rule:** Lead with the benefit, not the technology.

**Speaker Note:** Messaging do's and don'ts. Don't say 'manifest-driven local development orchestration framework'—that's jargon. Do say 'run your microservices locally without learning Kubernetes'—that's the benefit.

---

## 10. Competitive Moat

**Four pillars of defensibility:**

1. **Tilt Foundation** — 9.4k GitHub stars, battle-tested stability
2. **Manifest-Driven** — Unique in local-dev space (only TDK does this)
3. **Golden Images** — Production-ready Docker layering (L1-L4)
4. **Auto-Discovery** — Zero manual service registration

**Plus: Scale proof**
- 120+ services locally (proven)
- 10+ config files per service
- 70% reduction in "works on my machine" issues

**Competitors can copy one pillar. Replicating all four is hard.**

**Speaker Note:** Our moat isn't one thing—it's four. Tilt foundation gives us stability. Manifest-driven approach is unique in local-dev. Golden images give us production-readiness. Auto-discovery removes friction.

---

## 11. Bottom Line

**Your real competition isn't other tools—it's:**
- "Works on my machine" chaos
- Teams giving up and using cloud dev environments ($$$)
- Manual Docker Compose maintenance hell

**Closest competitor:** Garden.io
- Requires cluster knowledge
- Leaks K8s concepts everywhere
- Same manifest-driven power, but with K8s complexity

**TDK's unique angle:** Same manifest-driven power, zero K8s complexity.

**Speaker Note:** The real competition isn't other tools—it's the status quo. 'Works on my machine' chaos. Teams surrendering to $500+/month cloud dev environments.

---

## 12. Closing

# TDK CLI
## Kubernetes-Free Microservice Development

**One manifest. Multiple configs. Zero K8s knowledge required.**

---

# Appendix

## A. Technical Architecture

### How TDK CLI Works

```
service.json (source of truth)
    ↓
Generator Engine (Starlark-based)
    ↓
├─ vite.star → vite.config.*.autogenerated.ts
├─ dockerfile.star → Dockerfile.*.autogenerated
├─ tsconfig.star → tsconfig.*.autogenerated.json
├─ nginx.star → nginx.autogenerated.conf
├─ env.star → .env.*.autogenerated
└─ tilt.star → Tiltfile configs
    ↓
Tilt orchestrates Docker containers locally
```

### Golden Image Layering

| Layer | Contents |
|-------|----------|
| **L1** | Base OS (Alpine/Ubuntu) |
| **L2** | Runtime (Bun/Node) |
| **L3** | App dependencies |
| **L4** | Service code |

---

## B. Detailed Feature Comparison

| Feature | TDK | Garden | Skaffold | DevSpace |
|---------|:---:|:------:|:--------:|:--------:|
| K8s Required | ✗ | ⚠️ | ✓ | ✓ |
| Manifest format | JSON | YAML | YAML | YAML |
| Auto-gen configs | ✓ 10+ | 3-5 | ✗ | ✗ |
| Golden images | ✓ | ✗ | ✗ | ✗ |
| Auto-discovery | ✓ | ✗ | ✗ | ✗ |
| Local-only mode | ✓ | ✗ | ✗ | ✗ |
| Open source | ✓ | ✓ | ✓ | ✗ |

---

## C. Objection Handling

### "But we need Kubernetes for production anyway"
**Response:** Local dev doesn't need to match production. Different concerns. Use TDK for local speed, K8s for prod when ready.

### "What about CI/CD?"
**Response:** TDK is decoupled. Use it for local, whatever you want for CI. No lock-in.

### "Our platform team already set up Garden"
**Response:** TDK complements Garden. Use TDK for local speed (5s vs 30s startup), Garden for prod-like integration tests.

### "Is 120+ services actually realistic locally?"
**Response:** Yes, with selective startup and resource management. Proven in production at scale.

---

## D. Proof Points

- ✅ 120+ services running locally (proven scale)
- ✅ 70% reduction in "works on my machine" issues  
- ✅ 10+ config files auto-generated per service
- ✅ 9.4k GitHub stars (Tilt foundation stability)
- ✅ Zero Kubernetes knowledge required

---

*Generated for TDK CLI • 2025*
