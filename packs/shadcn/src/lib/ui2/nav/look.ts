import type { CSSProperties } from 'react';

// UI 2.0's style variables (Ui2/_shared/looks): each set style becomes one CSS variable on the widget's root (and on
// its popup content), read by the ui2-nav.css classes with the app theme as the fallback. Unset styles stay unset.

// ui.css's fallbacks for ToolJet theme tokens (as themeVars): the sandboxed iframe runtime has no --cc-* variables.
const FALLBACKS: Record<string, string> = {
  '--cc-primary-brand': '#4368e3',
  '--cc-primary-text': '#1b1f24',
  '--cc-surface1-surface': '#ffffff',
  '--cc-surface2-surface': '#f1f3f5',
  '--cc-placeholder-text': '#6a727c',
  '--cc-default-border': '#d7dbdf',
  '--cc-error-systemStatus': '#d72d39',
  '--cc-success-systemStatus': '#1e823b',
};

const withFallback = (value: string) =>
  value.replace(/var\((--cc-[\w-]+)\)/g, (match, name: string) =>
    FALLBACKS[name] ? `var(${name}, ${FALLBACKS[name]})` : match
  );

export const isSet = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

/** A length: a number (or numeric text) in px, anything else as written. */
export const px = (value: unknown): string => {
  const n = Number(value);
  return typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(n))
    ? `${n}px`
    : String(value);
};

/** One entry: the style's value, the variable(s) it sets, and how to write it. */
export type LookEntry = [value: unknown, vars: string | string[], toCss?: (value: unknown) => string];

export const lookVars = (entries: LookEntry[]): CSSProperties => {
  const out: Record<string, string> = {};
  for (const [value, vars, toCss] of entries) {
    if (!isSet(value)) continue;
    const css = withFallback(toCss ? toCss(value) : String(value));
    for (const name of Array.isArray(vars) ? vars : [vars]) out[name] = css;
  }
  // An accent re-derives the focus ring, which ui.css derives from --ui-primary where it is declared.
  if (out['--ui-primary']) out['--ui-ring'] = `color-mix(in srgb, ${out['--ui-primary']} 35%, transparent)`;
  return out as CSSProperties;
};
