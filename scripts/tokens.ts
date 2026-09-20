// riml-ds brand tokens (sRGB approximations from docs/brand.md)
export const t = {
  light: {
    surface: "#fffbf6", // neutral.100 窓
    paper: "#fcf4e8", // neutral.0 紙
    sunken: "#f9decb", // neutral.200 肌
    ink: "#39415b", // neutral.700
    muted: "#434756", // neutral.600
    border: "#7b8090", // neutral.500
    chrome: "#39415b",
    chromeText: "#fcf4e8",
    accent: "#2f4c7e", // accent.600
    brand: "#5e7eb4", // accent.500 装飾用
    signature: "#e13d3c", // signature.500 装飾用
    shadow: "rgba(21,26,41,0.16)",
    onAccent: "#fcf4e8",
  },
  dark: {
    surface: "#232839", // neutral.800
    paper: "#151a29", // neutral.900
    sunken: "#0b0f1a", // neutral.950
    ink: "#fcf4e8", // neutral.0
    muted: "#c3bdb3", // neutral.300
    border: "#7b8090",
    chrome: "#434756", // neutral.600
    chromeText: "#fcf4e8",
    accent: "#a0bff3", // accent.400
    brand: "#a0bff3",
    signature: "#ff6b63", // signature.400
    shadow: "rgba(0,0,0,0.5)",
    onAccent: "#151a29",
  },
} as const;

export type Theme = (typeof t)[keyof typeof t];

export const DISPLAY =
  "'Zen Maru Gothic','M PLUS Rounded 1c','Hiragino Maru Gothic ProN','Kosugi Maru','Arial Rounded MT Bold','Nunito','Segoe UI',system-ui,sans-serif";
export const SANS =
  "'Hiragino Sans','Noto Sans JP','Yu Gothic UI','Segoe UI',system-ui,sans-serif";

/** ざっくりの字幅見積り（和文 1em / 欧文 0.56em）。ピルの幅決めにだけ使う。 */
export function textWidth(s: string, size: number, bold = false): number {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c > 0x2e80) w += 1.0;
    else if (ch === " ") w += 0.3;
    else if (/[iIl.,:;'!|]/.test(ch)) w += 0.3;
    else if (/[A-Z0-9]/.test(ch)) w += bold ? 0.66 : 0.62;
    else w += bold ? 0.58 : 0.55;
  }
  return w * size;
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
