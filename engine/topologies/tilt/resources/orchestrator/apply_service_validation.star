# =============================================================================
# ✅ ORCHESTRATOR APPLY - SERVICE VALIDATION
# =============================================================================

load('../../common/utils.star', 'Utils')


def validate_service(service_config):
    service_name = service_config['name']
    service_paths = []

    for resource in service_config.get('resources', []):
        service_paths.append(service_config['path'] + "/" + resource['name'])

    circular_deps = Utils.detect_circular_deps(service_paths)
    if circular_deps:
        error_msg = "🔴 CIRCULAR DEPENDENCY DETECTED IN SERVICE: " + service_name + "\n"
        for cycle in circular_deps:
            error_msg += "   🔄 " + ' → '.join(cycle) + "\n"
        fail(error_msg)

    for resource_path in service_paths:
        naming_errors = Utils.validate_lib_naming(resource_path)
        if naming_errors:
            error_msg = "🔴 LIBRARY NAMING VIOLATION in " + service_name + "\n"
            for err in naming_errors:
                error_msg += "   ❌ " + err['package'] + ": " + err['error'] + "\n"
            fail(error_msg)


ServiceValidation = struct(
    validate = validate_service,
)

VALIDATION = {}
