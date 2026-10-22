import { createContext, useContext, useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
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
  h: 'height',
  w: 'width',
  gap: 'columnGap',
};
// A length in a text class is the font size (tw-text-[length:var(--lk-size,...)]), not the colour.
const propertyOf = (kind, prefix) => (kind === 'text' && prefix === 'length:' ? 'fontSize' : PROPERTIES[kind]);
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const classFor = (name) =>
  new RegExp(`^tw-(${Object.keys(PROPERTIES).join('|')})-\\[(color:|length:)?var\\(${escape(name)}[,)]`);

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
  // Inside the widget's own root, where the theme's --sc-* tokens are set. A widget drawing no pack root (loading, or
  // hidden) gets a token scope of its own (tj-shad-tokens): outside one, a token resolved to nothing and the probe
  // fell back to the inherited text colour, a transparent background or a 0 radius.
  const shell = root.querySelector('.tj-shadcn');
  const host = shell ?? document.createElement('div');
  if (!shell) {
    host.className = 'tj-shad-tokens';
    host.setAttribute('style', 'position: absolute; visibility: hidden;');
    root.appendChild(host);
  }
  const probe = document.createElement('span');
  const cssName = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  probe.setAttribute('style', `position: absolute; visibility: hidden; ${cssName}: ${value}`);
  host.appendChild(probe);
  const computed = getComputedStyle(probe)[property];
  probe.remove();
  if (!shell) host.remove();
  return computed && !computed.includes('var(') ? computed : null;
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
      const drawn = match && getComputedStyle(element)[propertyOf(match[1], match[2])];
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

// The property a style's name says it sets: a radius, a size, a background, a border, else a text colour.
const SIZE_PROPERTIES = [
  [/radius/i, 'borderTopLeftRadius'],
  [/fontsize|textsize/i, 'fontSize'],
  [/width/i, 'width'],
  [/gap|padding/i, 'columnGap'],
  [/size|height|thickness/i, 'height'],
];
const COLOR_PROPERTIES = [
  [/background|bg$/i, 'backgroundColor'],
  [/border|divider/i, 'borderTopColor'],
];
const propertyFor = (paramName) =>
  [...SIZE_PROPERTIES, ...COLOR_PROPERTIES].find(([pattern]) => pattern.test(paramName))?.[1] ?? 'color';

// A widget whose variants each draw their own colours (Button, Badge, Alert, ...) applies a style's class only when
// it is set (shadcnLook.whenSet); unset, the part carries `lk-theme-<style>` instead, and its own colours are the
// theme's. Its hover background is read from its hover class, which names the theme's token
// (hover:tw-bg-ui2-primary/90).
const hoverValue = (root, element) => {
  for (const token of element.classList) {
    // A theme colour (hover:tw-bg-ui2-primary/90) or an arbitrary one (hover:tw-bg-[color:color-mix(in_srgb,...)]).
    const named = token.match(/^hover:tw-bg-ui2-([a-z0-9-]+?)(?:\/(\d+))?$/);
    if (named) {
      const color = `var(--sc-${named[1]})`;
      return computeIn(
        root,
        named[2] ? `color-mix(in srgb, ${color} ${named[2]}%, transparent)` : color,
        'backgroundColor'
      );
    }
    const arbitrary = token.match(/^hover:tw-bg-\[(?:color:)?(.+)\]$/);
    if (arbitrary) return computeIn(root, arbitrary[1].replace(/_/g, ' '), 'backgroundColor');
  }
  return null;
};
const markedValue = (root, paramName) => {
  const element = root.querySelector(`.lk-theme-${paramName}`);
  if (!element) return null;
  if (/hover/i.test(paramName)) return hoverValue(root, element) ?? getComputedStyle(element).backgroundColor ?? null;
  return getComputedStyle(element)[propertyFor(paramName)] || null;
};

/**
 * The theme's value for a style that no part of the widget on the canvas draws (a trend colour with no trend, a menu
 * that is closed): the theme token, or the widget's own size, that a style of that kind falls back to. Every UI 2.0
 * colour and size style has one (themeDefaultCoverage.spec.js walks the configs), so no field is left blank.
 */
const FALLBACKS = [
  [/hover/i, 'var(--sc-accent)'],
  [/radius/i, 'var(--sc-radius)'],
  [/fontsize|textsize/i, '0.875rem'],
  [/^menuWidth$/, 'auto'],
  [/^(cellSize|slotSize)$/, '2.25rem'],
  [/^barHeight$/, '0.5rem'],
  [/^thickness$/, '1px'],
  [/gap|padding/i, '16px'],
  [/error|negative|destructive|weak/i, 'var(--sc-destructive)'],
  [/positive|success|strong/i, 'var(--sc-success)'],
  [/warning|fair/i, 'var(--sc-warning)'],
  [/background|bg$|bubble/i, 'var(--sc-card)'],
  [/border|divider|grid|line|track|separator|^emptyColor$|^offColor$/i, 'var(--sc-border)'],
  [
    /placeholder|help|hint|muted|caption|description|axis|legend|timestamp|footnote|time|affix|incompleted|fallback/i,
    'var(--sc-muted-foreground)',
  ],
  [
    /accent|primary|progress|bar|indicator|filled|highlight|chart|spark|marker|dot|link|ring|spinner|icon|now|cluster|current|completed|active|band|chip|selected|striped/i,
    'var(--sc-primary)',
  ],
  [/color|text|title|label|value|name|message|stepper/i, 'var(--sc-foreground)'],
];
export const themeFallback = (paramName) => {
  const rule = FALLBACKS.find(([pattern]) => pattern.test(paramName));
  return rule ? { value: rule[1], property: propertyFor(paramName) } : null;
};
// The theme tokens' own defaults (shadcn.scss), for a canvas where a token cannot be computed: the field still shows
// a value rather than "Theme default".
const TOKEN_DEFAULTS = {
  '--sc-accent': '#f5f5f5',
  '--sc-radius': '10px',
  '--sc-destructive': '#dc2626',
  '--sc-success': '#16a34a',
  '--sc-warning': '#d97706',
  '--sc-card': '#ffffff',
  '--sc-border': '#e5e5e5',
  '--sc-muted-foreground': '#737373',
  '--sc-primary': '#171717',
  '--sc-foreground': '#0a0a0a',
};
const LENGTH_PX = { '0.875rem': '14px', '2.25rem': '36px', '0.5rem': '8px' };
const fallbackValue = (root, paramName) => {
  const fallback = themeFallback(paramName);
  if (!fallback) return null;
  const token = fallback.value.match(/^var\((--sc-[a-z-]+)\)$/)?.[1];
  if (!token) {
    return /^\d/.test(fallback.value)
      ? computeIn(root, fallback.value, fallback.property) ?? LENGTH_PX[fallback.value] ?? fallback.value
      : fallback.value;
  }
  return computeIn(root, fallback.value, fallback.property) ?? TOKEN_DEFAULTS[token] ?? null;
};

/** What the widget on the canvas draws for a blank style, or null when no part of it draws the style. */
const drawnThemeValue = (componentId, component, paramName) => {
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
  return markedValue(root, paramName);
};

/** What the widget on the canvas draws for a blank style, else the theme's value for a style of its kind; null only
 *  when the widget is not on the canvas. */
export const themeValueOf = (componentId, component, paramName) => {
  const root = componentId ? document.getElementById(componentId) : null;
  if (!root) return null;
  return drawnThemeValue(componentId, component, paramName) ?? fallbackValue(root, paramName);
};

// The theme's colour tokens a drawn colour may be (the ones the Theme tab lists, --cc-<type>-<category>), the kind
// that suits the field first: a background is more likely a surface than a text colour of the same value.
const PREFERRED_CATEGORY = { backgroundColor: 'surface', borderTopColor: 'border', color: 'text' };
const themeTokens = (root) => {
  const names = new Set();
  for (const element of [root, document.documentElement]) {
    const computed = getComputedStyle(element);
    // The Theme tab's names only (--cc-surface1-surface, --cc-primary-brand): not the numbered text aliases
    // (--cc-0-text) or the light/dark/strong variants of a colour.
    for (let i = 0; i < computed.length; i++)
      if (/^--cc-[a-z][a-zA-Z0-9]*-[a-zA-Z]+$/.test(computed[i])) names.add(computed[i]);
  }
  return [...names];
};
/** The theme token (`var(--cc-surface1-surface)`) whose colour the widget draws for a blank colour style, or null. */
export const themeTokenOf = (componentId, paramName, drawn) => {
  const root = componentId ? document.getElementById(componentId) : null;
  if (!root || !drawn || /radius|size|width|gap|padding|height|thickness/i.test(paramName)) return null;
  const property = propertyFor(paramName);
  const target = colorText(drawn);
  if (!/^#/.test(target)) return null;
  const preferred = PREFERRED_CATEGORY[property];
  const matches = themeTokens(root).filter((name) => colorText(computeIn(root, `var(${name})`, property)) === target);
  const best = matches.find((name) => preferred && name.endsWith(`-${preferred}`)) ?? matches[0];
  return best ? `var(${best})` : null;
};

const readTheme = (enabled, componentId, component, paramName) => {
  if (!enabled) return null;
  const value = themeValueOf(componentId, component, paramName);
  return { value, token: themeTokenOf(componentId, paramName, value) };
};

const sameTheme = (a, b) => a === b || (!!a && !!b && a.value === b.value && a.token === b.token);

/**
 * themeValueOf (and the theme token it is), read as the field first draws (so the colour picker opens on that token),
 * and again after the canvas paints whenever the field renders or the widget's resolved properties or the app theme
 * change: a field that stayed mounted kept its first value (a Button made destructive still showed its blue, a theme
 * radius of 16 still showed 4). Reads that find the same value change nothing, so this never loops.
 */
// darkMode is kept in the signature for callers; a theme switch re-renders the field, which re-reads.
// eslint-disable-next-line no-unused-vars
export const useThemeValue = (enabled, componentId, component, paramName, darkMode) => {
  const [found, setFound] = useState(() => readTheme(enabled, componentId, component, paramName));
  // Re-rendered by what redraws the widget: its resolved properties and styles (a bound variant), and the app theme.
  useStore((state) =>
    enabled && componentId ? state.resolvedStore?.modules?.canvas?.components?.[componentId] : null
  );
  useStore((state) => state.globalSettings?.theme);
  useEffect(() => {
    const read = () => {
      const next = readTheme(enabled, componentId, component, paramName);
      setFound((current) => (sameTheme(current, next) ? current : next));
    };
    read();
    if (!enabled) return undefined;
    // After the canvas has painted the change: two frames, the first being the one that applies it. A colour that
    // eases to its new value (a Button's variant change) is read again once its transition ends.
    let second;
    const first = requestAnimationFrame(() => {
      read();
      second = requestAnimationFrame(read);
    });
    const root = componentId ? document.getElementById(componentId) : null;
    root?.addEventListener('transitionend', read);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      root?.removeEventListener('transitionend', read);
    };
  });
  return found;
};

/** A colour react-color's picker can start from (it reads hex and rgb, not oklch or color-mix results). */
export const pickerColor = (color) => {
  const text = colorText(color);
  return /^#/.test(text) ? text : undefined;
};

/** A drawn colour as the swatch's value text: hex for Chrome's computed forms, rgb()/rgba() and color(srgb ...) (what a
 *  theme token mixed with color-mix() computes to), else as drawn. */
export const colorText = (color) => {
  if (typeof color !== 'string') return '';
  const rgb = color.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/);
  const srgb = color.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/);
  if (!rgb && !srgb) return color;
  const channels = rgb ? rgb.slice(1, 4).map(Number) : srgb.slice(1, 4).map((part) => Number(part) * 255);
  const alphaText = (rgb ?? srgb)[4];
  const alpha = alphaText === undefined ? 1 : Number(alphaText);
  const hex = channels.map((part) =>
    Math.round(Math.min(255, Math.max(0, part)))
      .toString(16)
      .padStart(2, '0')
  );
  if (alpha < 1)
    hex.push(
      Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')
    );
  return `#${hex.join('').toUpperCase()}`;
};
