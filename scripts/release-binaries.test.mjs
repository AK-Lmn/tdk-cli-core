// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(new URL("release-binaries.sh", import.meta.url));
const ROOT_DIR = dirname(dirname(SCRIPT_PATH));
const SCRIPT_SOURCE = readFileSync(SCRIPT_PATH, "utf8");

function getBash() {
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\Git\\bin\\bash.exe",
      "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
      "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return "bash";
}

// Build a PATH for running the real script without bun on it and without ever
// reaching a real `gh`: a stub node reports a fake version, a stub gh records
// its call and fails. Directories that contain a bun executable are dropped
// whatever they are called (/usr/local/bin, /opt/homebrew/bin, ~/.bun/bin).
function isolatedPath(workDir) {
  const pathSep = process.platform === "win32" ? ";" : ":";
  const stubBin = join(workDir, "stub-bin");
  mkdirSync(stubBin, { recursive: true });
  writeFileSync(
    join(stubBin, "node"),
    `#!/usr/bin/env bash
for arg in "$@"; do
  if [[ "$arg" == *"package.json"* ]]; then
    echo "0.2.0"
    exit 0
  fi
done
exit 1
`,
  );
  writeFileSync(
    join(stubBin, "gh"),
    `#!/usr/bin/env bash
echo "gh must not be called: $*" >&2
touch "${join(workDir, "gh-called").replace(/\\/g, "/")}"
exit 99
`,
  );
  chmodSync(join(stubBin, "node"), 0o755);
  chmodSync(join(stubBin, "gh"), 0o755);
  const hasBun = (dir) => ["bun", "bun.exe"].some((name) => existsSync(join(dir, name)));
  return [stubBin, ...(process.env.PATH || "").split(pathSep).filter((dir) => dir && !hasBun(dir))].join(pathSep);
}

function extractFunction(source, fnName) {
  const start = source.indexOf(`${fnName}() {`);
  assert.ok(start >= 0, `function ${fnName} must exist in release-binaries.sh`);
  const end = source.indexOf("\n}", start) + 2;
  return source.slice(start, end);
}

test("release-binaries.sh defines expected targets, output names, and release repository", () => {
  assert.match(
    SCRIPT_SOURCE,
    /readonly RELEASE_REPOSITORY="flisk-sh\/releases"/,
    "must publish to flisk-sh/releases",
  );

  const expectedTargets = [
    { target: "bun-linux-x64", output: "flisk-linux-amd64" },
    { target: "bun-linux-arm64", output: "flisk-linux-arm64" },
    { target: "bun-darwin-x64", output: "flisk-darwin-amd64" },
    { target: "bun-darwin-arm64", output: "flisk-darwin-arm64" },
    { target: "bun-windows-x64", output: "flisk-windows-amd64.exe" },
  ];

  for (const { target, output } of expectedTargets) {
    assert.match(
      SCRIPT_SOURCE,
      new RegExp(`build_target\\s+${target}\\s+${output}`),
      `expected build_target mapping for ${target} -> ${output}`,
    );
  }

  assert.match(SCRIPT_SOURCE, /tar -czf flisk-cli-engine\.tar\.gz flisk-cli/);
  assert.match(SCRIPT_SOURCE, /flisk-cli-\$\{RELEASE_TAG\}-binaries\.zip/);
  assert.match(SCRIPT_SOURCE, /> checksums\.txt/);
});

test("release-binaries.sh fails with clear error when bun is missing", (t) => {
  const bash = getBash();
  const workDir = mkdtempSync(join(tmpdir(), "flisk-release-test-"));

  try {
    const cleanPath = isolatedPath(workDir);

    const proc = spawnSync(bash, [SCRIPT_PATH.replace(/\\/g, "/")], {
      cwd: ROOT_DIR,
      env: { ...process.env, PATH: cleanPath },
      encoding: "utf8",
    });

    if (proc.status === null && proc.error) {
      t.skip(`bash spawn unavailable on host: ${proc.error.message}`);
      return;
    }

    assert.equal(proc.status, 1, "must exit non-zero when bun is absent");
    assert.match(proc.stderr, /bun is required to build release binaries/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("release-binaries.sh --publish-only bypasses bun requirement check", (t) => {
  const bash = getBash();
  const workDir = mkdtempSync(join(tmpdir(), "flisk-release-test-"));

  try {
    const cleanPath = isolatedPath(workDir);

    const proc = spawnSync(bash, [SCRIPT_PATH.replace(/\\/g, "/"), "--publish-only"], {
      cwd: ROOT_DIR,
      env: { ...process.env, PATH: cleanPath },
      encoding: "utf8",
    });

    if (proc.status === null && proc.error) {
      t.skip(`bash spawn unavailable on host: ${proc.error.message}`);
      return;
    }

    assert.equal(proc.status, 1, "must exit non-zero when assets are missing");
    assert.match(proc.stderr, /Required release asset is missing or empty:/);
    assert.doesNotMatch(
      proc.stderr,
      /bun is required to build release binaries/,
      "bun check must be bypassed with --publish-only",
    );
    assert.equal(existsSync(join(workDir, "gh-called")), false, "validation must fail before any gh call");
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("build_target dry-run invokes bun compile with expected target outfiles", (t) => {
  const bash = getBash();
  const workDir = mkdtempSync(join(tmpdir(), "flisk-release-target-"));

  try {
    const binDir = join(workDir, "bin");
    mkdirSync(binDir, { recursive: true });

    const mockBun = join(binDir, "bun");
    const recordFile = join(workDir, "invocations.txt");
    writeFileSync(
      mockBun,
      `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${recordFile.replace(/\\/g, "/")}"
`,
    );
    chmodSync(mockBun, 0o755);

    const buildTargetFn = extractFunction(SCRIPT_SOURCE, "build_target");
    const harness = join(workDir, "harness.sh");
    writeFileSync(
      harness,
      `#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="/test-root"
RELEASE_DIR="/test-release"
${buildTargetFn}
build_target bun-linux-x64 flisk-linux-amd64
build_target bun-linux-arm64 flisk-linux-arm64
build_target bun-darwin-x64 flisk-darwin-amd64
build_target bun-darwin-arm64 flisk-darwin-arm64
build_target bun-windows-x64 flisk-windows-amd64.exe
`,
    );
    chmodSync(harness, 0o755);

    const pathSep = process.platform === "win32" ? ";" : ":";
    const proc = spawnSync(bash, [harness.replace(/\\/g, "/")], {
      env: {
        ...process.env,
        PATH: [binDir, process.env.PATH || ""].join(pathSep),
      },
      encoding: "utf8",
    });

    if (proc.status === null && proc.error) {
      t.skip(`bash spawn unavailable on host: ${proc.error.message}`);
      return;
    }

    assert.equal(proc.status, 0, `harness must succeed: ${proc.stderr}`);
    const recorded = readFileSync(recordFile, "utf8").trim().split("\n");
    assert.deepEqual(recorded, [
      "build --compile --target=bun-linux-x64 --outfile=/test-release/flisk-linux-amd64 /test-root/cli/src/cli.ts",
      "build --compile --target=bun-linux-arm64 --outfile=/test-release/flisk-linux-arm64 /test-root/cli/src/cli.ts",
      "build --compile --target=bun-darwin-x64 --outfile=/test-release/flisk-darwin-amd64 /test-root/cli/src/cli.ts",
      "build --compile --target=bun-darwin-arm64 --outfile=/test-release/flisk-darwin-arm64 /test-root/cli/src/cli.ts",
      "build --compile --target=bun-windows-x64 --outfile=/test-release/flisk-windows-amd64.exe /test-root/cli/src/cli.ts",
    ]);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("validate_release_assets detects missing required target assets", (t) => {
  const bash = getBash();
  const workDir = mkdtempSync(join(tmpdir(), "flisk-release-assets-"));

  try {
    const validateFn = extractFunction(SCRIPT_SOURCE, "validate_release_assets");
    const harness = join(workDir, "harness.sh");
    writeFileSync(
      harness,
      `#!/usr/bin/env bash
set -euo pipefail
RELEASE_DIR="${workDir.replace(/\\/g, "/")}"
RELEASE_TAG="v0.2.0"
${validateFn}
validate_release_assets
`,
    );
    chmodSync(harness, 0o755);

    const proc = spawnSync(bash, [harness.replace(/\\/g, "/")], { encoding: "utf8" });
    if (proc.status === null && proc.error) {
      t.skip(`bash spawn unavailable on host: ${proc.error.message}`);
      return;
    }

    assert.equal(proc.status, 1, "must fail when required release asset is missing");
    assert.match(proc.stderr, /Required release asset is missing or empty: flisk-linux-amd64/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("validate_release_assets validates PE MZ signature on Windows binary", (t) => {
  const bash = getBash();
  const workDir = mkdtempSync(join(tmpdir(), "flisk-release-mz-"));

  try {
    const requiredFiles = [
      "flisk-linux-amd64",
      "flisk-linux-arm64",
      "flisk-darwin-amd64",
      "flisk-darwin-arm64",
      "flisk-windows-amd64.exe",
      "flisk-cli-engine.tar.gz",
      "flisk-cli-v0.2.0-binaries.zip",
    ];

    for (const file of requiredFiles) {
      writeFileSync(join(workDir, file), "not-mz-content\n");
    }

    const validateFn = extractFunction(SCRIPT_SOURCE, "validate_release_assets");
    const harness = join(workDir, "harness.sh");
    writeFileSync(
      harness,
      `#!/usr/bin/env bash
set -euo pipefail
RELEASE_DIR="${workDir.replace(/\\/g, "/")}"
RELEASE_TAG="v0.2.0"
${validateFn}
validate_release_assets
`,
    );
    chmodSync(harness, 0o755);

    const proc = spawnSync(bash, [harness.replace(/\\/g, "/")], { encoding: "utf8" });
    if (proc.status === null && proc.error) {
      t.skip(`bash spawn unavailable on host: ${proc.error.message}`);
      return;
    }

    assert.equal(proc.status, 1, "must fail when Windows binary lacks MZ header");
    assert.match(proc.stderr, /Windows binary is not a PE executable \(missing MZ signature\)/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
