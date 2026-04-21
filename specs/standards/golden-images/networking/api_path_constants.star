# =============================================================================
# 🌐 TDK Landscape - API PATH CONSTANTS (Dynamic)
# =============================================================================
# API paths are generated dynamically from manifest domain and appName fields
# No hardcoded service names - all from platform-computing-provisioner.manifest.json
# =============================================================================

load("../../../../../.tilt/TILT_SERVICE_DEFAULTS.star", "HEALTH_CHECK_PATH")

# =============================================================================
# API VERSION AND BASE PATH
# =============================================================================

API_VERSION_V1 = "v1"
API_BASE_PATH = "/api"

# =============================================================================
# DYNAMIC API PATH GENERATION
# =============================================================================

def generate_api_path(domain, app_name):
    """Generate API path from manifest domain and appName."""
    # Pattern: /api/v1/{app-name} or /api/v1/{domain}-management
    # Dynamic detection based on app_name patterns
    # No hardcoded service names - all patterns derived from manifest
    return "/api/v1/" + app_name

# =============================================================================
# SERVICE DOMAIN TO API PATH MAPPING (Dynamic)
# =============================================================================
# This is populated at runtime from discovered manifests
# No hardcoded service names

SERVICE_DOMAIN_TO_API_PATH = {}

# =============================================================================
# API PATH TO SERVICE MAPPING (Dynamic)
# =============================================================================

API_PATH_TO_SERVICE_DOMAIN = {}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

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


def get_api_path_for_domain(domain, manifest=None):
    """Returns the full API path for a service domain.
    
    Args:
        domain: Service domain name from manifest.json
        manifest: Optional manifest dict that may contain 'apiPath' override
    
    Returns:
        Full API path string (e.g., "/api/v1/{domain}-management")
        Falls back to "/api/v1/{domain}s" if not found (properly pluralized)
        Returns apiPath from manifest if explicitly specified
    """
    # Check for explicit apiPath override in manifest
    if manifest and manifest.get("apiPath"):
        return manifest.get("apiPath")
    
    return SERVICE_DOMAIN_TO_API_PATH.get(domain, "/api/v1/" + _pluralize_domain(domain))

def get_api_path_for_service(service_name):
    """Returns the full API path for a service name.
    
    Args:
        service_name: Service appName from manifest
    
    Returns:
        Full API path string
    """
    # Extract domain from service name using pattern matching
    # No hardcoded service names - all patterns derived from naming conventions
    if "-management-backend" in service_name:
        domain = service_name.replace("-management-backend", "")
    elif "-management-frontend" in service_name:
        domain = service_name.replace("-management-frontend", "")
    elif "-planner-backend" in service_name:
        domain = service_name.replace("-planner-backend", "")
    elif "-planner-frontend" in service_name:
        domain = service_name.replace("-planner-frontend", "")
    elif "-backend" in service_name:
        domain = service_name.replace("-backend", "")
    elif "-frontend" in service_name:
        domain = service_name.replace("-frontend", "")
    else:
        domain = service_name
    
    return get_api_path_for_domain(domain)

def get_domain_for_api_path(api_path):
    """Returns the service domain for an API path (reverse lookup).
    
    Args:
        api_path: Full API path
    
    Returns:
        Service domain string
    """
    return API_PATH_TO_SERVICE_DOMAIN.get(api_path, "")

def build_traefik_url(api_path, host="TDK Landscape.localhost", scheme="http"):
    """Builds full Traefik gateway URL from API path.
    
    Args:
        api_path: API path
        host: Gateway host (default: TDK Landscape.localhost)
        scheme: URL scheme (default: http)
    
    Returns:
        Full URL string
    """
    return scheme + "://" + host + api_path

def build_health_endpoint(api_path, health_path="/health"):
    """Builds health check endpoint path from API path.
    
    Args:
        api_path: API path
        health_path: Health endpoint suffix (default: /health)
    
    Returns:
        Full health endpoint path
    """
    return api_path + health_path

def get_all_api_paths():
    """Returns a list of all defined API paths from discovered services.
    
    Returns:
        List of API path strings
    """
    return SERVICE_DOMAIN_TO_API_PATH.values()

def is_valid_api_path(api_path):
    """Checks if an API path is valid/defined.
    
    Args:
        api_path: API path to check
    
    Returns:
        True if valid, False otherwise
    """
    return api_path in API_PATH_TO_SERVICE_DOMAIN

# =============================================================================
# LEGACY COMPATIBILITY (Deprecated - for migration only)
# =============================================================================
# All legacy paths removed - use dynamic path generation from manifests

LEGACY_DOMAIN_TO_API_PATH = {}
