# Level 5: Networking — Service Mesh & Routing

## The Capability

Services can find and talk to each other. Load balancing works. **Replica management emerges.**

```
┌─────────────────────────────┐
│   LEVEL 5: NETWORKING        │
│                             │
│  ✅ Service discovery        │
│  ✅ Load balancing           │
│  ✅ Routing rules             │
│  ✅ Internal DNS              │
│  ✅ Basic replica mgmt        │
│  ✅ Traefik (working today)   │
│  🗓️  Istio (roadmap)          │
│                             │
│  Tools: Nginx, Traefik,      │
│  Istio, Linkerd, Consul     │
└─────────────────────────────┘
```

## Replica Management at Level 5

### What Level 5 Provides

**Basic replica awareness:**
- ✅ Multiple instances of a service
- ✅ Load balancing across replicas
- ✅ Health checking (remove failed replicas)
- ⚠️ Manual replica count configuration
- ❌ Auto-scaling (that's Level 7)

### Nginx Upstreams (Basic Replica Management)

```nginx
# Level 5: Static replica configuration
upstream user-api {
    server user-api-1:3000 weight=5;
    server user-api-2:3000 weight=5;
    server user-api-3:3000 backup;  # Backup replica
}

server {
    location /api/users/ {
        proxy_pass http://user-api;
    }
}
```

**What Nginx provides:**
- ✅ Round-robin load balancing across replicas
- ✅ Weighted distribution
- ✅ Health checks (mark as down)
- ✅ Backup servers

**What's manual:**
- ❌ Adding/removing replicas requires config update
- ❌ No auto-discovery of new replicas
- ❌ Static configuration

### Istio: Advanced Replica Management

**Istio is a Level 5+ tool** that adds service mesh capabilities:

```yaml
# Istio DestinationRule: Advanced replica management
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-service
spec:
  host: payment-service
  trafficPolicy:
    loadBalancer:
      # Replica load balancing strategies
      simple: LEAST_CONN  # Send to replica with least connections
      # Other options: ROUND_ROBIN, RANDOM, PASSTHROUGH
    
    connectionPool:
      # Per-replica connection limits
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 1000
    
    outlierDetection:
      # Automatic replica health management
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50  # Eject up to 50% of replicas
  
  subsets:
    # Replica subsets for canary deployments
    - name: stable
      labels:
        version: v1
    - name: canary
      labels:
        version: v2
```

```yaml
# Istio VirtualService: Traffic splitting across replicas
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-service
spec:
  hosts:
    - payment-service
  http:
    - route:
        # 90% traffic to stable replicas
        - destination:
            host: payment-service
            subset: stable
          weight: 90
        # 10% traffic to canary replicas
        - destination:
            host: payment-service
            subset: canary
          weight: 10
```

### What Istio Provides at Level 5

| Feature | Replica Management Level |
|---------|-------------------------|
| **Load balancing** | ✅ Advanced (least conn, weighted) |
| **Health checking** | ✅ Automatic ejection |
| **Circuit breaking** | ✅ Replica-level |
| **Traffic splitting** | ✅ Canary across replica subsets |
| **Auto-scaling** | ❌ Not provided (needs K8s HPA) |
| **Auto-discovery** | ❌ Manual subset configuration |
| **Replica lifecycle** | ❌ K8s manages, not Istio |

### Istio's Limitations at Level 5

**Istio manages traffic TO replicas, not replicas themselves:**

```
Istio: "I'll route traffic perfectly"
Developer: "Add 3 more replicas"
Istio: "You do that in Kubernetes"
Developer: "Can you auto-scale?"
Istio: "Talk to HPA"
Developer: "Can you discover new replicas?"
Istio: "If you label them correctly..."
```

**What Istio doesn't do:**
- ❌ Provision new replicas
- ❌ Auto-scale replica count
- ❌ Manage replica lifecycle
- ❌ Capacity planning

**That's Level 7 territory.**

## Competitors at Level 5

### With Replica Management

| Tool | What They Do | Replica Features | Limitation |
|------|--------------|------------------|------------|
| **Nginx** | Reverse proxy | Static upstreams, health checks | Manual config |
| **Traefik** | Cloud-native router | Auto-discovery (Docker/K8s labels) | Needs orchestrator |
| **Istio** | Service mesh | Advanced LB, subsets, health | Complex, K8s-only |
| **Linkerd** | Lightweight mesh | Automatic mTLS, load balancing | Simpler than Istio |
| **Consul** | Service discovery | Health checks, service mesh | Requires agents |

### Replica Management Comparison

```
Tool          | Discover | Load Balance | Health Check | Auto-Scale
-------------|----------|--------------|--------------|------------
Nginx        | Manual   | ✅           | ✅           | ❌
Traefik      | Auto*    | ✅           | ✅           | ❌
Istio        | Labels   | ✅ Advanced  | ✅ Advanced  | ❌
Linkerd      | Auto     | ✅           | ✅           | ❌
Our Platform | Auto     | ✅           | ✅           | ✅ (L7)

*With Docker/K8s provider
```

## The Configuration Explosion with Replicas

### Without Istio (Pure Level 5)

```nginx
# 3 replicas = manual upstream
upstream api {
    server api-1:3000;
    server api-2:3000;
    server api-3:3000;
}

# 10 replicas?
upstream api {
    server api-1:3000;
    server api-2:3000;
    server api-3:3000;
    server api-4:3000;
    server api-5:3000;
    server api-6:3000;
    server api-7:3000;
    server api-8:3000;
    server api-9:3000;
    server api-10:3000;
}

# Scale to 50 replicas?
# 100 lines of Nginx config
# Hope you don't make a typo
```

### With Istio

```yaml
# Istio handles dynamic replica discovery
# But you still manage replica count via K8s
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 50  # You set this manually or via HPA
```

## Where Most Teams Get Stuck

**Level 5 with manual replica management:**
- ✅ Services talk to each other
- ✅ Load balancing works
- ✅ Static replica configs
- ❌ Scaling requires manual updates
- ❌ Platform team = firefighters

**Adding Istio:**
- ✅ Better traffic management
- ✅ Advanced replica routing
- ❌ Adds massive complexity
- ❌ Still manual replica management
- ❌ K8s required

## Moving to Level 6-7

**The gap:** Level 5 manages traffic TO replicas.  
**Level 7 manages replicas themselves.**

**[Next: Level 6 — Autogeneration →](./level-6-autogeneration.md)**

---

## Istio + Level 7 = Powerful Combo

**What happens when you combine:**
- Level 7 (our platform): Auto-generates Istio configs
- Istio: Advanced replica traffic management

```json
// Your manifest
{
  "name": "payment-service",
  "port": 3000,
  "replicas": 5,
  "type": "api"
}
```

```yaml
// Platform auto-generates Istio config
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-service
  annotations:
    generated-by: manifest-driven-platform
spec:
  host: payment-service
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
```

**Result:**
- Istio complexity hidden
- Advanced replica management
- Zero manual Istio YAML
- Best of both worlds

---

**[See all 10 levels →](./README.md)**
