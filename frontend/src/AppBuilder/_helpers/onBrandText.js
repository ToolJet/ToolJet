import tinycolor from 'tinycolor2';

const WHITE = '#ffffff';
const INK = '#0a0a0a';
// WCAG 1.4.3 for normal-size text: primary labels are 12 to 14px, so the 3:1 large-text minimum does not cover them.
const NORMAL_TEXT = 4.5;

/** Text colour for labels drawn on the brand colour (primary buttons, selected toggles, solid chips). White whenever
 *  it reaches 3:1; near-black only on light accents (amber, lime, pale teal). By contrast alone black won on mid blues
 *  such as #3D85C6 (5.2 against 4.0), which reads wrong to everyone. Where white is under 4.5:1, small labels keep it
 *  and sit on primaryStrong instead of the brand itself. */
export const onBrandText = (brand) => {
  if (!brand || !tinycolor(brand).isValid()) return null;
  return tinycolor.readability(brand, WHITE) >= 3 ? WHITE : INK;
};

/** The fill behind small white labels (primary buttons, badges, a hero's action): the brand itself where white reads
 *  on it at 4.5:1, else the same hue with its lightness lowered just enough (a #3B82F6 theme drew them at 3.7:1).
 *  Light accents keep their dark labels and their colour. */
export const primaryStrong = (brand) => {
  const label = onBrandText(brand);
  if (label !== WHITE || tinycolor.readability(brand, WHITE) >= NORMAL_TEXT) return label && brand;
  const hsl = tinycolor(brand).toHsl();
  const at = (l) => tinycolor({ ...hsl, l });
  // Lightness bisected between black (which passes) and the brand (which does not), checked on the hex it becomes.
  let [pass, fail] = [0, hsl.l];
  while (fail - pass > 0.001) {
    const mid = (pass + fail) / 2;
    if (tinycolor.readability(at(mid).toHexString(), WHITE) >= NORMAL_TEXT) pass = mid;
    else fail = mid;
  }
  return hsl.a < 1 ? at(pass).toHex8String() : at(pass).toHexString();
};

/** Sets the on-brand label colour and the strong fill on the app root for the theme's primary in the mode in use, or
 *  clears them (the stylesheet then falls back to white and to the primary). */
export const setOnBrandColors = (root, brand) => {
  const colors = { '--cc-on-primary-brand': onBrandText(brand), '--cc-primary-brand-strong': primaryStrong(brand) };
  Object.entries(colors).forEach(([name, value]) =>
    value ? root.style.setProperty(name, value) : root.style.removeProperty(name)
  );
};
