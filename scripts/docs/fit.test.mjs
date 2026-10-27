// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
// Unit tests for scripts/docs/fit.mjs: the score matches flisk.sh/fit, and every page links to the pages one answer away.
//   node --test scripts/docs/fit.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT, gaugeSvg, plan, reasons, RUNTIMES, SETUPS, SIZES, score, serviceScore, teamScore, verdict } from "./fit.mjs";

test("the default answers score 82%, as on flisk.sh/fit (Node/TS/Bun, Compose, 8 services, 2 pains, 10 developers)", () => {
  assert.equal(score(DEFAULT.runtime, DEFAULT.setup, DEFAULT.size), 82);
  assert.equal(verdict(82).name, "Strong fit");
});

test("the services and team curves are the website's", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 60].map(serviceScore), [4, 8, 12, 16, 20, 20]);
  assert.deepEqual([1, 4, 5, 9, 10, 29, 30].map(teamScore), [6, 6, 10, 10, 14, 14, 16]);
  assert.deepEqual([75, 74, 45, 44].map((n) => verdict(n).name), ["Strong fit", "Partial fit", "Partial fit", "Not a fit yet"]);
});

test("one service is called out as not a fit, and every page lists the same assumptions", () => {
  const one = reasons(RUNTIMES[0], SETUPS[0], SIZES[0]);
  assert.ok(one.some(([mark, text]) => mark === "no" && /One service/.test(text)));
  assert.ok(one.some(([, text]) => /not measured savings/.test(text)));
});

test("162 pages, each with three bars whose tabs link to existing pages, and a gauge per distinct score", () => {
  const { assets, pages, section } = plan();
  assert.equal(pages.size, RUNTIMES.length * SETUPS.length * SIZES.length);
  for (const [file, text] of pages) {
    const links = [...text.matchAll(/<a href="([^"]+\.md)"><img/g)].map((m) => `docs/fit/${m[1]}`);
    assert.equal(links.length, RUNTIMES.length + SETUPS.length + SIZES.length, file);
    for (const link of links) assert.ok(pages.has(link), `${file} links to missing ${link}`);
    assert.ok(links.includes(file), `${file} links to itself from its selected tabs`);
    const img = /score-(\d+)\.[0-9a-f]{8}\.svg/.exec(text);
    assert.ok(img && [...assets.keys()].some((a) => a.includes(`score-${img[1]}.`)), file);
  }
  assert.match(section, /^<!-- fit · generated[\s\S]*<!-- \/fit -->$/);
  assert.match(section, /score-82\./);
});

test("the gauge fills to the score, honors reduced motion and rests filled without animation", () => {
  const svg = gaugeSvg(82);
  const c = Number(/stroke-dasharray:([\d.]+)/.exec(svg)[1]);
  const rest = Number(/stroke-dashoffset:([\d.]+);animation/.exec(svg)[1]);
  assert.ok(Math.abs(rest - c * 0.18) < 0.05);
  assert.match(svg, /prefers-reduced-motion:reduce/);
  assert.match(svg, /aria-label="82% fit score: Strong fit"/);
});
