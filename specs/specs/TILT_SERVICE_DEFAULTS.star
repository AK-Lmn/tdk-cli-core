#!/usr/bin/env starlark
# -*- coding: utf-8 -*-
# =============================================================================
# 🔧 TILT SERVICE DEFAULTS MASTER CONFIG
# =============================================================================
# 
# Defines standard configurations for all services in the TDK Landscape platform.
# This provides consistent port allocation, health checks, and build settings.
#
# See: docs/TILT_MASTER_CONFIGS.md
# =============================================================================

# Port Configuration
BASE_PORT_FRONTEND = 3000
BASE_PORT_BACKEND = 4000
BASE_PORT_HEALTH = 5000

# Port ranges
PORT_RANGE_FRONTEND_START = 3000
PORT_RANGE_FRONTEND_END = 3999
PORT_RANGE_BACKEND_START = 4000
PORT_RANGE_BACKEND_END = 4999
PORT_RANGE_HEALTH_START = 5000
PORT_RANGE_HEALTH_END = 5999

# Health Check Configuration
HEALTH_CHECK_PATH = "/health"
HEALTH_CHECK_LIVE = "/health/live"
HEALTH_CHECK_READY = "/health/ready"
HEALTH_CHECK_TIMEOUT = 30

# File watch ignore patterns (to prevent fsnotify buffer overflow)
def get_filewatch_ignore_patterns(service_path="."):
    """
    Returns list of file patterns to ignore for Tilt filewatch.
    
    Args:
        service_path: Base path of the service
    
    Returns:
        List of patterns to ignore
    """
    # Common directories that cause fsnotify buffer overflow
    ignores = [
        service_path + "/node_modules",
        service_path + "/dist",
        service_path + "/build",
        service_path + "/.git",
        service_path + "/.prisma",
        service_path + "/.turbo",
        service_path + "/coverage",
        service_path + "/tmp",
        service_path + "/temp",
        service_path + "/__tests__",
        service_path + "/test",
        service_path + "/tests",
    ]
    return ignores

def get_port_config():
    """Returns the complete port allocation strategy."""
    return {
        "frontend": {
            "base": BASE_PORT_FRONTEND,
            "range_start": PORT_RANGE_FRONTEND_START,
            "range_end": PORT_RANGE_FRONTEND_END,
        },
        "backend": {
            "base": BASE_PORT_BACKEND,
            "range_start": PORT_RANGE_BACKEND_START,
            "range_end": PORT_RANGE_BACKEND_END,
        },
        "health": {
            "base": BASE_PORT_HEALTH,
            "range_start": PORT_RANGE_HEALTH_START,
            "range_end": PORT_RANGE_HEALTH_END,
        },
    }

def get_service_port(service_type, domain_index=0, service_index=0):
    """
    Calculate service port based on type and indices.
    
    Args:
        service_type: "frontend" or "backend"
        domain_index: Index of the domain (for port allocation)
        service_index: Index of the service within domain
    
    Returns:
        Port number
    """
    if service_type == "frontend":
        base = BASE_PORT_FRONTEND
    elif service_type == "backend":
        base = BASE_PORT_BACKEND
    else:
        fail("Unknown service type: {}".format(service_type))
    
    # Allocate ports: base + (domain_index * 100) + service_index
    return base + (domain_index * 100) + service_index

def get_health_check_config():
    """Returns health check endpoint configuration."""
    return {
        "path": HEALTH_CHECK_PATH,
        "live": HEALTH_CHECK_LIVE,
        "ready": HEALTH_CHECK_READY,
        "timeout": HEALTH_CHECK_TIMEOUT,
    }

def get_build_config():
    """Returns Docker build configuration."""
    return {
        "dockerfile": "Dockerfile",
        "context": ".",
        "platform": "linux/amd64",
        "cache_from": [],
    }

def get_runtime_config():
    """Returns runtime command configuration."""
    return {
        "backend": {
            "command": "bun",
            "args": ["run", "dev"],
            "env": {
                "NODE_ENV": "development",
            },
        },
        "frontend": {
            "command": "bun",
            "args": ["run", "dev"],
            "env": {
                "NODE_ENV": "development",
            },
        },
    }

def get_service_defaults():
    """Returns complete service defaults."""
    return {
        "port": get_port_config(),
        "health": get_health_check_config(),
        "build": get_build_config(),
        "runtime": get_runtime_config(),
    }

def validate_service_defaults(config):
    """
    Validates service configuration against defaults.
    
    Args:
        config: Service configuration dict
    
    Returns:
        Dict with validation results
    """
    warnings = []
    errors = []
    
    # Validate port allocation
    if "port" in config:
        port = config["port"]
        if port < 1024:
            errors.append("Port {} is in reserved range (< 1024)".format(port))
        elif port > 65535:
            errors.append("Port {} exceeds maximum (65535)".format(port))
    
    # Validate health check path
    if "healthCheckPath" in config:
        path = config["healthCheckPath"]
        if not path.startswith("/"):
            errors.append("Health check path must start with /: {}".format(path))
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }

# Export public API
__all__ = [
    "get_port_config",
    "get_service_port",
    "get_health_check_config",
    "get_filewatch_ignore_patterns",
    "get_build_config",
    "get_runtime_config",
    "get_service_defaults",
    "validate_service_defaults",
    "BASE_PORT_FRONTEND",
    "BASE_PORT_BACKEND",
    "BASE_PORT_HEALTH",
    "PORT_RANGE_FRONTEND_START",
    "PORT_RANGE_FRONTEND_END",
    "PORT_RANGE_BACKEND_START",
    "PORT_RANGE_BACKEND_END",
    "PORT_RANGE_HEALTH_START",
    "PORT_RANGE_HEALTH_END",
    "HEALTH_CHECK_PATH",
    "HEALTH_CHECK_LIVE",
    "HEALTH_CHECK_READY",
    "HEALTH_CHECK_TIMEOUT",
]
