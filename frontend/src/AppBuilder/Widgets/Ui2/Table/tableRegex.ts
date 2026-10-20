// ToolJet UI 2.0 Table: the regex conditions (matches, does not match) of filters, conditional styles and button
// rules. A pattern is matched with bounded work (boundedRegex), with i, on the cell's text in lower case. When it cannot
// be checked on some row (too complex for the work budget, or unsupported), the rule holds for no row, whatever the
// row order: a filter keeps no row and a style applies to no cell. That verdict is kept for the last VERDICT_LIMIT
// patterns, so a re-render does not search again, and the Table warns once per pattern.
import { boundedRegex, warnRegexOutcome } from '@/AppBuilder/Widgets/Ui2/_shared/boundedRegex';
import type { BoundedRegex, RegexOutcome } from '@/AppBuilder/Widgets/Ui2/_shared/boundedRegex';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { isEmptyValue } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** A cell's value as the text conditions compare it: in lower case, objects as JSON. */
export const cellText = (value: unknown): string =>
  (isEmptyValue(value) ? '' : typeof value === 'object' ? stringify(value) : String(value)).toLowerCase();

const tableRegex = (pattern: unknown) =>
  boundedRegex(pattern instanceof RegExp ? pattern.source : pattern === undefined ? '' : String(pattern), 'i');

export const VERDICT_LIMIT = 50;
// Patterns that could not be checked on some row, least recently used first.
const unchecked = new Set<string>();
const keyOf = (re: BoundedRegex) => `${re.flags}/${re.source}`;

const isUnchecked = (re: BoundedRegex): boolean => {
  const key = keyOf(re);
  if (!unchecked.delete(key)) return false;
  unchecked.add(key);
  return true;
};

const markUnchecked = (re: BoundedRegex, outcome: RegexOutcome) => {
  unchecked.add(keyOf(re));
  const oldest = unchecked.values().next().value;
  if (unchecked.size > VERDICT_LIMIT && oldest !== undefined) unchecked.delete(oldest);
  warnRegexOutcome('Table', re, outcome, 'so its rule holds for no row');
};

/** Whether a matches rule (negated: does not match) holds for a cell's text. An invalid pattern matches nothing. */
export const regexHolds = (pattern: unknown, text: string, negated: boolean): boolean => {
  const re = tableRegex(pattern);
  if (!re) return negated;
  if (isUnchecked(re)) return false;
  const outcome = re.match(text);
  if (typeof outcome === 'boolean') return outcome !== negated;
  markUnchecked(re, outcome);
  return false;
};

/** The pattern tested on every row's value: whether each matches; null when it cannot be checked on some row (the
 *  rows after it are not tested), undefined for an invalid pattern. */
export const regexResults = <T>(
  pattern: unknown,
  rows: T[],
  valueOf: (row: T) => unknown
): boolean[] | null | undefined => {
  const re = tableRegex(pattern);
  if (!re) return undefined;
  if (isUnchecked(re)) return null;
  const results: boolean[] = [];
  for (const row of rows) {
    const outcome = re.match(cellText(valueOf(row)));
    if (typeof outcome !== 'boolean') {
      markUnchecked(re, outcome);
      return null;
    }
    results.push(outcome);
  }
  return results;
};
