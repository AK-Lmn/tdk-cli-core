// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const paths = vi.hoisted(() => ({ findProjectRoot: vi.fn() }));
const discovery = vi.hoisted(() => ({
  createDiscoveryContext: vi.fn(),
}));

vi.mock("../../utils/paths.js", () => paths);
vi.mock("../../utils/discovery-context.js", () => discovery);

import { agentCommand } from "../agent.js";

interface Envelope {
  schemaVersion: number;
  data: unknown;
  errors: Array<{ code: string; message: string }>;
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
    await agentCommand.parseAsync(["sessions", ...args, "--json"], { from: "user" });
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
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("tdk agent sessions", () => {
  it("fails when called outside a TDK project", async () => {
    paths.findProjectRoot.mockReturnValue(null);
    const { envelope, code } = await run("bot");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("COMMAND_FAILED");
  });

  it("reports UNKNOWN_RESOURCE when the resource does not exist in the project", async () => {
    discovery.createDiscoveryContext.mockReturnValue({ resources: [] });
    const { envelope, code } = await run("nonexistent");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("UNKNOWN_RESOURCE");
  });

  it("reports NOT_AN_AGENT when the resource exists but is not an agent", async () => {
    discovery.createDiscoveryContext.mockReturnValue({
      resources: [{ name: "api", appType: "backend", port: 4000 }],
    });
    const { envelope, code } = await run("api");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("NOT_AN_AGENT");
  });

  it("reports AGENT_NOT_RUNNING when agent fails to respond or times out", async () => {
    discovery.createDiscoveryContext.mockReturnValue({
      resources: [{ name: "bot", type: "agent", port: 4001 }],
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));
    const { envelope, code } = await run("bot");
    expect(code).toBe(1);
    expect(envelope.errors[0].code).toBe("AGENT_NOT_RUNNING");
  });

  it("fetches agent sessions and returns structured session payload", async () => {
    discovery.createDiscoveryContext.mockReturnValue({
      resources: [{ name: "bot", type: "agent", port: 4001 }],
    });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ sessions: ["session-1", "session-2"] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { envelope, code } = await run("bot", "--session-id=session-1");
    expect(code).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:4001/session",
      expect.objectContaining({
        method: "GET",
        headers: { "x-session-id": "session-1" },
      }),
    );
    expect(envelope.errors).toEqual([]);
    expect(envelope.data).toEqual({
      agent: "bot",
      port: 4001,
      session: { sessions: ["session-1", "session-2"] },
    });
  });
});
