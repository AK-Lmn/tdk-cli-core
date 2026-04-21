# =============================================================================
# 🎯 TDK - Platform Specs, Generators, and Standards
# =============================================================================
# This is the Tiltfile entry point for the tdk repo.
# It exports specs, generators, CLI tools, and standards.
#
# Usage:
#   v1alpha1.extension_repo(name='tdk', url='https://github.com/tdk-landscape/tdk')
#   load('ext://tdk', 'assert_tech_stack', 'TECH_STACK')
# =============================================================================

# =============================================================================
# 📋 TECH STACK SPEC
# =============================================================================
load('./specs/TILT_TECH_STACK.star',
    _assert_tech_stack='assert_tech_stack',
    _TECH_STACK='TECH_STACK'
)

assert_tech_stack = _assert_tech_stack
TECH_STACK = _TECH_STACK

# =============================================================================
# 🏗️ GENERATORS (self-contained)
# =============================================================================
# Note: Generators that require cross-repo dependencies are loaded separately
# This module only exports self-contained utilities

# Local constants only
DOCKER_CONSTANTS = {
    "BUN_VERSION": "1.3.11",
    "BUN_IMAGE": "oven/bun:1.3.11-alpine",
}

# =============================================================================
# 🔧 UTILITIES
# =============================================================================
def get_tdk_version():
    """Return the TDK version."""
    return "1.0.0"

def get_tdk_info():
    """Return information about TDK."""
    return {
        "name": "TDK Landscape",
        "description": "Tilt Development Kit - Platform specs and standards",
        "url": "https://github.com/tdk-landscape/tdk",
    }

print("✅ TDK loaded: specs, generators, and standards")
