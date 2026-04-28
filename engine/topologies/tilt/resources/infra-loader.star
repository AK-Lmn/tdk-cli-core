# =============================================================================
# 🏗️ TILT SDK - INFRASTRUCTURE LOADER
# =============================================================================
# Path: .tilt/provisioner/infra-loader.star
# Purpose: Load and configure infrastructure services
# =============================================================================
#
# This module centralizes infrastructure loading:
# - Database (PostgreSQL, Redis)
# - Messaging (NATS, Kafka)
# - Secrets (Infisical)
# - Registry (Verdaccio)
# - Proxy (Traefik)
# - Monitoring (SigNoz, ELK)
# - CDC (Debezium)
#
# Usage:
#   Infra.load_all(should_enable_fn)
# =============================================================================

load("../../platform/docker/constants.star", "PlatformDockerConstants")

# =============================================================================
# 🗃️ DATABASE MANAGEMENT
# =============================================================================

def _load_database_management(should_enable):
    """Load database and messaging infrastructure."""
    if not should_enable('database-management'):
        return
    
    print("🗃️  Loading database management services...")
    docker_compose('services/platform/database-management/docker-compose.yml')
    docker_compose('services/platform/messaging/docker-compose.yml')
    dc_resource('postgres', labels=['infra.tools'], resource_deps=['init-networks'], auto_init=True)
    dc_resource('redis', labels=['infra.messaging'], auto_init=False)
    dc_resource('nats', labels=['infra.messaging'], auto_init=True)
    cdc_enabled = should_enable('debezium')
    dc_resource('kafka', labels=['cdc'], resource_deps=['zookeeper'], auto_init=cdc_enabled)
    dc_resource('zookeeper', labels=['cdc'], auto_init=cdc_enabled)


# =============================================================================
# 📦 VERDACCIO (NPM Registry)
# =============================================================================

def _load_verdaccio(should_enable):
    """Load Verdaccio private npm registry."""
    if not should_enable(PlatformDockerConstants.VERDACCIO_RESOURCE_NAME):
        return
    
    print("📦 Loading Verdaccio...")
    docker_compose('docker-compose.verdaccio.yml')
    dc_resource(PlatformDockerConstants.VERDACCIO_RESOURCE_NAME, labels=['infra.tools', 'registry'], resource_deps=['init-networks'], auto_init=True)
    local_resource(PlatformDockerConstants.VERDACCIO_CONNECT_NETWORK_RESOURCE,
        cmd='docker network connect ' + PlatformDockerConstants.NETWORK_BACKEND + ' ' + PlatformDockerConstants.VERDACCIO_CONTAINER_NAME + ' 2>/dev/null || true',
        labels=['infra.tools', 'registry'], 
        resource_deps=[PlatformDockerConstants.VERDACCIO_RESOURCE_NAME, 'init-networks'], 
        auto_init=True
    )


# =============================================================================
# 🔐 INFISICAL (Secrets Management)
# =============================================================================

def _load_infisical(should_enable):
    """Load Infisical secrets management."""
    if not should_enable('infisical'):
        return
    
    print("🔐 Loading Infisical...")
    docker_compose('docker-compose.infisical.yml')
    dc_resource('infisical-db', labels=['infra.tools', 'secrets'], resource_deps=['init-networks'], auto_init=True)
    dc_resource('infisical-redis', labels=['infra.tools', 'secrets'], resource_deps=['init-networks'], auto_init=True)
    dc_resource('infisical', labels=['infra.tools', 'secrets'], resource_deps=['init-networks', 'infisical-db', 'infisical-redis'], auto_init=True)


# =============================================================================
# 🌐 PROXY (Traefik)
# =============================================================================

def _load_proxy(should_enable):
    """Load Traefik reverse proxy with proper health check sequencing."""
    if not should_enable('proxy'):
        return
    
    print("🌐 Loading proxy services from Introvertic Infra...")
    print("   → Primary: shared-product-engineering/introvertic/infra/docker-compose.traefik.yml")
    print("   → Override flags: TRAEFIK_LOG_LEVEL, TRAEFIK_ENABLE_DASHBOARD, etc.")
    print("   → Traefik will wait for postgres and nats to be healthy")
    print("   → Services configured with 60s startup grace period")
    
    # Use introvertic/infra traefik configuration (primary)
    # Keep legacy core.yml for network definitions during migration
    docker_compose([
        'shared-product-engineering/introvertic/infra/docker-compose.traefik.yml',
        'services/platform/proxy/docker-compose.core.yml',
        'services/platform/proxy/docker-compose.utilities.yml', 
        'services/platform/proxy/docker-compose.redirects.yml',
        'services/platform/proxy/docker-compose.docs.yml'
    ])
    
    # Traefik depends on core infrastructure being healthy (not just started) to prevent 504s
    dc_resource('traefik', 
        labels=['infra.tools'], 
        resource_deps=['init-networks', 'postgres', 'nats'], 
        auto_init=True)
    dc_resource('dashy', 
        labels=['infra.tools'], 
        resource_deps=['traefik'], 
        auto_init=False)
    dc_resource('main-redirect',
        labels=['infra.tools'],
        resource_deps=['traefik'],
        auto_init=False)
    dc_resource('traefik-pages',
        labels=['infra.tools'],
        resource_deps=['traefik'],
        auto_init=False)
    dc_resource('tilt-proxy',
        labels=['infra.tools'],
        resource_deps=['traefik'],
        auto_init=False)


# =============================================================================
# 📊 MONITORING (SigNoz, SkyWalking)
# =============================================================================

def _load_monitoring(should_enable):
    """Load monitoring and observability stack."""
    if not should_enable('monitoring'):
        return
    
    print("📊 Loading monitoring services...")
    docker_compose('services/platform/monitoring/docker-compose.yml')
    for svc in ['signoz-frontend', 'signoz-otel-collector', 'signoz-query-service']:
        dc_resource(svc, labels=['observability.apm'], auto_init=True)
    dc_resource('clickhouse', labels=['observability.storage'], auto_init=True)
    dc_resource('elasticsearch', labels=['observability.storage'], auto_init=True)
    dc_resource('skywalking-oap', labels=['observability.apm'], resource_deps=['elasticsearch'], auto_init=True)
    dc_resource('skywalking-ui', labels=['observability.apm'], resource_deps=['skywalking-oap'], auto_init=True)


# =============================================================================
# 🔄 DEBEZIUM (CDC)
# =============================================================================

def _load_debezium(should_enable):
    """Load Debezium Change Data Capture."""
    if not should_enable('debezium'):
        return
    
    print("🔄 Loading Enhanced Debezium...")
    docker_compose('services/platform/cdc/docker-compose.enhanced.yml')
    dc_resource('nats-http-bridge', labels=['cdc'], resource_deps=['nats'], auto_init=True)
    dc_resource('debezium-connect', labels=['cdc'], resource_deps=['kafka', 'postgres', 'nats-http-bridge'], auto_init=True)
    dc_resource('enhanced-connector-setup', labels=['cdc'], resource_deps=['debezium-connect', 'postgres', 'nats-http-bridge'], auto_init=False)


# =============================================================================
# 📊 ELK STACK
# =============================================================================

def _load_elk(should_enable):
    """Load ELK logging stack."""
    if not should_enable('elk'):
        return
    
    print("📊 Loading ELK stack...")
    docker_compose('docker/elk-compose.yml')
    dc_resource('elasticsearch', labels=['observability.elk'], auto_init=True)
    dc_resource('logstash', labels=['observability.elk', 'processor', 'logs'], resource_deps=['elasticsearch'], auto_init=True)
    dc_resource('kibana', labels=['observability.elk', 'frontend', 'dashboard'], resource_deps=['elasticsearch'], auto_init=True)


# =============================================================================
# 🌐 NETWORK INITIALIZATION
# =============================================================================

def _init_networks(fix_docker_networks_fn):
    """Initialize Docker networks."""
    local_resource('init-networks',
        cmd=fix_docker_networks_fn(),
        labels=['infra.setup'],
        auto_init=True,
        resource_deps=[]
    )


# =============================================================================
# 🏗️ GOLDEN IMAGE (Base Docker Image)
# =============================================================================

def _load_golden_image(should_enable, docker_provider):
    """Build the golden base image for faster service builds."""
    if not should_enable('golden-image'):
        return None
    
    print("🏗️  Building golden base image...")
    return docker_provider.golden_image.build()


def _generate_golden_dockerfile(should_enable, docker_provider, write_file_fn):
    """Generate the golden-layers.Dockerfile if it doesn't exist."""
    if not should_enable('golden-image'):
        return
    
    dockerfile_path = '.tdk/.tdk-out/golden-layers.Dockerfile'
    content = docker_provider.golden_image.generate_dockerfile()
    write_file_fn(dockerfile_path, content)


# =============================================================================
# 🎯 MAIN LOADER
# =============================================================================

def load_all_infrastructure(should_enable, fix_docker_networks_fn=None, docker_provider=None, write_file_fn=None):
    """
    Load all infrastructure services based on configuration.
    
    Args:
        should_enable: Function that takes service name and returns bool
        fix_docker_networks_fn: Function to fix Docker networks (optional)
        docker_provider: Docker provider struct (optional, for golden image)
        write_file_fn: File writing function (optional, for golden image)
    """
    # Initialize networks first
    if fix_docker_networks_fn:
        _init_networks(fix_docker_networks_fn)

    # These stacks both define an `elasticsearch` resource (and host port 9200).
    # Running both at once causes compose/resource collisions and unstable startup.
    if should_enable('monitoring') and should_enable('elk'):
        fail("Incompatible flags: 'monitoring' and 'elk' cannot both be enabled at the same time. Disable one of them.")
    
    # Build golden image before other infrastructure (if enabled)
    golden_image_resource = None
    if docker_provider and write_file_fn:
        _generate_golden_dockerfile(should_enable, docker_provider, write_file_fn)
        golden_image_resource = _load_golden_image(should_enable, docker_provider)
    
    # Load infrastructure in order
    _load_database_management(should_enable)
    _load_verdaccio(should_enable)
    _load_infisical(should_enable)
    _load_proxy(should_enable)
    _load_monitoring(should_enable)
    _load_debezium(should_enable)
    _load_elk(should_enable)
    
    return golden_image_resource


# =============================================================================
# 📦 INFRA STRUCT (Public API)
# =============================================================================

Infra = struct(
    # Main loader
    load_all = load_all_infrastructure,
    init_networks = _init_networks,
    
    # Individual loaders (for granular control)
    load_database = _load_database_management,
    load_verdaccio = _load_verdaccio,
    load_infisical = _load_infisical,
    load_proxy = _load_proxy,
    load_monitoring = _load_monitoring,
    load_debezium = _load_debezium,
    load_elk = _load_elk,
    load_golden_image = _load_golden_image,
)
