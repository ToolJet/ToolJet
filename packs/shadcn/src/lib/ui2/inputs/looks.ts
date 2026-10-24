import type { CSSProperties } from 'react';
import { TJ } from './sdk';
import { themeVars } from '../../themeVars';

// UI 2.0's styles for the inputs (Ui2/_shared/looks: entries.ts FIELD, inputs.ts, pickers.ts), with its style names
// and Inspector labels. Each style sets a CSS variable on the component's root (and on its popup) that
// styles/ui2-inputs.css reads with the theme as the fallback, so an unset style keeps the theme's look.

/** [style name, Inspector label, CSS variable ('accent': the focus ring and selection), 'px' for a size]. */
export type Look = [name: string, label: string, cssVar: string, kind?: 'px'];

export const FIELD: Look[] = [
  ['labelColor', 'Label color', '--lk-label'],
  ['helpTextColor', 'Help text color', '--lk-help'],
  ['backgroundColor', 'Field background', '--lk-bg'],
  ['textColor', 'Field text color', '--lk-fg'],
  ['placeholderColor', 'Placeholder color', '--lk-placeholder'],
  ['borderColor', 'Field border color', '--lk-border'],
  ['accentColor', 'Accent (focus ring, selection)', 'accent'],
  ['errorColor', 'Error color (message and border)', '--lk-error'],
  ['borderRadius', 'Field radius', '--lk-radius', 'px'],
];

/** A list opening from a field (the Phone and Currency pickers). */
export const POPOVER: Look[] = [
  ['popoverBackgroundColor', 'Popover background', '--lk-pop-bg'],
  ['popoverTextColor', 'Popover text color', '--lk-pop-fg'],
  ['hoverColor', 'Popover item hover background', '--lk-pop-hover'],
  ['selectedTextColor', 'Selected item text color (on the accent)', '--lk-pop-selected'],
];

/** FIELD with some labels as the widget words them. */
export const field = (labels: Record<string, string> = {}, omit: string[] = []): Look[] =>
  FIELD.filter(([name]) => !omit.includes(name)).map(([name, label, cssVar, kind]) => [name, labels[name] ?? label, cssVar, kind]);

const isSet = (v: unknown) => v !== undefined && v !== null && v !== '';

/** Declares the styles (in this order, every render) and returns the CSS variables for the set ones. */
export const useLooks = (looks: Look[]): CSSProperties => {
  const vars: Record<string, string> = {};
  let accent: string | undefined;
  for (const [name, label, cssVar, kind] of looks) {
    // The list is fixed per component, so the hook order is too.
    const value =
      kind === 'px'
        ? TJ.useStyleNumber({ name, label, initialValue: '' })
        : TJ.useStyleString({ name, label, inspector: 'color', initialValue: '' });
    if (!isSet(value)) continue;
    if (cssVar === 'accent') accent = String(value);
    else if (kind === 'px') {
      if (!Number.isNaN(Number(value))) vars[cssVar] = `${Number(value)}px`;
    } else vars[cssVar] = String(value);
  }
  return { ...themeVars({ primary: accent }), ...vars } as CSSProperties;
};
