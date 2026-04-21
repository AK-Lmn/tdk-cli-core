# =============================================================================
# 📦 DEPENDENCY MANIFEST Generator
# =============================================================================
# Generates manifest entries for missing dependencies
# Fixes: "dependency on unknown resource" warnings
# =============================================================================

def _get_timestamp():
    """Get current timestamp string"""
    return str(local("date +%Y-%m-%dT%H:%M:%S", quiet=True)).strip()

load("../common/utils.star", "Utils")
load("../../platform/docker/constants.star", "PlatformDockerConstants")
load("../../../../.tilt/TILT_TECH_STACK.star", "RUNTIME")
load("../common/utils.star", "LIBRARY_ROOTS")

# =============================================================================
# Dependency Registry
# =============================================================================

# Known libraries that should exist but might be missing
# This registry maps dependency names to their metadata
KNOWN_LIBRARY_REGISTRY = {
    # Product Libraries
    "product-timezone-utils": {
        "type": "product",
        "path": LIBRARY_ROOTS["product"] + "/product-timezone-utils",
        "description": "Timezone utilities for appointment scheduling",
        "category": "appointment",
        "default_version": "1.0.0",
        "dependencies": [],
        "app_type": "library",
        "features": [],
    },
    "product-date-utils": {
        "type": "product",
        "path": LIBRARY_ROOTS["product"] + "/product-date-utils",
        "description": "Date manipulation utilities",
        "category": "appointment",
        "default_version": "1.0.0",
        "dependencies": [],
        "app_type": "library",
        "features": [],
    },
    "product-validation-utils": {
        "type": "product",
        "path": LIBRARY_ROOTS["product"] + "/product-validation-utils",
        "description": "Validation utilities for forms and data",
        "category": "shared",
        "default_version": "1.0.0",
        "dependencies": [],
        "app_type": "library",
        "features": [],
    },
    
    # Platform Libraries
    "platform-timezone-utils": {
        "type": "platform",
        "path": LIBRARY_ROOTS["platform"] + "/platform-timezone-utils",
        "description": "Server-side timezone utilities",
        "category": "infrastructure",
        "default_version": "1.0.0",
        "dependencies": [],
        "app_type": "library",
        "features": [],
    },
    "platform-date-utils": {
        "type": "platform",
        "path": LIBRARY_ROOTS["platform"] + "/platform-date-utils",
        "description": "Server-side date utilities",
        "category": "infrastructure",
        "default_version": "1.0.0",
        "dependencies": [],
        "app_type": "library",
        "features": [],
    },
}

# =============================================================================
# Dependency Discovery
# =============================================================================

def discover_missing_dependencies(all_services, library_roots):
    """
    Discovers dependencies that are referenced but don't exist.
    
    Analyzes all service manifests and package.json files to find
    @TDK Landscape dependencies that don't have corresponding libraries.
    
    Returns: list of missing dependencies with metadata
    """
    missing = []
    found = []
    
    internal_scope = "@" + PlatformDockerConstants.PROJECT_NAME + "/"
    
    for service in all_services:
        service_path = service.get("path", "")
        
        # Check package.json
        package_json_path = "{}/package.json".format(service_path)
        if not os.path.exists(package_json_path):
            continue
        
        package_json = Utils.read_json_file(package_json_path)
        deps = package_json.get("dependencies", {})
        dev_deps = package_json.get("devDependencies", {})
        all_deps = dict(deps, **dev_deps)
        
        for dep_name in all_deps.keys():
            if not dep_name.startswith(internal_scope):
                continue
            
            lib_name = dep_name.replace(internal_scope, "")
            
            # Check if library exists
            lib_exists = False
            lib_path = ""
            
            for lib_type, lib_root in library_roots.items():
                potential_path = "{}/{}".format(lib_root, lib_name)
                if os.path.exists(potential_path):
                    lib_exists = True
                    lib_path = potential_path
                    break
            
            if lib_exists:
                if lib_name not in found:
                    found.append(lib_name)
            else:
                if lib_name not in [m["name"] for m in missing]:
                    missing.append({
                        "name": lib_name,
                        "full_name": dep_name,
                        "referenced_by": service.get("name", "unknown"),
                        "version": all_deps[dep_name],
                        "registry_entry": KNOWN_LIBRARY_REGISTRY.get(lib_name),
                    })
    
    return struct(
        missing=missing,
        found=found,
        total_referenced=len(missing) + len(found),
    )

def generate_missing_dependency_manifests(missing_deps, library_roots, write_fn=None):
    """
    Generates manifest.json files for missing dependencies.
    
    Creates placeholder manifests that can be used to:
      1. Create the missing library
      2. Or stub out the dependency to prevent errors
    
    Returns: dict of {lib_name: manifest_content}
    """
    manifests = {}
    
    for dep in missing_deps:
        lib_name = dep["name"]
        registry_entry = dep.get("registry_entry")
        
        if registry_entry:
            # Use registry entry as base
            manifest = {
                "appName": lib_name,
                "appType": registry_entry.get("app_type", "library"),
                "category": registry_entry.get("category", "shared"),
                "version": registry_entry.get("default_version", "1.0.0"),
                "description": registry_entry.get("description", "Auto-generated library"),
                "internalDependencies": registry_entry.get("dependencies", []),
                "features": registry_entry.get("features", []),
                "runtime": RUNTIME,
                "_autoGenerated": True,
                "_generatedReason": "Referenced by {} but library does not exist".format(
                    dep["referenced_by"]
                ),
            }
            
            manifests[lib_name] = manifest
        else:
            # Generate minimal manifest
            lib_type = "platform" if lib_name.startswith("platform-") else "product"
            lib_root = library_roots.get(lib_type, LIBRARY_ROOTS["product"])
            
            manifest = {
                "appName": lib_name,
                "appType": "library",
                "category": "unknown",
                "version": "1.0.0",
                "description": "Auto-generated library stub for {}".format(lib_name),
                "internalDependencies": [],
                "features": [],
                "runtime": RUNTIME,
                "_autoGenerated": True,
                "_generatedReason": "Referenced by {} but library does not exist".format(
                    dep["referenced_by"]
                ),
                "_suggestedPath": "{}/{}".format(lib_root, lib_name),
            }
            
            manifests[lib_name] = manifest
    
    if write_fn:
        for lib_name, manifest in manifests.items():
            filename = "generated-manifest-{}.json".format(lib_name)
            write_fn(filename, Utils.encode_json(manifest))
    
    return manifests

def generate_dependency_topology_updates(missing_deps, write_fn=None):
    """
    Generates Starlark code to add missing libraries to topology.
    
    Creates the necessary updates to:
      - config.star (PRODUCT_LIBS_EXPLICIT or PLATFORM_LIBS_EXPLICIT)
      - libraries.star (library definitions)
    
    Returns: dict with code snippets
    """
    product_libs = []
    platform_libs = []
    
    for dep in missing_deps:
        lib_name = dep["name"]
        registry_entry = dep.get("registry_entry")
        
        if registry_entry:
            lib_type = registry_entry.get("type", "product")
        else:
            lib_type = "platform" if lib_name.startswith("platform-") else "product"
        
        entry = '"{}"'.format(lib_name)
        
        if lib_type == "product":
            product_libs.append(entry)
        else:
            platform_libs.append(entry)
    
    updates = {
        "config_updates": {
            "product_libs_additions": product_libs,
            "platform_libs_additions": platform_libs,
        },
        "code_snippets": {
            "config_star": '''
# Add to PRODUCT_LIBS_EXPLICIT or PLATFORM_LIBS_EXPLICIT in discovery/config.star:

# Auto-generated additions for missing dependencies
PRODUCT_LIBS_EXPLICIT.extend([
    {}
])

PLATFORM_LIBS_EXPLICIT.extend([
    {}
])
'''.format(
                ",\n    ".join(product_libs) if product_libs else "# None",
                ",\n    ".join(platform_libs) if platform_libs else "# None"
            ),
        }
    }
    
    if write_fn:
        write_fn("topology-updates.json", Utils.encode_json(updates))
    
    return updates

def generate_dependency_resolution_report(all_services, library_roots, write_fn=None):
    """
    Master report for dependency resolution.
    
    Analyzes all dependencies, identifies missing ones, and provides
    actionable recommendations.
    """
    discovery = discover_missing_dependencies(all_services, library_roots)
    
    if discovery.missing:
        manifests = generate_missing_dependency_manifests(
            discovery.missing, library_roots, None
        )
        topology_updates = generate_dependency_topology_updates(
            discovery.missing, None
        )
        
        report = {
            "timestamp": _get_timestamp(),
            "status": "MISSING_DEPENDENCIES_FOUND",
            "summary": {
                "total_referenced": discovery.total_referenced,
                "found": len(discovery.found),
                "missing": len(discovery.missing),
            },
            "found_libraries": discovery.found,
            "missing_dependencies": discovery.missing,
            "generated_manifests": manifests,
            "topology_updates": topology_updates,
            "recommendations": [
                "1. Create missing library directories with generated manifests",
                "2. Update discovery/config.star with new library entries",
                "3. Run 'bun run publish:all' to publish new libraries",
                "4. Or remove unused dependencies from package.json files",
            ],
        }
    else:
        report = {
            "timestamp": _get_timestamp(),
            "status": "ALL_DEPENDENCIES_FOUND",
            "summary": {
                "total_referenced": discovery.total_referenced,
                "found": len(discovery.found),
                "missing": 0,
            },
            "found_libraries": discovery.found,
        }
    
    if write_fn:
        write_fn("dependency-resolution-report.json", Utils.encode_json(report))
    
    # Print summary
    print("")
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     📦 DEPENDENCY RESOLUTION REPORT                           ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    status_text = "✅ ALL FOUND" if not discovery.missing else "❌ MISSING FOUND"
    print("║  Status: " + status_text + " " * (50 - len(status_text)) + " ║")
    referenced_str = str(discovery.total_referenced)
    print("║  Libraries Referenced: " + referenced_str + " " * (33 - len(referenced_str)) + " ║")
    found_str = str(len(discovery.found))
    print("║  Libraries Found: " + found_str + " " * (38 - len(found_str)) + " ║")
    missing_str = str(len(discovery.missing))
    print("║  Libraries Missing: " + missing_str + " " * (36 - len(missing_str)) + " ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    
    if discovery.missing:
        print("")
        print("Missing Libraries:")
        for dep in discovery.missing:
            print("  ❌ {} (referenced by {})".format(dep["full_name"], dep["referenced_by"]))
            if dep.get("registry_entry"):
                print("     ℹ️  Known in registry: {}".format(dep["registry_entry"]["description"]))
    
    return report

# =============================================================================
# Library Stub Generator
# =============================================================================

def generate_library_stub(lib_name, lib_type, lib_path, write_fn=None):
    """
    Generates a minimal library stub to satisfy dependencies.
    
    Creates:
      - package.json
      - src/index.ts (placeholder)
      - platform-computing-provisioner.manifest.json (if needed)
    
    This allows services to build even if the library is not fully implemented.
    """
    internal_scope = "@" + PlatformDockerConstants.PROJECT_NAME + "/"
    full_name = "{}{}".format(internal_scope, lib_name)
    
    # package.json
    package_json = {
        "name": full_name,
        "version": "1.0.0",
        "description": "Auto-generated stub library for {}".format(lib_name),
        "main": "./dist/index.cjs",
        "module": "./dist/index.mjs",
        "types": "./dist/index.d.ts",
        "exports": {
            ".": {
                "import": "./dist/index.mjs",
                "require": "./dist/index.cjs",
                "types": "./dist/index.d.ts",
            }
        },
        "scripts": {
            "build": "vite build",
            "dev": "vite build --watch",
        },
        "_autoGenerated": True,
        "_stub": True,
    }
    
    # src/index.ts
    index_ts = '''// Auto-generated stub for {}
// This is a placeholder - replace with actual implementation

export const STUB_MESSAGE = "{} is not yet implemented";

export function stubFunction(): void {
    console.warn(STUB_MESSAGE);
}

export default {
    STUB_MESSAGE,
    stubFunction,
};
'''.format(lib_name, lib_name)
    
    # manifest.json (optional)
    manifest_json = {
        "appName": lib_name,
        "appType": "library",
        "category": "stub",
        "version": "1.0.0",
        "description": "Auto-generated stub library",
        "_autoGenerated": True,
        "_stub": True,
    }
    
    files = {
        "package.json": Utils.encode_json(package_json),
        "src/index.ts": index_ts,
        "platform-computing-provisioner.manifest.json": Utils.encode_json(manifest_json),
    }
    
    if write_fn:
        for filename, content in files.items():
            filepath = "{}/{}".format(lib_path, filename)
            write_fn(filepath, content)
    
    return files

def generate_all_library_stubs(missing_deps, library_roots, write_fn=None):
    """
    Generates stub libraries for all missing dependencies.
    """
    stubs = {}
    
    for dep in missing_deps:
        lib_name = dep["name"]
        registry_entry = dep.get("registry_entry")
        
        # Determine library type and path
        if registry_entry:
            lib_type = registry_entry.get("type", "product")
            lib_path = registry_entry.get("path")
        else:
            lib_type = "platform" if lib_name.startswith("platform-") else "product"
            lib_root = library_roots.get(lib_type, LIBRARY_ROOTS["product"])
            lib_path = "{}/{}".format(lib_root, lib_name)
        
        # Generate stub
        stub_files = generate_library_stub(lib_name, lib_type, lib_path, write_fn)
        stubs[lib_name] = {
            "path": lib_path,
            "files": stub_files,
        }
    
    return stubs

# =============================================================================
# Exports
# =============================================================================

DependencyManifest = struct(
    # Discovery
    discover_missing_dependencies=discover_missing_dependencies,
    
    # Generation
    generate_missing_dependency_manifests=generate_missing_dependency_manifests,
    generate_dependency_topology_updates=generate_dependency_topology_updates,
    generate_library_stub=generate_library_stub,
    generate_all_library_stubs=generate_all_library_stubs,
    
    # Reports
    generate_dependency_resolution_report=generate_dependency_resolution_report,
    
    # Registry
    KNOWN_LIBRARY_REGISTRY=KNOWN_LIBRARY_REGISTRY,
)
