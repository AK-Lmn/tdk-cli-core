# CI/CD Recommendation: Circular Dependency Check

To prevent circular dependencies from being introduced in future PRs, add the following to your CI pipeline:

## GitHub Actions Workflow

Create `.github/workflows/dependency-check.yml`:

```yaml
name: Dependency Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  check-circular-deps:
    name: Check Circular Dependencies
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./cli

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install madge
        run: npm install -g madge

      - name: Check for circular dependencies
        run: |
          echo "🔍 Checking for circular dependencies..."
          npx madge --circular --extensions ts src/
          if [ $? -eq 0 ]; then
            echo "✅ No circular dependencies found!"
          else
            echo "❌ Circular dependencies detected!"
            echo "Run 'npx madge --circular --extensions ts src/' locally to see details."
            exit 1
          fi

      - name: Generate dependency report (informational)
        if: github.event_name == 'pull_request'
        run: |
          echo "📊 Dependency Summary:"
          npx madge --summary --extensions ts src/ || true
```

## Package.json Script

Add to `cli/package.json`:

```json
{
  "scripts": {
    "check:circular": "madge --circular --extensions ts src/",
    "check:deps": "madge --summary --extensions ts src/"
  }
}
```

## Pre-commit Hook (Optional)

Add to your pre-commit configuration to catch issues before they're committed:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: check-circular-deps
        name: Check Circular Dependencies
        entry: bash -c 'cd cli && npx madge --circular --extensions ts src/'
        language: system
        pass_filenames: false
        always_run: true
```

## What This Prevents

- ✅ Accidental circular imports during refactoring
- ✅ Type-only import cycles (TypeScript allows these but they're still design smells)
- ✅ Barrel file cycles
- ✅ Cross-layer violations

## Running Locally

```bash
# Check for circular dependencies
cd cli
npx madge --circular --extensions ts src/

# View dependency graph
npx madge --json --extensions ts src/ | jq

# Generate visual graph (requires graphviz)
npx madge --image dependency-graph.svg --extensions ts src/
```
