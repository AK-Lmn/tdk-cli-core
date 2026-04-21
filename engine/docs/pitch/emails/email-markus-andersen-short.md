Subject: Your platform team as product builders, not firefighters

Hi Markus,

**The situation:** Your platform team spends 60% of their time fixing infrastructure configs. Service onboarding takes 3 days. Every new microservice adds technical debt.

**I've been there.** 2 years, 10,000 fixes, $500K in lost productivity.

**The solution we built:**

One `service.json` → Complete infrastructure (Docker, Nginx, Vite, env). Auto-generated. Validated. Conflict-free.

**For teams with 10+ microservices drowning in configuration.**

**Results:**
- 30 seconds to add a service
- 0 infrastructure fixes (was 417/month)
- Platform team ships features, not config patches

**Built on:** Tilt + Docker Compose + Starlark  
**Not:** Yet another K8s tool  
**Differentiator:** Context-aware autogeneration (not static templates)

**Relevant because:** [Company] is at the "20 services, starting to hurt" phase. We were there. It gets worse at 50.

**15-minute demo:** See **50 services spin up locally on a 16GB M1 Mac** from one command. No cloud required. No beefy hardware.

[Book time] or reply and I'll send docs.

Best,
[Your name]

---

P.S. - Built on Tilt, works with Docker Compose, no K8s required, no vendor lock-in. Intelligent replica management included.
