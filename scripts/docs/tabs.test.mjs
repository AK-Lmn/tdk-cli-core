// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
// Unit tests for scripts/docs/tabs.mjs, on a throwaway repo with one tab group.
//   node --test scripts/docs/tabs.test.mjs
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ASSETS, counterSvg, rewrite, run, tabSvg, textWidth } from "./tabs.mjs";

const SPEC = {
  groups: [
    {
      id: "os",
      count: "systems",
      dir: "docs/os",
      back: "README.md#setup",
      hosts: [{ file: "README.md", selected: "mac" }],
      tabs: [
        { slug: "mac", label: "macOS", icon: "laptop", title: "Set up macOS" },
        { slug: "linux", label: "Linux", icon: "server" },
      ],
    },
  ],
};
const README = "# Demo\n\n## Setup\n\n<!-- tabs:os mac -->\n<table>\n<tr><td></td></tr>\n<tr><td>\n\nRun `brew install x`.\n\n</td></tr>\n</table>\n<!-- /tabs:os -->\n\nAfter.\n";

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "flisk-tabs-"));
  mkdirSync(path.join(root, "docs"), { recursive: true });
  writeFileSync(path.join(root, "docs/tabs.json"), JSON.stringify(SPEC));
  writeFileSync(path.join(root, "README.md"), README);
  return root;
}

test("textWidth sums Arial advances and rounds up", () => {
  assert.equal(textWidth("Codex", 14), Math.ceil(((722 + 556 + 556 + 556 + 500) * 14) / 1000));
  assert.ok(textWidth("Codex", 14, 600) > textWidth("Codex", 14, 400));
});

test("a tab has the same width selected and not, and only the selected one is underlined", () => {
  const plain = tabSvg({ label: "Claude Code", icon: "terminal" }, false);
  const selected = tabSvg({ label: "Claude Code", icon: "terminal" }, true);
  const width = (svg) => /width="(\d+)"/.exec(svg)[1];
  assert.equal(width(plain), width(selected));
  assert.match(selected, /class="u"/);
  assert.doesNotMatch(plain, /class="u"/);
  assert.match(selected, /prefers-color-scheme:dark/);
  assert.match(selected, /<title>Claude Code \(selected\)<\/title>/);
  assert.throws(() => tabSvg({ label: "X", icon: "nope" }, false), /unknown icon "nope"/);
  assert.match(counterSvg("3 agents"), /aria-label="3 agents"/);
});

test("rewrite replaces the bar, keeps the panel and reports a block the spec does not list", () => {
  const block = { group: { id: "os" }, embed: { selected: "mac" }, head: "<!-- tabs:os mac NEW -->\n<table>\n<tr><td>BAR</td></tr>\n<tr><td>\n\n", tail: "</td></tr>\n</table>\n<!-- /tabs:os -->" };
  const { text, problems } = rewrite(README, [block], "README.md");
  assert.deepEqual(problems, []);
  assert.match(text, /<tr><td>BAR<\/td><\/tr>\n<tr><td>\n\nRun `brew install x`.\n\n<\/td><\/tr>\n<\/table>\n<!-- \/tabs:os -->\n\nAfter.\n$/);
  assert.equal(rewrite(text, [block], "README.md").text, text, "rewriting twice changes nothing");
  assert.match(rewrite(README, [], "README.md").problems[0], /tabs:os block that docs\/tabs.json does not list/);
  assert.match(rewrite("# Empty\n", [block], "README.md").problems[0], /missing the tabs:os block/);
  const wide = README.replace("Run `brew install x`.", "```bash\n" + "x".repeat(89) + "\n" + "y".repeat(88) + "\n```");
  assert.deepEqual(rewrite(wide, [block], "README.md").problems, [
    "README.md: tabs:os panel has a 89-character code line; GitHub then widens the panel past the page. Keep code lines to 88 (end a shell line with \\)",
  ]);
});

test("write mode produces everything, then --check is clean; a hand edit or a stray image makes it stale", () => {
  const root = fixture();
  try {
    const first = run(root, { write: true });
    assert.deepEqual(first.problems, []);
    assert.ok(first.stale.length > 0);
    assert.deepEqual(run(root, { write: false }), { stale: [], problems: [] });

    const images = readdirSync(path.join(root, ASSETS, "os")).sort();
    assert.equal(images.length, 5, "two tabs in two states plus the counter");
    assert.ok(images.every((name) => /^(mac|linux|count)(-selected)?\.[0-9a-f]{8}\.svg$/.test(name)));

    const readme = readFileSync(path.join(root, "README.md"), "utf8");
    assert.match(readme, /<a href="docs\/os\/mac.md"><img src="docs\/assets\/tabs\/os\/mac-selected\.[0-9a-f]{8}\.svg" alt="macOS \(selected\)"/);
    assert.match(readme, /Run `brew install x`\./);
    const stub = readFileSync(path.join(root, "docs/os/linux.md"), "utf8");
    assert.match(stub, /^# Linux\n\n\[← Back\]\(\.\.\/\.\.\/README\.md#setup\)/);
    assert.match(stub, /<a href="linux.md"><img src="\.\.\/assets\/tabs\/os\/linux-selected\./);

    writeFileSync(path.join(root, "README.md"), readme.replace('alt="Linux"', 'alt="Linux!"'));
    writeFileSync(path.join(root, ASSETS, "os", "old.svg"), "<svg/>");
    const { stale } = run(root, { write: false });
    assert.deepEqual(stale.sort(), ["README.md: tab bar out of date", "docs/assets/tabs/os/old.svg: not produced by docs/tabs.json"]);

    run(root, { write: true });
    assert.equal(existsSync(path.join(root, ASSETS, "os", "old.svg")), false);
    assert.deepEqual(run(root, { write: false }), { stale: [], problems: [] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
