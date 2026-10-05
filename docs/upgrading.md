# Upgrading TDK and keeping a team on one version

## Set a minimum version for the repo

Add `minTdkVersion` to `.tdk/project.json` and commit it:

```json
{ "minTdkVersion": "1.3.80" }
```

`tdk doctor` then fails on any older CLI, locally and in CI, and says what to run:

```text
tdk 1.3.79 is older than the 1.3.80 this project requires (minTdkVersion)
Run: tdk upgrade
```

- It is a **floor**: newer versions pass. Nothing pins an exact version.
- The value must be `MAJOR.MINOR.PATCH`; anything else fails the check.
- Only `tdk doctor` reads it. `tdk up` does not check it yet, so run `tdk doctor` in CI and in your onboarding steps.

## Install a specific version

- npm: `npm install -g @tdk-landscape/tdk-cli-core@1.3.80`
- `tdk upgrade` always goes to the latest release; it has no version argument.
- `install.sh` and the release binaries: whether `install.sh` can install an older tag is **not documented**. Versions are listed on the [releases page](https://github.com/tdk-landscape/tdk-cli-releases/releases).

## What is versioned

| Thing | Version | Where |
| --- | --- | --- |
| CLI, bundled engine and binaries | One number, the npm package version | `tdk version`, [CHANGELOG](../CHANGELOG.md) |
| `service.json` format | `schemaVersion` (currently `1`); `tdk doctor` rejects an unsupported value | [configuration](configuration.md) |
| `--json` output of `status`, `resources`, `networks`, `doctor`, `config verify` | `schemaVersion` in the envelope | [CHANGELOG](../CHANGELOG.md) |
| `.tdk/project.json` | No format version; optional `minTdkVersion` | this page |

## Compatibility policy

There is no written semver promise yet. What the changelog shows in practice: a flag that is going away is kept for a while and named with its removal version (for example `networks --json-legacy`, kept through 1.4.x and scheduled for removal in 1.5.0). Read the changelog's **Unreleased** and version sections before bumping `minTdkVersion`.

Not written down yet: how long a deprecated field keeps working, and whether an older `service.json` is migrated automatically. After an upgrade, run `tdk config verify` and `tdk doctor`; they report generated files that drifted and manifests that no longer validate.
