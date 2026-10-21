import { createContext, useContext, useEffect, useState } from 'react';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { LOOKS } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';

// A UI 2.0 widget's colour and radius styles have no default value: blank means the app theme decides, so a theme
// restyles every app. The inspector drew a blank colour as an empty white swatch and a blank radius as an empty box,
// which read as styles that failed to load. A blank style field now says it follows the theme: the swatch takes the
// colour the widget draws (read from the widget on the canvas) beside a muted "Theme", the radius shows the theme's
// radius as its placeholder. Where the widget does not draw the style (a trend colour with no trend, a part that is
// hidden), the field says "Theme default". The field renderers (BaseColorSwatches, NumberInput) read this context.

/** { value } for a blank theme-following style field (value: what the theme draws, or null when unknown); else null. */
export const ThemeDefaultContext = createContext(null);
export const useThemeDefault = () => useContext(ThemeDefaultContext);

const THEMED_TYPES = ['colorSwatches', 'numberInput'];
const isBlank = (value) => value === undefined || value === null || (typeof value === 'string' && !value.trim());

/** A UI 2.0 widget's colour or number style left blank: the theme decides its value. */
export const followsTheme = ({ component, paramName, paramType, value }) =>
  typeof component === 'string' &&
  component.startsWith('Shad') &&
  THEMED_TYPES.includes(paramType) &&
  isBlank(value) &&
  Boolean(componentTypeDefinitionMap[component]?.styles?.[paramName]);

// The utility classes that draw a style read its variable first, e.g.
// `tw-bg-[color:var(--lk-bg,var(--sc-card))]`: the class names the CSS property the value lands in.
const PROPERTIES = {
  text: 'color',
  bg: 'backgroundColor',
  border: 'borderTopColor',
  fill: 'fill',
  stroke: 'stroke',
  outline: 'outlineColor',
  rounded: 'borderTopLeftRadius',
};
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const classFor = (name) =>
  new RegExp(`^tw-(${Object.keys(PROPERTIES).join('|')})-\\[(?:color:|length:)?var\\(${escape(name)}[,)]`);

/** What the widget on the canvas draws for a blank style, or null when no part of it draws the style. */
export const themeValueOf = (componentId, component, paramName) => {
  const root = componentId ? document.getElementById(componentId) : null;
  if (!root) return null;
  const names = (LOOKS[component] || []).filter(([key]) => key === paramName).flatMap(([, name]) => [].concat(name));
  for (const name of names) {
    // A theme token the style overrides (the accent's --sc-primary): its value on the widget is the theme's.
    if (name.startsWith('--sc-')) {
      const token = getComputedStyle(root.firstElementChild ?? root)
        .getPropertyValue(name)
        .trim();
      if (token) return token;
      continue;
    }
    const pattern = classFor(name);
    const needle = `var(${name}`;
    for (const element of root.querySelectorAll('[class]')) {
      if (!element.getAttribute('class').includes(needle)) continue;
      const match = [...element.classList].map((token) => token.match(pattern)).find(Boolean);
      const drawn = match && getComputedStyle(element)[PROPERTIES[match[1]]];
      if (drawn) return drawn;
    }
  }
  return null;
};

/** themeValueOf, read after the canvas has drawn (a cleared colour reads the widget without it). */
export const useThemeValue = (enabled, componentId, component, paramName, darkMode) => {
  const [found, setFound] = useState(null);
  useEffect(() => {
    if (!enabled) {
      setFound(null);
      return undefined;
    }
    const read = () => setFound(themeValueOf(componentId, component, paramName));
    read();
    const frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, [enabled, componentId, component, paramName, darkMode]);
  return found;
};

/** A colour react-color's picker can start from (it reads hex and rgb, not oklch or color-mix results). */
export const pickerColor = (color) => (typeof color === 'string' && /^(#|rgba?\()/.test(color) ? color : undefined);
