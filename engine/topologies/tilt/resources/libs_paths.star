# =============================================================================
# 📚 TILT SDK - LIBRARY PATHS & DEP MAPPINGS
# =============================================================================

load('../../../topologies/tilt/common/utils.star', 'Utils')


def get_lib_path_from_package_name(ctx, package_name):
    """
    Converts @tdk/platform-logger -> shared-platform-engineering/platform-logger

    Returns:
        Tuple of (path, label, tilt_resource_name) or (None, None, None) if not a library
    """
    lib_info = Utils.resolve_lib_path(package_name)
    lib_path = lib_info[0]
    lib_type = lib_info[1]

    if not lib_path:
        return (None, None, None)

    lib_name = package_name[len(Utils.INTERNAL_SCOPE):]
    tilt_resource = 'lib-' + lib_name

    label_map = {
        'platform': 'lib.platform',
        'product': 'lib.product',
        'ddd': 'lib.ddd',
    }
    label = label_map.get(lib_type, 'lib.platform')

    return (lib_path, label, tilt_resource)


def read_package_json_deps(ctx, package_json_path):
    """Reads a package.json and returns all internal dependencies."""
    service_path = package_json_path.rsplit('/package.json', 1)[0]
    return Utils.get_internal_deps(service_path)


def get_service_paths_for_focus(ctx, focus_enabled_all):
    """Returns list of service paths based on focus mode targets."""
    if focus_enabled_all == None:
        return []

    service_path_map = ctx.get('service_path_map', {})
    service_paths = []

    for resource in focus_enabled_all:
        if resource in service_path_map:
            path = service_path_map[resource]
            if path not in service_paths:
                service_paths.append(path)

    return service_paths


def get_internal_deps_mapping(ctx, service_path):
    """Returns a mapping of package_name -> source_path for internal dependencies."""
    pkg_path = service_path + '/package.json'
    internal_deps = read_package_json_deps(ctx, pkg_path)

    mapping = {}
    for dep_name in internal_deps:
        lib_info = get_lib_path_from_package_name(ctx, dep_name)
        lib_path = lib_info[0]

        if lib_path != None:
            mapping[dep_name] = lib_path

    return mapping


LibsPaths = struct(
    get_path = get_lib_path_from_package_name,
    read_package_json_deps = read_package_json_deps,
    get_service_paths = get_service_paths_for_focus,
    get_deps_mapping = get_internal_deps_mapping,
)
