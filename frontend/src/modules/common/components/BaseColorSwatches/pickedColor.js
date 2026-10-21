// The hex a colour picker choice writes. The picker keeps the alpha of the colour it opened on, so on a colour that is
// fully transparent (a UI 2.0 Dialog's header and footer dividers default to #00000000) dragging to a hue wrote
// #e11d4800, still invisible: only the preset swatches, which write an opaque colour, seemed to work. For a UI 2.0
// widget, a choice that changes the colour but leaves it fully transparent is made opaque; moving the alpha slider to
// 0 on a visible colour still writes a transparent one. Native widgets keep their behaviour.

const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
const alphaHex = (alpha) => (alpha === 0 ? '00' : toHex(255 * alpha));

/** The colour as [r, g, b, a] when it is a hex colour or 'transparent'; null for anything else (a theme variable). */
const parse = (value) => {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (text === 'transparent') return [0, 0, 0, 0];
  const m = text.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (!m) return null;
  const digits = m[1].length <= 4 ? [...m[1]].map((d) => d + d).join('') : m[1];
  const [r, g, b, a = 255] = digits.match(/../g).map((pair) => parseInt(pair, 16));
  return [r, g, b, a / 255];
};

export const pickedColor = ({ r, g, b, a }, previous, isUi2Component) => {
  let alpha = a ?? 1;
  const before = parse(previous);
  if (
    isUi2Component &&
    alpha === 0 &&
    before &&
    before[3] === 0 &&
    (before[0] !== r || before[1] !== g || before[2] !== b)
  ) {
    alpha = 1;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex(alpha)}`;
};
