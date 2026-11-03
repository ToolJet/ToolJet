/** @group platform */
import { decamelizeKeysExcept } from '@helpers/utils.helper';

describe('decamelizeKeysExcept', () => {
  it('should decamelize keys recursively, except the ones listed', () => {
    expect(decamelizeKeysExcept({ someKey: { nestedKey: 1 }, keepMe: { alsoNested: 2 } }, ['keepMe'])).toEqual({
      some_key: { nested_key: 1 },
      keepMe: { alsoNested: 2 },
    });
  });

  // Regression: a Date has no own enumerable properties, so the `for...in` loop used to turn any
  // Date value into `{}` - e.g. an entity's createdAt/updatedAt column reaching this function
  // through a route's response. humps' decamelizeKeys (the sibling helper this function wraps)
  // already special-cases Date for exactly this reason.
  it('should leave a Date value untouched, not turn it into {}', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    expect(decamelizeKeysExcept({ createdAt }, [])).toEqual({ created_at: createdAt });
  });

  it('should leave a Date value untouched when nested inside an array', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    expect(decamelizeKeysExcept([{ createdAt }], [])).toEqual([{ created_at: createdAt }]);
  });
});
