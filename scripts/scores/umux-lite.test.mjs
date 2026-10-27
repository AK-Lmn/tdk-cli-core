// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { BEFORE, BEFORE_CAPABILITIES, BEFORE_EASE, beforeResponse, MIN_N, measure } from "./umux-lite.mjs";

const FORM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.github/ISSUE_TEMPLATE/usability-feedback.yml");

// A usability-feedback issue as the form renders it. `before` is [tool, capabilities, ease] or undefined for an issue
// filed before the "before" questions existed.
const response = (number, capabilities, ease, before) => ({
	number,
	title: "usability: ",
	createdAt: "2026-10-27T09:00:00Z",
	body: [
		`### “Flisk's capabilities meet my requirements”\n\n${capabilities}`,
		`### “Flisk is easy to use”\n\n${ease}`,
		"### How would you feel if you could no longer use Flisk?\n\nVery disappointed",
		"### How did you build it?\n\nWith an AI coding agent",
		...(before
			? [`### ${BEFORE}\n\n${before[0]}`, `### ${BEFORE_CAPABILITIES}\n\n${before[1]}`, `### ${BEFORE_EASE}\n\n${before[2]}`]
			: []),
		"### Comments (optional)\n\n_No response_",
	].join("\n\n"),
});

const ctxWith = (labeled) => ({
	repo: "flisk-sh/flisk",
	gh: (args) => (args.includes("--label") ? labeled : []),
});

test("measure is the mean UMUX-Lite and says when there are too few answers", () => {
	const r = measure(ctxWith([response(1, "7 - Strongly agree", "7 - Strongly agree"), response(2, "4", "4")]));
	assert.equal(r.value, 75);
	assert.equal(r.summary, `n=2, mean 75; fewer than ${MIN_N} answers, too few to trust`);
	assert.deepEqual(r.findings, []);
});

test("no answers is no data, not a zero", () => {
	assert.deepEqual(measure(ctxWith([])), { value: null, summary: "no answers yet" });
});

test("each tool used before is compared over the same people", () => {
	const r = measure(
		ctxWith([
			response(1, "7 - Strongly agree", "7 - Strongly agree", ["Tilt", "4", "1 - Strongly disagree"]),
			response(2, "4", "4", ["Tilt", "4", "4"]),
			response(3, "4", "4", ["Docker Compose", "7 - Strongly agree", "7 - Strongly agree"]),
			response(4, "4", "4", ["Nothing, this was my first time", "_No response_", "_No response_"]),
			response(5, "4", "4"),
		]),
	);
	assert.deepEqual(r.findings, [
		"Tilt: n=2, 37.5 for Tilt vs 75 for Flisk (same people)",
		"Docker Compose: n=1, 100 for Docker Compose vs 50 for Flisk (same people)",
	]);
});

test("a named tool without both ratings is not compared", () => {
	assert.equal(beforeResponse(response(1, "4", "4", ["Tilt", "5", "_No response_"]).body), null);
	assert.deepEqual(beforeResponse(response(1, "4", "4", ["Tilt", "1 - Strongly disagree", "1 - Strongly disagree"]).body), {
		tool: "Tilt",
		score: 0,
	});
});

test("the field labels match the form", () => {
	const labels = YAML.parse(readFileSync(FORM, "utf8")).body.map((b) => b.attributes?.label);
	for (const label of [BEFORE, BEFORE_CAPABILITIES, BEFORE_EASE]) assert.ok(labels.includes(label), label);
});
