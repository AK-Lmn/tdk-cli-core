// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import {
  classifyUpProgress,
  createUpProgressReporter,
  fetchWithProgress,
  formatUpProgressLine,
  shouldRedrawUpProgress,
} from "../up-progress.js";
import { waitForTiltResourcesReady } from "../up-readiness.js";

const item = (name: string, updateStatus: string, runtimeStatus: string, extra = {}) => ({
  metadata: { name },
  status: { updateStatus, runtimeStatus, ...extra },
});
const json = (...items: unknown[]) => JSON.stringify({ items });

function reporter(redraw: boolean) {
  const out: string[] = [];
  const progress = createUpProgressReporter({
    write: (text) => out.push(text),
    redraw,
    deferred: new Set(),
    columns: 200,
  });
  return { progress, text: () => out.join("") };
}

describe("classifyUpProgress", () => {
  it("maps Tilt statuses to waiting, building, starting, ready and failed", () => {
    const services = classifyUpProgress(
      json(
        item("queued", "pending", "pending"),
        item("api", "in_progress", "pending"),
        item("worker", "ok", "pending"),
        item("db", "ok", "ok", { composeResourceInfo: { healthStatus: "starting" } }),
        item("web", "not_applicable", "ok"),
        item("broken", "error", "none"),
        item("sick", "ok", "ok", { composeResourceInfo: { healthStatus: "unhealthy" } }),
      ),
      new Set(),
    );
    expect(Object.fromEntries(services.map((s) => [s.name, s.state]))).toEqual({
      queued: "waiting",
      api: "building",
      worker: "starting",
      db: "starting",
      web: "ready",
      broken: "failed",
      sick: "failed",
    });
  });

  it("leaves out what readiness does not gate on", () => {
    const services = classifyUpProgress(
      json(
        item("(Tiltfile)", "ok", "not_applicable"),
        item("api", "ok", "ok"),
        item("api-typecheck", "error", "none"),
        item("lazy", "none", "none"),
        { metadata: { name: "other" }, status: { disableStatus: { state: "Disabled" } } },
      ),
      new Set(["lazy"]),
    );
    expect(services.map((s) => s.name)).toEqual(["api"]);
  });
});

describe("formatUpProgressLine", () => {
  it("shows the ready count and the services in each unfinished state", () => {
    expect(
      formatUpProgressLine([
        { name: "api", state: "building" },
        { name: "db", state: "ready" },
        { name: "web", state: "starting" },
      ]),
    ).toBe("1/3 ready · building: api · starting: web");
  });
});

describe("shouldRedrawUpProgress", () => {
  it("redraws only on an interactive terminal outside CI", () => {
    const env = { TERM: "xterm-256color" };
    expect(shouldRedrawUpProgress({ isTTY: true, quiet: false, env })).toBe(true);
    expect(shouldRedrawUpProgress({ isTTY: false, quiet: false, env })).toBe(false);
    expect(shouldRedrawUpProgress({ isTTY: undefined, quiet: false, env })).toBe(false);
    expect(shouldRedrawUpProgress({ isTTY: true, quiet: true, env })).toBe(false);
    expect(shouldRedrawUpProgress({ isTTY: true, quiet: false, env: { CI: "true" } })).toBe(false);
    expect(shouldRedrawUpProgress({ isTTY: true, quiet: false, env: { CI: "false" } })).toBe(true);
    expect(shouldRedrawUpProgress({ isTTY: true, quiet: false, env: { TERM: "dumb" } })).toBe(
      false,
    );
  });
});

describe("createUpProgressReporter", () => {
  it("prints one plain line per state change, with no cursor control", () => {
    const { progress, text } = reporter(false);
    progress.update(json(item("api", "in_progress", "pending"), item("db", "ok", "pending")));
    progress.update(json(item("api", "in_progress", "pending"), item("db", "ok", "pending")));
    progress.update(json(item("api", "ok", "ok"), item("db", "ok", "ok")));
    progress.finish();
    expect(text()).toBe(
      [
        "api: building (0/2 ready)",
        "db: starting (0/2 ready)",
        "api: ready (2/2 ready)",
        "db: ready (2/2 ready)",
        "",
      ].join("\n"),
    );
    // biome-ignore lint/suspicious/noControlCharactersInRegex: asserting there is no escape sequence
    expect(text()).not.toMatch(/[\x1b\r]/);
  });

  it("names a failed service with a pointer to its logs", () => {
    const { progress, text } = reporter(false);
    progress.update(json(item("api", "in_progress", "pending"), item("db", "ok", "ok")));
    progress.update(json(item("api", "error", "none"), item("db", "ok", "ok")));
    expect(text()).toContain("✗ api failed. See its logs: flisk logs -s api (1/2 ready)\n");
  });

  it("redraws one line in place on a terminal and prints a failure on its own line", () => {
    const { progress, text } = reporter(true);
    progress.update(json(item("api", "in_progress", "pending"), item("db", "ok", "ok")));
    progress.update(json(item("api", "error", "none"), item("db", "ok", "ok")));
    progress.finish();
    expect(text()).toBe(
      "\r\x1b[2K⏳ 1/2 ready · building: api" +
        "\r\x1b[2K✗ api failed. See its logs: flisk logs -s api\n" +
        "\r\x1b[2K⏳ 1/2 ready · failed: api" +
        "\r\x1b[2K",
    );
  });

  it("ignores partial JSON and an empty resource list", () => {
    const { progress, text } = reporter(false);
    progress.update("{not json");
    progress.update(json());
    progress.finish();
    expect(text()).toBe("");
  });
});

describe("fetchWithProgress", () => {
  it("reports every Tilt answer the readiness wait polls, until the stack is ready", async () => {
    const { progress, text } = reporter(false);
    const responses = [
      null,
      json(item("api", "in_progress", "pending")),
      json(item("api", "ok", "ok")),
    ];
    const result = await waitForTiltResourcesReady(1, {
      intervalMs: 1,
      deferred: new Set(),
      fetchJson: fetchWithProgress(async () => responses.shift() ?? null, progress),
    });
    expect(result.ready).toBe(true);
    expect(text()).toBe("api: building (0/1 ready)\napi: ready (1/1 ready)\n");
  });
});
