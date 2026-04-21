# =============================================================================
# ⚡ TILT SDK - VITE PROVIDER HELPERS
# =============================================================================
# Path: .tilt/providers/vite/helpers.star
# Purpose: Shared helper functions for Vite generators
# =============================================================================

load('../../../../topologies/tilt/common/utils.star', 'Utils')
# =============================================================================
# API PATH CONSTANTS - Import for full descriptive API naming
# =============================================================================
load('../../../../topologies/platform/docker/networking/api_path_constants.star',
     'get_api_path_for_domain',
     'build_traefik_url')


def build_header(generator_fn, app_name, extra_header=''):
    """Build the standard file header using shared utility."""
    return Utils.get_template_header(
        'vite',
        'Vite.' + generator_fn,
        app_name,
        extra_header
    )


def generate_frontend_internal_aliases(service_path, manifest, config_depth_offset=0):
    """
    Generate internal package aliases for frontend Vite config.
    
    Convention over Configuration:
        @tdk/platform-x → {rel_to_root}shared-platform-engineering/platform-x/src
        @tdk/product-x  → {rel_to_root}shared-product-engineering/product-x/src
    """
    internal_deps = manifest.get('_internalDeps', [])
    
    if not internal_deps:
        return '      // No internal dependencies detected'
    
    # Calculate depth for relative paths
    service_parts = [p for p in service_path.split('/') if p]
    depth = len(service_parts) + config_depth_offset
    rel_to_root = '../' * depth
    
    lines = ['      // 🔥 Auto-generated internal package aliases (from package.json)']
    
    for dep in sorted(internal_deps):
        if dep.startswith('@tdk/'):
            lib_name = dep.replace('@tdk/', '')
            
            # Determine library root by naming convention
            if lib_name.startswith('platform-'):
                lib_path = rel_to_root + 'shared-platform-engineering/' + lib_name + '/dist'
            elif lib_name.startswith('product-'):
                lib_path = rel_to_root + 'shared-product-engineering/' + lib_name + '/dist'
            elif lib_name in ['domain', 'application', 'infrastructure', 'presentation']:
                lib_path = rel_to_root + 'shared-ddd-layers/' + lib_name + '/src'
            else:
                lib_path = rel_to_root + 'shared-platform-engineering/' + lib_name + '/src'
            
            lines.append("      '" + dep + "': resolve(__dirname, '" + lib_path + "'),")
    
    return '\n'.join(lines)


def generate_frontend_optimize_deps(manifest):
    """Generate optimizeDeps.include array for faster Vite dev startup."""
    internal_deps = manifest.get('_internalDeps', [])
    
    if not internal_deps:
        return ''
    
    optimize_deps = [dep for dep in internal_deps if dep.startswith('@tdk/')]
    
    if not optimize_deps:
        return ''
    
    return '\n      ' + ',\n      '.join(["'" + dep + "'" for dep in sorted(optimize_deps)]) + ',\n    '


def generate_proxy_block(api_base_path, backend_port, additional_routes, domain='app'):
    """Generate Vite proxy config using full descriptive API paths.
    
    Uses API naming convention with full service names from manifest:
    - Pattern: /api/v1/{app-name}
    - Generated from manifest "domain" and "appName" fields
    
    Args:
        api_base_path: The base API path (from manifest)
        backend_port: Backend service port (kept for compatibility)
        additional_routes: Additional proxy routes
        domain: Service domain name (from manifest.json)
    
    Returns:
        Vite proxy configuration string
    """
    # Get full descriptive API path for this domain using constants
    # This replaces the old pattern: 'http://localhost:' + str(backend_port)
    api_path = get_api_path_for_domain(domain)
    
    # Build Traefik gateway URL using the full API path
    # Format: http://TDK Landscape.localhost/api/v1/{full-service-name}
    local_target = build_traefik_url(api_path)
    
    routes = [
        (api_base_path, local_target),
        ('/health', local_target),
        ('/trpc', local_target),
    ]
    
    for route in additional_routes:
        if type(route) == 'dict':
            routes.append((route.get('path', '/'), route.get('target', local_target)))
        else:
            routes.append((route, local_target))
    
    lines = ['    proxy: {']
    for path, target in routes:
        lines.append("      '" + path + "': {")
        lines.append("        target: '" + target + "',")
        lines.append("        changeOrigin: true,")
        lines.append("        secure: false,")
        lines.append("      },")
    lines.append('    },')
    
    return '\n'.join(lines)


def generate_backend_path_aliases(service_path, manifest):
    """Generate TypeScript path aliases for DDD architecture."""
    lines = []
    
    ddd_aliases = [
        ('@application', './src/application'),
        ('@domain', './src/domain'),
        ('@infrastructure', './src/infrastructure'),
        ('@presentation', './src/presentation'),
        ('@test', './src/tests'),
    ]
    
    for alias, rel_path in ddd_aliases:
        lines.append("      '" + alias + "': path.resolve(__dirname, '" + rel_path + "'),")
    
    service_parts = [p for p in service_path.split('/') if p]
    depth = len(service_parts)
    rel_to_root = '../' * depth
    
    internal_deps = manifest.get('_internalDeps', [])
    for dep in sorted(internal_deps):
        if dep.startswith('@tdk/'):
            lib_name = dep.replace('@tdk/', '')
            
            if lib_name.startswith('platform-'):
                lib_path = rel_to_root + 'shared-platform-engineering/' + lib_name + '/dist'
            elif lib_name.startswith('product-'):
                lib_path = rel_to_root + 'shared-product-engineering/' + lib_name + '/dist'
            elif lib_name in ['domain', 'application', 'infrastructure', 'presentation']:
                lib_path = rel_to_root + 'shared-ddd-layers/' + lib_name + '/src'
            else:
                lib_path = rel_to_root + 'shared-platform-engineering/' + lib_name + '/src'
            
            lines.append("      '" + dep + "': path.resolve(__dirname, '" + lib_path + "'),")
    
    return '\n'.join(lines)


def generate_externals_config(manifest):
    """Generate Rollup externals for Node.js backend build."""
    externals = [
        '/^node:.*/',
        '@prisma/client',
        'prisma',
        'hono',
        'nats',
    ]
    
    if manifest.get('usePrisma'):
        externals.extend(['.prisma/client', '@prisma/adapter-pg'])
    
    if manifest.get('useNats'):
        externals.append('nats')
    
    return '[' + ', '.join(["'" + e + "'" if not e.startswith('/') else e for e in externals]) + ']'


def generate_vitest_inline_deps(manifest):
    """Generate Vitest inline deps for internal packages."""
    internal_deps = manifest.get('_internalDeps', [])
    inline_deps = [dep for dep in internal_deps if dep.startswith('@tdk/')]
    
    if not inline_deps:
        return ''
    
    return '\n        ' + ',\n        '.join(["'" + dep + "'" for dep in inline_deps]) + ',\n      '
