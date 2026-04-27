# =============================================================================
# 🧩 TILT SDK - ORCHESTRATOR HELPERS
# =============================================================================
# Path: .tilt/provisioner/orchestrator/helpers.star
# Purpose: Shared helper functions for orchestrator
# =============================================================================

def _get_db_name_for_resource(service_name, res_name):
    """Get database name from manifest databaseName field dynamically."""
    # Database names now come from manifest.json databaseName field
    # No hardcoded mappings - all from platform-computing-provisioner.manifest.json
    # Default: {project}_{service_name}
    return service_name


def _get_service_display_name(service_name, res_name):
    """Get human-readable service name for display."""
    display_name = service_name.replace('-', ' ').title()
    
    # Dynamic service type detection from resource name
    # No hardcoded service names - pattern-based detection
    if '-planner' in res_name or 'planner' in res_name:
        return display_name + ' Planner'
    elif '-management' in res_name:
        return display_name + ' Management'
    
    return display_name


OrchestratorHelpers = struct(
    get_db_name = _get_db_name_for_resource,
    get_display_name = _get_service_display_name,
)
