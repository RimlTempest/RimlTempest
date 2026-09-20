/**
 * プロフィールの画像をぜんぶ作る。
 *
 *   bun run scripts/build.ts           # 数字を GitHub から取り直して作る
 *   bun run scripts/build.ts --offline # assets/src/stats.json の値のまま作る
 *
 * 文字は content.toml にある。見た目の決まりは riml-ds の docs/brand.md
 * （視覚言語「まど」）に合わせている。
 */
import { t, type Theme, DISPLAY, SANS, textWidth, fit, esc } from "./tokens";
import { windowFrame, dotted, pill, cross, motion } from "./parts";
import content from "../content.toml";

type Content = {
  header: {
    window: string; name: string; meta: string; tagline: string; sub: string; alt: string;
    face_light: string; face_dark: string;
  };
  toolbox: { window: string; alt: string; rows: { label: string; items: string[] }[] };
  stats: {
    window: string; alt: string; heading: string; as_of: string; other: string;
    tile_contributions: string; tile_active_days: string; tile_repos: string; tile_followers: string;
  };
  footer: { window: string; alt: string; line1: string; line2: string; face: string };
  badges: { slug: string; label: string }[];
};

const c = content as Content;

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
  const TX = 252, TW = 856 - TX; // 文字が使える幅
  const h = c.header;
  return svg(
    W + 16,
    H + 16,
    h.alt,
    `  <defs>
    <clipPath id="av"><rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="18"/></clipPath>
  </defs>
${windowFrame(th, { w: W, h: H, title: h.window })}
  <g class="bob">
    <rect x="${ax + 7}" y="${ay + 7}" width="${as}" height="${as}" rx="18" fill="${th.shadow}"/>
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="18" fill="${AVATAR_BG}"/>
    <image x="${ax}" y="${ay}" width="${as}" height="${as}" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,${face}"/>
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="18" fill="none" stroke="${th.brand}" stroke-width="2"/>
  </g>
  <g class="tw">${cross(838, 108, 10, th.brand)}</g>
  <g class="tw2">${cross(868, 136, 6.5, th.brand, 0.7)}</g>
  ${cross(W - 46, H - 42, 11, th.signature)}
  <text x="${TX}" y="152" font-family="${DISPLAY}" font-size="${fit(h.name, TW, 54, { bold: true, where: "header.name" })}" font-weight="700" fill="${th.ink}">${esc(h.name)}</text>
  <text x="${TX}" y="182" font-family="${SANS}" font-size="${fit(h.meta, TW, 17, { where: "header.meta" })}" fill="${th.muted}">${esc(h.meta)}</text>
  ${dotted(th, TX, 856, 204)}
  <text x="${TX}" y="238" font-family="${DISPLAY}" font-size="${fit(h.tagline, TW, 21, { bold: true, where: "header.tagline" })}" font-weight="700" fill="${th.ink}">${esc(h.tagline)}</text>
  <text x="${TX}" y="268" font-family="${SANS}" font-size="${fit(h.sub, TW, 16.5, { where: "header.sub" })}" fill="${th.muted}">${esc(h.sub)}</text>`,
  );
}

// ── 道具箱 ──────────────────────────────────────────────────────────────────
function toolbox(th: Theme) {
  const W = 904, LX = 40, PX = 150, RIGHT = W - 40, GAP = 10, PH = 34, LINE = 46;
  let y = 88;
  let body = "";
  for (const [i, { label, items }] of c.toolbox.rows.entries()) {
    const rowTop = y;
    let x = PX;
    for (const item of items) {
      const w = Math.round(textWidth(item, 14.5, true) + 34);
      if (x + w > RIGHT) { x = PX; y += LINE; }
      body += pill(th, { x, y, label: item, w, h: PH });
      x += w + GAP;
    }
    body += `<text x="${LX}" y="${rowTop + 23}" font-family="${DISPLAY}" font-size="${fit(label, PX - LX - 16, 16, { bold: true, where: "toolbox.rows.label" })}" font-weight="700" fill="${th.muted}">${esc(label)}</text>`;
    y += LINE;
    if (i < c.toolbox.rows.length - 1) {
      body += dotted(th, LX, RIGHT, y - 6);
      y += 10;
    }
  }
  const H = y + 18;
  return svg(W + 16, H + 16, c.toolbox.alt, `${windowFrame(th, { w: W, h: H, title: c.toolbox.window })}\n${body}`);
}

// ── 言語の割合（GitHub の公開リポジトリから数える）──────────────────────────
type Lang = { name: string; weight: number };
type Stats = {
  langs: Lang[];
  repos: number;
  stars: number;
  followers: number;
  updated: string;
  contributions: number;
  activeDays: number;
};

async function fetchStats(prev?: Stats): Promise<Stats> {
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

  const graphql = async (query: string) => {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": `${USER}-profile`,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables: { login: USER } }),
    });
    const body = (await res.json()) as { data?: any; errors?: { message: string }[] };
    if (!res.ok || body.errors) throw new Error(`graphql: ${res.status} ${body.errors?.[0]?.message ?? ""}`);
    return body.data;
  };

  const user = (await api(`/users/${USER}`)) as { followers: number };

  // コントリビューションは GraphQL でしか取れない。読めなければ前回の値を持ち越す
  // （公開リポジトリ側は REST なので、ここで全部を捨てない）。
  const calendar = await graphql(`query($login:String!){
      user(login:$login){
        contributionsCollection{
          contributionCalendar{
            totalContributions
            weeks{ contributionDays{ date contributionCount } }
          }
        }
      }
    }`)
    .then(
      (d) =>
        d.user.contributionsCollection.contributionCalendar as {
          totalContributions: number;
          weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
        },
    )
    .catch((err) => {
      console.warn(`コントリビューションを読めなかったので前回の値を使う: ${err}`);
      return null;
    });

  const repos = (await api(`/users/${USER}/repos?per_page=100&type=owner&sort=pushed`)) as {
    name: string; fork: boolean; archived: boolean; stargazers_count: number;
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
    followers: user.followers,
    updated: new Date().toISOString().slice(0, 10),
    contributions: calendar?.totalContributions ?? prev?.contributions ?? 0,
    activeDays: calendar
      ? calendar.weeks.flatMap((w) => w.contributionDays).filter((d) => d.contributionCount > 0).length
      : (prev?.activeDays ?? 0),
  };
}

/** 言語の割合と、いまの数字。色だけに頼らないよう凡例に名前と % を出す（brand.md §7.5）。 */
function stats(th: Theme, s: Stats, palette: readonly string[]) {
  const W = 904, LX = 40, RIGHT = W - 40, BAR_Y = 106, BAR_H = 26, GAP = 4;
  const top = s.langs.slice(0, 5);
  const rest = s.langs.slice(5).reduce((n, l) => n + l.weight, 0);
  const rows = rest > 0 ? [...top, { name: c.stats.other, weight: rest }] : top;
  const sum = rows.reduce((n, l) => n + l.weight, 0) || 1;
  const shares = rows.map((l) => l.weight / sum);

  const track = RIGHT - LX - GAP * (rows.length - 1);
  let x = LX;
  let bar = "";
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

  const TW = 197, TH = 78, TY = legendBottom + 52;
  const tiles: [string, string][] = [
    [`${s.contributions}`, c.stats.tile_contributions],
    [`${s.activeDays}`, c.stats.tile_active_days],
    [`${s.repos}`, c.stats.tile_repos],
    [`${s.followers}`, c.stats.tile_followers],
  ];
  let tile = "";
  tiles.forEach(([n, label], i) => {
    const tx = LX + i * (TW + 9);
    tile +=
      `<rect x="${tx}" y="${TY}" width="${TW}" height="${TH}" rx="16" fill="${th.sunken}"/>` +
      `<text x="${tx + 18}" y="${TY + 40}" font-family="${DISPLAY}" font-size="30" font-weight="700" fill="${th.ink}">${esc(n)}</text>` +
      `<text x="${tx + 18}" y="${TY + 62}" font-family="${SANS}" font-size="${fit(label, TW - 36, 12, { where: "stats の tile" })}" fill="${th.muted}">${esc(label)}</text>`;
  });

  const H = TY + TH + 38;
  return svg(
    W + 16,
    H + 16,
    c.stats.alt,
    `${windowFrame(th, { w: W, h: H, title: c.stats.window })}
  <text x="${LX}" y="${BAR_Y - 14}" font-family="${DISPLAY}" font-size="${fit(c.stats.heading, 600, 16, { bold: true, where: "stats.heading" })}" font-weight="700" fill="${th.muted}">${esc(c.stats.heading)}</text>
  <text x="${RIGHT}" y="${BAR_Y - 14}" text-anchor="end" font-family="${SANS}" font-size="13" fill="${th.muted}">${esc(c.stats.as_of.replace("{date}", s.updated))}</text>
  ${bar}
  ${legend}
  ${dotted(th, LX, RIGHT, TY - 26)}
  ${tile}
  ${cross(RIGHT - 4, TY + TH + 18, 9, th.signature, 0.9)}`,
  );
}

// ── フッター ────────────────────────────────────────────────────────────────
function footer(th: Theme, face: string) {
  const W = 460, H = 132, bar = 44, ax = 28, ay = bar + 16, as = 56;
  const TX = ax + as + 20, TW = W - 40 - TX;
  const f = c.footer;
  return svg(
    W + 16,
    H + 16,
    f.alt,
    `  <defs><clipPath id="fa"><rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="14"/></clipPath></defs>
${windowFrame(th, { w: W, h: H, title: f.window, bar })}
  <g class="bob">
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="14" fill="${AVATAR_BG}"/>
    <image x="${ax}" y="${ay}" width="${as}" height="${as}" clip-path="url(#fa)" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,${face}"/>
    <rect x="${ax}" y="${ay}" width="${as}" height="${as}" rx="14" fill="none" stroke="${th.brand}" stroke-width="2"/>
  </g>
  <text x="${TX}" y="${ay + 26}" font-family="${DISPLAY}" font-size="${fit(f.line1, TW, 18, { bold: true, where: "footer.line1" })}" font-weight="700" fill="${th.ink}">${esc(f.line1)}</text>
  <text x="${TX}" y="${ay + 50}" font-family="${SANS}" font-size="${fit(f.line2, TW, 14, { where: "footer.line2" })}" fill="${th.muted}">${esc(f.line2)}</text>
  <g class="tw">${cross(W - 34, bar + 26, 8, th.signature)}</g>`,
  );
}

// ── リンクのピル ────────────────────────────────────────────────────────────
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
const cache = Bun.file(`${SRC}/stats.json`);
let data: Stats;
const previous: Stats | undefined = (await cache.exists()) ? await cache.json() : undefined;
if (process.argv.includes("--offline")) {
  data = await cache.json();
} else {
  try {
    data = await fetchStats(previous);
    await Bun.write(cache, JSON.stringify(data, null, 2) + "\n");
  } catch (err) {
    console.warn(`GitHub API を読めなかったので前回の値を使う: ${err}`);
    data = await cache.json();
  }
}

const [faceLight, faceDark, faceFooter] = await Promise.all([
  b64(`${SRC}/${c.header.face_light}`),
  b64(`${SRC}/${c.header.face_dark}`),
  b64(`${SRC}/${c.footer.face}`),
]);

const files: [string, string][] = [
  ["header-light.svg", header(t.light, faceLight)],
  ["header-dark.svg", header(t.dark, faceDark)],
  ["toolbox-light.svg", toolbox(t.light)],
  ["toolbox-dark.svg", toolbox(t.dark)],
  ["stats-light.svg", stats(t.light, data, PALETTE.light)],
  ["stats-dark.svg", stats(t.dark, data, PALETTE.dark)],
  ["footer-light.svg", footer(t.light, faceFooter)],
  ["footer-dark.svg", footer(t.dark, faceFooter)],
  ...c.badges.flatMap(({ slug, label }): [string, string][] => [
    [`badge-${slug}-light.svg`, badge(t.light, label)],
    [`badge-${slug}-dark.svg`, badge(t.dark, label)],
  ]),
];

for (const [name, content] of files) {
  await Bun.write(`${OUT}/${name}`, content);
}
console.log(`${files.length} files -> ${OUT}/ (languages: ${data.langs.length}, repos: ${data.repos})`);
