# FAANG Engineer's Review: Tilt Manifest-Driven Platform

**Reviewer:** Principal Engineer, Former WhatsApp Infrastructure  
**Background:** 15 years Erlang/OTP, recently writing Zig for systems programming  
**Philosophy:** "Explicit is better than implicit. Fault tolerance through supervision, not hope."

---

## Initial Reaction: Suspicious of Magic

Look, I've spent my career in Erlang where **everything is explicit**. Supervision trees, message passing, hot code reloading—you see exactly how it works. No YAML templating engines hiding complexity.

Then I look at your `service.json` → 10 configs pipeline and my immediate reaction is:

> "Where does the complexity go? It doesn't disappear. It just gets hidden."

But I'll give you a fair review. Let me trace through the actual mechanics.

---

## What I Like (Genuinely)

### 1. Starlark Over YAML

You chose Starlark (Python-like, deterministic, hermetic) instead of Helm's YAML templating hell. This is the first good sign.

```starlark
# Your approach - code, not templates
def generate_vite_config(manifest, ctx):
    return {
        "server": {"port": manifest["port"]},
        "paths": ctx.get_dependency_paths(manifest)
    }
```

Compare to Helm:
```yaml
# The YAML templating nightmare everyone hates
server:
  port: {{ .Values.port | default 3000 | int }}
  {{- if .Values.ingress.enabled }}
  host: {{ .Values.ingress.host }}
  {{- end }}
```

**Verdict:** +1. Starlark is deterministic, testable, and doesn't have YAML's quoting/whitespace footguns.

### 2. Per-Service Database Isolation

The PostgreSQL-per-service pattern with shared engine:
```starlark
def provision_database(service_name, db_name):
    # Shared PostgreSQL instance, isolated databases
    return f'postgresql://postgres@shared-pg/{db_name}'
```

This is actually elegant. In Erlang/OTP terms, it's like having a single `pg` supervisor managing multiple worker processes (databases). You get isolation without the resource overhead of 50 PostgreSQL containers.

**Verdict:** +1. Efficient. I appreciate not spinning up 50 database processes.

### 3. Golden Image Layering

Your L1→L2→L3→L4 Docker layering is correct:
```
L1: Base (Bun, Node)
L2: Dependencies (node_modules cached)
L3: Builder (build tools)
L4: Runtime (minimal, production)
```

This is proper build engineering. Cache reuse >90% is achievable with good layer design.

**Verdict:** +1. You understand Docker layer caching.

---

## What Makes Me Nervous

### 1. The Manifest-to-Reality Gap

You claim: "One manifest describes everything."

I ask: "What happens when the manifest lies?"

```json
{
  "appName": "payment-service",
  "port": 4005,
  "internalDependencies": ["identity", "eventing"]
}
```

Questions I have:
- What if `eventing` is down? Does the service crash? Retry? Backpressure?
- Where's the circuit breaker configuration?
- How does the platform know the dependency graph is still valid after a deployment?

In Erlang, I'd have a supervision tree monitoring this. Where's your supervision?

**Verdict:** -1. The manifest is a **declaration**, not a **guarantee**. I don't see the fault tolerance story.

### 2. Context Object: Black Box Concerns

```starlark
ctx = Context.build(full_graph, manifest)
```

What's in `ctx`? Where is it documented? How do I debug it?

If I'm chasing a bug at 3am and the generated Nginx config is wrong, I need to:
1. See the context that generated it
2. Reproduce the generation locally
3. Understand why the decision was made

Is the context serialized somewhere? Can I inspect it?

**Verdict:** -0.5. The context is powerful but potentially opaque. Needs better observability.

### 3. 340 Replicas: The Orchestration Question

You manage 340 replicas. I have questions:

**In Kubernetes (what I'd expect):**
- HPA (Horizontal Pod Autoscaler) decides replica count
- etcd stores desired state
- Controller manager reconciles

**In your platform:**
- Starlark generates configs
- Tilt applies them
- ??? manages the actual container lifecycle

What happens when a replica crashes? Who restarts it? Where's the health checking?

```starlark
# You show this:
def decide_replica_count(service, ctx):
    if ctx.get_load(service) > 0.8:
        return min(service.replicas * 2, 10)
    return service.replicas
```

But where's the **supervision**? In Erlang, this would be a `supervisor` watching `worker` processes. Tilt restarts containers, but that's coarse-grained.

**Verdict:** -1. I see generation. I don't see runtime management of 340 replicas.

### 4. The "10,000 Fixes" Claim

You say you fixed 10,000 infrastructure issues over 2 years. That's:
- ~13 fixes per day
- Every 37 minutes, someone was fixing a config issue

That seems... high? Or your initial setup was really broken?

Questions:
- What percentage were port conflicts? (Easily preventable with a registry)
- What percentage were dependency issues? (Should be caught in CI)
- What percentage were environment variable mismatches? (Should be validated)

I'm suspicious of the methodology. If you truly had 10,000 unique issues, your system was chaos. If you counted every CI failure as a "fix," that's misleading.

**Verdict:** -0.5. The number feels like marketing. I want a breakdown.

---

## The Zig Perspective: Where's the Bare Metal?

I write Zig now. Zig philosophy: **no hidden control flow, no hidden allocations**.

Your platform is the opposite:
- Hidden: 10 configs generated from 1 manifest
- Hidden: Dependency graph resolution
- Hidden: Port allocation algorithm
- Hidden: Replica decisions

For a Zig programmer, this is uncomfortable. I want to see:

```zig
// What I'd want to see (conceptually)
const Config = struct {
    port: u16,
    deps: []const Dependency,
    
    pub fn generate(self: Config, allocator: Allocator) !GeneratedConfigs {
        // Explicit allocation
        // Explicit error handling
        // No hidden state
    }
};
```

Your Starlark is better than YAML, but it's still:
- Dynamic typing (no `struct` guarantees)
- Runtime evaluation (not compiled)
- Implicit dependencies through the context object

**Verdict:** -0.5. Acceptable for the domain, but I'll always prefer explicit.

---

## What I'd Need to See (To Be Convinced)

### 1. The Debugging Story

When something breaks, show me:
```bash
# What I want
tilt debug-config payment-service --show-context
tilt debug-generation payment-service --step-by-step
tilt validate-manifest service.json --verbose
```

Can I see the context object that generated a specific config?

### 2. The Runtime Supervision Story

For 340 replicas, show me:
- Health check configuration (not just "it runs")
- Restart policy (always? on-failure? exponential backoff?)
- Circuit breakers for dependencies
- Observability (metrics, not just Tilt UI)

In Erlang terms: Where's the `supervisor` spec? Where's the `gen_server`?

### 3. The Failure Mode Analysis

What happens when:
- PostgreSQL container dies?
- NATS message bus is unreachable?
- A service enters crash loop?
- Manifest has circular dependencies?
- Two manifests claim the same port?

You have validation, but what's the **runtime** behavior?

### 4. The Escape Hatch

At some point, I need to drop down. Show me:
```bash
# Can I override generated configs?
tilt override-config payment-service nginx.conf --manual

# Can I see raw Tilt resources?
tilt dump-resources --json

# Can I debug the Starlark?
tilt debug-starlark --break-on-generation
```

I don't want to be trapped in your abstraction.

---

## Honest Assessment

### What You're Building

This is a **configuration compiler**. You take high-level declarations (manifests) and compile them to low-level configs (Docker, Nginx, etc.).

That's a valid approach. It's what Kubernetes does (desired state → reconciled reality).

### What's Different (Good)

- **Local-first:** 50 services on 16GB is genuinely impressive
- **No K8s complexity:** Avoids the 15-minute cloud spin-up tax
- **Starlark vs YAML:** Better than Helm/Kustomize templating
- **Incremental:** Change 1 manifest → regenerate 10 configs (not 300)

### What's Missing (Concerning)

- **Runtime supervision:** Generating configs ≠ managing runtime
- **Fault tolerance:** I see validation, not recovery
- **Observability:** Tilt UI is cute, but where are my metrics?
- **Debugging:** Context object is a black box
- **Explicitness:** Too much magic for my taste

---

## The Bottom Line

**For a startup with 10-50 services:** This is probably great. Better than Helm. Better than manual config. The local-first development story is compelling.

**For a FAANG-scale system:** I'd need to see:
1. How you handle 1000+ services (not 120)
2. How you manage multi-region (not just local)
3. How you handle compliance/auditing of generated configs
4. How you debug when the context object produces nonsense

**My personal take:**

I appreciate the engineering. The layering, the caching, the Starlark-over-YAML choice—all correct decisions.

But I'm an Erlang programmer. I believe in **let it crash** and **supervise everything**. Your platform generates beautiful configs. Who supervises the generators?

If you can show me:
- Deterministic, reproducible generation
- Clear debugging tools
- Runtime fault tolerance
- An escape hatch to raw configs

Then I'll admit: this is better than most IDPs I've seen.

But until then: **the complexity is hidden, not removed.** And that's what keeps me up at night.

---

## Questions for Your Team

1. **Reproducibility:** If I run generation twice, do I get bit-for-bit identical configs? (Nix-style)
2. **Debugging:** Can I `tilt debug` and see exactly what the context object contains?
3. **Testing:** How do you test the generators? Unit tests? Property-based?
4. **Rollback:** Manifest v2 breaks things. How do I rollback to v1 configs quickly?
5. **Observability:** Where's the Prometheus metrics for 340 replicas?

---

**Overall Rating:** 7/10  
**Would use for:** Local development, 10-100 services  
**Would not use for:** Production orchestration without runtime supervision layer

The foundation is solid. The execution needs more "Erlang thinking" (fault tolerance, supervision, explicit state).

---

*Written after reviewing the full pitch documentation. Reviewer maintains skepticism but acknowledges solid engineering decisions.*
