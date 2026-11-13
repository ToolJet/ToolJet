import type { CSSProperties } from 'react';

// ui.css's own fallbacks for ToolJet theme tokens: the sandboxed iframe runtime has no --cc-* variables.
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

const isSet = (value: unknown): value is string | number => value !== undefined && value !== null && value !== '';

export interface ThemeStyles {
  primary?: string; // filled controls, focus ring, default button/badge
  primaryFg?: string; // text on primary
  bg?: string; // surfaces: inputs, cards, menus
  fg?: string; // text
  muted?: string; // tracks, tab list, selected toggle, avatar fallback
  border?: string;
  radius?: number | string; // px
  buttonColor?: string; // button background in every variant (outline: also border; link: text)
  buttonText?: string; // button text, overriding the variant's
}

// Builder styles (ToolJet.useStyleX values) → the CSS variables ui.css is written against. Set on a
// component's root, and on its popup content, which renders in the separate popup layer.
export const themeVars = ({
  primary,
  primaryFg,
  bg,
  fg,
  muted,
  border,
  radius,
  buttonColor,
  buttonText,
}: ThemeStyles): CSSProperties => {
  const vars: Record<string, string> = {};
  if (isSet(primary)) {
    vars['--ui-primary'] = withFallback(primary);
    // --ui-ring is derived from --ui-primary where it is declared (:host), so it must be re-derived here.
    vars['--ui-ring'] = `color-mix(in srgb, ${withFallback(primary)} 35%, transparent)`;
  }
  if (isSet(primaryFg)) vars['--ui-primary-fg'] = withFallback(primaryFg);
  if (isSet(bg)) vars['--ui-bg'] = withFallback(bg);
  if (isSet(fg)) vars['--ui-fg'] = withFallback(fg);
  if (isSet(muted)) vars['--ui-muted'] = withFallback(muted);
  if (isSet(border)) vars['--ui-border'] = withFallback(border);
  if (isSet(radius) && !Number.isNaN(Number(radius))) vars['--ui-radius'] = `${Number(radius)}px`;
  // Left unset when empty, so each button variant keeps its own colors (see .ui-btn--* in ui.css).
  if (isSet(buttonColor)) vars['--ui-btn-color'] = withFallback(buttonColor);
  if (isSet(buttonText)) vars['--ui-btn-text'] = withFallback(buttonText);
  return vars as CSSProperties;
};
