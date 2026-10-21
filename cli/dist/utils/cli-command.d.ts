/** The command users install and type. */
export declare const CLI_COMMAND = "flisk";
/** The npm package that installs it. */
export declare const CLI_PACKAGE = "@flisk-sh/flisk";
/** The package the CLI was published under before the rename. It owns the old `tdk` command. */
export declare const LEGACY_PACKAGE = "@tdk-landscape/tdk-cli-core";
/** True when the command can be typed as-is, so `flisk ...` resolves. */
export declare function isCommandOnPath(command?: string, env?: NodeJS.ProcessEnv): boolean;
/**
 * The next step to print once the machine is ready. An ephemeral run (`npx @flisk-sh/flisk`)
 * never installs the command, so pointing at `flisk ...` there would fail with
 * "command not found"; that case says how to install it instead.
 */
export declare function readyNextStep(env?: NodeJS.ProcessEnv): string;
