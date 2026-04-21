#!/usr/bin/env python3
"""
Simple Python script to publish all @beauty-crm packages to Verdaccio
"""

import os
import subprocess
import json
from pathlib import Path

REGISTRY = "http://verdaccio.localhost:4873"
ROOT_DIR = Path(__file__).parent.parent

def get_package_name(package_dir):
    """Get package name from package.json"""
    package_json = package_dir / "package.json"
    if not package_json.exists():
        return None
    
    with open(package_json) as f:
        data = json.load(f)
        return data.get("name")

def has_build_script(package_dir):
    """Check if package has a build script"""
    package_json = package_dir / "package.json"
    with open(package_json) as f:
        data = json.load(f)
        return "build" in data.get("scripts", {})

def publish_package(package_dir):
    """Build and publish a single package"""
    pkg_name = get_package_name(package_dir)
    
    if not pkg_name or not pkg_name.startswith("@beauty-crm/"):
        return None
    
    print(f"\n📦 {pkg_name}")
    
    # Build if needed
    if has_build_script(package_dir):
        print("  Building...")
        result = subprocess.run(
            ["bun", "run", "build"],
            cwd=package_dir,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"  ❌ Build failed")
            return "failed"
    
    # Publish
    print("  Publishing...")
    result = subprocess.run(
        ["npm", "publish", "--registry", REGISTRY, "--access", "public"],
        cwd=package_dir,
        capture_output=True,
        text=True
    )
    
    if "409 Conflict" in result.stderr or "already present" in result.stderr:
        print("  ⚠️  Already published")
        return "skipped"
    elif result.returncode != 0:
        print(f"  ❌ Failed: {result.stderr.split(chr(10))[0]}")
        return "failed"
    else:
        print("  ✅ Published")
        return "published"

def main():
    print("🚀 Publishing all @beauty-crm packages to Verdaccio...")

    stats = {"published": 0, "skipped": 0, "failed": 0}

    # DDD Layer packages (must be first due to dependencies)
    print("\n=== DDD Layer Packages ===")
    ddd_dir = ROOT_DIR / "shared-ddd-layers"
    if ddd_dir.exists():
        # Publish in dependency order
        for pkg_name in ["domain", "infrastructure", "application", "presentation"]:
            package_dir = ddd_dir / pkg_name
            if package_dir.exists() and (package_dir / "package.json").exists():
                result = publish_package(package_dir)
                if result:
                    stats[result] += 1

    # Platform packages
    print("\n=== Platform Packages ===")
    platform_dir = ROOT_DIR / "shared-platform-engineering"
    for package_dir in sorted(platform_dir.iterdir()):
        if package_dir.is_dir() and (package_dir / "package.json").exists():
            result = publish_package(package_dir)
            if result:
                stats[result] += 1

    # Product packages
    print("\n=== Product Packages ===")
    product_dir = ROOT_DIR / "shared-product-engineering"
    for package_dir in sorted(product_dir.iterdir()):
        if package_dir.is_dir() and (package_dir / "package.json").exists():
            result = publish_package(package_dir)
            if result:
                stats[result] += 1

    # Summary
    print("\n" + "="*40)
    print("📊 Summary:")
    print(f"  ✅ Published: {stats['published']}")
    print(f"  ⚠️  Skipped: {stats['skipped']}")
    print(f"  ❌ Failed: {stats['failed']}")
    print("="*40)

if __name__ == "__main__":
    main()

