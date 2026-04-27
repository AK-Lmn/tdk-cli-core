"""
Tests for service snapshot scanning functionality.
Tests the filesystem scanning and service.json discovery.
"""

import json
import os
import pytest
from pathlib import Path


@pytest.mark.snapshot
class TestSnapshotScanning:
    """Tests for filesystem scanning functionality."""
    
    def test_scanning_finds_valid_service_files(self, temp_dir, monkeypatch):
        """
        Scenario: Scanning finds valid service files
        WHEN the scanner runs against a directory containing 3 valid service.json files
        THEN it SHALL return a list of 3 services with correct paths and parsed metadata
        """
        # Create test directory structure with 3 services
        services = [
            ("services/product/identity/identity-backend", "identity-backend"),
            ("services/product/identity/identity-frontend", "identity-frontend"),
            ("services/product/appointment/appointment-backend", "appointment-backend"),
        ]
        
        for service_path, service_name in services:
            service_dir = temp_dir / service_path
            service_dir.mkdir(parents=True)
            service_file = service_dir / "service.json"
            service_file.write_text(json.dumps({
                "name": service_name,
                "type": "backend" if "backend" in service_name else "frontend",
                "domain": service_path.split("/")[2],
                "port": 4001 if "backend" in service_name else 3001
            }))
        
        # Import and test
        import sys
        sys.path.insert(0, str(Path("discovery").resolve()))
        from service_snapshot import get_current_services
        
        # Change to temp directory for scanning
        original_dir = os.getcwd()
        os.chdir(temp_dir)
        
        try:
            found_services = get_current_services("services/product")
            
            assert len(found_services) == 3, f"Expected 3 services, found {len(found_services)}"
            assert all("service.json" in s for s in found_services), "All services should be service.json files"
        finally:
            os.chdir(original_dir)
    
    def test_scanning_ignores_non_service_files(self, temp_dir, monkeypatch):
        """
        Scenario: Scanning ignores non-service files
        WHEN the scanner runs against a directory containing service.json and package.json and README.md
        THEN it SHALL only return the service defined in service.json
        """
        # Create directory with mixed files
        service_dir = temp_dir / "services" / "product" / "test"
        service_dir.mkdir(parents=True)
        
        # Create service.json
        (service_dir / "service.json").write_text(json.dumps({"name": "test-service"}))
        # Create non-service files
        (service_dir / "package.json").write_text('{"name": "test"}')
        (service_dir / "README.md").write_text("# Test Service")
        (service_dir / "config.ts").write_text("export const config = {};")
        
        import sys
        sys.path.insert(0, str(Path("discovery").resolve()))
        from service_snapshot import get_current_services
        
        original_dir = os.getcwd()
        os.chdir(temp_dir)
        
        try:
            found_services = get_current_services("services/product")
            
            assert len(found_services) == 1, f"Expected 1 service, found {len(found_services)}"
            assert "service.json" in found_services[0], "Should only find service.json files"
            assert "package.json" not in found_services[0], "Should not include package.json"
        finally:
            os.chdir(original_dir)
    
    def test_scanning_handles_nested_directories(self, temp_dir, monkeypatch):
        """
        Scenario: Scanning handles nested directories
        WHEN the scanner runs against a directory with nested services/ subdirectory containing service.json
        THEN it SHALL find services at any depth and return correct relative paths
        """
        # Create deeply nested structure
        nested_dirs = [
            "services/product/domain1/backend/service.json",
            "services/product/domain1/frontend/service.json",
            "services/product/domain2/subdomain/backend/service.json",
        ]
        
        for path in nested_dirs:
            full_path = temp_dir / path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(json.dumps({"name": "test"}))
        
        import sys
        sys.path.insert(0, str(Path("discovery").resolve()))
        from service_snapshot import get_current_services
        
        original_dir = os.getcwd()
        os.chdir(temp_dir)
        
        try:
            found_services = get_current_services("services/product")
            
            assert len(found_services) == 3, f"Expected 3 services, found {len(found_services)}"
            # Verify all paths are relative and contain the full path
            assert all("domain1" in s or "domain2" in s for s in found_services)
            assert all("service.json" in s for s in found_services)
        finally:
            os.chdir(original_dir)
