// Copyright (c) 2026 TDK Landscape contributors
// SPDX-License-Identifier: MIT

import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";

/** The command users install and type. */
export const CLI_COMMAND = "flisk";

/** The npm package that installs it. */
export const CLI_PACKAGE = "@flisk-sh/flisk";

/** True when the command can be typed as-is, so `flisk ...` resolves. */
export function isCommandOnPath(
  command: string = CLI_COMMAND,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const path = env.PATH ?? env.Path ?? "";
  for (const dir of path.split(delimiter)) {
    if (!dir) continue;
    const candidates = [
      join(dir, command),
      join(dir, `${command}.cmd`),
      join(dir, `${command}.exe`),
    ];
    for (const candidate of candidates) {
      try {
        accessSync(candidate, constants.X_OK);
        return true;
      } catch {
        // Not on this PATH entry; keep looking.
      }
    }
  }
  return false;
}

/**
 * The next step to print once the machine is ready. An ephemeral run (`npx @flisk-sh/flisk`)
 * never installs the command, so pointing at `flisk ...` there would fail with
 * "command not found"; that case says how to install it instead.
 */
export function readyNextStep(env: NodeJS.ProcessEnv = process.env): string {
  if (isCommandOnPath(CLI_COMMAND, env)) {
    return `Next: ${CLI_COMMAND} project --yes`;
  }
  return (
    `The \`${CLI_COMMAND}\` command is not on PATH (this run is not a global install). ` +
    `Install it with \`npm install -g ${CLI_PACKAGE}\`, then run \`${CLI_COMMAND} project --yes\`.`
  );
}
