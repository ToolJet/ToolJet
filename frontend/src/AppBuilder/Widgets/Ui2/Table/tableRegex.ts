// ToolJet UI 2.0 Table: the regex conditions (matches, does not match) of filters, conditional styles and button
// rules. A pattern is matched with bounded work (boundedRegex), with i, on the cell's text in lower case. When it cannot
// be checked on some row of a dataset (too complex for the work budget, or unsupported), the rule holds for no row of
// that dataset, whatever the row order: a filter keeps no row, a style applies to no cell and a button rule disables or
// hides no button. Whether a pattern can be checked depends on the text, so that verdict belongs to one evaluation of
// one dataset (regexResults, screenRegexRules in tableModel) and never to the pattern: another Table, or this one after
// a refetch, checks its own rows. The Table warns once per pattern.
import { boundedRegex, warnRegexOutcome } from '@/AppBuilder/Widgets/Ui2/_shared/boundedRegex';
import type { BoundedRegex, RegexOutcome } from '@/AppBuilder/Widgets/Ui2/_shared/boundedRegex';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { isEmptyValue } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** The patterns of a dataset's rules that could not be checked on some of its rows (patternKey of each). */
export type UncheckedPatterns = ReadonlySet<string>;

/** A cell's value as the text conditions compare it: in lower case, objects as JSON. */
export const cellText = (value: unknown): string =>
  (isEmptyValue(value) ? '' : typeof value === 'object' ? stringify(value) : String(value)).toLowerCase();

const tableRegex = (pattern: unknown) =>
  boundedRegex(pattern instanceof RegExp ? pattern.source : pattern === undefined ? '' : String(pattern), 'i');

const keyOf = (re: BoundedRegex) => `${re.flags}/${re.source}`;

/** How UncheckedPatterns names a rule's pattern; null for an invalid one. */
export const patternKey = (pattern: unknown): string | null => {
  const re = tableRegex(pattern);
  return re ? keyOf(re) : null;
};

const warnUnchecked = (re: BoundedRegex, outcome: RegexOutcome) =>
  warnRegexOutcome('Table', re, outcome, 'so its rule holds for no row');

/** Whether a matches rule (negated: does not match) holds for a cell's text. An invalid pattern matches nothing; a
 *  pattern in `unchecked` (its dataset's screen) holds for no cell, nor does one that cannot be checked on this text. */
export const regexHolds = (
  pattern: unknown,
  text: string,
  negated: boolean,
  unchecked?: UncheckedPatterns
): boolean => {
  const re = tableRegex(pattern);
  if (!re) return negated;
  if (unchecked?.has(keyOf(re))) return false;
  const outcome = re.match(text);
  if (typeof outcome === 'boolean') return outcome !== negated;
  warnUnchecked(re, outcome);
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
  const results: boolean[] = [];
  for (const row of rows) {
    const outcome = re.match(cellText(valueOf(row)));
    if (typeof outcome !== 'boolean') {
      warnUnchecked(re, outcome);
      return null;
    }
    results.push(outcome);
  }
  return results;
};
