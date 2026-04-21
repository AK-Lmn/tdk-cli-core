# =============================================================================
# 🎯 TILT SDK - ORCHESTRATOR APPLY
# =============================================================================
# Purpose: thin coordinator for service apply lifecycle.
# =============================================================================

load('../databases.star', 'Database')
load('./apply_runtime_flags.star', 'RuntimeFlags')
load('./apply_service_validation.star', 'ServiceValidation')
load('./apply_manifest_orchestration.star', 'ManifestOrchestration')
load('./apply_compose_resource_registration.star', 'ComposeResourceRegistration')
load('./apply_migrator_orchestration.star', 'MigratorOrchestration')


def apply_app_service(service_config, ctx):
    """
    Load and configure an application service by delegating each responsibility
    to a focused orchestration module.
    """
    service_name = service_config['name']
    should_enable = ctx['should_enable']

    if not should_enable(service_name):
        return

    runtime_flags = RuntimeFlags.resolve()
    ctx['auto_init_config_gen'] = runtime_flags['auto_init_config_gen']

    print("🚀 Loading " + service_name + " services...")

    ServiceValidation.validate(service_config)

    # Only provision database if service has a backend resource (not just frontend)
    has_backend = False
    for resource in service_config.get('resources', []):
        manifest = resource.get('_manifest', {})
        if manifest.get('appType') == 'backend':
            has_backend = True
            break
    
    if should_enable('database-management') and has_backend:
        Database.provision(service_name)

    manifest_state = ManifestOrchestration.prepare(service_config, ctx)
    compose_state = ComposeResourceRegistration.register(
        service_config,
        ctx,
        runtime_flags,
        manifest_state,
    )

    MigratorOrchestration.register(
        service_config,
        ctx,
        runtime_flags,
        compose_state['compose_project_name'],
    )
