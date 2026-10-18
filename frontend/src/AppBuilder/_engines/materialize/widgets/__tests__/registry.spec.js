import { exposureOf } from '../index';

describe('exposureOf', () => {
  it.each(['Text', 'TextInput', 'Button', 'Image'])('returns the module for %s', (type) => {
    const module = exposureOf(type);
    expect(typeof module.initial).toBe('function');
    expect(typeof module.actions).toBe('object');
    expect(Object.values(module.actions).every((action) => typeof action === 'function')).toBe(true);
    expect(Array.isArray(module.liveActions)).toBe(true);
  });

  it('returns undefined for a type without a module', () => {
    expect(exposureOf('Table')).toBeUndefined();
    expect(exposureOf(undefined)).toBeUndefined();
  });
});
