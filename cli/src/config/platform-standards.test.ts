// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { STANDARD_PORTS } from "../utils/constants.js";
import { PLATFORM_STANDARDS } from "./platform-standards.js";

describe("platform standards", () => {
  it("keeps the low-level Traefik host generic and uses a non-privileged port", () => {
    expect(PLATFORM_STANDARDS.traefik.defaultHost).toBe("localhost");
    expect(PLATFORM_STANDARDS.traefik.appHost).toBe("app.localhost");
    expect(PLATFORM_STANDARDS.traefik.apiHost).toBe("api.localhost");
    expect(PLATFORM_STANDARDS.traefik.defaultPort).toBe(8080);
  });

  it("pins the Traefik network name and feature description", () => {
    expect(PLATFORM_STANDARDS.traefik.network).toBe("traefik-public");
    expect(PLATFORM_STANDARDS.features.traefik).toBe("HTTP routing");
  });

  it("pins the Traefik standard port to match standalone compose", () => {
    expect(STANDARD_PORTS.traefik).toBe(8080);
    expect(PLATFORM_STANDARDS.ports.traefik).toBe(8080);
  });
});
