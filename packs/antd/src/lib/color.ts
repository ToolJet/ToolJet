/**
 * Whether the browser reads `text` as a CSS colour (CSS.supports). Where it can't judge, every value is taken, as the
 * host does for colour styles (packStyleColors.ts).
 */
export const readsAsColor = (text: string): boolean =>
  typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports('color', text);
