import { isEqual } from 'lodash';

// Pairs of frozen values already found equal: frozen values never change, so the answer stays true.
const provenEqual = new WeakMap();

const isFrozenObject = (value) => value !== null && typeof value === 'object' && Object.isFrozen(value);

/**
 * Whether `a` and `b` have the same content — exactly lodash's `isEqual` — remembering pairs of frozen values found
 * equal, so comparing the same two store values again (on every render, every resolution) doesn't walk them again.
 */
export const sameValue = (a, b) => {
  if (Object.is(a, b)) return true;
  const frozenPair = isFrozenObject(a) && isFrozenObject(b);
  if (frozenPair && provenEqual.get(a)?.has(b)) return true;
  const equal = isEqual(a, b);
  if (equal && frozenPair) {
    let known = provenEqual.get(a);
    if (!known) provenEqual.set(a, (known = new WeakSet()));
    known.add(b);
  }
  return equal;
};

/**
 * Whether an exposed value is unchanged (then it isn't written and nothing that depends on it updates): exactly
 * `sameValue`. Arrays are compared element by element, by identity first: a rebuilt array of the same rows (a Table's
 * filteredData) is found equal without reading the rows; only elements that differ are compared by content.
 */
export const sameExposedValue = (next, current) => {
  if (Object.is(next, current)) return true;
  if (Array.isArray(next) && Array.isArray(current)) {
    if (next.length !== current.length) return false;
    for (let i = 0; i < next.length; i++) {
      if (!Object.is(next[i], current[i]) && !sameValue(next[i], current[i])) return false;
    }
    return true;
  }
  return sameValue(next, current);
};
