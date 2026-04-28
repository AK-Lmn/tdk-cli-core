# =============================================================================
# 🎯 TOPOLOGIES - FOCUS PROFILES
# =============================================================================

load("../../../topologies/tilt/common/utils.star", "Utils")
load(
    "../discovery/registry.star",
    "APP_RESOURCES",
    "CORE_INFRA_EXPORT",
    "INFRA_DOMAIN_MAP_EXPORT",
    "OPTIONAL_INFRA_EXPORT",
    "DEFAULTS_EXPORT",
    "RESOURCE_DEPENDENCIES",
    "RESOURCE_ALIASES",
)
load("../discovery/config.star", "Config")

# =============================================================================
# 🎯 RELEASE PHASE MAPPINGS
# =============================================================================
# Map release phase names to service lists from spec.master

RELEASE_PHASES = {
    "pre-alpha": Config.FOCUS_PRE_ALPHA,
    "alpha": Config.FOCUS_ALPHA,
    "beta": Config.FOCUS_BETA,
}

def expand_release_targets(targets):
    """Expand release phase targets (pre-alpha, alpha, beta) to service lists."""
    expanded = []
    for target in targets:
        target_lower = target.lower()
        if target_lower in RELEASE_PHASES:
            phase_services = RELEASE_PHASES[target_lower]
            for svc in phase_services:
                expanded.append(svc)
        else:
            expanded.append(target)
    return expanded

def _get_resources_for_domain(domain_name):
    """Get resource names (backend, frontend) for a domain from APP_RESOURCES.
    
    Returns both the actual service resources and YAML tracking resources.
    Library resources (appType == 'library') only return YAML resources.
    """
    resources = []
    for service in APP_RESOURCES:
        if service.get("name") == domain_name:
            for res in service.get("resources", []):
                res_name = res.get("name", "")
                if res_name:
                    # Check if this is a library resource - libraries don't have runtime resources
                    manifest = res.get("_manifest", {})
                    if manifest.get("appType") == "library":
                        # For libraries, only add YAML tracking resource
                        resources.append(res_name + "-yaml")
                    else:
                        # For actual services (backend, frontend), add both:
                        # 1. The actual service resource (for docker_build/docker_compose)
                        resources.append(res_name)
                        # 2. The YAML tracking resource
                        resources.append(res_name + "-yaml")
    return resources


def get_all_needed_services(targets, skip_frontend = False):
    needed = {}
    visited = {}

    def _resolve_alias(resource_name):
        if resource_name in RESOURCE_ALIASES:
            alias_value = RESOURCE_ALIASES[resource_name]
            # RESOURCE_ALIASES maps names to paths (strings), not to resource lists
            # Only return alias_value if it's a list (of resource names)
            if type(alias_value) == "list":
                return alias_value
        return [resource_name]

    def _filter_frontends(resources, include_frontends):
        if include_frontends:
            return resources
        return [resource for resource in resources if "frontend" not in resource]

    def resolve_target(resource_name):
        # Explicit focus targets keep their frontends unless --no-frontend is set.
        return _filter_frontends(_resolve_alias(resource_name), not skip_frontend)

    def resolve_dependency(resource_name):
        # Transitive domain dependencies should not pull dependency UIs.
        return _filter_frontends(_resolve_alias(resource_name), False)

    def discover(service):
        if service in visited:
            return
        visited[service] = True

        if skip_frontend and "frontend" in service:
            return

        needed[service] = True

        deps = RESOURCE_DEPENDENCIES.get(service, [])
        for dep in deps:
            for resolved in resolve_dependency(dep):
                discover(resolved)

    for target in targets:
        for resolved in resolve_target(target):
            discover(resolved)

    # Expand any domain names in needed to their actual resources
    # e.g., "identity" -> ["identity-management-backend", "identity-management-frontend", ...]
    expanded_needed = {}
    for service in needed:
        resources = _get_resources_for_domain(service)
        if resources:
            for res in resources:
                expanded_needed[res] = True
        else:
            expanded_needed[service] = True

    return expanded_needed.keys()


def apply_focus_filter(cfg):
    focus_targets = cfg.get("focus", [])

    # Default to pre-alpha if no focus targets specified
    if not focus_targets:
        print("🎯 ═══════════════════════════════════════════════════════════════")
        print("🎯  DEFAULTING TO PRE-ALPHA MODE")
        print("🎯  Use --focus alpha or --focus beta for other phases")
        print("🎯 ═══════════════════════════════════════════════════════════════")
        focus_targets = ["pre-alpha"]

    parsed_targets = []
    for target in focus_targets:
        parsed_targets.extend(target.split(","))
    parsed_targets = [t.strip() for t in parsed_targets if t.strip()]
    
    # Expand release phase targets (pre-alpha, alpha, beta) to service lists
    parsed_targets = expand_release_targets(parsed_targets)

    if not parsed_targets:
        return (False, None, None)

    print("🎯 ═══════════════════════════════════════════════════════════════")
    print("🎯  UBER-STYLE FOCUS MODE ACTIVATED")
    print("🎯  Target services: " + ", ".join(parsed_targets))
    print("🎯 ═══════════════════════════════════════════════════════════════")

    skip_frontend = cfg.get("no-frontend", False)
    include_monitoring = cfg.get("include-monitoring", False)

    needed_list = get_all_needed_services(parsed_targets, skip_frontend)
    needed = {}
    for s in needed_list:
        needed[s] = True

    for infra in CORE_INFRA_EXPORT:
        needed[infra] = True
        if infra in INFRA_DOMAIN_MAP_EXPORT:
            needed[INFRA_DOMAIN_MAP_EXPORT[infra]] = True

    if include_monitoring:
        needed["monitoring"] = True
        for svc in OPTIONAL_INFRA_EXPORT.get("monitoring", []):
            needed[svc] = True

    if os.environ.get("INFISICAL_ENABLED", "true").lower() == "true":
        needed["infisical"] = True
        for svc in OPTIONAL_INFRA_EXPORT.get("infisical", []):
            needed[svc] = True

    for target in parsed_targets:
        if target in RESOURCE_ALIASES:
            needed[target] = True

    all_needed = needed.keys()

    logic_toggles = [
        "database-management",
        "golden-image",
        "proxy",
        "verdaccio",
        "infisical",
        "monitoring",
        "elk",
        "debezium",
        # Domains are auto-discovered from service manifests
        # No hardcoded domain names - all from platform-computing-provisioner.manifest.json
        "backends-only",
    ]
    # config.set_enabled_resources accepts only concrete Tilt resources.
    # Service alias keys (e.g. "booking-domain") and domain names (e.g. "identity") must be filtered out.
    # Real Tilt resources always have hyphens (e.g., "identity-management-backend-yaml")
    resource_only_needed = [r for r in all_needed if r not in logic_toggles and r not in RESOURCE_ALIASES and '-' in r]

    print("🎯 Discovered " + str(len(all_needed)) + " entities via dependency graph:")

    app_resources = [r for r in all_needed if any([x in r for x in ["backend", "frontend", "migrator"]])]
    infra_resources = [r for r in all_needed if r in CORE_INFRA_EXPORT or any([r in v for v in OPTIONAL_INFRA_EXPORT.values()])]
    db_resources = [r for r in all_needed if "provision-db" in r]

    if app_resources:
        print("   📱 Apps: " + ", ".join(sorted(app_resources)))
    if db_resources:
        print("   🗃️  Databases: " + ", ".join(sorted(db_resources)))
    if infra_resources:
        print("   🏗️  Infrastructure: " + ", ".join(sorted(infra_resources)))

    print("🎯 ═══════════════════════════════════════════════════════════════")

    return (True, all_needed, resource_only_needed)


def create_should_enable_wrapper(focus_mode, focus_enabled_all, cfg, defaults):
    def should_enable_wrapper(resource_name):
        if focus_mode and focus_enabled_all:
            # Check if resource_name itself is in the list (for infrastructure)
            if resource_name in focus_enabled_all:
                return True
            # Check if resource_name starts with any domain in focus_enabled_all
            # e.g., "identity-management-backend" starts with "identity"
            for domain in focus_enabled_all:
                if resource_name.startswith(domain + "-"):
                    return True
            # Check RESOURCE_ALIASES (if it maps to resource lists)
            if resource_name in RESOURCE_ALIASES:
                alias_value = RESOURCE_ALIASES[resource_name]
                if type(alias_value) == "list":
                    return any([res in focus_enabled_all for res in alias_value])
            return False
        return Utils.should_enable(resource_name, cfg, defaults)

    return should_enable_wrapper


Focus = struct(
    get_needed_services = get_all_needed_services,
    apply_focus = apply_focus_filter,
    create_enabler = create_should_enable_wrapper,
)


# Inlined constant
DEFAULTS = {}
