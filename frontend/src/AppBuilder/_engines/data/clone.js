import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { isFeatureEnabled } from '../features';
import { footprintOf } from './freeze';
import { ensure } from './memory';

// What copying `value` will take, when known: its own size, or the sizes of the large values right inside it (a
// query's `data` and `rawData`).
const copyCost = (value) => {
  if (value === null || typeof value !== 'object') return 0;
  const own = footprintOf(value);
  if (own !== undefined) return own;
  let total = 0;
  for (const key in value) total += footprintOf(value[key]) ?? 0;
  return total;
};

/**
 * `obj` for user code (a RunJS script, a transformation) that may change what it reads: reads, writes and deletes
 * behave as on `deepClone(obj)`, but each top-level value is copied only when first read — a script reading one query
 * doesn't copy every query's data. A copy that wouldn't fit in the tab's memory throws a MemoryBudgetError naming it
 * (`label` + key, eg. "queries.restapi1") instead of crashing the tab.
 */
export const lazyCopies = (obj, label) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (!isFeatureEnabled('user-copies')) return deepClone(obj);
  const copy = {};
  for (const key of Object.keys(obj)) {
    let value;
    let copied = false;
    Object.defineProperty(copy, key, {
      enumerable: true,
      configurable: true,
      get() {
        if (!copied) {
          const source = obj[key];
          ensure(copyCost(source), `A copy of ${label}.${key} for this script`);
          value = deepClone(source);
          copied = true;
        }
        return value;
      },
      set(next) {
        value = next;
        copied = true;
      },
    });
  }
  return copy;
};
