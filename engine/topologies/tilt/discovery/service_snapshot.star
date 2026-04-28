# =============================================================================
# 📸 RESOURCE SNAPSHOT - Starlark Interface
# =============================================================================
# Provides Starlark functions for snapshot-based incremental resource discovery
# =============================================================================

# Python script path (relative to Tiltfile)
_SNAPSHOT_SCRIPT = ".tdk/.tdk-out/snapshots/resource_snapshot.py"

def _run_snapshot_command(cmd):
    """Run a snapshot command via Python script."""
    result = local(
        "python3 " + _SNAPSHOT_SCRIPT + " " + cmd,
        quiet=True,
        echo_off=True
    )
    return str(result)

def save_snapshot(resources):
    """
    Save current resource list to snapshot file.
    
    Args:
        resources: List of service.json file paths
    """
    # Use Python to save snapshot directly
    result = local(
        "cd " + config.main_dir + " && python3 " + _SNAPSHOT_SCRIPT + " save",
        quiet=True,
        echo_off=True
    )
    
    return str(result)

def load_from_file():
    """
    Load previous snapshot from file.
    
    Returns:
        Dict with 'timestamp', 'resources', 'count'
    """
    result = _run_snapshot_command("load")
    
    # Parse JSON result
    if result and result.startswith('{'):
        return json.decode(result)
    
    # Return empty snapshot on error
    return struct(
        timestamp="",
        services=[],
        count=0
    )

def diff_snapshots(old_snapshot, current_resources):
    """
    Compare old snapshot with current resources.
    
    Args:
        old_snapshot: Previous snapshot dict
        current_resources: Current list of service.json paths
        
    Returns:
        Struct with 'added', 'removed', 'unchanged' lists
    """
    old_set = set(old_snapshot.get("resources", []))
    current_set = set(current_resources)
    
    added = []
    removed = []
    unchanged = []
    
    for res in current_resources:
        if res in old_set:
            unchanged.append(res)
        else:
            added.append(res)
    
    for res in old_snapshot.get("resources", []):
        if res not in current_set:
            removed.append(res)
    
    return struct(
        added=added,
        removed=removed,
        unchanged=unchanged,
        has_changes=len(added) > 0 or len(removed) > 0
    )

def get_current_resources(resource_patterns=["services/product/*", "services/platform/*"]):
    """
    Scan for all service.json files.
    
    Returns:
        List of service.json file paths
    """
    all_resources = []
    
    for pattern in resource_patterns:
        result = local(
            "find " + pattern + " -name 'service.json' 2>/dev/null | sort",
            quiet=True,
            echo_off=True
        )
        
        if result:
            lines = str(result).split('\n')
            for line in lines:
                line = line.strip()
                if line:
                    all_resources.append(line)
    
    return all_resources

def snapshot_exists():
    """Check if snapshot file exists."""
    result = local(
        "test -f .tdk/.tdk-out/snapshots/resource-snapshot.json && echo 'yes' || echo 'no'",
        quiet=True,
        echo_off=True
    )
    return str(result).strip() == "yes"

# Get the path to the resource snapshot file
def get_resource_snapshot_path():
    """Return the path to the resource snapshot JSON file."""
    return ".tdk/.tdk-out/snapshots/resource-snapshot.json"

# Export public API
ResourceSnapshot = struct(
    save=save_snapshot,
    load_from_file=load_from_file,
    diff=diff_snapshots,
    scan=get_current_resources,
    exists=snapshot_exists,
    get_path=get_resource_snapshot_path
)
