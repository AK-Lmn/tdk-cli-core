# AGENTS.md - Manifest System

## Purpose

General-purpose manifest parsing and loading system. Used across Tilt infrastructure, not just discovery.

## Key Files

### Core
- **`constants.star`** - `MANIFEST_FILENAME`, `MANIFEST_FILENAME_YAML`, validation constants
- **`loader.star`** - `ManifestLoader` struct with `load_from_file()` method
- **`parser.star`** - Path parsing, domain extraction from paths
- **`schema.star`** - JSON schema definitions for manifests
- **`validator.star`** - Comprehensive manifest validation

### Specialized
- **`errors.star`** - Manifest error types and formatting
- **`integration.star`** - Integration with other systems
- **`mapper.star`** - Manifest-to-resource mapping

## Important Distinction

**This folder** (`tilt/manifest/`) vs **discovery/manifest/**:
- **This:** General-purpose, reusable across all of Tilt
- **discovery/manifest/:** Discovery-specific logic (default syncs, normalization)

## Common Usage

### Load a manifest
```starlark
load("./loader.star", "ManifestLoader")
result = ManifestLoader.load_from_file(path)
if result.error:
    print(result.error)
manifest = result.manifest
```

### Get constants
```starlark
load("./constants.star", "MANIFEST_FILENAME")
# Returns: "platform-computing-provisioner.manifest.json"
```

## Manifest Structure

```json
{
  "appName": "service-name-backend",
  "appType": "backend",  // frontend, backend, library, migrator, sdk, worker
  "domain": "appointment",
  "port": 4000,
  "features": ["nats", "prisma", "vite-node"],
  "internalDependencies": ["identity"]
}
```

## Integration Points

- Used by `discovery/` - to find and load service manifests
- Used by `generators/` - to read manifest and generate configs
- Used by `resources/` - to understand service structure
