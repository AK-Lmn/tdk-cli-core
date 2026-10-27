// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
// "Does Flisk fit your stack?" in Markdown: the flisk.sh/fit calculator as tabs. GitHub keeps no state, so every answer is a
// page: three tab bars (runtime, today's setup, number of services), and each tab links to the page with that one answer
// changed. 6 x 9 x 3 = 162 pages under docs/fit/, all generated. Each shows an animated score gauge, the verdict and the
// reasons. The README shows the default page between <!-- fit --> and <!-- /fit -->.
// The score is the website's (flisk-sh/website fit/index.html): 2 x runtime + 2 x setup + pains + services + team, out of 100,
// then capped so the verdict cannot contradict the reasons: 1 service stops at 40% (not a fit), 2-4 services at 74% (at most
// partial), and on the website "None, we're happy" stops at 60%. Pains and team size have no tabs here; they stay at the
// website's defaults (onboarding and drift, 10 developers) and every page shows them as assumed, so the default page scores
// the same 82% as flisk.sh/fit. Keep the weights and caps in step with the website.
//   node scripts/docs/fit.mjs [--root <repo dir>]           write everything
//   node scripts/docs/fit.mjs [--root <repo dir>] --check   exit 1 when anything is out of date (D5 in
//                                                           tests/e2e/static/skills-and-docs.sh)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textWidth } from "./metrics.mjs";
import { tabSvg } from "./tabs.mjs";

export const PAGES = "docs/fit";
export const ASSETS = "docs/assets/fit";
const GENERATOR = "scripts/docs/fit.mjs";

// Weights follow what the CLI ships (docs/backend-language-providers.md): Node, TypeScript and Bun are the default generators
// and golden images; Python and Go have backend scaffolds (`--language`); the rest run from your own Dockerfile or a `command`.
export const RUNTIMES = [
  { slug: "node", label: "Node / TS / Bun", name: "Node.js / TypeScript / Bun", value: 10,
    mark: "yes", reason: "Built for it: the default generators and golden images are TypeScript and Bun (Hono, Express, NestJS and more; Vite frontends)." },
  { slug: "python", label: "Python", name: "Python", value: 9,
    mark: "yes", reason: "`flisk resource api --type backend --language python` scaffolds a Python backend; see the [one-backend-python example](../../examples/one-backend-python/README.md)." },
  { slug: "go", label: "Go", name: "Go", value: 9,
    mark: "yes", reason: "`flisk resource api --type backend --language go` scaffolds a Go backend." },
  { slug: "jvm", label: "Java / JVM", name: "Java / JVM", value: 6,
    mark: "partly", reason: "No Java scaffold yet: bring your own Dockerfile, or give each service a `command` and run it without Docker." },
  { slug: "ruby-php", label: "Ruby / PHP", name: "Ruby / PHP", value: 6,
    mark: "partly", reason: "No Ruby or PHP scaffold yet: bring your own Dockerfile, or give each service a `command` and run it without Docker." },
  { slug: "other", label: "Other", name: "Other", value: 5,
    mark: "partly", reason: "Scaffolds exist for Node, Python, Go and Rust; anything else runs from your own Dockerfile or a `command`." },
];

export const SETUPS = [
  { slug: "kubernetes", label: "Kubernetes", name: "Kubernetes (kind / minikube / k3d)", value: 10,
    mark: "yes", reason: "You run a cluster just to develop. Flisk runs the same services on your laptop without one." },
  { slug: "mixed", label: "Scripts & manual steps", name: "A mix of scripts, containers and manual steps", value: 9,
    mark: "yes", reason: "A different setup on every machine is the drift one `service.json` per service removes." },
  { slug: "compose", label: "Docker Compose", name: "Docker Compose", value: 8,
    mark: "yes", reason: "You already think in containers: Flisk writes the Compose file and the Tiltfile for you." },
  { slug: "orchestrator", label: "Tilt / Skaffold", name: "Tilt / Skaffold / Garden / DevSpace", value: 8,
    mark: "yes", reason: "You already use local orchestration: Flisk adds generated service definitions, docs and diagnostics around it." },
  { slug: "container-ui", label: "OrbStack / Rancher", name: "Portainer / Rancher Desktop / OrbStack", value: 7,
    mark: "partly", reason: "A container dashboard shows what runs; Flisk adds repeatable multi-service generation and start-up." },
  { slug: "dev-containers", label: "Dev Containers", name: "Dev Containers (VS Code Remote)", value: 6,
    mark: "partly", reason: "Dev Containers give each developer the same tools; Flisk adds running all the services together." },
  { slug: "cloud-ide", label: "Cloud IDE", name: "Cloud IDE (Gitpod / Codespaces / Coder)", value: 5,
    mark: "partly", reason: "Cloud IDEs solve a different problem; Flisk runs the same stack on your own machine, with no per-seat bill." },
  { slug: "native", label: "Native processes", name: "No containers: native processes", value: 8,
    mark: "yes", reason: "Keep your processes: give each service a `command` and Flisk runs them without Docker. Containers come when you need a database or one gateway URL." },
  { slug: "other", label: "Other", name: "Other or custom setup", value: 5,
    mark: "partly", reason: "A custom setup may fit: compare its orchestration, generated files and diagnostics with Flisk's." },
];

export const SIZES = [
  { slug: "1", label: "1 service", count: 1 },
  { slug: "2-4", label: "2–4 services", count: 3 },
  { slug: "5-plus", label: "5+ services", count: 8 },
];

// The website's defaults for the inputs that have no tabs here.
const PAINS = [
  "`flisk doctor` and `flisk up` are designed to replace a setup wiki. Onboarding time has not been measured on a hiring cohort.",
  "Golden Docker L1–L4 image layers give every developer the same base images.",
];
const PAIN_POINTS = 6;
const TEAM = 10;

export function serviceScore(n) {
  if (n <= 1) return 4;
  if (n < 5) return Math.round(4 + ((n - 1) / 4) * 16);
  return 20;
}

export function teamScore(n) {
  if (n < 5) return 6;
  if (n < 10) return 10;
  if (n < 30) return 14;
  return 16;
}

// The verdict must not contradict the reasons, so some answers cap the score.
export function cap(size) {
  if (size.count <= 1) return { limit: 40, why: "1 service: Flisk is a multi-service tool, so the score stops at 40%." };
  if (size.count < 5) return { limit: 74, why: "Fewer than 5 services: the score stops at 74%, below a strong fit." };
  return null;
}

// The score with its parts, so every page can show how it adds up.
export function score(runtime, setup, size) {
  const parts = [
    { name: "Runtime", answer: runtime.name, points: runtime.value * 2, max: 20 },
    { name: "Today's setup", answer: setup.name, points: setup.value * 2, max: 20 },
    { name: "Pains (assumed)", answer: "Onboarding, environment drift", points: PAINS.length * PAIN_POINTS, max: 24 },
    { name: "Services", answer: size.label, points: serviceScore(size.count), max: 20 },
    { name: "Team (assumed)", answer: `${TEAM} developers`, points: teamScore(TEAM), max: 16 },
  ];
  const raw = parts.reduce((sum, part) => sum + part.points, 0);
  const limit = cap(size);
  const total = Math.max(0, Math.min(100, limit ? Math.min(raw, limit.limit) : raw));
  return { total, raw, parts, cap: limit && raw > limit.limit ? limit : null };
}

export function verdict(total) {
  if (total >= 75) return { name: "Strong fit", line: "Flisk was built for exactly this setup.", tone: "good" };
  if (total >= 45) return { name: "Partial fit", line: "Flisk will help; read the caveats below first.", tone: "warn" };
  return { name: "Not a fit yet", line: "Your setup does not have the pain Flisk solves, yet.", tone: "bad" };
}

const MARK = { yes: "✅", partly: "🟡", no: "❌" };

export function reasons(runtime, setup, size) {
  const out = [];
  out.push([runtime.mark, runtime.reason]);
  out.push([setup.mark, setup.reason]);
  for (const pain of PAINS) out.push(["yes", pain]);
  if (size.count <= 1) out.push(["no", "One service does not need a multi-service orchestrator. Flisk pays off from about 5."]);
  else if (size.count < 5) out.push(["partly", "A few services already benefit, but the sweet spot is 5 or more."]);
  else out.push(["yes", "5 or more services is Flisk's range. CI boots 100 generated `/health` services through one gateway (a fixture, not an app)."]);
  out.push(["yes", `The score assumes ${TEAM} developers. It is arithmetic on your answers, not measured savings.`]);
  return out;
}

const COLORS = {
  good: ["#1a7f37", "#3fb950"],
  warn: ["#9a6700", "#d29922"],
  bad: ["#cf222e", "#f85149"],
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A ring that fills to the score once when the image loads, with the percentage and the verdict. Light and dark aware;
// with reduced motion, or a viewer without CSS animation, it shows the filled ring.
export function gaugeSvg(total) {
  const v = verdict(total);
  const [light, dark] = COLORS[v.tone];
  const r = 62;
  const c = +(2 * Math.PI * r).toFixed(2);
  const rest = +(c * (1 - total / 100)).toFixed(2);
  const pill = textWidth(v.name, 13, 600) + 24;
  const label = `${total}% fit score: ${v.name}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="196" viewBox="0 0 240 196" role="img" aria-label="${esc(label)}">`,
    `<title>${esc(label)}</title>`,
    `<style>.tr{stroke:#d1d9e0}.ar{stroke:${light}}.n{fill:#1f2328}.m{fill:#59636e}.p{fill:${light}}.pt{fill:#ffffff}` +
      `@media (prefers-color-scheme:dark){.tr{stroke:#3d444d}.ar{stroke:${dark}}.n{fill:#f0f6fc}.m{fill:#9198a1}.p{fill:${dark}}.pt{fill:#0d1117}}` +
      `.ar{stroke-dasharray:${c};stroke-dashoffset:${rest};animation:fill 1.4s cubic-bezier(.2,.7,.2,1) both}` +
      `@keyframes fill{from{stroke-dashoffset:${c}}}` +
      `@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>`,
    `<circle class="tr" cx="120" cy="84" r="${r}" fill="none" stroke-width="12"/>`,
    `<circle class="ar" cx="120" cy="84" r="${r}" fill="none" stroke-width="12" stroke-linecap="round" transform="rotate(-90 120 84)"/>`,
    `<text class="n" x="120" y="94" text-anchor="middle" font-family="${FONT}" font-size="34" font-weight="700">${total}%</text>`,
    `<text class="m" x="120" y="114" text-anchor="middle" font-family="${FONT}" font-size="12">fit score</text>`,
    `<rect class="p" x="${120 - pill / 2}" y="164" width="${pill}" height="26" rx="13"/>`,
    `<text class="pt" x="120" y="181.5" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="600">${esc(v.name)}</text>`,
    "</svg>",
    "",
  ].join("\n");
}

const hashed = (base, svg) => `${base}.${createHash("sha256").update(svg).digest("hex").slice(0, 8)}.svg`;
const pageName = (rt, st, sz) => `${rt.slug}-${st.slug}-${sz.slug}.md`;
export const DEFAULT = { runtime: RUNTIMES[0], setup: SETUPS[2], size: SIZES[2] };

// Everything the calculator produces: images, pages, and the README section.
export function plan() {
  const assets = new Map();
  const image = (base, svg) => {
    const file = `${ASSETS}/${hashed(base, svg)}`;
    assets.set(file, svg);
    return { file, width: Number(/width="(\d+)"/.exec(svg)[1]) };
  };
  const tabImages = new Map();
  for (const [dim, options] of [["runtime", RUNTIMES], ["setup", SETUPS], ["size", SIZES]]) {
    for (const option of options) {
      for (const selected of [false, true]) {
        tabImages.set(`${dim}:${option.slug}:${selected}`, image(`${dim}-${option.slug}${selected ? "-selected" : ""}`, tabSvg(option, selected)));
      }
    }
  }
  const gauges = new Map();
  const gauge = (total) => {
    if (!gauges.has(total)) gauges.set(total, image(`score-${total}`, gaugeSvg(total)));
    return gauges.get(total);
  };

  // The three bars, from the folder of the page that shows them.
  const bars = (from, at) => {
    const rel = (to) => path.posix.relative(from, to);
    const bar = (dim, options, title) => {
      const tabs = options.map((option) => {
        const selected = option.slug === at[dim].slug;
        const pick = { ...at, [dim]: option };
        const img = tabImages.get(`${dim}:${option.slug}:${selected}`);
        const alt = selected ? `${option.label} (selected)` : option.label;
        return `<a href="${rel(`${PAGES}/${pageName(pick.runtime, pick.setup, pick.size)}`)}"><img src="${rel(img.file)}" alt="${esc(alt)}" width="${img.width}" height="48" align="top"></a>`;
      });
      return `<tr><td><sub><b>${title}</b></sub><br>${tabs.join("")}</td></tr>`;
    };
    return [
      "<table>",
      bar("runtime", RUNTIMES, "1. Primary runtime"),
      bar("setup", SETUPS, "2. How do you run things locally today?"),
      bar("size", SIZES, "3. Services running at once"),
      "</table>",
    ].join("\n");
  };

  const result = (from, at) => {
    const s = score(at.runtime, at.setup, at.size);
    const total = s.total;
    const v = verdict(total);
    const g = gauge(total);
    return {
      total,
      gauge: `<p align="center"><img src="${path.posix.relative(from, g.file)}" alt="${total}% fit score: ${v.name}" width="${g.width}"></p>`,
      verdict: `**${v.name}.** ${v.line}`,
      breakdown: [
        "**How the score adds up**",
        "",
        "| | Your answer | Points |",
        "| --- | --- | --- |",
        ...s.parts.map((part) => `| ${part.name} | ${part.answer} | ${part.points} / ${part.max} |`),
        ...(s.cap ? [`| Sum | | ${s.raw} / 100 |`, `| **Cap** | ${s.cap.why} | **${s.total}** |`] : []),
        `| **Score** | | **${s.total}%** |`,
      ].join("\n"),
    };
  };

  const pages = new Map();
  for (const runtime of RUNTIMES) {
    for (const setup of SETUPS) {
      for (const size of SIZES) {
        const at = { runtime, setup, size };
        const r = result(PAGES, at);
        pages.set(`${PAGES}/${pageName(runtime, setup, size)}`, [
          `<!-- Generated by ${GENERATOR}; edit the generator, not this page. -->`,
          "# Does Flisk fit your stack?",
          "",
          "[← Back to the README](../../README.md#does-flisk-fit-your-stack)",
          "",
          `**Your answers:** ${runtime.name} · ${setup.name} · ${size.label}. Click a tab to change one; the score follows.`,
          "",
          bars(PAGES, at),
          "",
          r.gauge,
          "",
          r.verdict,
          "",
          ...reasons(runtime, setup, size).map(([mark, text]) => `- ${MARK[mark]} ${text}`),
          "",
          r.breakdown,
          "",
          "Same formula as [flisk.sh/fit](https://flisk.sh/fit/). Pains and team size have no tabs here, so they stay at the website's defaults (marked assumed); change them on the website. The caps keep the verdict in line with the reasons.",
          "",
          r.total >= 45 ? "**Next:** [install Flisk](../install/npm.md) and [pick how to start](../../README.md#quick-start)." : "**Next:** [see what Flisk generates](../generated-files.md), or [run your services without Docker](../run-without-docker.md).",
          "",
        ].join("\n"));
      }
    }
  }

  const home = result(".", DEFAULT);
  const section = [
    "<!-- fit · generated by scripts/docs/fit.mjs; edit the generator, not this section -->",
    "Answer three questions by clicking the tabs. Each answer opens a page with your score and the reasons.",
    "",
    bars(".", DEFAULT),
    "",
    home.gauge,
    "",
    `${home.verdict} [Why this score →](${PAGES}/${pageName(DEFAULT.runtime, DEFAULT.setup, DEFAULT.size)}) · [Full calculator on flisk.sh](https://flisk.sh/fit/)`,
    "<!-- /fit -->",
  ].join("\n");

  return { assets, pages, section };
}

function filesIn(dir) {
  return existsSync(dir) ? readdirSync(dir).map((name) => path.join(dir, name)) : [];
}

// Returns what is out of date; with write, fixes it first.
export function run(root, { write }) {
  const { assets, pages, section } = plan();
  const stale = [];
  const problems = [];
  const want = new Map([...assets, ...pages]);
  for (const dir of [ASSETS, PAGES]) {
    for (const full of filesIn(path.join(root, dir))) {
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (want.has(rel)) continue;
      stale.push(`${rel}: not produced by ${GENERATOR}`);
      if (write) rmSync(full);
    }
  }
  for (const [rel, content] of want) {
    const full = path.join(root, rel);
    if (existsSync(full) && readFileSync(full, "utf8") === content) continue;
    stale.push(`${rel}: missing or out of date`);
    if (write) {
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
  }
  const readme = path.join(root, "README.md");
  const text = readFileSync(readme, "utf8");
  const match = /<!-- fit[ \n][\s\S]*?<!-- \/fit -->/.exec(text);
  if (!match) problems.push("README.md: no <!-- fit --> ... <!-- /fit --> section");
  else if (match[0] !== section) {
    stale.push("README.md: fit section out of date");
    if (write) writeFileSync(readme, text.replace(match[0], section));
  }
  return { stale, problems };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const rootAt = args.indexOf("--root");
  const root = path.resolve(rootAt >= 0 ? args[rootAt + 1] : path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
  const check = args.includes("--check");
  const { stale, problems } = run(root, { write: !check });
  for (const line of problems) console.error(`FAIL ${line}`);
  if (check && stale.length > 0) {
    console.error(`${stale.length} generated fit file(s) out of date:\n${stale.slice(0, 20).map((s) => `  ${s}`).join("\n")}`);
    console.error(`Run: node ${GENERATOR}`);
  } else if (!check && stale.length > 0) {
    console.log(`updated ${stale.length} fit file(s)`);
  }
  if (problems.length > 0 || (check && stale.length > 0)) process.exit(1);
  if (check) console.log(`fit calculator up to date (${PAGES}, ${ASSETS})`);
}
