// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempDir, createTempProject } from "../../test-support/index.js";
import { selectNativeRun } from "../up.js";

class Refused extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
const fail = (code: string, message: string): never => {
  throw new Refused(code, message);
};

const native = (name: string, extra: Record<string, unknown> = {}) => ({
  appName: name,
  appType: "backend",
  command: "node server.js",
  schemaVersion: 1,
  ...extra,
});

describe("choosing the native runtime for flisk up", () => {
  it("leaves a project without command services to Docker + Tilt", () => {
    const root = createTempProject({
      stacks: { shop: { api: { appType: "backend", schemaVersion: 1, port: 4400 } } },
    });
    expect(selectNativeRun(undefined, undefined, fail, root)).toBeNull();
  });

  it("adopts a directory of command services that has no .flisk/project.json yet", () => {
    const dir = createTempDir();
    mkdirSync(join(dir, "api"));
    writeFileSync(join(dir, "api", "service.json"), JSON.stringify(native("api")));
    expect(selectNativeRun(undefined, undefined, fail, dir)).toMatchObject({
      projectRoot: dir,
      isNewProject: true,
      selected: [expect.objectContaining({ name: "api" })],
    });
  });

  it("ignores a directory without any service.json nearby", () => {
    expect(selectNativeRun(undefined, undefined, fail, createTempDir())).toBeNull();
  });

  it("brings the dependsOn closure of a stack or --only selection", () => {
    const root = createTempProject({
      files: {
        "api/service.json": JSON.stringify(native("api", { stack: "back" })),
        "web/service.json": JSON.stringify(native("web", { stack: "front", dependsOn: ["api"] })),
        "admin/service.json": JSON.stringify(native("admin", { stack: "front" })),
      },
    });
    const names = (selection: ReturnType<typeof selectNativeRun>) =>
      selection?.selected.map((service) => service.name).sort();
    expect(names(selectNativeRun("front", undefined, fail, root))).toEqual(["admin", "api", "web"]);
    const only = selectNativeRun(undefined, ["web"], fail, root);
    expect(names(only)).toEqual(["api", "web"]);
    expect(only?.dependencies).toEqual(["api"]);
  });

  it("refuses an unknown stack or service by name", () => {
    const root = createTempProject({
      files: { "api/service.json": JSON.stringify(native("api")) },
    });
    expect(() => selectNativeRun("nope", undefined, fail, root)).toThrow(
      expect.objectContaining({ code: "STACK_NOT_FOUND" }),
    );
    expect(() => selectNativeRun(undefined, ["nope"], fail, root)).toThrow(
      expect.objectContaining({ code: "UNKNOWN_SERVICE" }),
    );
  });

  it("refuses an invalid service.json instead of skipping it", () => {
    const root = createTempProject({
      files: {
        "api/service.json": JSON.stringify(native("api")),
        "web/service.json": JSON.stringify(native("web", { image: "nginx" })),
      },
    });
    expect(() => selectNativeRun(undefined, undefined, fail, root)).toThrow(
      /service "web": declares both command and image/,
    );
  });

  it("refuses to mix command services with container services", () => {
    const root = createTempProject({
      files: { "web/service.json": JSON.stringify(native("web")) },
      stacks: { shop: { api: { appType: "backend", schemaVersion: 1, port: 4400 } } },
    });
    expect(() => selectNativeRun(undefined, undefined, fail, root)).toThrow(
      expect.objectContaining({ code: "MIXED_RUNTIME" }),
    );
    // A container-only selection is refused too: Tilt would discover the command service as well.
    expect(() => selectNativeRun("shop", undefined, fail, root)).toThrow(
      expect.objectContaining({ code: "MIXED_RUNTIME" }),
    );
  });
});
