# =============================================================================
# 🎯 TILT SDK - SERVICE ORCHESTRATOR
# =============================================================================
# Path: .tilt/provisioner/orchestrator.star
# Purpose: Application service lifecycle management
# =============================================================================
#
# This module handles the complete lifecycle of loading and configuring
# application services. It orchestrates:
# - Manifest loading and validation
# - Config generation (Vite, TSConfig, Docker)
# - Resource registration and dependency tracking
#
# Key Functions:
#   Orchestrator.apply_service(service_config, ctx) - Load and configure a service
#   Orchestrator.apply_all(services, ctx) - Load all services
# =============================================================================

load('./orchestrator/apply.star', 'apply_app_service')
load('./orchestrator/helpers.star', 'OrchestratorHelpers')
load('./orchestrator/generators/env.star', 'EnvGenerators')

_get_db_name_for_resource = OrchestratorHelpers.get_db_name
_get_service_display_name = OrchestratorHelpers.get_display_name
_generate_env_file = EnvGenerators.generate_env_file


def apply_all_services(services, ctx):
    """Apply all services in the list."""
    for service_config in services:
        apply_app_service(service_config, ctx)


# =============================================================================
# 📦 ORCHESTRATOR STRUCT (Public API)
# =============================================================================

Orchestrator = struct(
    # Main functions
    apply_service = apply_app_service,
    apply_all = apply_all_services,
    
    # Helpers (exposed for testing)
    generate_env_file = _generate_env_file,
    get_db_name = _get_db_name_for_resource,
    get_display_name = _get_service_display_name,
)
