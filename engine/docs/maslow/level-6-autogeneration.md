# Level 6: Autogeneration — Code → Configs

## The Capability

Generate infrastructure configs from code or simple definitions. **Replica configuration becomes template-based.**

```
┌─────────────────────────────┐
│   LEVEL 6: AUTOGENERATION    │
│                             │
│  ✅ Code → Configs           │
│  ✅ Template-based           │
│  ✅ Reduced manual work       │
│  ✅ Basic replica templates    │
│  ⚠️ Static generation         │
│  ⚠️ No system awareness       │
│  ❌ Still breaks at scale     │
│                             │
│  Tools: Helm, CDK,           │
│  basic generators           │
└─────────────────────────────┘
```

## Replica Management at Level 6

### Template-Based Replicas

**Level 6 generates replica configs, but statically:**

```yaml
# Helm template with replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.service.name }}
spec:
  replicas: {{ .Values.service.replicas }}  # Template value
  template:
    spec:
      containers:
        - name: app
          image: {{ .Values.service.image }}
```

```yaml
# values.yaml - You define replicas manually
service:
  name: payment-service
  replicas: 5  # You set this
  image: myapp:v1
```

**What Level 6 provides:**
- ✅ Template generates replica config
- ✅ Consistent replica configuration
- ✅ Version-controlled replica counts

**What's still manual:**
- ❌ You decide replica count
- ❌ You update values.yaml
- ❌ No auto-scaling
- ❌ No load-based decisions

### Helm + HPA (Hybrid Level 6-7)

```yaml
# Helm template with HPA
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.service.name }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.service.name }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
```

```yaml
# values.yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80
```

**This is Level 6.5:**
- ✅ Templates generate HPA config
- ✅ K8s manages scaling (not Helm)
- ⚠️ You configure thresholds manually
- ⚠️ Static configuration (no learning)

## Competitors at Level 6

### With Replica Templates

| Tool | Generation | Replica Support | Auto-Scaling |
|------|-----------|-----------------|--------------|
| **Helm** | Templates | `replicas` value | Via HPA templates |
| **AWS CDK** | Code | Replica config | ASG integration |
| **Pulumi** | Code | Replica properties | Policy-based |
| **Kustomize** | Overlays | Replica patches | No |
| **Jsonnet** | Code | Replica parameters | No |

### Replica Management Comparison

```
Level 6: "I can generate a config with 5 replicas"
Level 6: "You want 10 replicas? Update the value"
Level 6: "You want auto-scaling? Here's an HPA template"
Level 6: "You want intelligent scaling? Talk to Level 7"
```

## The Template Trap with Replicas

### Static Replica Counts

```yaml
# Template
replicas: {{ .Values.replicas }}

# Service A: values.yaml
replicas: 3

# Service B: values.yaml  
replicas: 3

# Service C: values.yaml
replicas: 3

# All have 3 replicas
# But do they all need 3?
# Who knows! Not the template.
```

### No Context Awareness

```
Template sees: "Service needs replicas value"
Template doesn't see:
  - "Service A gets 10 RPS, needs 2 replicas"
  - "Service B gets 1000 RPS, needs 20 replicas"
  - "Service C is CPU-intensive, needs 5 replicas"

Result: All services get same replica count
         or you manually configure each one
```

## Istio at Level 6

### Generating Istio Configs

```yaml
# Helm template for Istio
{{- if .Values.istio.enabled }}
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: {{ .Values.service.name }}
spec:
  host: {{ .Values.service.name }}
  trafficPolicy:
    loadBalancer:
      simple: {{ .Values.istio.loadBalancer }}
    outlierDetection:
      consecutiveErrors: {{ .Values.istio.consecutiveErrors }}
{{- end }}
```

```yaml
# values.yaml
istio:
  enabled: true
  loadBalancer: LEAST_CONN
  consecutiveErrors: 5
```

**Level 6 with Istio:**
- ✅ Generates Istio configs
- ✅ Templates for traffic management
- ❌ Static configuration
- ❌ No replica auto-scaling (that's K8s/HPA)

### The Complexity Explosion

```
Without templates: 100 lines of Istio YAML per service
With templates: 20 lines of templates + 10 lines of values

But for 50 services: 
- 50 value files
- Manual replica counts
- Manual Istio config
- Still doesn't auto-scale

Better than pure Level 5, but...
```

## Moving to Level 7

**The realization:** Templates help, but context is everything.

Level 7 adds:
- ✅ System-wide context
- ✅ Intelligent replica decisions
- ✅ Auto-scaling without manual config
- ✅ Optimal replica counts per service

**[Next: Level 7 — Manifest-Driven →](./level-7-manifest-driven.md)**

---

## Level 6 + Level 7 Integration

**Best practice:**
- Level 7 (our platform): Decides replica counts, generates configs
- Level 6 (Helm/templates): Renders the final YAML
- Istio (Level 5+): Manages traffic to those replicas

```
Level 7 decides: "Payment service needs 8 replicas"
Level 6 generates: Helm values with replicas=8
Istio manages: Traffic splitting across those 8 replicas
```

**The stack working together.**

---

**[See all 10 levels →](./README.md)**
