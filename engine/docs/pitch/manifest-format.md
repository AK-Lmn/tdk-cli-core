# Manifest Format

## Overview

The `service.json` file is your **single source of truth**. One file generates all infrastructure configs.

```json
{
  "name": "my-service",
  "port": 3000,
  "type": "api",
  "dependencies": ["postgres"]
}
```

## Specification

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Unique service identifier | `"user-api"` |
| `port` | integer | Service port (1024-65535, or 0 for auto) | `3000` |
| `type` | string | Service type | `"api"` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `dependencies` | array | Services this depends on | `["postgres", "redis"]` |
| `routes` | array | HTTP route patterns | `["/api/users/*"]` |
| `environment` | object | Environment variables | `{"DEBUG": "true"}` |
| `replicas` | integer | Number of instances | `2` |
| `backend_name` | string | For frontend: API service name | `"user-api"` |
| `base_path` | string | URL prefix | `"/admin"` |

## Service Types

### `api` - REST API Service

```json
{
  "name": "user-api",
  "port": 3001,
  "type": "api",
  "dependencies": ["postgres", "redis"],
  "routes": ["/api/users/*", "/api/profiles/*"],
  "environment": {
    "DATABASE_URL": "postgresql://localhost:5432/users",
    "REDIS_URL": "redis://localhost:6379"
  },
  "replicas": 2
}
```

**Generates:**
- Docker Compose with load balancing
- Nginx upstream configuration
- Health check endpoints
- Database connection pooling

### `web` - Frontend Application

```json
{
  "name": "admin-dashboard",
  "port": 3002,
  "type": "web",
  "backend_name": "user-api",
  "base_path": "/admin",
  "dependencies": ["user-api"]
}
```

**Generates:**
- Vite development config
- Nginx SPA routing (history API fallback)
- API proxy configuration
- Hot reload setup
- Build optimization

### `worker` - Background Job Processor

```json
{
  "name": "email-worker",
  "port": 0,
  "type": "worker",
  "dependencies": ["redis", "postgres"],
  "queue": "emails",
  "environment": {
    "QUEUE_NAME": "emails",
    "CONCURRENCY": "10"
  }
}
```

**Generates:**
- Background job configuration
- Queue consumer setup
- No external port (internal only)
- Graceful shutdown handling

### `library` - Shared Package

```json
{
  "name": "utils",
  "type": "library",
  "publish_to": "verdaccio",
  "build_target": "es2022"
}
```

**Generates:**
- TypeScript build configuration
- Package publishing setup
- Version management
- Dependency linking

### `sdk` - Client SDK

```json
{
  "name": "api-client",
  "type": "sdk",
  "target": "typescript",
  "api_service": "user-api",
  "generate_from_openapi": true
}
```

**Generates:**
- Client library code
- Type definitions
- API client configuration
- Auto-generated from OpenAPI spec

## Dependencies

### Declaring Dependencies

```json
{
  "name": "order-api",
  "dependencies": [
    "user-api",
    "inventory-api",
    "postgres",
    "redis",
    "stripe"
  ]
}
```

**Behavior:**
1. Platform verifies all dependencies exist
2. Generates `depends_on` in Docker Compose
3. Services start in topological order
4. Health checks ensure deps are ready
5. Circular dependencies detected and rejected

### Dependency Types

**Service Dependencies:**
```json
{
  "dependencies": ["user-api", "payment-service"]
}
```
Other services in your system.

**Infrastructure Dependencies:**
```json
{
  "dependencies": ["postgres", "redis", "kafka"]
}
```
Managed infrastructure (databases, queues, etc.).

**External Dependencies:**
```json
{
  "dependencies": ["stripe", "sendgrid"]
}
```
Third-party services (mocked in local dev).

## Environment Variables

### Static Values

```json
{
  "environment": {
    "NODE_ENV": "development",
    "LOG_LEVEL": "debug",
    "API_VERSION": "v1"
  }
}
```

### References

```json
{
  "environment": {
    "PORT": "${self:port}",
    "RESOURCE_NAME": "${self:name}",
    "DATABASE_URL": "${deps:postgres:url}"
  }
}
```

**Reference types:**
- `${self:field}` - Current service's field
- `${deps:name:field}` - Dependency's field
- `${context:port}` - Allocated port
- `${secrets:key}` - Secret value

### Auto-Generated Variables

The platform automatically provides:

```bash
RESOURCE_NAME=my-service
RESOURCE_PORT=3000
RESOURCE_TYPE=api
INTERNAL_HOST=my-service
INTERNAL_PORT=3000

# For each dependency
POSTGRES_URL=postgresql://my-service-db:5432/my_service
REDIS_URL=redis://redis:6379

# Comma-separated list
DEPENDS_ON=postgres,redis
```

## Routes

### HTTP Route Patterns

```json
{
  "routes": [
    "/api/v1/users/*",
    "/api/v1/orders/*",
    "/health",
    "/metrics"
  ]
}
```

**Pattern syntax:**
- `*` - Wildcard (matches any path segment)
- `**` - Recursive wildcard
- Exact paths match exactly

### Generated Nginx Config

```nginx
# From routes above
location /api/v1/users/ {
    proxy_pass http://user-api:3001;
}

location /api/v1/orders/ {
    proxy_pass http://order-api:3002;
}
```

## Advanced Configuration

### Health Checks

```json
{
  "health_check": {
    "path": "/health",
    "interval": "10s",
    "timeout": "5s",
    "retries": 3,
    "start_period": "30s"
  }
}
```

### Resource Limits

```json
{
  "resources": {
    "cpu": "500m",
    "memory": "512Mi",
    "ephemeral_storage": "1Gi"
  }
}
```

### Scaling

```json
{
  "replicas": 3,
  "scaling": {
    "min": 1,
    "max": 10,
    "target_cpu": "70%",
    "target_memory": "80%"
  }
}
```

### Storage

```json
{
  "volumes": [
    {
      "name": "data",
      "mount_path": "/app/data",
      "size": "10Gi",
      "type": "persistent"
    },
    {
      "name": "tmp",
      "mount_path": "/tmp",
      "type": "ephemeral"
    }
  ]
}
```

### Build Configuration

```json
{
  "build": {
    "context": ".",
    "dockerfile": "Dockerfile",
    "args": {
      "NODE_VERSION": "18"
    },
    "cache": true,
    "target": "production"
  }
}
```

## Complete Examples

### Microservice with Database

```json
{
  "name": "order-service",
  "port": 3003,
  "type": "api",
  "dependencies": ["postgres", "redis", "user-service"],
  "routes": ["/api/orders/*"],
  "environment": {
    "DATABASE_URL": "${deps:postgres:url}",
    "REDIS_URL": "${deps:redis:url}",
    "USER_RESOURCE_URL": "${deps:user-service:url}"
  },
  "replicas": 2,
  "health_check": {
    "path": "/health",
    "interval": "10s"
  }
}
```

### Frontend with API

```json
{
  "name": "customer-portal",
  "port": 3004,
  "type": "web",
  "backend_name": "order-service",
  "base_path": "/portal",
  "dependencies": ["order-service"],
  "environment": {
    "REACT_APP_API_URL": "/api"
  }
}
```

### Background Worker

```json
{
  "name": "notification-worker",
  "port": 0,
  "type": "worker",
  "dependencies": ["redis", "postgres", "sendgrid"],
  "queue": "notifications",
  "environment": {
    "QUEUE_NAME": "notifications",
    "CONCURRENCY": "20",
    "SENDGRID_API_KEY": "${secrets:sendgrid_key}"
  }
}
```

### Full-Stack Application

```json
{
  "name": "ecommerce-app",
  "port": 3005,
  "type": "api",
  "dependencies": [
    "postgres",
    "redis",
    "stripe",
    "sendgrid"
  ],
  "routes": [
    "/api/products/*",
    "/api/cart/*",
    "/api/checkout/*",
    "/webhooks/stripe"
  ],
  "environment": {
    "DATABASE_URL": "${deps:postgres:url}",
    "STRIPE_SECRET_KEY": "${secrets:stripe_secret}",
    "STRIPE_WEBHOOK_SECRET": "${secrets:stripe_webhook}"
  },
  "replicas": 3,
  "scaling": {
    "min": 2,
    "max": 20
  }
}
```

## Validation

The platform validates your manifest on every change:

### Structure Validation

```
✓ name: Required, unique, [a-z0-9-]+
✓ port: Required, 1024-65535 or 0
✓ type: Required, one of [api, web, worker, library, sdk]
```

### Reference Validation

```
✓ dependencies: All must exist
✓ backend_name: Must be valid service
✓ environment: No undefined references
```

### Semantic Validation

```
✓ No circular dependencies
✓ No port conflicts
✓ Valid route patterns
✓ Required env vars present
```

## Best Practices

### 1. Use Auto-Port Assignment

```json
{
  "port": 0  // Platform assigns available port
}
```

Avoids conflicts, easier to manage.

### 2. Declare All Dependencies

```json
{
  "dependencies": [
    "postgres",
    "redis",
    "other-service"  // Don't forget internal services!
  ]
}
```

### 3. Use References

```json
{
  "environment": {
    // Good: Uses reference
    "DATABASE_URL": "${deps:postgres:url}"
    
    // Bad: Hardcoded
    // "DATABASE_URL": "postgresql://localhost:5432/mydb"
  }
}
```

### 4. Add Health Checks

```json
{
  "health_check": {
    "path": "/health"
  }
}
```

Enables proper orchestration.

### 5. Document with Comments

```json
{
  "_comment": "Payment processing service",
  "name": "payment-service",
  "port": 3006,
  "type": "api",
  "dependencies": [
    "postgres",    // Transaction storage
    "redis",       // Rate limiting
    "stripe"       // Payment gateway
  ]
}
```

---

**Questions?** See [examples](./examples) or open an issue.
