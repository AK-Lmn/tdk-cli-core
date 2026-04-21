#!/usr/bin/env bash
# =============================================================================
# Hardcoded Values Audit Report
# =============================================================================
# Generated: $(date)
# Purpose: Document hardcoded values found in .star files
# =============================================================================

## Summary

Total .star files: 140

### Hardcoded Port Numbers Found:
- 3000, 4000 in manifest/constants.star (PORT_RANGES - should use master config)
- 3000 in lifecycle/orchestrator.star (identity service URL)
- 3000 in platform/docker/auth/auth.star (DEFAULT_IDENTITY_SERVICE_URL)
- 3000 in platform/docker/compose/compose.star (internal port)
- 3000 in platform/docker/generators/golden_docker_generator_v2.star (default param)
- 3000 in platform/services/synthetic-monitor.star (SYNTHETIC_MONITOR_PORT)
- 3000 in tilt/resources/orchestrator/apply_migrator_orchestration.star

### Hardcoded Timeouts Found:
- '30s', '60s', '10s' in lifecycle/orchestrator.star (health check configs)
- '30s' in platform/docker/networking/traefik_constants.star
- '30s' in platform/docker/compose/compose.star (start_period)
- '15s', '10s' in manifest/constants.star (traefik healthcheck)

### Hardcoded Health Paths Found:
- '/health' in manifest/constants.star (TRAEFIK_DEFAULTS)
- '/health' in tilt/generators/vite/helpers.star

### Already Using Master Configs (Good):
- manifest/constants.star imports BASE_PORT_FRONTEND, BASE_PORT_BACKEND, HEALTH_CHECK_PATH
- typescript.star imports get_filewatch_ignore_patterns

### Files Requiring Updates:
1. .tilt-engine/topologies/platform/docker/compose/compose.star
2. .tilt-engine/topologies/platform/docker/networking/traefik_constants.star
3. .tilt-engine/topologies/platform/docker/auth/auth.star
4. .tilt-engine/topologies/platform/docker/generators/golden_docker_generator_v2.star
5. .tilt-engine/topologies/platform/services/synthetic-monitor.star
6. .tilt-engine/topologies/tilt/resources/orchestrator/apply_migrator_orchestration.star
7. .tilt-engine/lifecycle/orchestrator.star
