import tinycolor from 'tinycolor2';

const WHITE = '#ffffff';
const INK = '#0a0a0a';

/** Text colour for labels drawn on the brand colour (primary buttons, selected toggles, solid chips). White whenever
 *  it reaches 3:1, the WCAG minimum for bold UI text; near-black only on light accents (amber, lime, pale teal). By
 *  contrast alone black won on mid blues such as #3D85C6 (5.2 against 4.0), which reads wrong to everyone. */
export const onBrandText = (brand) => {
  if (!brand || !tinycolor(brand).isValid()) return null;
  return tinycolor.readability(brand, WHITE) >= 3 ? WHITE : INK;
};
