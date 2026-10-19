// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureExit } from "../../test-support/index.js";
import { errorFactories, showError, showErrorAndExit, TdkError } from "../errors.js";
import { toMachineError } from "../machine-output.js";

describe("not-found error suggestions", () => {
  it("suggests a close stack name while retaining existing guidance", () => {
    const error = errorFactories.stackNotFound("shp", ["shop", "api"]);

    expect(error.message).toBe('Stack "shp" not found');
    expect(error.suggestions).toEqual([
      'Did you mean "shop"?',
      "Run `tdk stacks` to see available stacks",
      "Run `tdk stack` to assign resources to a stack",
    ]);
  });

  it("suggests a close resource name while retaining existing guidance", () => {
    const error = errorFactories.resourceNotFound("aip", ["api", "web"]);

    expect(error.message).toBe('Resource "aip" not found');
    expect(error.suggestions).toEqual([
      'Did you mean "api"?',
      "Run `tdk resources` to list all resources",
      "Check the resource name spelling",
    ]);
  });

  it("keeps the current suggestions when no candidate is close", () => {
    const error = errorFactories.stackNotFound("missing", ["api", "web"]);

    expect(error.suggestions).toEqual([
      "Run `tdk stacks` to see available stacks",
      "Run `tdk stack` to assign resources to a stack",
    ]);
  });

  it("uses the same suggestion format for unknown services", () => {
    const error = errorFactories.unknownServices(["widgt"], ["widget"]);

    expect(error.message).toBe("Unknown service widgt. Valid names: widget");
    expect(error.exitCode).toBe(2);
    expect(error.suggestions).toEqual(['Did you mean "widget"?']);
  });

  it("pairs each suggestion with its unknown service", () => {
    const error = errorFactories.unknownServices(["widgt", "widge"], ["widget"]);

    expect(error.suggestions).toEqual([
      'Did you mean "widget" for "widgt"?',
      'Did you mean "widget" for "widge"?',
    ]);
  });
  it("preserves usage exit codes in machine-readable errors", () => {
    const error = errorFactories.unknownServices(["widgt"], ["widget"]);

    expect(toMachineError(error).exitCode).toBe(2);
  });

  it("preserves suggestions in machine-readable errors", () => {
    const error = errorFactories.stackNotFound("shp", ["shop"]);

    expect(toMachineError(error).error).toMatchObject({
      code: "COMMAND_FAILED",
      message: 'Stack "shp" not found',
      suggestions: expect.arrayContaining(['Did you mean "shop"?']),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats showError, showErrorAndExit, and TdkError through the unified prefix", () => {
    const lines: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => {
      lines.push(args.map(String).join(" "));
    });
    const { expectExit } = captureExit();

    showError("First failure", "extra context", ["Try again"]);
    expect(lines[0]).toContain("❌ First failure");
    expect(lines[1]).toContain("extra context");
    expect(lines.join("\n")).toContain("💡 Suggestions:");
    expect(lines.join("\n")).toContain("→ Try again");

    lines.length = 0;
    expect(() => showErrorAndExit("Fatal failure", 2, ["Check flags"])).toThrow("process.exit");
    expect(lines[0]).toContain("❌ Fatal failure");
    expect(lines.join("\n")).toContain("→ Check flags");
    expectExit(2);

    lines.length = 0;
    const tdkErr = new TdkError("Domain failure", ["Run tdk doctor"], 1);
    expect(() => tdkErr.exit()).toThrow("process.exit");
    expect(lines[0]).toContain("❌ Domain failure");
    expect(lines.join("\n")).toContain("→ Run tdk doctor");
  });

  it("routes error diagnostics exclusively to stderr and keeps stdout clean for piping", () => {
    const stderr: string[] = [];
    const stdout: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => {
      stderr.push(args.map(String).join(" "));
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation((...args) => {
      stdout.push(args.map(String).join(" "));
    });

    showError("Pipeline broke", "Check pipe destination", ["Verify shell pipeline"]);

    expect(stdout).toHaveLength(0);
    expect(logSpy).not.toHaveBeenCalled();
    expect(stderr.filter((line) => line.includes("❌"))).toHaveLength(1);
    expect(stderr[0]).toContain("❌ Pipeline broke");
    expect(stderr.join("\n")).toContain("Check pipe destination");
  });

  it("emits multiline diagnostics with exactly one error symbol", () => {
    const stderr: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => {
      stderr.push(args.map(String).join(" "));
    });

    showError("Version too old\nFix: run tdk upgrade");

    const prefixes = stderr.flatMap((line) => line.match(/❌/g) ?? []);
    expect(prefixes).toHaveLength(1);
    expect(stderr.join("\n")).toContain("Version too old");
    expect(stderr.join("\n")).toContain("Fix: run tdk upgrade");
  });
});
