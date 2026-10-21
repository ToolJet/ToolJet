import { createContext, useContext, useEffect, useState } from 'react';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { LOOKS } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { kanbanLook } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';

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

// The Kanban keeps its own look module (kanbanLook.ts): its colours are variables its classes read, or, for the column
// and the card, inline values with the theme's as the fallback when unset (read from kanbanLook itself).
const KANBAN_VARIABLES = {
  accentColor: '--sc-primary',
  progressColor: '--sc-primary',
  columnTitleColor: '--kb-col-title',
  columnCountBackgroundColor: '--kb-count-bg',
  columnCountTextColor: '--kb-count-fg',
  cardTitleColor: '--kb-card-title',
  cardTextColor: '--kb-card-text',
};
const kanbanDefaults = () => {
  const { column, card } = kanbanLook({});
  return {
    columnBackgroundColor: column.background,
    columnBorderRadius: column.borderRadius,
    cardBackgroundColor: card.background,
    cardBorderColor: card.borderColor,
    cardBorderRadius: card.borderRadius,
  };
};
const RADIUS_KEYS = /radius/i;
// The longhand a shorthand's value lands in, as getComputedStyle reads it.
const LONGHAND = {
  background: 'backgroundColor',
  'background-color': 'backgroundColor',
  border: 'borderTopColor',
  'border-color': 'borderTopColor',
  'border-radius': 'borderTopLeftRadius',
};

/** A CSS value as the widget would compute it: drawn into a hidden probe inside the widget, so its theme applies. */
const computeIn = (root, value, property) => {
  // Inside the widget's own root, where the theme's --sc-* tokens are set.
  const host = root.querySelector('.tj-shadcn') ?? root;
  const probe = document.createElement('span');
  const cssName = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  probe.setAttribute('style', `position: absolute; visibility: hidden; ${cssName}: ${value}`);
  host.appendChild(probe);
  const computed = getComputedStyle(probe)[property];
  probe.remove();
  return computed || null;
};

/** The first part of the widget that draws `name` (the variable first, the theme's value as its fallback), read off
 *  its computed style: a utility class (tw-bg-[color:var(--lk-bg,...)]) or an inline style (a Card grid's card draws
 *  background: var(--lk-bg,var(--sc-card)) inline, and --cg-border: var(--lk-border,...) for its border). */
const drawnValue = (root, name) => {
  const pattern = classFor(name);
  const needle = `var(${name}`;
  for (const element of root.querySelectorAll('[class], [style]')) {
    if (element.getAttribute('class')?.includes(needle)) {
      const match = [...element.classList].map((token) => token.match(pattern)).find(Boolean);
      const drawn = match && getComputedStyle(element)[PROPERTIES[match[1]]];
      if (drawn) return drawn;
    }
    const inline = element.getAttribute('style');
    if (inline?.includes(needle)) {
      // Read off the attribute's own text: a shorthand holding a variable (background, border-radius) reports its
      // longhands empty until the variable is substituted.
      for (const declaration of inline.split(';')) {
        const [property, ...rest] = declaration.split(':');
        if (!rest.join(':').trim().startsWith(needle)) continue;
        const prop = property.trim();
        const computed = getComputedStyle(element);
        const drawn = prop.startsWith('--') ? computed.getPropertyValue(prop) : computed[LONGHAND[prop] ?? prop];
        if (drawn?.trim()) return drawn.trim();
      }
    }
  }
  return null;
};

/** What the widget on the canvas draws for a blank style, or null when no part of it draws the style. */
export const themeValueOf = (componentId, component, paramName) => {
  const root = componentId ? document.getElementById(componentId) : null;
  if (!root) return null;
  if (component === 'ShadKanban') {
    const fallback = kanbanDefaults()[paramName];
    if (fallback) return computeIn(root, fallback, RADIUS_KEYS.test(paramName) ? 'borderTopLeftRadius' : 'color');
  }
  const names =
    component === 'ShadKanban'
      ? [KANBAN_VARIABLES[paramName]].filter(Boolean)
      : (LOOKS[component] || []).filter(([key]) => key === paramName).flatMap(([, name]) => [].concat(name));
  for (const name of names) {
    // A theme token the style overrides (the accent's --sc-primary): its value on the widget is the theme's.
    if (name.startsWith('--sc-')) {
      const token = getComputedStyle(root.querySelector('.tj-shadcn') ?? root.firstElementChild ?? root)
        .getPropertyValue(name)
        .trim();
      if (token) return token;
      continue;
    }
    const drawn = drawnValue(root, name);
    if (drawn) return drawn;
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
