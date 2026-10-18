// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureExit } from "../../test-support/index.js";
import {
  errorFactories,
  runCommand,
  showError,
  showErrorAndExit,
  TdkError,
} from "../../utils/errors.js";
import {
  createKebabCaseValidator,
  isValidPort,
  validateResourceName,
} from "../../utils/validation.js";
import { DRIFT_EXIT_CODE, nativeWindowsUpRefusal } from "../up.js";

describe("error handling", () => {
  describe("resource name validation", () => {
    it("should validate resource names using actual validation utility", () => {
      expect(validateResourceName("my-service")).toEqual({ valid: true });
      expect(validateResourceName("service123")).toEqual({ valid: true });
      expect(validateResourceName("api-gateway")).toEqual({ valid: true });

      expect(validateResourceName("")).toEqual({
        valid: false,
        error: "Resource name is required",
      });
      expect(validateResourceName("MyService")).toEqual({
        valid: false,
        error:
          'Resource name "MyService" is not valid. Use lowercase letters, numbers, and hyphens only, e.g. "my-service".',
      });
      expect(validateResourceName("my_service")).toEqual({
        valid: false,
        error:
          'Resource name "my_service" is not valid. Use lowercase letters, numbers, and hyphens only, e.g. "my-service".',
      });
    });

    it("should create kebab-case validators for different contexts", () => {
      const resourceValidator = createKebabCaseValidator("resource");
      const stackValidator = createKebabCaseValidator("stack");

      expect(resourceValidator("my-resource")).toBe(true);
      expect(resourceValidator("")).toBe("Resource name is required");
      expect(resourceValidator("MyResource")).toBe(
        'Resource name "MyResource" is not valid. Use lowercase letters, numbers, and hyphens only, e.g. "my-service".',
      );

      expect(stackValidator("my-stack")).toBe(true);
      expect(stackValidator("")).toBe("Stack name is required");
      expect(stackValidator("MyStack")).toBe(
        'Stack name "MyStack" is not valid. Use lowercase letters, numbers, and hyphens only, e.g. "my-stack".',
      );
    });
  });

  describe("port assignment", () => {
    it("should validate port is within valid range using isValidPort", () => {
      // Valid ports (isValidPort allows ports 1-65535, not just 1024+)
      expect(isValidPort(3000)).toBe(true);
      expect(isValidPort(8080)).toBe(true);
      expect(isValidPort(1024)).toBe(true);
      expect(isValidPort(1)).toBe(true); // Valid per isValidPort (just > 0)
      expect(isValidPort(65535)).toBe(true);

      // Invalid ports
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
    });
  });

  describe("stack name validation", () => {
    it("should validate stack name format using createKebabCaseValidator", () => {
      const validNames = ["main", "api-services", "v1-stack", "test123"];

      const invalidNames = ["My Stack", "my_stack", "MyStack", ""];

      const stackValidator = createKebabCaseValidator("stack");

      for (const name of validNames) {
        expect(stackValidator(name)).toBe(true);
      }

      for (const name of invalidNames) {
        expect(typeof stackValidator(name)).toBe("string");
      }
    });
  });

  describe("unified error formatting and exit codes", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("formats showError and showErrorAndExit with the standard ❌ prefix", () => {
      const stderr: string[] = [];
      vi.spyOn(console, "error").mockImplementation((...args) => {
        stderr.push(args.map(String).join(" "));
      });
      const { expectExit } = captureExit();

      showError("Unsupported shell: fish-custom");
      expect(stderr[0]).toContain("❌ Unsupported shell: fish-custom");

      stderr.length = 0;
      expect(() => showErrorAndExit("--port must be a valid port number", 2)).toThrow(
        "process.exit",
      );
      expect(stderr[0]).toContain("❌ --port must be a valid port number");
      expectExit(2);
    });

    it("routes unexpected and TdkError failures in runCommand through showError", async () => {
      const stderr: string[] = [];
      vi.spyOn(console, "error").mockImplementation((...args) => {
        stderr.push(args.map(String).join(" "));
      });
      const { exit } = captureExit();

      await expect(
        runCommand(async () => {
          throw new Error(".tdk/project.json not found");
        }),
      ).rejects.toThrow("process.exit");
      expect(stderr[0]).toContain("❌ .tdk/project.json not found");
      expect(exit).toHaveBeenCalledWith(1);

      stderr.length = 0;
      exit.mockClear();
      await expect(
        runCommand(async () => {
          throw errorFactories.unknownServices(["bad-svc"], ["orders-api"]);
        }),
      ).rejects.toThrow("process.exit");
      expect(stderr[0]).toContain("❌ Unknown service bad-svc. Valid names: orders-api");
      expect(exit).toHaveBeenCalledWith(2);

      stderr.length = 0;
      exit.mockClear();
      await expect(
        runCommand(async () => {
          throw new TdkError("Custom failure", ["Try 'tdk doctor'"], 1);
        }),
      ).rejects.toThrow("process.exit");
      expect(stderr[0]).toContain("❌ Custom failure");
      expect(stderr.join("\n")).toContain("→ Try 'tdk doctor'");
      expect(exit).toHaveBeenCalledWith(1);
    });

    it("keeps DRIFT_EXIT_CODE as 2 for tdk up drift gate", () => {
      expect(DRIFT_EXIT_CODE).toBe(2);
    });

    it("exits with code 1 on native Windows startup refusal", () => {
      const refusal = nativeWindowsUpRefusal("win32", undefined);
      expect(refusal).toBeDefined();

      const stderr: string[] = [];
      vi.spyOn(console, "error").mockImplementation((...args) => {
        stderr.push(args.map(String).join(" "));
      });
      const { expectExit } = captureExit();

      expect(() => showErrorAndExit(refusal!)).toThrow("process.exit");
      expect(stderr[0]).toContain("❌");
      expectExit(1);
    });
  });
});
