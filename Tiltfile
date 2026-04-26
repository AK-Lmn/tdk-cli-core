# =============================================================================
# 🎯 TDK CLI - Combined Tilt Development Kit
# =============================================================================
# This is the unified Tiltfile entry point for tdk-cli.
# It combines: engine, discovery, specs, and ext into one repository.
#
# Usage:
#   v1alpha1.extension_repo(name='tdk-cli', url='https://github.com/tdk-landscape/tdk-cli')
#   load('ext://tdk-cli', 'Utils', 'Manifest', ...)
# =============================================================================

print("🚀 Loading TDK CLI (unified)")

# =============================================================================
# ENGINE (Core orchestration)
# =============================================================================
load('./engine/topologies/tilt/common/utils.star', _Utils='Utils')
load('./engine/topologies/tilt/discovery/loading.star', _Manifest='Manifest')
load('./engine/topologies/tilt/config/global.star', _Config='Config')
load('./engine/topologies/tilt/discovery/registry.star',
    _GLOBAL_CONFIG_EXPORT='GLOBAL_CONFIG_EXPORT',
    _APP_SERVICES='APP_SERVICES',
    _INFRA_SERVICES_EXPORT='INFRA_SERVICES_EXPORT',
    _DDD_LIBS_EXPORT='DDD_LIBS_EXPORT',
    _DEFAULTS_EXPORT='DEFAULTS_EXPORT',
    _SERVICE_ALIASES='SERVICE_ALIASES',
    _SERVICE_PATH_MAP='SERVICE_PATH_MAP',
    _get_platform_libs_export='get_platform_libs_export',
    _get_product_libs_export='get_product_libs_export',
)
load('./engine/topologies/tilt/generators/vite_config.star', _Vite='Vite')
load('./engine/topologies/tilt/generators/tsconfig.star', _TSConfig='TSConfig')
load('./engine/topologies/platform/docker/index.star', _Docker='Docker')
load('./engine/topologies/tilt/generators/npmrc.star', _PackageConfig='PackageConfig')
load('./engine/topologies/tilt/common/utils_deterministic.star', _Determinism='Determinism')
load('./engine/topologies/tilt/resources/deps.star', _Libs='Libs')
load('./engine/topologies/tilt/resources/conditions.star', _Database='Database')
load('./engine/topologies/tilt/resources/declaration.star', _Orchestrator='Orchestrator')
load('./engine/topologies/tilt/resources/ordering.star', _Infra='Infra')
load('./engine/topologies/tilt/resources/triggers.star', _Watchers='Watchers')

# =============================================================================
# SPECS (Tech stack and standards)
# =============================================================================
load('./specs/specs/TILT_TECH_STACK.star', _assert_tech_stack='assert_tech_stack', _TECH_STACK='TECH_STACK')

# =============================================================================
# DISCOVERY (Service discovery)
# =============================================================================
load('./discovery/constants.star',
    _MANIFEST_FILENAME='MANIFEST_FILENAME',
    _MANIFEST_FILENAME_YAML='MANIFEST_FILENAME_YAML',
    _SERVICES_ROOT='SERVICES_ROOT',
    _DISCOVERY_SCAN_ROOTS='DISCOVERY_SCAN_ROOTS',
)
load('./discovery/discovery_orchestrator.star', _initialize_discovery='initialize_discovery')
load('./discovery/service_snapshot.star', _get_service_snapshot_path='get_service_snapshot_path')

# =============================================================================
# EXT (UI enhancements and IDE components)
# =============================================================================
# UI enhancements are inlined for self-containment
def load_ui_enhancements(config):
    """Load UI enhancements configuration."""
    enable_tooltips = config.get('enable_tooltips', True)
    enable_icons = config.get('enable_icons', True)
    enable_help_panel = config.get('enable_help_panel', True)
    enable_cron_jobs_tab = config.get('enable_cron_jobs_tab', True)
    
    print("✨ UI Enhancements configured")
    print("   - Tooltips: " + ("enabled" if enable_tooltips else "disabled"))
    print("   - Icons: " + ("enabled" if enable_icons else "disabled"))
    print("   - Help Panel: " + ("enabled" if enable_help_panel else "disabled"))
    print("   - Cron Jobs Tab: " + ("enabled" if enable_cron_jobs_tab else "disabled"))

def get_ide_components_path():
    """Return the path to IDE components."""
    return './ext/ide-components'

def get_file_browser_script():
    """Return the path to file browser server script."""
    return './ext/ide-components/file_browser/server.py'

def get_code_viewer_script():
    """Return the path to code viewer server script."""
    return './ext/ide-components/code_viewer/server.py'

def get_config_inspector_script():
    """Return the path to config inspector server script."""
    return './ext/ide-components/config_inspector/server.py'

def get_code_executor_script():
    """Return the path to code executor server script."""
    return './ext/ide-components/code_executor/server.py'

IDE_PORTS = {
    'file_browser': 9765,
    'code_viewer': 9766,
    'config_inspector': 9767,
    'code_executor': 9768,
}

# =============================================================================
# RE-EXPORTS (Unified API)
# =============================================================================

# Core
Utils = _Utils
Manifest = _Manifest
Config = _Config

# Registry Data
GLOBAL_CONFIG_EXPORT = _GLOBAL_CONFIG_EXPORT
APP_SERVICES = _APP_SERVICES
INFRA_SERVICES_EXPORT = _INFRA_SERVICES_EXPORT
DDD_LIBS_EXPORT = _DDD_LIBS_EXPORT
DEFAULTS_EXPORT = _DEFAULTS_EXPORT
SERVICE_ALIASES = _SERVICE_ALIASES
SERVICE_PATH_MAP = _SERVICE_PATH_MAP

def get_platform_libs_export(autodiscover=False):
    return _get_platform_libs_export(autodiscover)

def get_product_libs_export(autodiscover=False):
    return _get_product_libs_export(autodiscover)

# Providers
Vite = _Vite
TSConfig = _TSConfig
Docker = _Docker
PackageConfig = _PackageConfig

# Lifecycle
Libs = _Libs
Database = _Database
Orchestrator = _Orchestrator
Infra = _Infra
Watchers = _Watchers

# Specs
assert_tech_stack = _assert_tech_stack
TECH_STACK = _TECH_STACK

# Discovery
MANIFEST_FILENAME = _MANIFEST_FILENAME
MANIFEST_FILENAME_YAML = _MANIFEST_FILENAME_YAML
SERVICES_ROOT = _SERVICES_ROOT
DISCOVERY_SCAN_ROOTS = _DISCOVERY_SCAN_ROOTS
initialize_discovery = _initialize_discovery
get_service_snapshot_path = _get_service_snapshot_path

# Determinism Utilities
Determinism = _Determinism

print("✅ TDK CLI loaded: engine + discovery + specs + ext + determinism")
