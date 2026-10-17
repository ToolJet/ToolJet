import type { Option, OptionValue } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';

// How many choices a select, radio group or toggle group draws: a 10,000-option binding froze the page.

// Radios and toggle buttons are laid out on the widget: past this many, a bound list is a mistake that froze the page.
export const MAX_CHOICES = 100;

/** The options a widget draws: the first `max`, plus the selected one wherever it is (actions still reach them all). */
export const shownOptions = <T>(options: T[], selected: T | null | undefined, max: number): T[] => {
  const shown = options.slice(0, max);
  if (selected && !shown.includes(selected)) shown.push(selected);
  return shown;
};

/** The key a select, radio group or toggle group starts on: its default value as text, '' for none. */
export const defaultKey = (v: unknown): string => (v === '' || v === undefined ? '' : String(v));

/** Options by key: String(value), unless the widget keys its items its own way. */
export const optionsByKey = (options: Option[], keyOf: (v: OptionValue) => string = String): Map<string, Option> =>
  new Map(options.map((o) => [keyOf(o.value), o]));
