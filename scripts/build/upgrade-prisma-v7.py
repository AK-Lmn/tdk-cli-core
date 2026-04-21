#!/usr/bin/env python3
"""
Upgrade all Prisma packages to ^7.2.0
"""

import json
import os
from pathlib import Path

def update_package_json(file_path):
    """Update Prisma versions in a package.json file"""
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    updated = False
    package_name = data.get('name', 'unknown')
    
    # Update dependencies
    if 'dependencies' in data:
        if '@prisma/client' in data['dependencies']:
            data['dependencies']['@prisma/client'] = '^7.2.0'
            updated = True
        if 'prisma' in data['dependencies']:
            data['dependencies']['prisma'] = '^7.2.0'
            updated = True
    
    # Update devDependencies
    if 'devDependencies' in data:
        if '@prisma/client' in data['devDependencies']:
            data['devDependencies']['@prisma/client'] = '^7.2.0'
            updated = True
        if 'prisma' in data['devDependencies']:
            data['devDependencies']['prisma'] = '^7.2.0'
            updated = True
    
    if updated:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
            f.write('\n')
        print(f"✅ Updated {package_name}")
        return True
    
    return False

def main():
    root = Path('/private/var/www/2025/ollamar1/beauty-crm')
    updated_count = 0
    
    print("Upgrading all packages to Prisma ^7.2.0...")
    print()
    
    # Find all package.json files
    for package_file in root.rglob('package.json'):
        # Skip node_modules and .next directories
        if 'node_modules' in str(package_file) or '.next' in str(package_file):
            continue
        
        if update_package_json(package_file):
            updated_count += 1
    
    print()
    print(f"✅ Updated {updated_count} packages to Prisma ^7.2.0")

if __name__ == '__main__':
    main()

