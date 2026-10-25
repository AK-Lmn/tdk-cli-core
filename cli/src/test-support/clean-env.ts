// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT

/**
 * `process.env` for a spawned CLI child, without the FLISK_* and TDK_* variables of the host shell. A developer's
 * profile can export them (the CLI still reads the legacy TDK_* names and warns about them), and a test that
 * inherits them gets output the test did not ask for. A test that needs one sets it through its own `env`.
 */
export function cleanEnv(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: Record<string, string | undefined> = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("FLISK_") || key.startsWith("TDK_")) delete env[key];
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  return env as NodeJS.ProcessEnv;
}
