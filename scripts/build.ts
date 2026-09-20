/**
 * プロフィールの画像をぜんぶ作る。
 *
 *   bun run scripts/build.ts          # 言語の割合は GitHub API から取り直す
 *   bun run scripts/build.ts --offline # assets/src/languages.json をそのまま使う
 *
 * 見た目の決まりは riml-ds の docs/brand.md（視覚言語「まど」）に合わせている。
 */
import { t, type Theme, DISPLAY, SANS, textWidth, esc } from "./tokens";
import { windowFrame, dotted, pill, cross, motion } from "./parts";

const OUT = "assets";
const SRC = "assets/src";
const USER = "RimlTempest";
const AVATAR_BG = "#fffbf6";

const b64 = async (p: string) =>
  Buffer.from(await Bun.file(p).arrayBuffer()).toString("base64");

const svg = (w: number, h: number, title: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>${motion}
${body}
</svg>
`;

// ── ヘッダー ────────────────────────────────────────────────────────────────
function header(th: Theme, face: string) {
  const W = 904, H = 304;
  const ax = 40, ay = 88, as = 176;
  return svg(
    W + 16,
    H + 16,
    "Riml — つくるのが好きなソフトウェアエンジニア",
    `  <defs>
    <clipPath id="av"><rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="18"/></clipPath>
  </defs>
${windowFrame(th, { w: W, h: H, title: "riml.exe" })}
  <g class="bob">
    <rect x="${ax + 7}" y="${ay + 7}" width="${as}" height="${as}" rx="18" fill="${th.shadow}"/>
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="18" fill="${AVATAR_BG}"/>
    <image x="${ax}" y="${ay}" width="${as}" height="${as}" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,${face}"/>
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="18" fill="none" stroke="${th.brand}" stroke-width="2"/>
  </g>
  <g class="tw">${cross(838, 108, 10, th.brand)}</g>
  <g class="tw2">${cross(868, 136, 6.5, th.brand, 0.7)}</g>
  ${cross(W - 46, H - 42, 11, th.signature)}
  <text x="252" y="152" font-family="${DISPLAY}" font-size="54" font-weight="700" fill="${th.ink}">Riml</text>
  <text x="252" y="182" font-family="${SANS}" font-size="17" fill="${th.muted}">@RimlTempest ・ Tokyo, JP</text>
  ${dotted(th, 252, 856, 204)}
  <text x="252" y="238" font-family="${DISPLAY}" font-size="21" font-weight="700" fill="${th.ink}">つくるのが好きなソフトウェアエンジニア</text>
  <text x="252" y="268" font-family="${SANS}" font-size="16.5" fill="${th.muted}">デザインシステム / Web / Cloudflare / 個人開発</text>`,
  );
}

// ── 道具箱 ──────────────────────────────────────────────────────────────────
const TOOLS: [string, string[]][] = [
  ["言語", ["TypeScript", "Rust", "Python", "Swift", "C#"]],
  ["Web", ["React", "TanStack Start", "Lit", "Astro", "Vue", "Hono"]],
  ["基盤", ["Cloudflare Workers", "D1", "Bun", "GitHub Actions"]],
  ["道具", ["Nix", "Storybook", "Playwright", "changesets", "Claude Code"]],
];

function toolbox(th: Theme) {
  const W = 904, LX = 40, PX = 150, RIGHT = W - 40, GAP = 10, PH = 34, LINE = 46;
  let y = 88;
  let body = "";
  for (const [i, [label, items]] of TOOLS.entries()) {
    const rowTop = y;
    let x = PX;
    for (const item of items) {
      const w = Math.round(textWidth(item, 14.5, true) + 34);
      if (x + w > RIGHT) { x = PX; y += LINE; }
      body += pill(th, { x, y, label: item, w, h: PH });
      x += w + GAP;
    }
    body += `<text x="${LX}" y="${rowTop + 23}" font-family="${DISPLAY}" font-size="16" font-weight="700" fill="${th.muted}">${esc(label)}</text>`;
    y += LINE;
    if (i < TOOLS.length - 1) {
      body += dotted(th, LX, RIGHT, y - 6);
      y += 10;
    }
  }
  const H = y + 18;
  return svg(W + 16, H + 16, "道具箱 — Riml がふだん使う技術", `${windowFrame(th, { w: W, h: H, title: "toolbox" })}\n${body}`);
}

// ── 言語の割合（GitHub の公開リポジトリから数える）──────────────────────────
type Lang = { name: string; weight: number };
type Stats = { langs: Lang[]; repos: number; stars: number; updated: string };

async function fetchStats(): Promise<Stats> {
  const token = process.env.GITHUB_TOKEN;
  const api = async (path: string) => {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": `${USER}-profile`,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`${path}: ${res.status} ${res.statusText}`);
    return res.json();
  };

  const repos = (await api(`/users/${USER}/repos?per_page=100&type=owner&sort=pushed`)) as {
    name: string; fork: boolean; archived: boolean; stargazers_count: number; languages_url: string;
  }[];
  const mine = repos.filter((r) => !r.fork && !r.archived);

  // 1 リポジトリ = 1 票。巨大な生成物のあるリポジトリに全体を持っていかれないように、
  // リポジトリごとに割合を出してから足す。
  const total = new Map<string, number>();
  for (const r of mine) {
    const langs = (await api(`/repos/${USER}/${r.name}/languages`)) as Record<string, number>;
    const bytes = Object.values(langs).reduce((n, b) => n + b, 0);
    if (!bytes) continue;
    for (const [name, b] of Object.entries(langs)) {
      total.set(name, (total.get(name) ?? 0) + b / bytes);
    }
  }

  return {
    langs: [...total].map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight),
    repos: mine.length,
    stars: mine.reduce((n, r) => n + r.stargazers_count, 0),
    updated: new Date().toISOString().slice(0, 10),
  };
}

/** 段は 6 つまで。色だけに頼らないよう、凡例に必ず名前と % を出す（brand.md §7.5）。 */
function languages(th: Theme, s: Stats, palette: readonly string[]) {
  const W = 904, LX = 40, RIGHT = W - 40, BAR_Y = 106, BAR_H = 26, GAP = 4;
  const top = s.langs.slice(0, 5);
  const rest = s.langs.slice(5).reduce((n, l) => n + l.weight, 0);
  const rows = rest > 0 ? [...top, { name: "その他", weight: rest }] : top;
  const sum = rows.reduce((n, l) => n + l.weight, 0) || 1;

  const track = RIGHT - LX - GAP * (rows.length - 1);
  let x = LX;
  let bar = "";
  const shares = rows.map((l) => l.weight / sum);
  rows.forEach((_, i) => {
    const w = Math.max(14, Math.round(track * shares[i]!));
    bar += `<rect x="${x}" y="${BAR_Y}" width="${w}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${palette[i % palette.length]}"/>`;
    x += w + GAP;
  });

  let legend = "";
  const COL = 3, CW = Math.round((RIGHT - LX) / COL);
  rows.forEach((l, i) => {
    const cx = LX + (i % COL) * CW;
    const cy = BAR_Y + BAR_H + 44 + Math.floor(i / COL) * 34;
    legend +=
      `<rect x="${cx}" y="${cy - 11}" width="14" height="14" rx="4" fill="${palette[i % palette.length]}"/>` +
      `<text x="${cx + 24}" y="${cy}" font-family="${SANS}" font-size="15" fill="${th.ink}">${esc(l.name)}</text>` +
      `<text x="${cx + CW - 28}" y="${cy}" text-anchor="end" font-family="${SANS}" font-size="15" font-weight="700" fill="${th.muted}">${(shares[i]! * 100).toFixed(1)}%</text>`;
  });

  const legendBottom = BAR_Y + BAR_H + 44 + (Math.ceil(rows.length / COL) - 1) * 34;
  const factY = legendBottom + 56;
  const H = factY + 26;
  return svg(
    W + 16,
    H + 16,
    `言語の割合 — 公開リポジトリ ${s.repos} 件`,
    `${windowFrame(th, { w: W, h: H, title: "languages" })}
  <text x="${LX}" y="${BAR_Y - 14}" font-family="${DISPLAY}" font-size="16" font-weight="700" fill="${th.muted}">公開リポジトリで使っている言語</text>
  ${bar}
  ${legend}
  ${dotted(th, LX, RIGHT, factY - 32)}
  <text x="${LX}" y="${factY}" font-family="${SANS}" font-size="14.5" fill="${th.muted}">公開リポジトリ ${s.repos} 件 ・ ★ ${s.stars} ・ ${s.updated} 更新</text>
  ${cross(RIGHT - 6, factY - 6, 9, th.signature, 0.9)}`,
  );
}

// ── フッター ────────────────────────────────────────────────────────────────
function footer(th: Theme, face: string) {
  const W = 460, H = 132, bar = 44, ax = 28, ay = bar + 16, as = 56;
  return svg(
    W + 16,
    H + 16,
    "見てくれてありがとう！",
    `  <defs><clipPath id="fa"><rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="14"/></clipPath></defs>
${windowFrame(th, { w: W, h: H, title: "thanks!", bar })}
  <g class="bob">
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="14" fill="${AVATAR_BG}"/>
    <image x="${ax}" y="${ay}" width="${as}" height="${as}" clip-path="url(#fa)" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,${face}"/>
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="14" fill="none" stroke="${th.brand}" stroke-width="2"/>
  </g>
  <text x="${ax + as + 20}" y="${ay + 26}" font-family="${DISPLAY}" font-size="18" font-weight="700" fill="${th.ink}">見てくれてありがとう！</text>
  <text x="${ax + as + 20}" y="${ay + 50}" font-family="${SANS}" font-size="14" fill="${th.muted}">気になるものがあれば覗いていってね</text>
  <g class="tw">${cross(W - 34, bar + 26, 8, th.signature)}</g>`,
  );
}

// ── リンクのピル ────────────────────────────────────────────────────────────
const BADGES: [string, string][] = [
  ["portfolio", "Portfolio"],
  ["x", "X @fande4d"],
  ["lapras", "LAPRAS"],
  ["ds", "riml-ds"],
];

function badge(th: Theme, label: string) {
  const H = 40;
  const W = Math.round(textWidth(label, 15, true) + 44);
  return svg(
    W + 6,
    H + 6,
    label,
    `  <rect x="3" y="3" width="${W}" height="${H}" rx="${H / 2}" fill="${th.shadow}"/>
  <rect x="0" y="0" width="${W}" height="${H}" rx="${H / 2}" fill="${th.accent}"/>
  <text x="${W / 2}" y="${H / 2 + 5.5}" text-anchor="middle" font-family="${DISPLAY}" font-size="15" font-weight="700" fill="${th.onAccent}">${esc(label)}</text>`,
  );
}

// 段の色。面の上で 3:1 以上を保つ段だけを使う（brand.md §2）。
const PALETTE = {
  light: ["#2f4c7e", "#5e7eb4", "#e13d3c", "#04585c", "#434756", "#7b8090"],
  dark: ["#a0bff3", "#5e7eb4", "#ff6b63", "#4eccd3", "#c3bdb3", "#7b8090"],
} as const;

// ── 出力 ────────────────────────────────────────────────────────────────────
const cache = Bun.file(`${SRC}/languages.json`);
let stats: Stats;
if (process.argv.includes("--offline")) {
  stats = await cache.json();
} else {
  try {
    stats = await fetchStats();
    await Bun.write(cache, JSON.stringify(stats, null, 2) + "\n");
  } catch (err) {
    console.warn(`GitHub API を読めなかったので前回の値を使う: ${err}`);
    stats = await cache.json();
  }
}

const [smile, eyes, smileSm] = await Promise.all([
  b64(`${SRC}/riml-smile.jpg`),
  b64(`${SRC}/riml-eyes.jpg`),
  b64(`${SRC}/riml-smile-sm.jpg`),
]);

const files: [string, string][] = [
  ["header-light.svg", header(t.light, smile)],
  ["header-dark.svg", header(t.dark, eyes)],
  ["toolbox-light.svg", toolbox(t.light)],
  ["toolbox-dark.svg", toolbox(t.dark)],
  ["languages-light.svg", languages(t.light, stats, PALETTE.light)],
  ["languages-dark.svg", languages(t.dark, stats, PALETTE.dark)],
  ["footer-light.svg", footer(t.light, smileSm)],
  ["footer-dark.svg", footer(t.dark, smileSm)],
  ...BADGES.flatMap(([slug, label]): [string, string][] => [
    [`badge-${slug}-light.svg`, badge(t.light, label)],
    [`badge-${slug}-dark.svg`, badge(t.dark, label)],
  ]),
];

for (const [name, content] of files) {
  await Bun.write(`${OUT}/${name}`, content);
}
console.log(`${files.length} files -> ${OUT}/ (languages: ${stats.langs.length}, repos: ${stats.repos})`);
