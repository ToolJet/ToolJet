import { reservedKeywordReplacer } from '@/_lib/reserved-keyword-replacer';
import { stringifyBounded } from '@/AppBuilder/_engines/data/bounded';

/**
 * Decides which editor the query panel body should mount for the selected query.
 *
 * Returns a decision, not a component, so the choice can be unit-tested without
 * pulling in the query editor bundle. `QueryManagerBody` maps it:
 *   'none'    -> render nothing
 *   'plugin'  -> the generic operations.json-driven DynamicForm
 *   'builtin' -> allSources[componentName]
 */
export const resolveQueryEditor = ({ selectedDataSource, selectedQuery }) => {
  // Dummy DS = stub options + maybe no plugin relation. Mounting editor crashes:
  // built-ins read undefined options.X.value, unbundled kinds → allSources[Kind] = undefined.
  // is_dummy warning in the panel already tells user to pull.
  if (selectedDataSource?.is_dummy === true) return { type: 'none' };

  if (selectedDataSource?.plugin_id) return { type: 'plugin' };

  const kind = selectedQuery?.kind;
  return {
    type: 'builtin',
    componentName: kind?.charAt(0).toUpperCase() + kind?.slice(1),
  };
};

/** Above this many characters of JSON, the query preview no longer copies the result (see previewOf). */
export const PREVIEW_TEXT_LIMIT = 20000000;
/** How much of a result above that limit the Raw tab shows, in characters. */
export const PREVIEW_TRUNCATED_LENGTH = 100000;

/**
 * What the query preview shows for a result: `raw` for the Raw tab and `tree` for the JSON tab.
 *
 * Up to `limit` characters of JSON this is what the preview always showed: the text of
 * `JSON.stringify(value, reservedKeywordReplacer)`, and the tree of its parsed copy. A larger result can't be written out
 * at all (past ~500 MB of text the browser refuses, and the tab runs out of memory first), so `truncated` is true, `raw`
 * is the first `PREVIEW_TRUNCATED_LENGTH` characters of the text, and the tree shows the result itself; the JSON tab
 * hides the page's own objects with `reservedKeywordReplacer`. Circular references are written as "[Circular]" instead
 * of failing.
 */
export const previewOf = (value, limit = PREVIEW_TEXT_LIMIT) => {
  if (value === null || typeof value !== 'object') {
    return { raw: value ? value.toString() : value === null ? '' : `${value}`, tree: value, truncated: false };
  }
  const { text, truncated } = stringifyBounded(value, limit, reservedKeywordReplacer);
  if (truncated) return { raw: text.slice(0, Math.min(limit, PREVIEW_TRUNCATED_LENGTH)), tree: value, truncated };
  return { raw: text ?? '', tree: text === undefined ? undefined : JSON.parse(text), truncated };
};
