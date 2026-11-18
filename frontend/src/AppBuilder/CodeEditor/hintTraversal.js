// Pure helpers for building autocomplete hints. No store imports, so any module can use them.

export const ARRAY_HINT_TEMPLATE_THRESHOLD = 10;

/**
 * Recursively traverses an object to produce flat hint entries for autocomplete.
 * Each entry is { hint: 'dotted.path', type: 'Object'|'Array'|'String'|etc }.
 *
 * Mirrors the old createReferencesLookup / buildMap logic from _stores/utils.js.
 * Long arrays use row 0 as a structural template (see ARRAY_HINT_TEMPLATE_THRESHOLD) — avoids
 * traversing thousands of rows.
 */
export function traverseObjectToHints(data, prefix, maxDepth = 3, _depth = 0) {
  const hints = [];
  if (_depth >= maxDepth || data == null || typeof data !== 'object') return hints;

  const keys = Object.keys(data);
  keys.forEach((key) => {
    const value = data[key];
    const _type = Object.prototype.toString.call(value).slice(8, -1);
    const newPath = prefix ? `${prefix}.${key}` : key;

    hints.push({ hint: newPath, type: _type });

    if (_type === 'Object') {
      hints.push(...traverseObjectToHints(value, newPath, maxDepth, _depth + 1));
    } else if (_type === 'Array') {
      const template = value.length >= ARRAY_HINT_TEMPLATE_THRESHOLD ? value[0] : value;
      if (template && typeof template === 'object') {
        hints.push(...traverseObjectToHints(template, newPath, maxDepth, _depth + 1));
      }
    }
  });

  return hints;
}
