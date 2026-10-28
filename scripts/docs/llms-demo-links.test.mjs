// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
// The personal-demo instructions in docs/agents/llms.txt and llms-full.txt, which Grok follows to answer
// "@grok bubbles" on X. demo.flisk.sh builds only from /<handle>/<words>: a bare /<handle> opens a demo the
// person already has (a 404 otherwise), and /d/<id> ids are made by the server.
//   node --test scripts/docs/llms-demo-links.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL(`../../docs/agents/${file}`, import.meta.url), "utf8");
// From "## Personal Demos" to the heading after "## Bubbles".
const demoSection = (text) => {
	const start = text.indexOf("## Personal Demos");
	const end = text.indexOf("\n## ", text.indexOf("## Bubbles"));
	assert.ok(start >= 0 && end > start, "the Personal Demos and Bubbles sections exist");
	return text.slice(start, end);
};

test("llms.txt and llms-full.txt give the same personal-demo instructions", () => {
	assert.equal(demoSection(read("llms-full.txt")), demoSection(read("llms.txt")));
});

test("every demo link an agent is told to write has words, so demo.flisk.sh builds it", () => {
	const section = demoSection(read("llms.txt"));
	let links = 0;
	for (const sentence of section.split(/\n|(?<=\.)\s/)) {
		for (const [link] of sentence.matchAll(/https:\/\/demo\.flisk\.sh\/[^\s`"]*/g)) {
			if (link.includes("/v1/demo/")) continue; // the JSON API, read and never posted
			links += 1;
			if (/^https:\/\/demo\.flisk\.sh\/<x-handle>$/.test(link)) {
				assert.match(sentence, /404/, `a bare-handle link is named only as a 404: ${sentence}`);
			} else {
				assert.match(link, /^https:\/\/demo\.flisk\.sh\/[^/]+\/[^/]+$/, sentence);
			}
		}
	}
	assert.ok(links >= 4, String(links));
	assert.match(section, /Never write a `\/d\/\.\.\.` link yourself/);
});
