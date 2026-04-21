# =============================================================================
# 🐳 TILT SDK - TRAEFIK HELPERS
# =============================================================================

load(
    "./traefik_constants.star",
    "TRAEFIK_TDK_HOST",
    "TRAEFIK_ENABLE_BACKEND_PATH_RULE",
    "TRAEFIK_ENABLE_BACKEND_HOST_RULE",
    "TRAEFIK_ENABLE_FRONTEND_HOST_RULE",
    "TRAEFIK_ENABLE_FRONTEND_PATH_RULE",
    "TRAEFIK_FRONTEND_LOCALHOST_SUFFIX",
    "TRAEFIK_WEB_ENTRYPOINT",
    "TRAEFIK_WEBSECURE_ENTRYPOINT",
    "TRAEFIK_API_VERSION",
)
load("../../../../../.tilt/TILT_SERVICE_DEFAULTS.star", "TRAEFIK_API_BASE_PATH")


def build_entrypoints(enable_http, enable_https):
    entrypoints = []
    if enable_http:
        entrypoints.append(TRAEFIK_WEB_ENTRYPOINT)
    if enable_https:
        entrypoints.append(TRAEFIK_WEBSECURE_ENTRYPOINT)
    if len(entrypoints) == 0:
        entrypoints.append(TRAEFIK_WEB_ENTRYPOINT)
    return ",".join(entrypoints)


def frontend_rule(res_name, base_path, traefik_host):
    parts = []
    if TRAEFIK_ENABLE_FRONTEND_HOST_RULE:
        parts.append(
            "Host(`{res_name}{suffix}`)".format(
                res_name=res_name,
                suffix=TRAEFIK_FRONTEND_LOCALHOST_SUFFIX,
            ),
        )
    if traefik_host:
        parts.append("Host(`{traefik_host}`)".format(traefik_host=traefik_host))
    if TRAEFIK_ENABLE_FRONTEND_PATH_RULE:
        parts.append(
            "(Host(`{host}`) && PathPrefix(`{base_path}`))".format(
                host=TRAEFIK_TDK_HOST,
                base_path=base_path,
            ),
        )
        # Also accept localhost for local testing
        parts.append(
            "(Host(`localhost`) && PathPrefix(`{base_path}`))".format(
                base_path=base_path,
            ),
        )
    return " || ".join(parts)


def backend_rule(traefik_host, traefik_path):
    parts = []
    if TRAEFIK_ENABLE_BACKEND_HOST_RULE:
        parts.append("Host(`{host}`)".format(host=traefik_host))
    if TRAEFIK_ENABLE_BACKEND_PATH_RULE and traefik_path:
        parts.append("PathPrefix(`{path}`)".format(path=traefik_path))
    return " || ".join(parts)


def _pluralize_domain(domain):
    """Convert domain to proper plural form.
    
    Handles irregular plurals and special cases for TDK Landscape domains.
    
    Args:
        domain: Singular domain name (e.g., "identity", "salon", "appointment")
    
    Returns:
        str: Pluralized domain name (e.g., "identities", "salons", "appointments")
    """
    # Already plural
    if domain.endswith("s"):
        return domain
    
    # Special cases - irregular plurals
    irregulars = {
        "identity": "identities",
        "category": "categories",
        "story": "stories",
        "city": "cities",
        "body": "bodies",
        "activity": "activities",
        "ability": "abilities",
        "specialty": "specialties",
        "therapy": "therapies",
        "inventory": "inventories",
    }
    
    if domain in irregulars:
        return irregulars[domain]
    
    # Words ending in 'y' (not preceded by a vowel) -> 'ies'
    if domain.endswith("y") and len(domain) > 1 and domain[-2] not in "aeiou":
        return domain[:-1] + "ies"
    
    # Words ending in 'ch', 'sh', 'ss', 'x', 'z', 'o' -> add 'es'
    if domain.endswith(("ch", "sh", "ss", "x", "z", "o")):
        return domain + "es"
    
    # Default: add 's'
    return domain + "s"


def get_api_path(domain, manifest=None):
    """Generate API path from domain. Converts domain to plural form.
    
    Args:
        domain: Service domain from manifest (from platform-computing-provisioner.manifest.json)
        manifest: Optional manifest dict that may contain 'apiPath' override
    
    Returns:
        str: API path like "/api/v1/{domain}" 
               or the apiPath from manifest if explicitly specified
    """
    # Check for explicit apiPath override in manifest
    if manifest and manifest.get("apiPath"):
        return manifest.get("apiPath")
    
    return "{base}/{version}/{domain}".format(
        base=TRAEFIK_API_BASE_PATH,
        version=TRAEFIK_API_VERSION,
        domain=_pluralize_domain(domain),
    )


def TDK_backend_rule(manifest):
    """Generate routing rule for TDK Landscape.localhost from manifest.
    
    Args:
        manifest: Service manifest dictionary
    
    Returns:
        str: Traefik routing rule for TDK Landscape.localhost
    """
    if not manifest:
        return ""
    
    domain = manifest.get("domain", "")
    if not domain:
        return ""
    
    api_path = get_api_path(domain, manifest)
    return "Host(`{host}`) && PathPrefix(`{path}`)".format(
        host=TRAEFIK_TDK_HOST,
        path=api_path,
    )
