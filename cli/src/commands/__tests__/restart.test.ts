// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tilt = vi.hoisted(() => ({
  runTilt: vi.fn(),
}));
const paths = vi.hoisted(() => ({ findProjectRoot: vi.fn() }));
vi.mock("../../utils/tilt.js", () => tilt);
vi.mock("../../utils/paths.js", () => paths);

import { restartCommand } from "../restart.js";

interface Envelope {
  schemaVersion: number;
  data: unknown;
  errors: Array<{ code: string; message: string; suggestions?: string[] }>;
}

let out: string[];
let errors: string[];
let exit: ReturnType<typeof vi.spyOn>;

async function run(...args: string[]): Promise<{ envelope: Envelope; code: number | null }> {
  let code: number | null = null;
  exit.mockImplementation(((c: number) => {
    code ??= c;
    throw new Error("exit");
  }) as never);
  try {
    await restartCommand.parseAsync(["--json", ...args], { from: "user" });
  } catch (error) {
    if ((error as Error).message !== "exit") throw error;
  }
  return { envelope: JSON.parse(out[0] ?? "null"), code };
}

beforeEach(() => {
  out = [];
  errors = [];
  vi.spyOn(console, "log").mockImplementation((line) => void out.push(String(line)));
  vi.spyOn(console, "error").mockImplementation(
    (...parts) => void errors.push(parts.map(String).join(" ")),
  );
  exit = vi.spyOn(process, "exit");
  paths.findProjectRoot.mockReturnValue("/project");
  tilt.runTilt.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("tdk restart", () => {
  it("fails when called outside a TDK project", async () => {
    paths.findProjectRoot.mockReturnValue(null);
    const { envelope, code } = await run("api");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("COMMAND_FAILED");
    expect(envelope.errors[0].message).toContain("Could not find project root");
  });

  it("reports tiltNotInstalled when tilt binary cannot be spawned", async () => {
    tilt.runTilt.mockRejectedValueOnce(new Error("Failed to spawn tilt: ENOENT"));
    const { envelope, code } = await run("api");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("COMMAND_FAILED");
    expect(envelope.errors[0].message).toContain("Tilt CLI is not installed");
  });

  it("reports TILT_NOT_RUNNING when tilt version check fails", async () => {
    tilt.runTilt.mockResolvedValueOnce({ exitCode: 1, stdout: "", stderr: "version check failed" });
    const { envelope, code } = await run("api", "--port=10350");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("TILT_NOT_RUNNING");
  });

  it("reports TILT_NOT_RUNNING when tilt trigger cannot reach Tilt", async () => {
    tilt.runTilt.mockResolvedValueOnce({ exitCode: 0, stdout: "v0.33.0", stderr: "" });
    tilt.runTilt.mockResolvedValueOnce({
      exitCode: 1,
      stdout: "",
      stderr: "dial tcp 127.0.0.1:10350: connect: connection refused",
    });
    const { envelope, code } = await run("api", "--port=10350");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("TILT_NOT_RUNNING");
  });

  it("triggers restart successfully when Tilt is running", async () => {
    tilt.runTilt.mockResolvedValueOnce({ exitCode: 0, stdout: "v0.33.0", stderr: "" });
    tilt.runTilt.mockResolvedValueOnce({ exitCode: 0, stdout: "triggered restart", stderr: "" });
    const { envelope, code } = await run("api");
    expect(code).toBeNull();
    expect(envelope.errors).toEqual([]);
    expect(envelope.data).toEqual({ resource: "api", restarted: true, port: 10350 });
  });
});
