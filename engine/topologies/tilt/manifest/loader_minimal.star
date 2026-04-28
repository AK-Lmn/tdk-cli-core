# =============================================================================
# 📋 MANIFEST MODULE - MINIMAL LOADER
# =============================================================================
# Loads manifest files (JSON only for now - YAML coming next)
# =============================================================================

load("./constants.star", "MANIFEST_FILENAME", "MANIFEST_FILENAME_YAML")

def load_from_file(path):
    """Load a manifest file."""
    content = read_file(path, default="")
    if not content:
        return struct(manifest=None, error="File not found: " + path)
    
    # Parse JSON
    manifest = decode_json(content)
    if manifest == None:
        return struct(manifest=None, error="Invalid JSON: " + path)
    
    return struct(manifest=manifest, error=None)

def load_from_path(resource_path):
    """Load manifest from service directory."""
    # Try YAML first
    yaml_path = resource_path + "/" + MANIFEST_FILENAME_YAML
    result = load_from_file(yaml_path)
    if not result.error and result.manifest:
        return result
    
    # Fall back to JSON
    json_path = resource_path + "/" + MANIFEST_FILENAME
    return load_from_file(json_path)

# Simple loader - no caching, no mapping
ManifestLoader = struct(
    load_from_file=load_from_file,
    load_from_path=load_from_path,
)
