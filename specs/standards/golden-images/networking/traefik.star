# =============================================================================
# 🐳 TILT SDK - TRAEFIK LABELS GENERATOR
# =============================================================================

load(
    "./traefik_constants.star",
    "TRAEFIK_BACKEND_ENABLE_HTTP",
    "TRAEFIK_BACKEND_ENABLE_HTTPS",
    "TRAEFIK_TDK_HOST",
    "TRAEFIK_DOCKER_NETWORK",
    "TRAEFIK_ENABLE_LABEL",
    "TRAEFIK_FRONTEND_ENABLE_HTTP",
    "TRAEFIK_FRONTEND_ENABLE_HTTPS",
    "TRAEFIK_FRONTEND_PRIORITY_BASE",
    "TRAEFIK_MIDDLEWARE_SUFFIX",
    "TRAEFIK_WEB_ENTRYPOINT",
    "TRAEFIK_WEBSECURE_ENTRYPOINT",
    "TRAEFIK_API_VERSION",
    "TRAEFIK_HEALTHCHECK_INTERVAL",
    "TRAEFIK_HEALTHCHECK_TIMEOUT",
    "TRAEFIK_HEALTHCHECK_RETRIES",
    "TRAEFIK_STARTUP_GRACE_PERIOD",
    "TRAEFIK_API_BASE_PATH",
)
load("./traefik_helpers.star", 
    "backend_rule", 
    "build_entrypoints", 
    "frontend_rule",
    "get_api_path",
    "TDK_backend_rule",
)


def get_frontend_traefik_labels(res_name, domain, base_path, port, traefik_host=None, manifest=None):
    """Generate Traefik labels for frontend services."""
    # Priority based on path length ensures more specific paths win over broader ones
    router_priority = TRAEFIK_FRONTEND_PRIORITY_BASE + len(base_path or "")
    frontend_route_rule = frontend_rule(res_name, base_path, traefik_host)
    frontend_entrypoints = build_entrypoints(
        TRAEFIK_FRONTEND_ENABLE_HTTP,
        TRAEFIK_FRONTEND_ENABLE_HTTPS,
    )
    middleware_name = res_name + TRAEFIK_MIDDLEWARE_SUFFIX
    
    # Check if maintenance feature is enabled
    features = manifest.get('features', []) if manifest else []
    maintenance_middleware = ""
    if 'maintenance' in features:
        maintenance_middleware = ",maintenance@file"

    return """        - "{traefik_enable_label}"
        - 'traefik.http.routers.{res_name}.rule={frontend_route_rule}'
        - "traefik.http.routers.{res_name}.entrypoints={frontend_entrypoints}"
        - "traefik.http.routers.{res_name}.priority={router_priority}"
        - "traefik.http.routers.{res_name}.middlewares={middleware_name}{maintenance_middleware}"
        - "traefik.http.middlewares.{middleware_name}.stripprefix.prefixes={base_path}"
        - "traefik.http.services.{res_name}.loadbalancer.server.port={port}"
        - "traefik.docker.network={traefik_network}\"""".format(
        res_name=res_name,
        traefik_enable_label=TRAEFIK_ENABLE_LABEL,
        frontend_route_rule=frontend_route_rule,
        frontend_entrypoints=frontend_entrypoints,
        middleware_name=middleware_name,
        base_path=base_path,
        port=port,
        router_priority=router_priority,
        traefik_network=TRAEFIK_DOCKER_NETWORK,
        maintenance_middleware=maintenance_middleware,
    )

def get_backend_traefik_labels(
    service_entry_name,
    traefik_host,
    traefik_path,
    traefik_service_name,
    internal_port,
    health_path,
    manifest=None,
):
    """Generate Traefik labels for backend services with enhanced health checks."""
    backend_route_rule = backend_rule(traefik_host, traefik_path)
    backend_entrypoints = build_entrypoints(
        TRAEFIK_BACKEND_ENABLE_HTTP,
        TRAEFIK_BACKEND_ENABLE_HTTPS,
    )
    middleware_name = service_entry_name + TRAEFIK_MIDDLEWARE_SUFFIX
    
    # Check if maintenance feature is enabled
    features = manifest.get('features', []) if manifest else []
    maintenance_middleware = ""
    if 'maintenance' in features:
        maintenance_middleware = ",maintenance@file"

    # Build middleware config only if traefik_path is not empty
    if traefik_path:
        middleware_config_lines = [
            '      - "traefik.http.routers.' + service_entry_name + '.middlewares=' + middleware_name + maintenance_middleware + '"',
            '      - "traefik.http.middlewares.' + middleware_name + '.stripprefix.prefixes=' + traefik_path + '"',
        ]
        middleware_config = "\n".join(middleware_config_lines)
    else:
        # No middleware if path is empty - router has no middlewares
        middleware_config = ""

    labels = """      - "{traefik_enable_label}"
      - "traefik.http.routers.{service_entry_name}.rule={backend_route_rule}"
      - "traefik.http.routers.{service_entry_name}.entrypoints={backend_entrypoints}"
      - "traefik.http.routers.{service_entry_name}.service={traefik_service_name}"
{middleware_config}
      - "traefik.http.services.{traefik_service_name}.loadbalancer.server.port={internal_port}"
      - "traefik.http.services.{traefik_service_name}.loadbalancer.healthcheck.path={health_path}"
      - "traefik.http.services.{traefik_service_name}.loadbalancer.healthcheck.interval={health_interval}"
      - "traefik.http.services.{traefik_service_name}.loadbalancer.healthcheck.timeout={health_timeout}"
      - "traefik.http.services.{traefik_service_name}.loadbalancer.healthcheck.followredirects=false"
      - "traefik.docker.network={traefik_network}"
""".format(
        service_entry_name=service_entry_name,
        traefik_enable_label=TRAEFIK_ENABLE_LABEL,
        backend_route_rule=backend_route_rule,
        backend_entrypoints=backend_entrypoints,
        traefik_service_name=traefik_service_name,
        middleware_config=middleware_config,
        internal_port=internal_port,
        health_path=health_path,
        health_interval=TRAEFIK_HEALTHCHECK_INTERVAL,
        health_timeout=TRAEFIK_HEALTHCHECK_TIMEOUT,
        traefik_network=TRAEFIK_DOCKER_NETWORK,
    )

    # Generate TDK Landscape.localhost routing from manifest domain
    if manifest:
        domain = manifest.get("domain", "")
        if domain:
            api_path = get_api_path(domain, manifest)
            TDK_rule = TDK_backend_rule(manifest)
            TDK_entrypoints = build_entrypoints(
                TRAEFIK_BACKEND_ENABLE_HTTP,
                TRAEFIK_BACKEND_ENABLE_HTTPS,
            )
            # Calculate priority based on path length (more specific = higher priority)
            router_priority = TRAEFIK_FRONTEND_PRIORITY_BASE + len(api_path)
            
            labels += """
      - "traefik.http.routers.{service_entry_name}-TDK Landscape.rule={TDK_rule}"
      - "traefik.http.routers.{service_entry_name}-TDK Landscape.entrypoints={TDK_entrypoints}"
      - "traefik.http.routers.{service_entry_name}-TDK Landscape.service={traefik_service_name}"
      - "traefik.http.routers.{service_entry_name}-TDK Landscape.middlewares={middleware_name}-TDK Landscape{maintenance_middleware}"
      - "traefik.http.middlewares.{middleware_name}-TDK Landscape.stripprefix.prefixes={api_path}"
      - "traefik.http.routers.{service_entry_name}-TDK Landscape.priority={router_priority}"
""".format(
                service_entry_name=service_entry_name,
                traefik_service_name=traefik_service_name,
                TDK_rule=TDK_rule,
                TDK_entrypoints=TDK_entrypoints,
                middleware_name=middleware_name,
                maintenance_middleware=maintenance_middleware,
                api_path=api_path,
                router_priority=router_priority,
            )

    return labels
