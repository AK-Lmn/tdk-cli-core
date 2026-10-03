import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const composeStar = JSON.stringify(
  join(repoRoot, "engine", "topologies", "platform", "docker", "compose", "compose.star"),
);

const hasTilt = spawnSync("tilt", ["version"], { encoding: "utf-8" }).status === 0;
if (process.env.TDK_REQUIRE_TILT === "1" && !hasTilt) {
  throw new Error("Tilt is required for Starlark generator tests in CI.");
}

const temporaryDirs: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

/** Evaluates a Tiltfile. A failed `fail(...)` check makes tilt exit non-zero and puts the message in stderr. */
function expectPasses(source: string) {
  const directory = mkdtempSync(join(tmpdir(), "tdk-stack-routers-"));
  temporaryDirs.push(directory);
  const tiltfile = join(directory, "Tiltfile");
  writeFileSync(tiltfile, source);
  const result = spawnSync("tilt", ["alpha", "tiltfile-result", "-f", tiltfile], {
    cwd: repoRoot,
    encoding: "utf-8",
    timeout: 25000,
  });
  expect(`${result.stdout}${result.stderr}`, "Starlark check failed").not.toMatch(/Error in fail/);
  expect(result.status, result.stderr).toBe(0);
}

/** Generates the Compose entry for `orders-api` in stack `shop`, with `extra` merged into its manifest. */
const entryFor = (extra: string) => `
load(${composeStar}, 'generate_backend_compose_entry')
manifest = {'appType': 'backend', 'stack': 'shop', 'port': 4000, 'appName': 'orders-api', '_resource_path': 'services/shop/orders-api'}
manifest.update(${extra})
entry = generate_backend_compose_entry('services/shop', 'orders-api', {'name': 'orders-api', '_resource_path': 'services/shop/orders-api'}, manifest)
`;

describe.skipIf(!hasTilt)("stack-scoped Traefik routers (#392)", { timeout: 40_000 }, () => {
  it("keeps the stack routers when the stack has one backend", () => {
    expectPasses(`${entryFor("{'_stackBackendCount': 1}")}
if 'routers.orders-api.rule=' not in entry: fail('missing the stack router')
if 'routers.orders-api-management.rule=' not in entry: fail('missing the -management router')
if 'routers.orders-api-project.rule=' not in entry: fail('missing the -project router')
`);
  });

  it("keeps the stack routers when nothing says how many backends share the stack (old callers)", () => {
    expectPasses(`${entryFor("{}")}
if 'routers.orders-api.rule=' not in entry: fail('missing the stack router')
if 'routers.orders-api-management.rule=' not in entry: fail('missing the -management router')
`);
  });

  it("drops the shared stack routers but keeps the per-backend route when two backends share a stack", () => {
    expectPasses(`${entryFor("{'_stackBackendCount': 2}")}
if 'routers.orders-api.rule=' in entry: fail('the shared stack router is still emitted')
if 'routers.orders-api-management.rule=' in entry: fail('the shared -management router is still emitted')
if 'routers.orders-api-project.rule=' not in entry: fail('the per-backend -project router is gone')
if 'PathPrefix(\`/api/shop-management\`)' in entry: fail('the shared /api/shop-management path is still routed')
if 'loadbalancer.server.port=4000' not in entry: fail('the service labels are gone, so the -project router has nothing to route to')
if 'routers.orders-api-project.service=orders-api' not in entry: fail('the -project router lost its service')
`);
  });

  it("keeps an explicit traefik.pathPrefix even when the stack has two backends", () => {
    expectPasses(`${entryFor("{'_stackBackendCount': 2, 'traefik': {'pathPrefix': '/api/orders-legacy'}}")}
if 'routers.orders-api.rule=' not in entry: fail('an explicit pathPrefix should keep its router')
if '/api/orders-legacy' not in entry: fail('the explicit pathPrefix is missing')
`);
  });
});
