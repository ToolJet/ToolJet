const other = { z: "z" };
const k = "dyn";
export const s = {
  a: '[data-cy="a"]',
  b: (x) => `[data-cy="b-${x}"]`,
  nested: { c: '[data-cy="c"]' },
  ...other,
  [k]: "x",
};
