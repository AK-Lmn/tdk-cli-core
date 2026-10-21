// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

import { formatProgress, readStackProgress, type StackProgress } from "../stack-progress.js";

const base: StackProgress = {
  ready: 3,
  building: 2,
  pending: 4,
  failed: 0,
  total: 9,
  working: [],
  broken: [],
  elapsed: 75,
};

describe("formatProgress", () => {
  it("counts what is ready, building, queued and failed", () => {
    const line = formatProgress(base);
    expect(line).toContain("3/9 resources ready");
    expect(line).toContain("1m 15s");
    expect(line).toContain("2 building");
    expect(line).toContain("4 queued");
  });

  it("mentions the failures", () => {
    expect(formatProgress({ ...base, failed: 1 })).toContain("1 failed");
  });

  it("shows seconds before the first minute", () => {
    expect(formatProgress({ ...base, elapsed: 8 })).toContain("8s");
  });
});

describe("readStackProgress", () => {
  const items = [
    { metadata: { name: "traefik" }, status: { updateStatus: "ok", runtimeStatus: "ok" } },
    { metadata: { name: "floor-app" }, status: { updateStatus: "ok", runtimeStatus: "ok" } },
    {
      metadata: { name: "kitchen-api" },
      status: { updateStatus: "pending", runtimeStatus: "pending" },
    },
    {
      metadata: { name: "menu-api" },
      status: { updateStatus: "building", runtimeStatus: "pending" },
    },
    {
      metadata: { name: "kitchen-worker" },
      status: {
        updateStatus: "error",
        runtimeStatus: "error",
        buildHistory: [{ error: "compose failed" }],
      },
    },
  ];

  it("counts the resources by state", async () => {
    const progress = await readStackProgress(10350, async () => JSON.stringify({ items }));
    expect(progress?.ready).toBe(2);
    expect(progress?.pending).toBe(1);
    expect(progress?.building).toBe(1);
    expect(progress?.failed).toBe(1);
    expect(progress?.total).toBe(5);
  });

  it("names the resources that are still working and the ones that broke", async () => {
    const progress = await readStackProgress(10350, async () => JSON.stringify({ items }));
    expect(progress?.working.map((entry) => entry.name)).toEqual(["kitchen-api", "menu-api"]);
    expect(progress?.broken[0]?.name).toBe("kitchen-worker");
    expect(progress?.broken[0]?.message).toContain("compose failed");
  });

  it("returns nothing when Tilt does not answer", async () => {
    expect(await readStackProgress(10350, async () => null)).toBeUndefined();
  });

  it("returns nothing for output that is not JSON", async () => {
    expect(await readStackProgress(10350, async () => "not json")).toBeUndefined();
  });
});
