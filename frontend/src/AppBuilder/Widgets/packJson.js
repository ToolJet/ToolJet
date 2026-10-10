// Shared by the component packs (experiment), with no React or store imports so pure models can use it.

/** JSON.stringify that never throws: a value bound to a property can be circular (a JS query's result) or hold a
 *  BigInt. A repeated object becomes '[Circular]' and a BigInt its digits; undefined stays undefined, as in JSON. */
export const stringify = (value, space) => {
  try {
    return JSON.stringify(value, null, space);
  } catch {
    const seen = new WeakSet();
    try {
      return JSON.stringify(
        value,
        (key, v) => {
          if (typeof v === 'bigint') return String(v);
          if (v !== null && typeof v === 'object') {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
          }
          return v;
        },
        space
      );
    } catch {
      return '';
    }
  }
};
