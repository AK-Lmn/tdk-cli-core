# =============================================================================
# 🧪 TEST: Custom Dockerfile Path Resolution
# =============================================================================
# Test for the bug where custom Dockerfile validation fails for platform services
# because the path check runs from the wrong working directory.
#
# Bug: When Tilt runs from .tdk/.tdk-out/, the local() command checks paths
# relative to that directory, not the project root.
#
# Example:
#   - Project root: /private/var/www/2025/ollamar1/beauty-crm/
#   - Tilt runs from: /private/var/www/2025/ollamar1/beauty-crm/.tdk/.tdk-out/
#   - Service location: services/platform/mdblaster/mdblaster-docs/
#   - Dockerfile: services/platform/mdblaster/mdblaster-docs/Dockerfile.custom
#   
#   Check runs: test -f 'services/platform/mdblaster/mdblaster-docs/Dockerfile.custom'
#   From wrong dir: /beauty-crm/.tdk/.tdk-out/ (MISSING)
#   Should be from: /beauty-crm/ (EXISTS)
# =============================================================================

# This test file documents the bug and can be run with:
#   cd /private/var/www/2025/ollamar1/tdk-cli && tilt alpha tiltfile-test tests/test_custom_dockerfile_path.star
#
# Or manually tested by checking:
#   local("test -f 'services/platform/mdblaster/mdblaster-docs/Dockerfile.custom' && echo 'yes' || echo 'no'")
# Run this from project root: returns "yes"
# Run this from .tdk/.tdk-out/: returns "no" (BUG!)

print("Testing custom Dockerfile path resolution...")

# Get project root from environment (set by Tiltfile)
project_root = os.environ.get('TDK_PROJECT_ROOT', '')
print("Project root: " + project_root)

# Test paths
test_paths = [
    "services/platform/mdblaster/mdblaster-docs/Dockerfile.custom",
    "services/product/mdblaster-docs/Dockerfile.custom",
]

# Test 1: Check from current directory (wherever Tilt is running)
print("\n📍 Test 1: Checking from current directory")
for path in test_paths:
    result = str(local("test -f '{path}' && echo 'yes' || echo 'no'".format(path=path), quiet=True, echo_off=True)).strip()
    print("   " + path + ": " + result)

# Test 2: Check from project root (correct)
print("\n📍 Test 2: Checking from project root (correct)")
for path in test_paths:
    result = str(local("cd '{root}' && test -f '{path}' && echo 'yes' || echo 'no'".format(root=project_root, path=path), quiet=True, echo_off=True)).strip()
    print("   " + path + ": " + result)

print("\n✅ Test complete!")
print("If Test 1 shows 'no' for platform path but Test 2 shows 'yes', the bug is confirmed.")
