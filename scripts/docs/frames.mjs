// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
// Device frames for the docs tabs (scripts/docs/tabs.mjs). A tab in docs/tabs.json with a "frame" gets a top and a bottom
// image around its panel: a laptop or an old monitor with the window chrome of that system or agent, and a status line. GitHub
// Markdown cannot put text inside an image, so the panel between them stays real, copyable Markdown. The pieces are drawn
// for these docs: no product logos, only the look of each window (title bar, prompt, input box).
//   frame.kind   macos | win95 | ubuntu | omarchy | claude-code | codex | cursor
//   frame.title  window title or working folder
//   frame.left   status text, bottom left (a measured number only when docs/benchmarks records it)
//   frame.right  status text, bottom right
//   frame.prompt what the agent's input box shows
export const WIDTH = 812;

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";
const RETRO = "'MS Sans Serif','Microsoft Sans Serif',Tahoma,Geneva,Verdana,sans-serif";
const UBUNTU = "Ubuntu,'Noto Sans','DejaVu Sans',sans-serif";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const W = WIDTH;

function svg(height, label, body, style = "") {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(label)}">`,
    `<title>${esc(label)}</title>`,
    style ? `<style>${style.replace(/\s+/g, " ").trim()}</style>` : "",
    body.filter(Boolean).join("\n"),
    "</svg>",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

const text = (x, y, value, { font = SANS, size = 12, weight = 400, fill, cls, anchor, extra = "" } = {}) =>
  `<text${cls ? ` class="${cls}"` : ""}${fill ? ` fill="${fill}"` : ""} x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ""} font-family="${font}" font-size="${size}"${weight !== 400 ? ` font-weight="${weight}"` : ""}${extra}>${esc(value)}</text>`;

// A laptop: dark lid with a camera above the window chrome, and below the status line the lid's chin and a silver base.
const BEZEL = "#0e0e10";
const laptopTop = (height) => [
  `<path d="M0 16a16 16 0 0 1 16-16h${W - 32}a16 16 0 0 1 16 16v${height - 16}H0Z" fill="${BEZEL}"/>`,
  `<circle cx="${W / 2}" cy="9" r="2.5" fill="#25262b"/><circle cx="${W / 2}" cy="9" r="1" fill="#3b4a6b"/>`,
];
const laptopBottom = (screen) => [
  `<path d="M0 0h${W}v${screen + 8}a14 14 0 0 1-14 14H14A14 14 0 0 1 0 ${screen + 8}Z" fill="${BEZEL}"/>`,
  `<path d="M0 ${screen + 24}h${W}v6a10 10 0 0 1-10 10H10A10 10 0 0 1 0 ${screen + 30}Z" fill="#c8c9cc"/>`,
  `<rect x="0" y="${screen + 24}" width="${W}" height="2" fill="#e4e5e7"/>`,
  `<path d="M${W / 2 - 56} ${screen + 24}h112a6 6 0 0 1-6 6H${W / 2 - 50}a6 6 0 0 1-6-6Z" fill="#a7a9ad"/>`,
];
const LAPTOP_BOTTOM_EXTRA = 40;
const SIDE = 14; // lid border left and right of the screen

function trafficLights(y, x = SIDE + 20, r = 6) {
  const gap = r * 3.3;
  return ["#ff5f57", "#febc2e", "#28c840"].map((fill, i) => `<circle cx="${x + i * gap}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
}

// Classic grey bevel: light top-left edge, dark bottom-right edge (raised), or the reverse (sunken).
function bevel(x, y, w, h, sunken = false) {
  const [a, b] = sunken ? ["#808080", "#ffffff"] : ["#ffffff", "#404040"];
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c0c0c0"/>`,
    `<path d="M${x} ${y + h}V${y}H${x + w}" fill="none" stroke="${a}" stroke-width="1"/>`,
    `<path d="M${x + w} ${y}V${y + h}H${x}" fill="none" stroke="${b}" stroke-width="1"/>`,
  ].join("");
}

const FRAMES = {
  // An Apple-silicon laptop with a macOS window; follows the reader's light or dark theme.
  macos: {
    top: (f) =>
      svg(
        58,
        `macOS window: ${f.title}`,
        [
          ...laptopTop(58),
          `<rect class="bar" x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="40"/>`,
          trafficLights(38),
          text(W / 2, 43, f.title, { cls: "ttl", size: 13, weight: 600, anchor: "middle" }),
          `<rect class="sep" x="${SIDE}" y="57" width="${W - 2 * SIDE}" height="1"/>`,
        ],
        `.bar{fill:#ececec}.ttl{fill:#4d4d4d}.sep{fill:#d0d0d0}
         @media (prefers-color-scheme:dark){.bar{fill:#2b2b2d}.ttl{fill:#c8c8c8}.sep{fill:#000}}`,
      ),
    bottom: (f) =>
      svg(
        30 + LAPTOP_BOTTOM_EXTRA,
        `${f.left} · ${f.right}`,
        [
          ...laptopBottom(30),
          `<rect class="bar" x="${SIDE}" y="0" width="${W - 2 * SIDE}" height="30"/>`,
          `<circle class="ok" cx="${SIDE + 18}" cy="15" r="4"/>`,
          text(SIDE + 30, 19.5, f.left, { cls: "txt", font: MONO }),
          text(W - SIDE - 14, 19.5, f.right, { cls: "txt", font: MONO, anchor: "end" }),
        ],
        `.bar{fill:#f6f6f6}.txt{fill:#57606a}.ok{fill:#1f883d}
         @media (prefers-color-scheme:dark){.bar{fill:#232325}.txt{fill:#b8b8b8}.ok{fill:#3fb950}}`,
      ),
  },

  // A beige 90s monitor with a navy title bar, bevelled buttons, a status bar and a taskbar. Fixed colors, as it was.
  win95: {
    top: (f) => {
      const bw = 16;
      const btn = (x, glyph) => [bevel(x, 25, bw, 14), glyph(x)].join("");
      return svg(
        66,
        `Retro window: ${f.title}`,
        [
          `<defs><linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#000080"/><stop offset="1" stop-color="#1084d0"/></linearGradient></defs>`,
          `<path d="M0 10a10 10 0 0 1 10-10h${W - 20}a10 10 0 0 1 10 10v56H0Z" fill="#d6cfbb"/>`,
          `<rect x="${SIDE}" y="14" width="${W - 2 * SIDE}" height="52" fill="#c0c0c0"/>`,
          `<rect x="${SIDE + 3}" y="17" width="${W - 2 * SIDE - 6}" height="22" fill="url(#t)"/>`,
          `<rect x="${SIDE + 8}" y="21" width="14" height="14" fill="#c0c0c0" stroke="#000" stroke-width="1"/><rect x="${SIDE + 8}" y="21" width="14" height="4" fill="#000080"/>`,
          text(SIDE + 30, 32.5, f.title, { font: RETRO, size: 12, weight: 700, fill: "#ffffff" }),
          btn(W - SIDE - 60, (x) => `<rect x="${x + 4}" y="34" width="7" height="2" fill="#000"/>`),
          btn(W - SIDE - 43, (x) => `<rect x="${x + 3.5}" y="28.5" width="9" height="7" fill="none" stroke="#000" stroke-width="1"/><rect x="${x + 3.5}" y="28" width="9" height="2" fill="#000"/>`),
          btn(W - SIDE - 24, (x) => `<path d="M${x + 4.5} 28.5l7 7M${x + 11.5} 28.5l-7 7" stroke="#000" stroke-width="1.6"/>`),
          ...["File", "Edit", "View", "Help"].map((m, i) =>
            [
              text(SIDE + 10 + i * 48, 56, m, { font: RETRO, size: 12, fill: "#000" }),
              `<rect x="${SIDE + 10 + i * 48}" y="58" width="7" height="1" fill="#000"/>`,
            ].join(""),
          ),
        ],
      );
    },
    bottom: (f) =>
      svg(
        84,
        `${f.left} · ${f.right}`,
        [
          `<path d="M0 0h${W}v74a10 10 0 0 1-10 10H10A10 10 0 0 1 0 74Z" fill="#d6cfbb"/>`,
          `<rect x="${SIDE}" y="0" width="${W - 2 * SIDE}" height="54" fill="#c0c0c0"/>`,
          bevel(SIDE + 3, 3, W - 2 * SIDE - 200, 18, true),
          text(SIDE + 9, 16, f.left, { font: RETRO, size: 12, fill: "#000" }),
          bevel(W - SIDE - 194, 3, 191, 18, true),
          text(W - SIDE - 188, 16, f.right, { font: RETRO, size: 12, fill: "#000" }),
          `<rect x="${SIDE}" y="25" width="${W - 2 * SIDE}" height="1" fill="#ffffff"/>`,
          bevel(SIDE + 3, 28, 64, 22),
          `<rect x="${SIDE + 8}" y="33" width="13" height="9" fill="#008080" stroke="#000" stroke-width="1"/><rect x="${SIDE + 12}" y="42" width="5" height="2" fill="#000"/><rect x="${SIDE + 10}" y="44" width="9" height="1.5" fill="#000"/>`,
          text(SIDE + 25, 44, "Start", { font: RETRO, size: 12, weight: 700, fill: "#000" }),
          bevel(SIDE + 74, 28, 170, 22, true),
          text(SIDE + 82, 43.5, "Flisk Setup", { font: RETRO, size: 12, weight: 700, fill: "#000" }),
          bevel(W - SIDE - 75, 28, 72, 22, true),
          text(W - SIDE - 39, 43.5, "12:01 AM", { font: RETRO, size: 12, fill: "#000", anchor: "middle" }),
          text(SIDE + 6, 72, "FLISK 95", { font: RETRO, size: 10, weight: 700, fill: "#8d856f", extra: ' letter-spacing="2"' }),
          `<rect x="${W - SIDE - 36}" y="66" width="22" height="6" rx="3" fill="#b9b19b"/><circle cx="${W - SIDE - 48}" cy="69" r="3" fill="#36c24a"/>`,
        ],
      ),
  },

  // A laptop with an Ubuntu terminal: dark header bar with the orange close button, aubergine prompt line.
  ubuntu: {
    top: (f) =>
      svg(
        58,
        `Ubuntu terminal: ${f.title}`,
        [
          ...laptopTop(58),
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="40" fill="#2c2c2c"/>`,
          text(W / 2, 43, f.title, { font: UBUNTU, size: 13, weight: 700, fill: "#f2f2f2", anchor: "middle" }),
          `<circle cx="${W - SIDE - 76}" cy="38" r="9" fill="#3d3d3d"/><rect x="${W - SIDE - 80}" y="38" width="8" height="1.6" fill="#f2f2f2"/>`,
          `<circle cx="${W - SIDE - 50}" cy="38" r="9" fill="#3d3d3d"/><rect x="${W - SIDE - 54}" y="34" width="8" height="8" fill="none" stroke="#f2f2f2" stroke-width="1.4"/>`,
          `<circle cx="${W - SIDE - 24}" cy="38" r="9" fill="#e95420"/><path d="M${W - SIDE - 27.5} 34.5l7 7M${W - SIDE - 20.5} 34.5l-7 7" stroke="#fff" stroke-width="1.6"/>`,
          `<rect x="${SIDE + 14}" y="29" width="18" height="18" rx="4" fill="#3d3d3d"/><path d="M${SIDE + 23} 33v10M${SIDE + 18} 38h10" stroke="#f2f2f2" stroke-width="1.6"/>`,
        ],
      ),
    bottom: (f) => {
      const [user, rest = ""] = f.left.split(":");
      return svg(
        32 + LAPTOP_BOTTOM_EXTRA,
        `${f.left} · ${f.right}`,
        [
          ...laptopBottom(32),
          `<rect x="${SIDE}" y="0" width="${W - 2 * SIDE}" height="32" fill="#300a24"/>`,
          `<text x="${SIDE + 14}" y="21" font-family="${MONO}" font-size="13"><tspan fill="#8ae234" font-weight="700">${esc(user)}</tspan><tspan fill="#fff">:</tspan><tspan fill="#729fcf" font-weight="700">${esc(rest.split("$")[0])}</tspan><tspan fill="#fff">$${esc(rest.split("$")[1] ?? "")}</tspan><tspan fill="#fff">▌</tspan></text>`,
          text(W - SIDE - 14, 21, f.right, { font: MONO, size: 12, fill: "#c4a7bd", anchor: "end" }),
        ],
      );
    },
  },

  // A laptop running Omarchy: Waybar along the top, a Hyprland window with a blue-to-purple border, Tokyo Night colors.
  omarchy: {
    top: (f) =>
      svg(
        70,
        `Omarchy desktop: ${f.title}`,
        [
          ...laptopTop(70),
          `<defs><linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="#7aa2f7"/><stop offset="1" stop-color="#bb9af7"/></linearGradient></defs>`,
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="52" fill="#1a1b26"/>`,
          ...[1, 2, 3, 4, 5].map((n, i) =>
            text(SIDE + 16 + i * 20, 34, String(n), { font: MONO, size: 12, weight: n === 1 ? 700 : 400, fill: n === 1 ? "#7aa2f7" : "#565f89" }),
          ),
          text(W / 2, 34, "Tuesday 00:01", { font: MONO, size: 12, fill: "#c0caf5", anchor: "middle" }),
          text(W - SIDE - 44, 34, "100%", { font: MONO, size: 12, fill: "#9aa5ce", anchor: "end" }),
          `<rect x="${W - SIDE - 38}" y="25" width="18" height="10" rx="2" fill="none" stroke="#9aa5ce" stroke-width="1.2"/><rect x="${W - SIDE - 36}" y="27" width="14" height="6" fill="#9ece6a"/><rect x="${W - SIDE - 19.5}" y="28" width="2" height="4" fill="#9aa5ce"/>`,
          `<rect x="${SIDE + 8}" y="44" width="${W - 2 * SIDE - 16}" height="26" fill="#1a1b26" stroke="url(#h)" stroke-width="2"/>`,
          `<rect x="${SIDE + 7}" y="69" width="${W - 2 * SIDE - 14}" height="2" fill="#1a1b26"/>`,
          text(SIDE + 20, 62, f.title, { font: MONO, size: 12, fill: "#565f89" }),
        ],
      ),
    bottom: (f) =>
      svg(
        40 + LAPTOP_BOTTOM_EXTRA,
        `${f.left} · ${f.right}`,
        [
          ...laptopBottom(40),
          `<defs><linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="#7aa2f7"/><stop offset="1" stop-color="#bb9af7"/></linearGradient></defs>`,
          `<rect x="${SIDE}" y="0" width="${W - 2 * SIDE}" height="40" fill="#1a1b26"/>`,
          `<rect x="${SIDE + 8}" y="-2" width="${W - 2 * SIDE - 16}" height="34" fill="#1a1b26" stroke="url(#h)" stroke-width="2"/>`,
          `<text x="${SIDE + 20}" y="21" font-family="${MONO}" font-size="13"><tspan fill="#7aa2f7" font-weight="700">${esc(f.left.split("❯")[0].trim())}</tspan><tspan fill="#bb9af7"> ❯</tspan><tspan fill="#c0caf5">${esc(f.left.split("❯")[1] ?? "")}</tspan><tspan fill="#c0caf5">▌</tspan></text>`,
          text(W - SIDE - 20, 21, f.right, { font: MONO, size: 12, fill: "#565f89", anchor: "end" }),
        ],
      ),
  },

  // A laptop with a terminal running Claude Code: the welcome box on top, the input box and the shortcut hint below.
  "claude-code": {
    top: (f) =>
      svg(
        112,
        `Claude Code in a terminal, ${f.title}`,
        [
          ...laptopTop(112),
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="94" fill="#1c1c1c"/>`,
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="22" fill="#2a2a2a"/>`,
          trafficLights(29, SIDE + 16, 5),
          text(W / 2, 33, f.title, { font: SANS, size: 11, fill: "#9a9a9a", anchor: "middle" }),
          `<rect x="${SIDE + 14}" y="50" width="420" height="54" rx="6" fill="none" stroke="#d97757" stroke-width="1.2"/>`,
          `<text x="${SIDE + 28}" y="70" font-family="${MONO}" font-size="13"><tspan fill="#d97757">✻ </tspan><tspan fill="#f0f0f0">Welcome to </tspan><tspan fill="#f0f0f0" font-weight="700">Claude Code</tspan><tspan fill="#f0f0f0">!</tspan></text>`,
          text(SIDE + 46, 92, `cwd: ${f.title}`, { font: MONO, size: 12, fill: "#8a8a8a" }),
        ],
      ),
    bottom: (f) =>
      svg(
        62 + LAPTOP_BOTTOM_EXTRA,
        `Claude Code input: ${f.prompt}`,
        [
          ...laptopBottom(62),
          `<rect x="${SIDE}" y="0" width="${W - 2 * SIDE}" height="62" fill="#1c1c1c"/>`,
          `<rect x="${SIDE + 14}" y="6" width="${W - 2 * SIDE - 28}" height="30" rx="6" fill="none" stroke="#6b6b6b" stroke-width="1.2"/>`,
          `<text x="${SIDE + 26}" y="26" font-family="${MONO}" font-size="13"><tspan fill="#9a9a9a">&gt; </tspan><tspan fill="#f0f0f0">${esc(f.prompt)}</tspan></text>`,
          text(SIDE + 26, 53, "? for shortcuts", { font: MONO, size: 12, fill: "#7a7a7a" }),
        ],
      ),
  },

  // A laptop with a terminal running Codex: the header box on top, the composer and its key hints below.
  codex: {
    top: (f) =>
      svg(
        112,
        `Codex in a terminal, ${f.title}`,
        [
          ...laptopTop(112),
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="94" fill="#111111"/>`,
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="22" fill="#262626"/>`,
          trafficLights(29, SIDE + 16, 5),
          text(W / 2, 33, f.title, { font: SANS, size: 11, fill: "#9a9a9a", anchor: "middle" }),
          `<rect x="${SIDE + 14}" y="50" width="330" height="54" rx="4" fill="none" stroke="#5c5c5c" stroke-width="1.2"/>`,
          `<text x="${SIDE + 28}" y="70" font-family="${MONO}" font-size="13"><tspan fill="#9a9a9a">&gt;_ </tspan><tspan fill="#f0f0f0" font-weight="700">OpenAI Codex</tspan></text>`,
          `<text x="${SIDE + 28}" y="92" font-family="${MONO}" font-size="12"><tspan fill="#8a8a8a">directory: </tspan><tspan fill="#d0d0d0">${esc(f.title)}</tspan></text>`,
        ],
      ),
    bottom: (f) =>
      svg(
        62 + LAPTOP_BOTTOM_EXTRA,
        `Codex input: ${f.prompt}`,
        [
          ...laptopBottom(62),
          `<rect x="${SIDE}" y="0" width="${W - 2 * SIDE}" height="62" fill="#111111"/>`,
          `<rect x="${SIDE + 14}" y="6" width="${W - 2 * SIDE - 28}" height="30" fill="#1f1f1f"/>`,
          `<text x="${SIDE + 24}" y="26" font-family="${MONO}" font-size="13"><tspan fill="#f0f0f0" font-weight="700">› </tspan><tspan fill="#f0f0f0">${esc(f.prompt)}</tspan></text>`,
          text(SIDE + 24, 53, "⏎ send   ⌃J newline   ⌃T transcript   ⌃C quit", { font: MONO, size: 12, fill: "#7a7a7a" }),
          text(W - SIDE - 24, 53, "100% context left", { font: MONO, size: 12, fill: "#7a7a7a", anchor: "end" }),
        ],
      ),
  },

  // A laptop with an AI code editor: window title bar and the agent chat header on top, the chat composer below.
  cursor: {
    top: (f) =>
      svg(
        92,
        `AI code editor agent chat, ${f.title}`,
        [
          ...laptopTop(92),
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="74" fill="#181818"/>`,
          `<rect x="${SIDE}" y="18" width="${W - 2 * SIDE}" height="30" fill="#1f1f1f"/>`,
          trafficLights(33),
          text(W / 2, 38, f.title, { font: SANS, size: 12, fill: "#a0a0a0", anchor: "middle" }),
          `<rect x="${SIDE}" y="48" width="${W - 2 * SIDE}" height="1" fill="#2b2b2b"/>`,
          `<rect x="${SIDE + 12}" y="56" width="92" height="26" rx="6" fill="#2a2a2a"/>`,
          text(SIDE + 24, 73.5, "New Chat", { font: SANS, size: 12, weight: 600, fill: "#e6e6e6" }),
          text(W - SIDE - 20, 74, "+   ⟲   ⋯", { font: SANS, size: 14, fill: "#8a8a8a", anchor: "end" }),
        ],
      ),
    bottom: (f) =>
      svg(
        84 + LAPTOP_BOTTOM_EXTRA,
        `Agent chat input: ${f.prompt}`,
        [
          ...laptopBottom(84),
          `<rect x="${SIDE}" y="0" width="${W - 2 * SIDE}" height="84" fill="#181818"/>`,
          `<rect x="${SIDE + 12}" y="6" width="${W - 2 * SIDE - 24}" height="70" rx="10" fill="#202020" stroke="#3a3a3a" stroke-width="1"/>`,
          text(SIDE + 26, 30, f.prompt, { font: SANS, size: 13, fill: "#e6e6e6" }),
          `<rect x="${SIDE + 24}" y="44" width="78" height="22" rx="11" fill="#2d2d2d"/>`,
          text(SIDE + 36, 59, "∞ Agent ⌄", { font: SANS, size: 12, fill: "#d0d0d0" }),
          text(SIDE + 114, 59, "Auto ⌄", { font: SANS, size: 12, fill: "#9a9a9a" }),
          `<circle cx="${W - SIDE - 38}" cy="55" r="11" fill="#e6e6e6"/><path d="M${W - SIDE - 38} 60v-10M${W - SIDE - 42.5} 54.5 ${W - SIDE - 38} 50l4.5 4.5" fill="none" stroke="#181818" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
        ],
      ),
  },
};

export const FRAME_KINDS = Object.keys(FRAMES);

export function frameSvgs(frame, where) {
  const kind = FRAMES[frame.kind];
  if (!kind) throw new Error(`unknown frame "${frame.kind}" for ${where}; known: ${FRAME_KINDS.join(", ")}`);
  return { top: kind.top(frame), bottom: kind.bottom(frame) };
}
