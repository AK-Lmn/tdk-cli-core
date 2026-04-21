# =============================================================================
# 🏗️ TILT SDK - GOLDEN IMAGE CONSTANTS
# =============================================================================

GOLDEN_IMAGE_PREFIX = 'TDK Landscape'
GOLDEN_DOCKERFILE = '.tilt-engine/assets/docker/golden-layers.Dockerfile'

GOLDEN_LAYERS = {
    'l1': {
        'name': 'TDK Landscape-l1',
        'tag': 'latest',
        'description': 'OS base + runtime environment',
        'target': 'l1_golden',
    },
    'l2': {
        'name': 'TDK Landscape-l2',
        'tag': 'latest',
        'description': 'Dependencies + node_modules',
        'target': 'l2_golden',
    },
    'l3-backend': {
        'name': 'TDK Landscape-l3-backend',
        'tag': 'latest',
        'description': 'Backend build tools (Prisma only, Infisical CLI skipped to avoid CDN hangs)',
        'target': 'l3_backend_golden',
    },
    'l3-frontend': {
        'name': 'TDK Landscape-l3-frontend',
        'tag': 'latest',
        'description': 'Frontend build tools (no Prisma)',
        'target': 'l3_frontend_golden',
    },
    'l3-migrator': {
        'name': 'TDK Landscape-l3-migrator',
        'tag': 'latest',
        'description': 'Migrator build tools (Prisma only, Infisical CLI skipped to avoid CDN hangs)',
        'target': 'l3_migrator_golden',
    },
    'l4-backend': {
        'name': 'TDK Landscape-l4-backend',
        'tag': 'latest',
        'description': 'Backend production runtime (Bun, no Infisical CLI)',
        'target': 'l4_backend_bun',
    },
    'l4-backend-node': {
        'name': 'TDK Landscape-l4-backend-node',
        'tag': 'latest',
        'description': 'Backend production runtime (Node.js - lightweight, no Infisical CLI)',
        'target': 'l4_backend_node',
    },
    'l4-frontend': {
        'name': 'TDK Landscape-l4-frontend',
        'tag': 'latest',
        'description': 'Frontend production runtime',
        'target': 'l4_frontend_golden',
    },
    'l4-migrator': {
        'name': 'TDK Landscape-l4-migrator',
        'tag': 'latest',
        'description': 'Migrator production runtime (no Infisical CLI - uses env vars)',
        'target': 'l4_migrator_golden',
    },
}


def get_layer_reference(layer):
    """Returns the full image reference for a specific layer."""
    if layer not in GOLDEN_LAYERS:
        fail("Invalid layer: " + layer + ". Must be one of: l1, l2, l3, l4")

    layer_info = GOLDEN_LAYERS[layer]
    return '{name}:{tag}'.format(
        name=layer_info['name'],
        tag=layer_info['tag'],
    )
