import type { CSSProperties } from 'react';
import { TJ } from './sdk';
import { themeVars } from '../../themeVars';
import { TOKEN, unlessDefault } from '../../styleDefaults';

// UI 2.0's styles for the inputs (Ui2/_shared/looks: entries.ts FIELD, inputs.ts, pickers.ts), with its style names
// and Inspector labels. Each style sets a CSS variable on the component's root (and on its popup) that
// styles/ui2-inputs.css reads with the theme as the fallback, so an unset style keeps the theme's look.

/** [style name, Inspector label, CSS variable ('accent': the focus ring and selection), what it draws unset]: a colour's
 *  theme token (styleDefaults TOKEN), or for a size 'px' (it follows the theme radius) or the px number it draws. */
export type Look = [name: string, label: string, cssVar: string, drawn?: string | number];

const isPx = (drawn: Look[3]) => drawn === 'px' || typeof drawn === 'number';

export const FIELD: Look[] = [
  ['labelColor', 'Label color', '--lk-label', TOKEN.text],
  ['helpTextColor', 'Help text color', '--lk-help', TOKEN.mutedText],
  ['backgroundColor', 'Field background', '--lk-bg', TOKEN.surface],
  ['textColor', 'Field text color', '--lk-fg', TOKEN.text],
  ['placeholderColor', 'Placeholder color', '--lk-placeholder', TOKEN.mutedText],
  ['borderColor', 'Field border color', '--lk-border', TOKEN.border],
  ['accentColor', 'Accent (focus ring, selection)', 'accent', TOKEN.brand],
  ['errorColor', 'Error color (message and border)', '--lk-error', TOKEN.error],
  ['borderRadius', 'Field radius', '--lk-radius', 'px'],
];

/** A list opening from a field (the Phone and Currency pickers). */
export const POPOVER: Look[] = [
  ['popoverBackgroundColor', 'Popover background', '--lk-pop-bg', TOKEN.surface],
  ['popoverTextColor', 'Popover text color', '--lk-pop-fg', TOKEN.text],
  ['hoverColor', 'Popover item hover background', '--lk-pop-hover', TOKEN.muted],
  // inherit: the selected row's text, the brand fill's text colour
  ['selectedTextColor', 'Selected item text color (on the accent)', '--lk-pop-selected', TOKEN.surface],
];

/** FIELD with some labels as the widget words them. */
export const field = (labels: Record<string, string> = {}, omit: string[] = []): Look[] =>
  FIELD.filter(([name]) => !omit.includes(name)).map(([name, label, cssVar, drawn]) => [name, labels[name] ?? label, cssVar, drawn]);

const isSet = (v: unknown) => v !== undefined && v !== null && v !== '';

/** Declares the styles (in this order, every render) and returns the CSS variables for the set ones. */
export const useLooks = (looks: Look[]): CSSProperties => {
  const vars: Record<string, string> = {};
  let accent: string | undefined;
  for (const [name, label, cssVar, drawn] of looks) {
    // The list is fixed per component, so the hook order is too. Each declares what it draws unset as its default
    // and reads back '' at that default, so the look is unchanged. A theme radius has no number: no default (a ''
    // default was saved on drop as {{""}}, code in an invalid field), and the field's placeholder says so.
    const px = isPx(drawn);
    const initialValue = drawn === undefined || drawn === 'px' ? '' : drawn;
    const raw = px
      ? TJ.useStyleNumber({ name, label, ...(drawn === 'px' ? { placeholder: 'Theme radius' } : { initialValue: initialValue as number }) })
      : TJ.useStyleString({ name, label, inspector: 'color', initialValue: initialValue as string });
    const value = unlessDefault(raw ?? '', initialValue);
    if (!isSet(value)) continue;
    if (cssVar === 'accent') accent = String(value);
    else if (px) {
      if (!Number.isNaN(Number(value))) vars[cssVar] = `${Number(value)}px`;
    } else vars[cssVar] = String(value);
  }
  return { ...themeVars({ primary: accent }), ...vars } as CSSProperties;
};
