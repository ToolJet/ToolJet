import { radiusVar, shadowVar } from './themeVariables';

// A widget style that follows a theme border radius or box shadow: `borderRadiusStyle` / `boxShadowStyle` hold the
// theme item's id, or 'custom' for the widget's own value (the existing `borderRadius` / `boxShadow`). Widgets saved
// before these keys existed have none and render their own value, as before.
export const CUSTOM_STYLE = 'custom';

const followsTheme = (style) => Boolean(style) && style !== CUSTOM_STYLE;

// A number (or numeric string) is pixels; a string with its own unit ("1rem", "50%") is used as is.
const radiusCss = (radius) => (typeof radius === 'string' && /[a-z%]$/i.test(radius.trim()) ? radius : `${radius}px`);

/** The CSS border radius: the widget's own value, or the theme item with that value as the fallback. */
export const themedRadius = (style, radius) =>
  followsTheme(style) ? `var(${radiusVar(style)}, ${radiusCss(radius)})` : radiusCss(radius);

/** The CSS box shadow: the widget's own shadow, or the theme item with that shadow as the fallback. */
export const themedShadow = (style, shadow) =>
  followsTheme(style) ? `var(${shadowVar(style)}, ${shadow || 'none'})` : shadow;

const px = (n) => (n ? `${n}px` : '0');
/** A theme shadow as the design lists it: x y blur spread ("0 2px 4px 0"), none as "0, 0, 0, 0". */
export const shadowLabel = ({ x, y, blur, spread }) =>
  [x, y, blur, spread].every((n) => !n) ? '0, 0, 0, 0' : [x, y, blur, spread].map(px).join(' ');
