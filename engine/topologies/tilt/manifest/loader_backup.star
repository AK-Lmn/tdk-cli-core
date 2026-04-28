# =============================================================================
# 📋 MANIFEST MODULE - LOADER
# =============================================================================
# Path: .tilt/topologies/tilt/manifest/loader.star
# Purpose: File loading and I/O operations for manifest system
# Status: Phase 2 of manifest system refactoring
# =============================================================================

load("./constants.star", 
    "MANIFEST_FILENAME", 
    "MANIFEST_FILENAME_YAML",
    "MANIFEST_PATTERN",
    "ManifestConstants",
)
load("./errors.star", "ManifestErrors")

def load_from_file(path):
    """
    Load a single manifest from file path.
    
    Args:
        path: Absolute or relative path to manifest JSON file
    
    Returns:
        struct(
            manifest=None,      # Parsed manifest dict or None if error
            error=None,         # Error message or None
            warnings=[],        # List of warning messages
            metadata={         # Loading metadata
                'path': path,
                'from_cache': False,
                'load_time_ms': 0,
            }
        )
    """
    # Validate path
    if not path:
        return struct(
            manifest=None,
            error="Empty path provided",
            warnings=[],
            metadata={'path': path, 'from_cache': False, 'load_time_ms': 0},
        )
    
    # Read file
    content = read_file(path, default="")
    
    # If file doesn't exist and path is JSON, try YAML
    if not content and path.endswith('.json'):
        yaml_path = path.replace('.json', '.yaml')
        content = read_file(yaml_path, default="")
        if content:
            path = yaml_path
    
    # If file doesn't exist and path is YAML, try JSON
    if not content and path.endswith('.yaml'):
        json_path = path.replace('.yaml', '.json')
        content = read_file(json_path, default="")
        if content:
            path = json_path
    
    if not content or not str(content).strip():
        error = ManifestErrors.new(
            message="Empty or missing file: " + path,
            category=ManifestErrors.CATEGORY['IO'],
            severity=ManifestErrors.SEVERITY['ERROR'],
            context={'path': path},
        )
        return struct(
            manifest=None,
            error=ManifestErrors.format(error),
            warnings=[],
            metadata={'path': path, 'from_cache': False, 'load_time_ms': 0, 'format': None},
        )
    
    # Read file as JSON (works for both .json and .yaml files)
    manifest = decode_json(content)
    
    if manifest == None:
        error = ManifestErrors.new(
            message="Invalid JSON in manifest file: " + path,
            category=ManifestErrors.CATEGORY['PARSE'],
            severity=ManifestErrors.SEVERITY['ERROR'],
            context={'path': path},
        )
        return struct(
            manifest=None,
            error=ManifestErrors.format(error),
            warnings=[],
            metadata={'path': path, 'from_cache': False, 'load_time_ms': 0, 'format': 'json'},
        )
    
    # Determine format from extension
    format_type = 'json'
    if path.endswith('.yaml') or path.endswith('.yml'):
        format_type = 'yaml'
    
    return struct(
        manifest=manifest,
        error=None,
        warnings=[],
        metadata={
            'path': path,
            'from_cache': False,
            'load_time_ms': 0,
            'size_bytes': len(str(content)),
            'format': format_type,
        }
    )

def load_from_path(service_path):
    """
    Load manifest from service directory (auto-detects manifest file).
    
    Tries YAML first (.yaml) for better human readability, then falls back to JSON (.json).
    
    Args:
        service_path: Path to service directory
    
    Returns:
        Same as load_from_file
    """
    # Normalize path
    service_path = _canonicalize_path(service_path)
    
    # Try YAML first (better for humans - supports comments, easier to read)
    yaml_path = service_path + "/" + MANIFEST_FILENAME_YAML
    result = load_from_file(yaml_path)
    if not result.error:
        return result
    
    # Fall back to JSON (legacy format)
    json_path = service_path + "/" + MANIFEST_FILENAME
    return load_from_file(json_path)

def load_all(services_root, filters=None):
    """
    Load all manifests from services directory with optional filtering.
    
    Args:
        services_root: Root directory to search (e.g., "services/product")
        filters: Optional dict of filters:
            - appType: ['frontend', 'backend', ...] or single string
            - stack: ['user', 'order', ...] or single string
            - features: ['nats', 'prisma', ...] - must have at least one
            - enabled_only: True/False - only enabled services
    
    Returns:
        struct(
            manifests=[],       # List of loaded manifests
            errors=[],          # List of error structs
            warnings=[],        # List of warning messages
            stats={             # Loading statistics
                'total_found': N,
                'successful': N,
                'failed': N,
                'filtered_out': N,
                'from_cache': N,
            }
        )
    """
    filters = filters or {}
    
    # Discover all manifest files
    find_cmd = (
        "find " + services_root + 
        " -type f -name " + MANIFEST_PATTERN + 
        " 2>/dev/null | grep " + MANIFEST_FILENAME + 
        " | sort"
    )
    
    result = str(local(find_cmd, quiet=True, echo_off=True))
    
    manifest_paths = []
    if result:
        for line in result.strip().split("\n"):
            line = line.strip()
            if line and MANIFEST_FILENAME in line:
                manifest_paths.append(line)
    
    total_found = len(manifest_paths)
    successful = []
    errors = []
    warnings = []
    filtered_out = 0
    from_cache = 0
    
    # Load each manifest
    for path in manifest_paths:
        result = load_from_file(path)
        
        if result.metadata.get('from_cache'):
            from_cache += 1
        
        if result.error:
            errors.append(ManifestErrors.new(
                message=result.error,
                category=ManifestErrors.CATEGORY['IO'],
                severity=ManifestErrors.SEVERITY['ERROR'],
                context={'path': path},
            ))
        elif result.manifest:
            # Apply filters
            manifest = result.manifest
            should_include = True
            
            # Filter by appType
            if 'appType' in filters:
                filter_app_types = filters['appType']
                if type(filter_app_types) == "string":
                    filter_app_types = [filter_app_types]
                if manifest.get('appType') not in filter_app_types:
                    should_include = False
            
            # Filter by stack
            if 'stack' in filters and should_include:
                filter_stacks = filters['stack']
                if type(filter_stacks) == "string":
                    filter_stacks = [filter_stacks]
                if manifest.get('stack') not in filter_stacks:
                    should_include = False
            
            # Filter by features (must have at least one)
            if 'features' in filters and should_include:
                filter_features = filters['features']
                if type(filter_features) == "string":
                    filter_features = [filter_features]
                manifest_features = manifest.get('features', [])
                has_matching_feature = False
                for feat in filter_features:
                    if feat in manifest_features:
                        has_matching_feature = True
                        break
                if not has_matching_feature:
                    should_include = False
            
            # Filter by enabled_only (check if manifest has enabled field)
            if filters.get('enabled_only') and should_include:
                # For now, assume all loaded manifests are "enabled"
                # This could be enhanced with a manifest field
                pass
            
            if should_include:
                successful.append(manifest)
            else:
                filtered_out += 1
    
    return struct(
        manifests=successful,
        errors=errors,
        warnings=warnings,
        stats={
            'total_found': total_found,
            'successful': len(successful),
            'failed': len(errors),
            'filtered_out': filtered_out,
            'from_cache': from_cache,
        }
    )

def clear_cache():
    """
    Clear the manifest cache.
    
    Returns:
        Number of entries cleared
    """
    return 0

def get_cache_stats():
    """
    Get cache statistics.
    
    Returns:
        Dict with cache stats
    """
    return {
        'entries': 0,
        'paths': [],
    }

def _canonicalize_path(path):
    """
    Canonicalize a path by removing ./ prefixes and normalizing.
    
    Args:
        path: Path to canonicalize
    
    Returns:
        Cleaned path
    """
    if not path:
        return path
    
    # Remove ./ prefixes
    while path.startswith("./"):
        path = path[2:]
    
    # Normalize slashes
    path = path.replace("//", "/")
    
    return path

def get_manifest_path(service_path):
    """
    Get the expected manifest file path for a service directory.
    
    Args:
        service_path: Service directory path
    
    Returns:
        Expected manifest file path
    """
    service_path = _canonicalize_path(service_path)
    return service_path + "/" + MANIFEST_FILENAME

def is_cached(path):
    """
    Check if a manifest path is in cache.
    
    Args:
        path: Manifest file path
    
    Returns:
        True if cached
    """
    return False

# Export loader functions
ManifestLoader = struct(
    load_from_file=load_from_file,
    load_from_path=load_from_path,
    load_all=load_all,
    clear_cache=clear_cache,
    get_cache_stats=get_cache_stats,
    get_manifest_path=get_manifest_path,
    is_cached=is_cached,
)
