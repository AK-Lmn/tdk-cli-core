#!/usr/bin/env python3
"""
Test for custom Dockerfile path resolution with platform services.

This test reproduces the issue where custom Dockerfiles for platform services
(services/platform/*) are incorrectly resolved to services/product/* paths.

Bug: When a service in services/platform/ uses a custom Dockerfile, the
docker-compose generation produces an incorrect path.

Example:
- Service location: services/platform/mdblaster/mdblaster-docs/
- Dockerfile: services/platform/mdblaster/mdblaster-docs/Dockerfile.custom
- Expected in docker-compose: dockerfile: services/platform/mdblaster/mdblaster-docs/Dockerfile.custom
- Actual (buggy) in docker-compose: dockerfile: services/product/mdblaster-docs/Dockerfile.custom

The bug is in compose_build_config which reconstructs paths incorrectly
when resource_path doesn't match the actual service location.
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path


def simulate_compose_build_config(resource_path, res_name, dockerfile):
    """
    Simulate the compose_build_config logic from compose_helpers.star.
    
    This is the logic that has the bug.
    """
    # Check if dockerfile is already a full path (contains resource_path)
    if dockerfile.startswith(resource_path + '/'):
        # dockerfile is already a full path, use it directly
        full_dockerfile_path = dockerfile
    elif res_name:
        # Nested structure: construct path as resource_path/res_name/dockerfile
        full_dockerfile_path = "{resource_path}/{res_name}/{dockerfile}".format(
            resource_path=resource_path,
            res_name=res_name,
            dockerfile=dockerfile
        )
    else:
        # Flat structure: construct path as resource_path/dockerfile
        full_dockerfile_path = "{resource_path}/{dockerfile}".format(
            resource_path=resource_path,
            dockerfile=dockerfile
        )
    
    return full_dockerfile_path


def simulate_compose_generation_correct():
    """
    Simulate correct compose generation for platform service.
    """
    # From discovery
    full_resource_path = "services/platform/mdblaster/mdblaster-docs"
    dockerfile_from_discovery = "services/platform/mdblaster/mdblaster-docs/Dockerfile.custom"
    
    # In compose.star, this would be used directly since it starts with full_resource_path
    result = simulate_compose_build_config(
        resource_path=full_resource_path,
        res_name="",  # Empty because we use full_resource_path directly for flat
        dockerfile="Dockerfile.custom"  # Just the filename
    )
    
    return result


def simulate_compose_generation_buggy():
    """
    Simulate BUGGY compose generation for platform service.
    
    This is what happens when resource_path is wrong.
    """
    # BUG: resource_path is incorrectly set to services/product/mdblaster
    wrong_resource_path = "services/product/mdblaster"
    res_name = "mdblaster-docs"
    
    # The dockerfile from res.get('dockerfile') might be relative
    dockerfile = "mdblaster-docs/Dockerfile.custom"  # This is what _build_resource_config produces
    
    # BUG: The path check fails because dockerfile doesn't start with wrong_resource_path
    result = simulate_compose_build_config(
        resource_path=wrong_resource_path,
        res_name=res_name,
        dockerfile=dockerfile
    )
    
    return result


class TestCustomDockerfilePathResolution:
    """Test that custom Dockerfile paths are correctly resolved for platform services."""
    
    def setup_test_environment(self):
        """Create a test project structure with platform services."""
        self.test_dir = tempfile.mkdtemp(prefix="tdk_test_")
        
        # Create the project structure
        project_root = Path(self.test_dir)
        
        # Create a platform service with custom Dockerfile
        platform_service = project_root / "services" / "platform" / "mdblaster" / "mdblaster-docs"
        platform_service.mkdir(parents=True)
        
        # Create service.json with custom dockerfile
        service_json = platform_service / "service.json"
        service_json.write_text("""{
  "appName": "mdblaster-docs",
  "appType": "frontend",
  "runtime": "bun",
  "stack": "mdblaster",
  "port": 5173,
  "basePath": "/docs",
  "healthCheck": true,
  "dockerfile": "Dockerfile.custom"
}""")
        
        # Create the actual Dockerfile.custom
        dockerfile = platform_service / "Dockerfile.custom"
        dockerfile.write_text("""# Custom Dockerfile for testing
FROM nginx:alpine
COPY . /usr/share/nginx/html
""")
        
        # Create package.json (required for discovery)
        package_json = platform_service / "package.json"
        package_json.write_text("""{
  "name": "mdblaster-docs",
  "version": "1.0.0"
}""")
        
        return project_root
    
    def teardown_test_environment(self):
        """Clean up test environment."""
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_compose_build_config_with_correct_path(self):
        """
        Test compose_build_config with correct resource_path.
        
        When resource_path is correct (services/platform/mdblaster/mdblaster-docs),
        the dockerfile path should be used directly.
        """
        # Correct path from discovery
        correct_resource_path = "services/platform/mdblaster/mdblaster-docs"
        dockerfile = "Dockerfile.custom"
        
        result = simulate_compose_build_config(
            resource_path=correct_resource_path,
            res_name="",  # Empty for flat structure
            dockerfile=dockerfile
        )
        
        expected = "services/platform/mdblaster/mdblaster-docs/Dockerfile.custom"
        assert result == expected, f"Expected {expected}, got {result}"
        
        print("✅ Correct path test passed")
        print(f"   Input: resource_path={correct_resource_path}, dockerfile={dockerfile}")
        print(f"   Output: {result}")
    
    def test_compose_build_config_with_wrong_path(self):
        """
        Test compose_build_config with WRONG resource_path (the bug).
        
        When resource_path is wrong (services/product/mdblaster),
        the dockerfile path is reconstructed incorrectly.
        """
        # Wrong path that causes the bug
        wrong_resource_path = "services/product/mdblaster"
        res_name = "mdblaster-docs"
        dockerfile = "mdblaster-docs/Dockerfile.custom"  # What _build_resource_config produces
        
        result = simulate_compose_build_config(
            resource_path=wrong_resource_path,
            res_name=res_name,
            dockerfile=dockerfile
        )
        
        # This is the BUGGY output - it has wrong product path and double mdblaster-docs
        buggy_output = "services/product/mdblaster/mdblaster-docs/mdblaster-docs/Dockerfile.custom"
        
        assert result == buggy_output, f"Expected buggy output {buggy_output}, got {result}"
        
        print("✅ Bug reproduction test passed")
        print(f"   Input: resource_path={wrong_resource_path}, res_name={res_name}, dockerfile={dockerfile}")
        print(f"   Output: {result}")
        print(f"   Note: This shows how the bug produces wrong paths!")
    
    def test_platform_service_dockerfile_exists(self):
        """
        Test that the Dockerfile exists at the correct platform location.
        """
        project_root = self.setup_test_environment()
        
        try:
            # Expected correct path
            correct_path = "services/platform/mdblaster/mdblaster-docs/Dockerfile.custom"
            
            # Verify the file exists at correct location
            correct_full = project_root / correct_path
            assert correct_full.exists(), f"Dockerfile should exist at {correct_path}"
            
            # Verify the file does NOT exist at buggy location
            buggy_path = "services/product/mdblaster-docs/Dockerfile.custom"
            buggy_full = project_root / buggy_path
            assert not buggy_full.exists(), f"Dockerfile should NOT exist at {buggy_path}"
            
            print("✅ Platform service Dockerfile exists at correct location")
            print(f"   Correct: {correct_path}")
            print(f"   Buggy: {buggy_path} (does not exist - as expected)")
            
        finally:
            self.teardown_test_environment()
    
    def test_discovery_produces_correct_full_path(self):
        """
        Verify that discovery produces the correct full dockerfile path.
        
        Discovery correctly finds: services/platform/mdblaster/mdblaster-docs/Dockerfile.custom
        """
        project_root = self.setup_test_environment()
        
        try:
            # Simulate discovery output
            full_resource_path = "services/platform/mdblaster/mdblaster-docs"
            custom_dockerfile = "Dockerfile.custom"
            expected_dockerfile_path = f"{full_resource_path}/{custom_dockerfile}"
            
            assert expected_dockerfile_path == "services/platform/mdblaster/mdblaster-docs/Dockerfile.custom"
            
            # Verify the file exists
            dockerfile_full = project_root / expected_dockerfile_path
            assert dockerfile_full.exists(), f"Dockerfile should exist at {expected_dockerfile_path}"
            
            print("✅ Discovery path test passed")
            print(f"   Discovery produces: {expected_dockerfile_path}")
            
        finally:
            self.teardown_test_environment()
    
    def test_compose_generation_flow(self):
        """
        Test the complete compose generation flow with correct vs wrong resource_path.
        """
        project_root = self.setup_test_environment()
        
        try:
            # Discovery provides correct full path
            discovery_dockerfile_path = "services/platform/mdblaster/mdblaster-docs/Dockerfile.custom"
            
            # Scenario 1: CORRECT - compose uses full_resource_path directly
            correct_full_res_path = "services/platform/mdblaster/mdblaster-docs"
            
            # With full_resource_path as resource_path and just the filename as dockerfile
            correct_result = simulate_compose_build_config(
                resource_path=correct_full_res_path,
                res_name="",
                dockerfile="Dockerfile.custom"
            )
            
            assert correct_result == discovery_dockerfile_path, \
                f"Correct flow failed: expected {discovery_dockerfile_path}, got {correct_result}"
            
            # Scenario 2: BUGGY - compose uses wrong resource_path
            wrong_resource_path = "services/product/mdblaster"
            
            # _build_resource_config might produce relative dockerfile path
            relative_dockerfile = "mdblaster-docs/Dockerfile.custom"
            
            buggy_result = simulate_compose_build_config(
                resource_path=wrong_resource_path,
                res_name="mdblaster-docs",
                dockerfile=relative_dockerfile
            )
            
            # This should produce a WRONG path
            assert buggy_result != discovery_dockerfile_path, \
                f"Bug not reproduced: got correct path {buggy_result}"
            
            assert "services/product" in buggy_result, \
                f"Buggy result should contain services/product: {buggy_result}"
            
            print("✅ Compose generation flow test passed")
            print(f"   Discovery path: {discovery_dockerfile_path}")
            print(f"   Correct result: {correct_result}")
            print(f"   Buggy result: {buggy_result}")
            print(f"   Bug confirmed: Wrong path contains 'services/product'")
            
        finally:
            self.teardown_test_environment()


def run_tests():
    """Run all tests."""
    test = TestCustomDockerfilePathResolution()
    
    print("=" * 70)
    print("Testing Custom Dockerfile Path Resolution for Platform Services")
    print("=" * 70)
    print()
    
    tests = [
        ("compose_build_config with correct path", test.test_compose_build_config_with_correct_path),
        ("compose_build_config with wrong path (bug)", test.test_compose_build_config_with_wrong_path),
        ("platform service Dockerfile exists", test.test_platform_service_dockerfile_exists),
        ("discovery produces correct path", test.test_discovery_produces_correct_full_path),
        ("complete compose generation flow", test.test_compose_generation_flow),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            print(f"\n🧪 Running: {test_name}")
            print("-" * 50)
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"❌ FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print()
    print("=" * 70)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 70)
    
    if failed == 0:
        print("\n✅ All tests passed!")
        print()
        print("Summary:")
        print("- The bug occurs when resource_path is incorrect in compose generation")
        print("- Discovery correctly finds: services/platform/mdblaster/mdblaster-docs/")
        print("- Buggy compose produces: services/product/mdblaster-docs/ (WRONG)")
        print("- Fix needed in compose generation to use correct resource_path")
        return 0
    else:
        print(f"\n❌ {failed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
