# AGENTS.md - Networking & Proxy

## Purpose

Traefik reverse proxy, networking configuration, and service routing.

## Key Files

### Traefik
- **`proxy.star`** - Traefik configuration generation
- **`labels.star`** - Docker labels for Traefik routing

### Network Management
- **`network.star`** - Docker network setup
- **`hosts.star`** - /etc/hosts file management

## Common Tasks

### Generate Traefik labels
```starlark
load("./proxy.star", "generate_traefik_labels")
labels = generate_traefik_labels(
    service_name="appointment-management-backend",
    port=4000,
    host="appointment.backend.beauty.localhost",
    path_prefix="/api/appointments"
)
```

### Output
```python
{
    "traefik.enable": "true",
    "traefik.http.routers.appointment-management-backend.rule": "Host(`appointment.backend.beauty.localhost`) && PathPrefix(`/api/appointments`)",
    "traefik.http.routers.appointment-management-backend.entrypoints": "web",
    "traefik.http.services.appointment-management-backend.loadbalancer.server.port": "4000"
}
```

## Architecture

```
Internet/localhost
       ↓
   Traefik (port 80/443)
       ↓
   Routes to services by Host/Path
       ↓
   Service containers
```

## Integration

- Called by `resources/` when creating service resources
- Used by `platform/docker/` for Docker Compose generation
- Labels applied to docker_build and docker_compose

## Local Development

Services accessible at:
- `{service}.backend.beauty.localhost`
- `{service}.frontend.beauty.localhost`

Managed in `/etc/hosts` automatically.
