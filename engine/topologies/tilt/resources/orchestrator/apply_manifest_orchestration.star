# =============================================================================
# 📄 ORCHESTRATOR APPLY - MANIFEST ORCHESTRATION
# =============================================================================

# === INLINED CONSTANTS for pure extension loading ===
BASE_PORT_FRONTEND = 3000
BASE_PORT_BACKEND = 4000
# === END INLINED CONSTANTS ===


load('../../discovery/loading.star', 'Manifest')
load('./generators/manifest_resource.star', 'ManifestResource')



def prepare_resource_manifests(service_config, ctx):
    service_name = service_config['name']
    resource_manifests = {}
    backend_manifest_cache = {}
    config_gen_resources = {}

    # First pass: load all manifests.
    for resource in service_config.get('resources', []):
        # Use the resource's _resource_path if available (for services from different scan roots)
        # Otherwise fall back to constructing path from service_config path + resource name
        resource_path = resource.get('_resource_path', service_config['path'] + '/' + resource['name'])
        manifest = Manifest.load_manifest(resource_path)
        resource_manifests[resource['name']] = manifest

        app_name = manifest.get('appName', resource['name'])
        stack = manifest.get('stack', service_name)
        port = manifest.get('port', BASE_PORT_FRONTEND)
        app_type = manifest.get('appType', 'backend')

        print(
            "   [Tilt] ✅ Loaded: " + app_name
            + " | Stack: " + stack
            + " | Port: " + str(port)
            + " | Type: " + app_type
        )

        if manifest.get('appType') == 'backend':
            backend_manifest_cache[manifest.get('appName')] = manifest

    # Second pass: create config generation resources.
    print("   🎯 Creating manifest-driven config resources...")
    for resource in service_config.get('resources', []):
        manifest = resource_manifests.get(resource['name'], {})
        backend_manifest = None

        if resource.get('frontend', False) or manifest.get('appType') == 'frontend':
            backend_name = manifest.get('backendName', resource['name'].replace('-frontend', '-backend'))
            backend_manifest = backend_manifest_cache.get(backend_name)
            if not backend_manifest:
                backend_manifest = Manifest.load_related(manifest)

        # Use the resource's actual service path for config generation
        resource_path = resource.get('_resource_path', service_config['path'] + '/' + resource['name'])
        
        config_gen_resource = ManifestResource.create_config_resource(
            service_name,
            resource,
            resource_path,  # Pass correct path instead of service_config['path']
            manifest,
            backend_manifest,
            ctx,
        )
        config_gen_resources[resource['name']] = config_gen_resource

    return {
        'resource_manifests': resource_manifests,
        'config_gen_resources': config_gen_resources,
    }


ManifestOrchestration = struct(
    prepare = prepare_resource_manifests,
)
