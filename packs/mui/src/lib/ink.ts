import { decomposeColor, getContrastRatio, hslToRgb, type Theme } from '@mui/material/styles';

// Ink: a colour as small text on a tint of itself (a status chip drawn in an author's CSS colour), readable at 4.5:1.
// The colour is mixed toward white in a dark theme and toward black in a light one, only as far as the text needs to
// clear 4.5:1 on its tint over the paper, so a colour that already reads is drawn as is. Palette chips need none of
// this: MUI picks their text with the theme's contrastThreshold (lib/theme.ts, 4.5).

export const MIN_TEXT_CONTRAST = 4.5;

const rgbOf = (color: string): [number, number, number] => {
  const d = decomposeColor(color.trim().startsWith('hsl') ? hslToRgb(color) : color);
  return [d.values[0], d.values[1], d.values[2]] as [number, number, number];
};
const mix = (a: [number, number, number], b: [number, number, number], share: number) =>
  `rgb(${a.map((v, i) => Math.round(v * share + b[i] * (1 - share))).join(', ')})`;

/** The ink for `color` on a `tint` share of it over `paper` (0: on the paper itself), in a `dark` or light theme. The
 *  surface under a chip is not always the paper (a DataGrid row in a dark theme, a ToolJet surface, a hover), so the
 *  ink also clears the tint over the paper moved a tenth toward the pole. */
export const readableInk = (color: string, paper: string, dark: boolean, tint = 0.14): string => {
  try {
    const c = rgbOf(color);
    const pole: [number, number, number] = dark ? [255, 255, 255] : [0, 0, 0];
    const base = rgbOf(paper);
    const lifted = rgbOf(mix(pole, base, 0.1));
    const backs = [mix(c, base, tint), mix(c, lifted, tint)];
    for (let k = 0; k <= 1.0001; k += 0.05) {
      const ink = mix(pole, c, k);
      if (backs.every((back) => getContrastRatio(ink, back) >= MIN_TEXT_CONTRAST)) return ink;
    }
    return mix(pole, c, 1);
  } catch {
    return color;
  }
};

/** readableInk on the theme's paper and mode. */
export const themeInk = (color: string, theme: Theme, tint = 0.14) => readableInk(color, theme.palette.background.paper, theme.palette.mode === 'dark', tint);
