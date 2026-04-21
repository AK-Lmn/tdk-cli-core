# =============================================================================
# ⚙️ TOPOLOGIES - GLOBAL CONFIG
# =============================================================================

load("./profiles.star", "Focus")
load(
    "../discovery/registry.star",
    "GLOBAL_CONFIG_EXPORT",
    "APP_SERVICES",
    "INFRA_SERVICES_EXPORT",
    "DDD_LIBS_EXPORT",
    "DEFAULTS_EXPORT",
    "CORE_INFRA_EXPORT",
    "INFRA_DOMAIN_MAP_EXPORT",
    "OPTIONAL_INFRA_EXPORT",
    "SERVICE_DEPENDENCIES",
    "SERVICE_ALIASES",
    "SERVICE_PATH_MAP",
    "get_platform_libs_export",
    "get_product_libs_export",
)


def build_config_context():
    return {
        "internal_scope": GLOBAL_CONFIG_EXPORT["internal_scope"],
        "library_roots": GLOBAL_CONFIG_EXPORT["library_roots"],
        "verdaccio_url_local": GLOBAL_CONFIG_EXPORT["verdaccio_url_local"],
        "verdaccio_url_docker": GLOBAL_CONFIG_EXPORT["verdaccio_url_docker"],
        "service_path_map": SERVICE_PATH_MAP,
        "database": GLOBAL_CONFIG_EXPORT["database"],
    }


Config = struct(
    get_needed_services = Focus.get_needed_services,
    apply_focus = Focus.apply_focus,
    create_enabler = Focus.create_enabler,
    build_context = build_config_context,
    GLOBAL = GLOBAL_CONFIG_EXPORT,
    DEFAULTS = DEFAULTS_EXPORT,
    APP_SERVICES = APP_SERVICES,
    INFRA_SERVICES = INFRA_SERVICES_EXPORT,
    DDD_LIBS = DDD_LIBS_EXPORT,
    CORE_INFRA = CORE_INFRA_EXPORT,
    INFRA_DOMAIN_MAP = INFRA_DOMAIN_MAP_EXPORT,
    OPTIONAL_INFRA = OPTIONAL_INFRA_EXPORT,
    SERVICE_DEPENDENCIES = SERVICE_DEPENDENCIES,
    SERVICE_ALIASES = SERVICE_ALIASES,
    SERVICE_PATH_MAP = SERVICE_PATH_MAP,
    get_platform_libs = get_platform_libs_export,
    get_product_libs = get_product_libs_export,
)

GLOBAL_CONFIG = {}
