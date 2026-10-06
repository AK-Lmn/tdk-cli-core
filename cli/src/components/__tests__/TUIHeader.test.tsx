import { renderToString } from "ink";
import { describe, expect, it } from "vitest";
import { TUIHeader } from "../TUIHeader.js";

const ANSI_SGR = new RegExp([String.fromCharCode(0x1b), "\\[[0-?]*[ -/]*[@-~]"].join(""), "g");
const projectRoot = "C:\\work\\projects\\a-very-long-project-directory";

function renderHeader(terminalWidth: number, resourceCount = 3): string {
  return renderToString(
    <TUIHeader
      projectRoot={projectRoot}
      resourceCount={resourceCount}
      terminalWidth={terminalWidth}
      version="1.3.86"
    />,
    { columns: terminalWidth },
  ).replace(ANSI_SGR, "");
}

function expectLinesToFit(output: string, width: number): void {
  expect(
    Math.max(...output.split(/\r?\n/).map((line) => Array.from(line).length)),
  ).toBeLessThanOrEqual(width);
}

describe("TUIHeader", () => {
  it("shows the version and discovered resource count in the compact layout", () => {
    const output = renderHeader(60);

    expect(output).toContain("TDK v1.3.86");
    expect(output).toContain("3 resources discovered");
    expect(output).toContain(projectRoot);
    expectLinesToFit(output, 60);
  });

  it("uses singular grammar for one discovered resource", () => {
    const output = renderHeader(60, 1);

    expect(output).toContain("1 resource discovered");
    expect(output).not.toContain("1 resources discovered");
    expectLinesToFit(output, 60);
  });

  it("keeps the compact layout at 79 columns", () => {
    const output = renderHeader(79);

    expect(output).toContain("TDK v1.3.86");
    expectLinesToFit(output, 79);
  });
  it("keeps the title, a truncated project root, and resource count within a wide terminal", () => {
    const output = renderHeader(80);

    expect(output).toContain("TDK NEON EDITION v1.3.86");
    expect(output).toContain("3 resources discovered");
    expect(output).toContain("C:\\work\\projects\\");
    expect(output).not.toContain(projectRoot);
    expectLinesToFit(output, 80);
  });

  it("fits a long project path and multi-digit resource count on narrow terminals", () => {
    const output = renderHeader(40, 12);

    expect(output).toContain("12 resources discovered");
    expectLinesToFit(output, 40);
  });

  it("splits the compact title and status when the terminal is very narrow", () => {
    const output = renderHeader(25, 12);

    expect(output).toContain("TDK v1.3.86");
    expect(output).toContain("12 resources discovered");
    expectLinesToFit(output, 25);
  });
});
