# =============================================================================
# 🏗️ TILT SDK - GOLDEN IMAGE CONSTANTS
# =============================================================================

# Load project configuration to get the project name as prefix
# Falls back to 'tdk-project' if project.json is not found
_GOLDEN_IMAGE_PREFIX = 'tdk-project'
if os.path.exists('.tdk/project.json'):
    _project_json = read_json('.tdk/project.json')
    _GOLDEN_IMAGE_PREFIX = _project_json.get('project', {}).get('name', 'tdk-project')

GOLDEN_IMAGE_PREFIX = _GOLDEN_IMAGE_PREFIX
GOLDEN_DOCKERFILE = '.tdk/.tdk-out/golden-layers.Dockerfile'

GOLDEN_LAYERS = {
    'l1': {
        'name': GOLDEN_IMAGE_PREFIX + '-l1',
        'tag': 'latest',
        'description': 'OS base + runtime environment',
        'target': 'l1_golden',
    },
    'l2': {
        'name': GOLDEN_IMAGE_PREFIX + '-l2',
        'tag': 'latest',
        'description': 'Dependencies + node_modules',
        'target': 'l2_golden',
    },
    'l3-backend': {
        'name': GOLDEN_IMAGE_PREFIX + '-l3-backend',
        'tag': 'latest',
        'description': 'Backend build tools (Prisma only, Infisical CLI skipped to avoid CDN hangs)',
        'target': 'l3_backend_golden',
    },
    'l3-frontend': {
        'name': GOLDEN_IMAGE_PREFIX + '-l3-frontend',
        'tag': 'latest',
        'description': 'Frontend build tools (no Prisma)',
        'target': 'l3_frontend_golden',
    },
    'l3-migrator': {
        'name': GOLDEN_IMAGE_PREFIX + '-l3-migrator',
        'tag': 'latest',
        'description': 'Migrator build tools (Prisma only, Infisical CLI skipped to avoid CDN hangs)',
        'target': 'l3_migrator_golden',
    },
    'l4-backend': {
        'name': GOLDEN_IMAGE_PREFIX + '-l4-backend',
        'tag': 'latest',
        'description': 'Backend production runtime (Bun, no Infisical CLI)',
        'target': 'l4_backend_bun',
    },
    'l4-backend-node': {
        'name': GOLDEN_IMAGE_PREFIX + '-l4-backend-node',
        'tag': 'latest',
        'description': 'Backend production runtime (Node.js - lightweight, no Infisical CLI)',
        'target': 'l4_backend_node',
    },
    'l4-frontend': {
        'name': GOLDEN_IMAGE_PREFIX + '-l4-frontend',
        'tag': 'latest',
        'description': 'Frontend production runtime',
        'target': 'l4_frontend_golden',
    },
    'l4-migrator': {
        'name': GOLDEN_IMAGE_PREFIX + '-l4-migrator',
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

CONSTANTS = {}
