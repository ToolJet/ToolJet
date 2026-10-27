/**
 * Whether a property value can be kept as it is when it is validated — the check that lets a dataset bound to a
 * component skip superstruct's `create`, which copies every row (500k rows: ~150 ms per pass, a few ms here).
 */

// Below the top level, primitives aren't coerced (generateSchemaFromValidationDefinition), so a type check answers.
const PRIMITIVES = {
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && !isNaN(v),
  boolean: (v) => typeof v === 'boolean',
};

const quickShape = (definition, nested = false) => {
  if (!definition || definition.size || definition.pattern) return false;
  if (definition.type === 'object') return !(definition.object && Object.keys(definition.object).length);
  if (definition.type === 'array') return !definition.element?.type || quickShape(definition.element, true);
  if (definition.type === 'union')
    return !!definition.schemas?.length && definition.schemas.every((s) => quickShape(s, true));
  return nested && definition.type in PRIMITIVES;
};

const isPlainObject = (value) => {
  if (typeof value !== 'object' || value === null) return false;
  // Not a null-prototype object either: the copy superstruct makes has Object's methods (`row.hasOwnProperty`).
  return Object.getPrototypeOf(value) === Object.prototype;
};

// Whether superstruct accepts `value` once converted (`type({})` takes any object), and whether it keeps it unconverted.
// A union takes its first part that accepts the value, converted or not, as superstruct's union coercer does.
const check = (definition, value, plain) => {
  if (definition.optional && value === undefined) return true;
  switch (definition.type) {
    case 'object':
      return plain ? isPlainObject(value) : typeof value === 'object' && value !== null;
    case 'union': {
      const part = definition.schemas.find((s) => check(s, value, false));
      return !!part && (!plain || check(part, value, true));
    }
    case 'array': {
      if (!Array.isArray(value)) return false;
      const element = definition.element;
      if (!element?.type) return true;
      for (let i = 0; i < value.length; i++) if (!check(element, value[i], plain)) return false;
      return true;
    }
    default:
      return PRIMITIVES[definition.type](value);
  }
};

const fits = (definition, value) => check(definition, value, true);

// Answers for frozen values (store data never changes), per definition: the same dataset bound to the same property is
// checked once, not on every resolution.
const answers = new WeakMap();

/**
 * Whether `value` can be kept as it is for `definition`, answered with plain loops for the shapes large data has (arrays,
 * plain objects without listed keys, unions of them, nested primitives); `null` for any other definition (ask
 * superstruct). `true` only when superstruct's `create` would return the same content, just copied; `false` when the
 * value doesn't fit, or fits only once converted: `create` spreads every non-plain object it accepts as an object
 * (`[1, 2]` → `{0: 1, 1: 2}`, a Date → `{}`), so those still go through superstruct. 500k rows take ~150 ms through
 * superstruct, a few here.
 */
export const fitsDefinition = (definition, value) => {
  if (!quickShape(definition)) return null;
  const frozen = value !== null && typeof value === 'object' && Object.isFrozen(value);
  if (!frozen) return fits(definition, value);
  let known = answers.get(value);
  if (!known) answers.set(value, (known = new Map()));
  if (!known.has(definition)) known.set(definition, fits(definition, value));
  return known.get(definition);
};
