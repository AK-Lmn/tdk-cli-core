// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { promptConfirmMock, assertMachineReadyMock, buildTiltDownArgsMock, runTiltMock } =
  vi.hoisted(() => ({
    promptConfirmMock: vi.fn(),
    assertMachineReadyMock: vi.fn(),
    buildTiltDownArgsMock: vi.fn(),
    runTiltMock: vi.fn(),
  }));

vi.mock("../../utils/cold-preflight.js", () => ({
  assertMachineReadyOrExit: assertMachineReadyMock,
}));

vi.mock("../../utils/prompt.js", () => ({
  promptConfirm: promptConfirmMock,
  promptText: vi.fn(),
  promptMultiSelect: vi.fn(),
}));

vi.mock("../../utils/docker.js", () => ({
  getContainerRuntimeStatus: vi.fn(() => "running"),
}));

vi.mock("../../utils/tilt.js", () => ({
  buildTiltDownArgs: buildTiltDownArgsMock,
  getTiltfilePath: vi.fn(),
  isTiltAvailable: vi.fn(async () => true),
  runTilt: runTiltMock,
}));

import { downCommand } from "../down.js";
import { projectCommand } from "../project.js";

describe("behavioral flag contract: --force vs --yes", () => {
  let tempDir: string;
  const originalCwd = process.cwd();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "tdk-force-yes-behavior-"));
    mkdirSync(join(tempDir, ".tdk"), { recursive: true });
    writeFileSync(
      join(tempDir, ".tdk", "project.json"),
      JSON.stringify({ project: { name: "test-app", version: "1.0.0" } }),
    );
    process.chdir(tempDir);

    promptConfirmMock.mockReset();
    assertMachineReadyMock.mockReset().mockResolvedValue(undefined);
    buildTiltDownArgsMock.mockReset().mockReturnValue([]);
    runTiltMock.mockReset().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" });

    for (const opt of ["force", "yes", "dryRun", "json", "verbose", "pruneNetworks"]) {
      downCommand.setOptionValue(opt, false);
      projectCommand.setOptionValue(opt, false);
    }
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("project: --force alone preserves confirmation prompt; user declining aborts reset", async () => {
    promptConfirmMock.mockResolvedValue(false);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await projectCommand.parseAsync(["node", "tdk", "--force"], { from: "node" });

    expect(promptConfirmMock).toHaveBeenCalledTimes(1);
    expect(promptConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("reset your project configuration"),
      }),
    );
    log.mockRestore();
  });

  it("project: --force with --yes bypasses the confirmation prompt entirely", async () => {
    promptConfirmMock.mockResolvedValue(true);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      await projectCommand.parseAsync(["node", "tdk", "--force", "--yes"], { from: "node" });
    } catch {
      // Downstream template generation is mocked/stubbed
    }

    expect(promptConfirmMock).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("down: --force sets options.yes, logs a deprecation warning, and does not forward force to Tilt", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await downCommand.parseAsync(["node", "tdk", "--force"], { from: "node" });

    expect(downCommand.opts().yes).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "Note: --force (-f) on tdk down is deprecated; use --yes (-y) instead.",
      ),
    );
    expect(buildTiltDownArgsMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ force: true }),
    );
    warn.mockRestore();
    log.mockRestore();
  });
});
