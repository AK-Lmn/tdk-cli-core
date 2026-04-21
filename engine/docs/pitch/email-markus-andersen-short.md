# Short Pitch Email - Markus Andersen

**Subject:** Level 7 infrastructure: 120 services, 16GB Mac, zero manual config

---

Hi Markus,

Quick question: How many hours last week did your team spend on port conflicts, dependency mismatches, or "works on my machine"?

We built something that eliminates that entirely. 120 microservices. One 16GB MacBook Air. Zero manual configuration.

## The problem

AI generates features in hours. Then you spend 2 days debugging infrastructure:
- Port 3000 already taken (by another AI-generated service)
- Missing database connection
- Environment variables out of sync
- Nginx config with a syntax error at 3am

We tracked 10,000+ of these fixes over 2 years. Cost: $500K in engineering time.

## The solution

One `service.json` → 10+ generated configs, all context-aware:

```json
{
  "appName": "payment-service",
  "port": 4005,
  "databaseName": "payments_db",
  "internalDependencies": ["identity", "eventing"]
}
```

This generates:
- Port allocation (no conflicts)
- Dependency resolution
- Docker/Compose configs
- TypeScript paths
- Traefik routing
- Database provisioning

Change one file. Everything updates.

## What works now

✅ 120+ services orchestrated  
✅ **340+ replicas** with intelligent management  
✅ 16GB M1 Mac handles 50+ services locally  
✅ 30 seconds to add a new service  
✅ Tilt UI shows all resources, dependencies, health

## Competitors stop at Level 6

- **Garden, Skaffold:** Template-based, context-blind
- **Backstage:** Catalog only, no autogeneration
- **Tilt vanilla:** Manual resource definitions

We're at **Level 7**: manifest-driven, context-aware, multi-target.

## The numbers

Manual config for 50 services: $100,800 (setup + maintenance)
Manifest-driven: $2,600
**Savings: $98,000 per 50 services**

## 30-second demo

```bash
# Create one file
echo '{"appName":"demo","port":4001}' > service.json

# Start
tilt up

# Service running, configured, routed. Done.
```

30 minutes this week? I can show you the full 120-service topology running locally.

—
[Your name]

---

**Links:**
- Full technical overview: `./technical.md`
- Competitor analysis: `./competitors.md`
