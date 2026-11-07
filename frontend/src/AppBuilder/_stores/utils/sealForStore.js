/**
 * Lets Immer store a large value without visiting every node of it.
 *
 * When a recipe assigns a value Immer has not seen before, finalize walks all of it looking for drafts and
 * deep-freezes every object on the way (immer 9 finalizeProperty). The walk stops at anything already frozen. A value
 * computed outside the recipe (a resolved binding, a widget's exposed value, a query result) cannot hold a draft, so
 * freezing its top level is enough: Immer skips it and the write costs the same for 10 rows as for 10k. Without this,
 * every 10k-row binding paid a full walk at load and again on every re-resolve.
 *
 * Only arrays and plain objects are frozen, which Immer would have frozen anyway. Class instances (moment, Date, Map)
 * are left alone: some of them mutate themselves lazily, and Immer does not walk them either.
 *
 * The one difference from Immer's own freeze: objects nested inside the value are no longer frozen.
 */
export function sealForStore(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  if (Array.isArray(value)) return Object.freeze(value);
  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) return Object.freeze(value);
  return value;
}

/** sealForStore on each value of a plain map, e.g. { data, rawData } or { properties, styles }. Returns the map. */
export function sealValuesForStore(values) {
  if (values && typeof values === 'object') Object.values(values).forEach(sealForStore);
  return values;
}
