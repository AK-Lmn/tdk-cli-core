// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

import { formatProgress, type StackProgress } from "../stack-progress.js";

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
