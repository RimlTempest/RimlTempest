import { type Theme, DISPLAY, esc } from "./tokens";

/** 影 → 窓 → 帯 → 丸 3 つ → タイトル。まど（Mado）の骨格。 */
export function windowFrame(
  th: Theme,
  o: { w: number; h: number; title: string; bar?: number; controls?: boolean },
) {
  const bar = o.bar ?? 56;
  const r = 16;
  const cr = bar / 2;
  const glyph = (x: number, kind: "close" | "expand" | "collapse") => {
    const g = 4.5;
    const c = th.chrome;
    if (kind === "close")
      return `<path d="M${x - g} ${cr - g}l${g * 2} ${g * 2}M${x + g} ${cr - g}l${-g * 2} ${g * 2}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
    if (kind === "expand")
      return `<rect x="${x - g}" y="${cr - g}" width="${g * 2}" height="${g * 2}" rx="1.5" fill="none" stroke="${c}" stroke-width="2.4"/>`;
    return `<path d="M${x - g} ${cr}h${g * 2}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
  };
  const dots =
    o.controls === false
      ? ""
      : `<g>
      <circle cx="30" cy="${cr}" r="11" fill="${th.chromeText}"/>
      <circle cx="62" cy="${cr}" r="11" fill="${th.chromeText}"/>
      <circle cx="94" cy="${cr}" r="11" fill="${th.chromeText}"/>
      ${glyph(30, "close")}${glyph(62, "expand")}${glyph(94, "collapse")}
    </g>`;
  return `
  <rect x="8" y="8" width="${o.w}" height="${o.h}" rx="${r}" fill="${th.shadow}"/>
  <rect x="0" y="0" width="${o.w}" height="${o.h}" rx="${r}" fill="${th.surface}"/>
  <path d="M0 ${bar}V${r}a${r} ${r} 0 0 1 ${r}-${r}h${o.w - r * 2}a${r} ${r} 0 0 1 ${r} ${r}v${bar - r}z" fill="${th.chrome}"/>
  ${dots}
  <text x="${o.w / 2}" y="${cr + 7}" text-anchor="middle" font-family="${DISPLAY}" font-size="19" font-weight="700" fill="${th.chromeText}">${esc(o.title)}</text>`;
}

/** 点線の区切り（§7.6）。 */
export const dotted = (th: Theme, x1: number, x2: number, y: number) =>
  `<path d="M${x1} ${y}h${x2 - x1}" stroke="${th.border}" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 7"/>`;

/** ピル（§7.2 の形）。塗りの上に文字を置くのは accent だけ（§9）。 */
export function pill(
  th: Theme,
  o: { x: number; y: number; label: string; w: number; h?: number; tone?: "accent" | "sunken" },
) {
  const h = o.h ?? 34;
  const fill = o.tone === "accent" ? th.accent : th.sunken;
  const fg = o.tone === "accent" ? th.onAccent : th.ink;
  return `<g><rect x="${o.x}" y="${o.y}" width="${o.w}" height="${h}" rx="${h / 2}" fill="${fill}"/>
  <text x="${o.x + o.w / 2}" y="${o.y + h / 2 + 5}" text-anchor="middle" font-family="${DISPLAY}" font-size="14.5" font-weight="700" fill="${fg}">${esc(o.label)}</text></g>`;
}

/** キャラのヘアピン由来の × 。幾何だけを持ち込む（§9）。 */
export const cross = (x: number, y: number, s: number, color: string, opacity = 1) =>
  `<path d="M${x - s} ${y - s}l${s * 2} ${s * 2}M${x + s} ${y - s}l${-s * 2} ${s * 2}" stroke="${color}" stroke-width="${Math.max(2, s * 0.5)}" stroke-linecap="round" opacity="${opacity}"/>`;

export const motion = `
  <style>
    .bob { animation: rd-bob 3.6s ease-in-out infinite; }
    .tw  { animation: rd-tw 2.8s ease-in-out infinite; transform-origin: center; }
    .tw2 { animation: rd-tw 2.8s ease-in-out infinite 1.4s; transform-origin: center; }
    @keyframes rd-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
    @keyframes rd-tw  { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
    @media (prefers-reduced-motion: reduce) { .bob,.tw,.tw2 { animation: none } }
  </style>`;
