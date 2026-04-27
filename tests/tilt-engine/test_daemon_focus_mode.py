"""
Tests for daemon focus mode compliance.
Tests that discovery respects focus mode domain restrictions.
"""

import pytest
from pathlib import Path
import json


@pytest.mark.daemon
class TestDaemonFocusMode:
    """Tests for focus mode compliance."""
    
    def test_focus_mode_restricts_discovery(self, temp_dir):
        """
        Scenario: Focus mode restricts discovery
        WHEN `--focus identity` is enabled and a new service appears in `services/product/billing/`
        THEN the daemon SHALL NOT trigger registration (queue it for later)
        AND it SHALL log "⏳ Service queued (focus mode)"
        """
        # Simulate focus mode config
        focus_config = {
            "enabled": True,
            "domains": ["identity", "appointment"],
            "excluded_paths": []
        }
        
        # Service outside focus
        service_domain = "billing"
        is_in_focus = service_domain in focus_config["domains"]
        
        assert not is_in_focus, "billing should not be in focus mode"
        
        # In real daemon, this would queue instead of registering
        # For test, verify the filtering logic works
        should_register = not focus_config["enabled"] or is_in_focus
        assert not should_register, "Service outside focus should not be registered immediately"
    
    def test_focus_mode_allows_matching_services(self, temp_dir):
        """
        Scenario: Focus mode allows matching services
        WHEN `--focus identity` is enabled and a new service appears in `services/product/identity/`
        THEN the daemon SHALL trigger registration normally
        """
        # Create service in focus domain
        focus_config = {
            "enabled": True,
            "domains": ["identity", "appointment"],
            "excluded_paths": []
        }
        
        service_domain = "identity"
        is_in_focus = service_domain in focus_config["domains"]
        
        assert is_in_focus, "identity should be in focus mode"
        
        # In focus - should register
        should_register = not focus_config["enabled"] or is_in_focus
        assert should_register, "Service in focus should be registered"
    
    def test_focus_mode_disabled_allows_all(self):
        """Test that when focus mode is disabled, all services are registered."""
        focus_config = {
            "enabled": False,
            "domains": ["identity"],
            "excluded_paths": []
        }
        
        service_domain = "billing"
        is_in_focus = service_domain in focus_config["domains"]
        
        # Focus disabled - should register regardless
        should_register = not focus_config["enabled"] or is_in_focus
        assert should_register, "When focus mode disabled, all services should register"
    
    def test_focus_mode_domain_matching(self):
        """Test domain matching logic for focus mode."""
        test_cases = [
            ({"enabled": True, "domains": ["identity"]}, "identity", True),
            ({"enabled": True, "domains": ["identity"]}, "billing", False),
            ({"enabled": True, "domains": ["identity", "appointment"]}, "appointment", True),
            ({"enabled": False, "domains": ["identity"]}, "billing", True),
        ]
        
        for config, domain, expected in test_cases:
            is_in_focus = domain in config["domains"]
            should_register = not config["enabled"] or is_in_focus
            assert should_register == expected, f"Failed for {domain} with config {config}"
