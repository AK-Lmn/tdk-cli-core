# json_manifest_scanner.star
# 
# Purpose: Low-level JSON manifest file discovery using shell `find` command
# Use: discover_json_manifests(root_path) returns list of manifest file paths
#
# NOTE: This is the "manual" scanner - it finds files in a specific folder.
# For auto-discovery from Tilt's discovery system, use discovery.star instead.

load("../manifest/constants.star", "MANIFEST_FILENAME_NEW")

def discover_json_manifests(root_path):
    """
    Discover all JSON manifest files in a given root path.
    
    Args:
        root_path: Path relative to project root (e.g., "services/product")
                 Can also contain glob patterns (e.g., "identity-*") for flat structures.
    
    Returns:
        List of manifest file paths (strings)
    """
    # Use config.main_dir to get the project root (where the main Tiltfile is)
    project_root = config.main_dir
    
    # Check if root_path contains glob patterns (for flat structures like identity-*)
    if '*' in root_path or '?' in root_path:
        # Use bash to expand glob and find service.json files
        # This handles patterns like "identity-*" by expanding them first
        cmd = "cd " + project_root + " && bash -c 'for dir in " + root_path + "; do if [ -d \"$dir\" ]; then find \"$dir\" -maxdepth 1 -name \"" + MANIFEST_FILENAME_NEW + "\" -type f 2>/dev/null; fi; done'"
    else:
        # Standard find for non-glob paths
        cmd = "cd " + project_root + " && find " + root_path + " -type f -name '" + MANIFEST_FILENAME_NEW + "' 2>/dev/null | sort"
    
    result = str(local(cmd, quiet=True, echo_off=True))
    
    manifests = []
    if result:
        for line in result.strip().split("\n"):
            line = line.strip()
            if line and MANIFEST_FILENAME_NEW in line:
                manifests.append(line)

    return manifests
