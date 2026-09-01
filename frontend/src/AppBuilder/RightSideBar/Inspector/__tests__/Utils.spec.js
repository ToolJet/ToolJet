/**
 * Pure unit tests for `validateStaticId` (src/AppBuilder/RightSideBar/Inspector/Utils.js).
 *
 * `validateStaticId` is the shared validator behind both the Navigation
 * widget's item ids (useMenuItemsManager.validateItemId) and the Tabs
 * widget's tab ids (TabComponent.validateTabId) — see the header comment on
 * the source function for why a `{{ }}` binding must be rejected outright
 * (ids are compared with plain equality at runtime, never resolved).
 *
 * No store import, zero mocks — a plain function in, tuple out.
 */
// Utils.js's other exports (renderElement/renderCustomStyles/renderQuerySelector) pull in the
// full CodeHinter -> ee AiBuilder -> @mdxeditor/editor chain, which Jest isn't set up to
// transform (ESM-only). `validateStaticId` never touches any of that, so this stubs the one
// heavy, unrelated import just to let the module load — it does not touch the logic under test.
jest.mock('../Elements/Code', () => ({ Code: () => null }));
jest.mock('../Components/Form/_components', () => ({ LabeledDivider: () => null }));

import { validateStaticId } from '../Utils';

describe('validateStaticId', () => {
  describe('empty/blank values', () => {
    test('null is invalid with the default empty message', () => {
      expect(validateStaticId(null)).toEqual([false, 'ID cannot be empty']);
    });

    test('undefined is invalid with the default empty message', () => {
      expect(validateStaticId(undefined)).toEqual([false, 'ID cannot be empty']);
    });

    test('an empty string is invalid', () => {
      expect(validateStaticId('')).toEqual([false, 'ID cannot be empty']);
    });

    test('a whitespace-only string is invalid', () => {
      expect(validateStaticId('   ')).toEqual([false, 'ID cannot be empty']);
    });

    test('a custom emptyMessage override is used instead of the default', () => {
      const [isValid, message] = validateStaticId('', [], null, { emptyMessage: 'Tab ID cannot be empty' });
      expect(isValid).toBe(false);
      expect(message).toBe('Tab ID cannot be empty');
    });
  });

  describe('dynamic bindings', () => {
    test('a full binding like {{foo}} is invalid with the default binding message', () => {
      expect(validateStaticId('{{foo}}')).toEqual([
        false,
        'ID cannot contain a dynamic binding ({{ }}). Use a plain, static value.',
      ]);
    });

    test('a malformed/partial binding is still rejected', () => {
      const [isValid, message] = validateStaticId('{{components.codeeditor1.}}');
      expect(isValid).toBe(false);
      expect(message).toBe('ID cannot contain a dynamic binding ({{ }}). Use a plain, static value.');
    });

    test('a custom bindingMessage override is used instead of the default', () => {
      const [isValid, message] = validateStaticId('{{foo}}', [], null, {
        bindingMessage: 'Tab ID cannot contain a dynamic binding ({{ }}). Use a plain, static value.',
      });
      expect(isValid).toBe(false);
      expect(message).toBe('Tab ID cannot contain a dynamic binding ({{ }}). Use a plain, static value.');
    });
  });

  describe('duplicates', () => {
    test('a value equal to another id in existingIds is invalid', () => {
      const [isValid, message] = validateStaticId('item2', ['item1', 'item2', 'item3'], 'item1');
      expect(isValid).toBe(false);
      expect(message).toBe('ID must be unique. This ID is already used by another item.');
    });

    test('a custom duplicateMessage override is used instead of the default', () => {
      const [isValid, message] = validateStaticId('t1', ['t0', 't1'], 't0', {
        duplicateMessage: 'Tab ID must be unique. This ID is already used by another tab.',
      });
      expect(isValid).toBe(false);
      expect(message).toBe('Tab ID must be unique. This ID is already used by another tab.');
    });

    test('a value equal to currentId itself is valid — not flagged as a duplicate of itself', () => {
      // currentId is the item's OWN (unchanged) id, which is naturally also present
      // in existingIds. Renaming an item to its own current name must not error.
      expect(validateStaticId('item1', ['item1', 'item2'], 'item1')).toEqual([true, null]);
    });
  });

  describe('valid values', () => {
    test('a unique, non-empty, non-binding value is valid', () => {
      expect(validateStaticId('newItem', ['item1', 'item2'], 'item3')).toEqual([true, null]);
    });

    test('leading/trailing whitespace is trimmed before the duplicate check', () => {
      expect(validateStaticId('  item2  ', ['item1', 'item2'], 'item1')).toEqual([
        false,
        'ID must be unique. This ID is already used by another item.',
      ]);
    });
  });
});
