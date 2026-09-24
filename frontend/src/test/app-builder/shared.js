export function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export function applyDeclaredOverrides(kind, defaults, overrides, allowedKeys) {
  for (const key of Object.keys(overrides)) {
    if (!allowedKeys.includes(key)) throw new Error(`Unknown ${kind} override: ${key}`);
  }
  return { ...defaults, ...overrides };
}
