"""
C4 Diagram Generator for TDK Landscape
Auto-generates C4 model data from service manifests with proper borders
and internal dependency tracking.
"""

load("../../../../.tilt/TILT_TECH_STACK.star", "RUNTIME", "ORM", "MESSAGING", "BUNDLER", "WEB_FRAMEWORK", "LANGUAGE")

def generate_c4_model(services):
    """
    Generate C4 model from service list with:
    - Proper borders (System, Container, Component boundaries)
    - Only internal dependencies
    - Clickability metadata for IDE integration
    """
    
    # C4 Level 1: System Context
    systems = {}
    
    # C4 Level 2: Containers (Services)
    containers = []
    
    # C4 Level 3: Components (Internal structure)
    components = []
    
    # Internal relationships only
    relationships = []
    
    # Track domains as systems
    domains = {}
    for svc in services:
        domain = svc.get("domain", "unknown")
        if domain not in domains:
            domains[domain] = {
                "id": "system_{}".format(domain),
                "name": domain.capitalize(),
                "description": "{} domain services".format(domain.capitalize()),
                "type": "System",
                "tags": [domain],
                "border_color": _get_domain_color(domain),
                "services": []
            }
        domains[domain]["services"].append(svc)
    
    # Generate containers (services)
    for domain_name, domain_data in domains.items():
        for svc in domain_data["services"]:
            manifest = svc.get("manifest", {})
            app_type = manifest.get("appType", "backend")
            
            container = {
                "id": "container_{}_{}".format(domain_name, svc["name"]),
                "name": svc["name"],
                "description": manifest.get("description", "{} service".format(app_type)),
                "type": "Container",
                "technology": _get_technology(app_type, manifest),
                "parent_id": domain_data["id"],
                "tags": [domain_name, app_type],
                "border_style": _get_border_style(app_type),
                "border_color": _get_border_color(app_type),
                "border_width": 3,
                "fill_color": _get_fill_color(app_type, domain_name),
                "clickable": True,
                "drill_down": {
                    "enabled": True,
                    "target": "component_{}".format(svc["name"]),
                    "level": 3
                },
                "metadata": {
                    "port": manifest.get("port"),
                    "runtime": manifest.get("runtime", RUNTIME),
                    "features": manifest.get("features", []),
                    "path": svc.get("path"),
                    "domain": domain_name
                }
            }
            containers.append(container)
            
            # Generate components for this container (Level 3)
            components.extend(_generate_components(svc, container["id"]))
    
    # Generate internal relationships only
    for container in containers:
        svc_name = container["name"]
        manifest = _find_manifest(services, svc_name)
        
        if manifest:
            # Internal dependencies only (within same project)
            internal_deps = manifest.get("internalDependencies", [])
            for dep in internal_deps:
                # Find the target container
                target = _find_container_by_name(containers, dep)
                if target:
                    rel = {
                        "id": "rel_{}_to_{}".format(container["id"], target["id"]),
                        "source": container["id"],
                        "target": target["id"],
                        "description": "uses",
                        "type": "internal",
                        "style": {
                            "stroke": "#4ec9b0",
                            "stroke_width": 2,
                            "arrow_style": "solid"
                        },
                        "clickable": True,
                        "metadata": {
                            "dependency_type": "internal",
                            "bidirectional": False
                        }
                    }
                    relationships.append(rel)
            
            # Frontend -> Backend relationships
            if manifest.get("appType") == "frontend" and manifest.get("backendName"):
                backend_name = manifest.get("backendName")
                target = _find_container_by_name(containers, backend_name)
                if target:
                    rel = {
                        "id": "rel_{}_to_{}_api".format(container["id"], target["id"]),
                        "source": container["id"],
                        "target": target["id"],
                        "description": "calls API",
                        "type": "api",
                        "style": {
                            "stroke": "#9cdcfe",
                            "stroke_width": 2,
                            "arrow_style": "dashed"
                        },
                        "clickable": True
                    }
                    relationships.append(rel)
    
    # Build final C4 model
    c4_model = {
        "version": "1.0",
        "generated_at": "",
        "levels": {
            "1": {
                "name": "System Context",
                "description": "TDK Landscape system domains",
                "elements": list(domains.values())
            },
            "2": {
                "name": "Container",
                "description": "Services within each domain",
                "elements": containers
            },
            "3": {
                "name": "Component",
                "description": "Internal service components",
                "elements": components
            }
        },
        "relationships": relationships,
        "view_config": {
            "layout": "hierarchical",
            "direction": "top_down",
            "spacing": {
                "system_gap": 100,
                "container_gap": 60,
                "component_gap": 40
            },
            "borders": {
                "show_domain_boundaries": True,
                "show_service_boundaries": True,
                "border_radius": 8,
                "shadow": True
            },
            "clickability": {
                "enabled": True,
                "drill_down": True,
                "show_details": True,
                "highlight_connected": True,
                "hover_preview": True
            }
        },
        "statistics": {
            "total_systems": len(domains),
            "total_containers": len(containers),
            "total_components": len(components),
            "total_relationships": len(relationships),
            "domains": list(domains.keys())
        }
    }
    
    return c4_model


def _generate_components(service, parent_id):
    """Generate component-level details for a service"""
    components = []
    manifest = service.get("manifest", {})
    app_type = manifest.get("appType", "backend")
    features = manifest.get("features", [])
    
    # Common components based on features
    if MESSAGING in features:
        components.append({
            "id": "comp_{}_nats".format(service["name"]),
            "name": "NATS Client",
            "type": "Component",
            "technology": "NATS",
            "parent_id": parent_id,
            "description": "Event messaging client",
            "border_color": "#ff7f0e",
            "fill_color": "#fff3e0"
        })
    
    if ORM in features:
        components.append({
            "id": "comp_{}_prisma".format(service["name"]),
            "name": "Prisma ORM",
            "type": "Component",
            "technology": "Prisma",
            "parent_id": parent_id,
            "description": "Database access layer",
            "border_color": "#2ca02c",
            "fill_color": "#e8f5e9"
        })
    
    if BUNDLER in features or "vite-node" in features:
        components.append({
            "id": "comp_{}_api".format(service["name"]),
            "name": "API Routes",
            "type": "Component",
            "technology": WEB_FRAMEWORK + "/" + BUNDLER.capitalize(),
            "parent_id": parent_id,
            "description": "HTTP API endpoints",
            "border_color": "#1f77b4",
            "fill_color": "#e3f2fd"
        })
    
    if app_type == "frontend":
        components.append({
            "id": "comp_{}_ui".format(service["name"]),
            "name": "React Components",
            "type": "Component",
            "technology": "React",
            "parent_id": parent_id,
            "description": "UI components",
            "border_color": "#9467bd",
            "fill_color": "#f3e5f5"
        })
        
        components.append({
            "id": "comp_{}_store".format(service["name"]),
            "name": "State Management",
            "type": "Component",
            "technology": "React Query/Zustand",
            "parent_id": parent_id,
            "description": "Client-side state",
            "border_color": "#d62728",
            "fill_color": "#ffebee"
        })
    
    return components


def _get_domain_color(domain):
    """Get border color for domain boundary"""
    colors = {
        "salon": "#1f77b4",
        "identity": "#ff7f0e",
        "appointment": "#2ca02c",
        "billing": "#d62728",
        "inventory": "#9467bd",
        "staff": "#8c564b",
        "treatment": "#e377c2",
        "payment": "#7f7f7f",
        "reporting": "#bcbd22",
        "api-gateway": "#17becf"
    }
    return colors.get(domain, "#666666")


def _get_technology(app_type, manifest):
    """Get technology string for container"""
    runtime = manifest.get("runtime", RUNTIME)
    features = manifest.get("features", [])
    
    if app_type == "frontend":
        return "React + " + BUNDLER.capitalize() + " + " + LANGUAGE.capitalize()
    elif app_type == "backend":
        tech_parts = [WEB_FRAMEWORK.capitalize(), LANGUAGE.capitalize()]
        if ORM in features:
            tech_parts.append("Prisma")
        if MESSAGING in features:
            tech_parts.append("NATS")
        return " + ".join(tech_parts)
    elif app_type == "cli":
        return "{} CLI".format(runtime.capitalize())
    elif app_type == "sdk":
        return "TypeScript SDK"
    return "Unknown"


def _get_border_style(app_type):
    """Get border style based on type"""
    styles = {
        "backend": "solid",
        "frontend": "dashed",
        "cli": "dotted",
        "sdk": "double"
    }
    return styles.get(app_type, "solid")


def _get_border_color(app_type):
    """Get border color based on type"""
    colors = {
        "backend": "#4ec9b0",
        "frontend": "#c586c0",
        "cli": "#ce9178",
        "sdk": "#9cdcfe"
    }
    return colors.get(app_type, "#808080")


def _get_fill_color(app_type, domain):
    """Get fill color for container"""
    base_colors = {
        "backend": "#1e1e1e",
        "frontend": "#252526",
        "cli": "#2d2d30",
        "sdk": "#252525"
    }
    return base_colors.get(app_type, "#1e1e1e")


def _find_manifest(services, name):
    """Find service manifest by name"""
    for svc in services:
        if svc["name"] == name:
            return svc.get("manifest", {})
    return {}


def _find_container_by_name(containers, name):
    """Find container by service name"""
    for container in containers:
        if container["name"] == name or name in container["name"]:
            return container
    return None


def generate_c4_json(services, output_path=".tilt/c4-model.json"):
    """
    Generate C4 model JSON file for IDE consumption
    """
    model = generate_c4_model(services)
    
    # Return as string for file writing
    return struct(
        model=model,
        output_path=output_path,
        json=encode_json(model)
    )


# Export functions for use in Tiltfile
c4_generator = struct(
    generate_model=generate_c4_model,
    generate_json=generate_c4_json,
    version="1.0.0"
)
