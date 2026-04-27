# =============================================================================
# 📸 SERVICE SNAPSHOT - Starlark Interface
# =============================================================================
# Provides Starlark functions for snapshot-based incremental service discovery
# =============================================================================

# Python script path (relative to Tiltfile)
_SNAPSHOT_SCRIPT = ".tdk/.tdk-out/snapshots/service_snapshot.py"

def _run_snapshot_command(cmd):
    """Run a snapshot command via Python script."""
    result = local(
        "python3 " + _SNAPSHOT_SCRIPT + " " + cmd,
        quiet=True,
        echo_off=True
    )
    return str(result)

def save_snapshot(services):
    """
    Save current service list to snapshot file.
    
    Args:
        services: List of service.json file paths
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
        Dict with 'timestamp', 'services', 'count'
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

def diff_snapshots(old_snapshot, current_services):
    """
    Compare old snapshot with current services.
    
    Args:
        old_snapshot: Previous snapshot dict
        current_services: Current list of service.json paths
        
    Returns:
        Struct with 'added', 'removed', 'unchanged' lists
    """
    old_set = set(old_snapshot.get("services", []))
    current_set = set(current_services)
    
    added = []
    removed = []
    unchanged = []
    
    for svc in current_services:
        if svc in old_set:
            unchanged.append(svc)
        else:
            added.append(svc)
    
    for svc in old_snapshot.get("services", []):
        if svc not in current_set:
            removed.append(svc)
    
    return struct(
        added=added,
        removed=removed,
        unchanged=unchanged,
        has_changes=len(added) > 0 or len(removed) > 0
    )

def get_current_services(service_patterns=["services/product/*", "services/platform/*"]):
    """
    Scan for all service.json files.
    
    Returns:
        List of service.json file paths
    """
    all_services = []
    
    for pattern in service_patterns:
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
                    all_services.append(line)
    
    return all_services

def snapshot_exists():
    """Check if snapshot file exists."""
    result = local(
        "test -f .tdk/.tdk-out/snapshots/service-snapshot.json && echo 'yes' || echo 'no'",
        quiet=True,
        echo_off=True
    )
    return str(result).strip() == "yes"

# Get the path to the service snapshot file
def get_service_snapshot_path():
    """Return the path to the service snapshot JSON file."""
    return ".tdk/.tdk-out/snapshots/service-snapshot.json"

# Export public API
ServiceSnapshot = struct(
    save=save_snapshot,
    load_from_file=load_from_file,
    diff=diff_snapshots,
    scan=get_current_services,
    exists=snapshot_exists,
    get_path=get_service_snapshot_path
)
