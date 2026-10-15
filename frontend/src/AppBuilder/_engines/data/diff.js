/**
 * What changed from `lhs` to `rhs`: `{}` when nothing did, `rhs` itself when either isn't an object (or a Date changed),
 * else an object (with no prototype) of the changed keys — added and updated keys with their new value or nested
 * difference, deleted keys as `undefined`. The same result as deep-object-diff's `diff`, which this replaces.
 */
const isObject = (value) => value != null && typeof value === 'object';
const isDate = (value) => value instanceof Date;
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isEmptyObject = (value) => isObject(value) && Object.keys(value).length === 0;

export const diff = (lhs, rhs) => {
  if (lhs === rhs) return {};
  if (!isObject(lhs) || !isObject(rhs)) return rhs;

  const changes = Object.create(null);
  for (const key of Object.keys(lhs)) if (!has(rhs, key)) changes[key] = undefined;

  if (isDate(lhs) || isDate(rhs)) return lhs.valueOf() == rhs.valueOf() ? {} : rhs; // eslint-disable-line eqeqeq

  for (const key of Object.keys(rhs)) {
    if (!has(lhs, key)) {
      changes[key] = rhs[key];
      continue;
    }
    const difference = diff(lhs[key], rhs[key]);
    // No difference, and the left side was empty or the right side isn't: nothing to report for this key.
    if (isEmptyObject(difference) && !isDate(difference) && (isEmptyObject(lhs[key]) || !isEmptyObject(rhs[key]))) {
      continue;
    }
    changes[key] = difference;
  }
  return changes;
};
