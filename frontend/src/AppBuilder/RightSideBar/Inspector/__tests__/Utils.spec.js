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

import { validateStaticId, isClickInsidePortaledOverlay, shouldClearLegacyInvalidDates } from '../Utils';

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

// Regression for: rejecting a Nav item's Id as a duplicate grows CodeHinter's own
// preview/error popover (an Alert banner, portaled to document.body outside the
// "Edit menu item" popup's own DOM subtree). A click landing on that portal was
// misread as "outside" the popup, closing it — and once the popup's DOM disappeared,
// the same click's mouseup went on to deselect the whole widget on the canvas.
describe('isClickInsidePortaledOverlay', () => {
  test('a click inside the codehinter preview/error popover is treated as inside', () => {
    const popover = document.createElement('div');
    popover.id = 'codehinter-preview-box-popover';
    const target = document.createElement('span');
    popover.appendChild(target);
    document.body.appendChild(popover);

    expect(isClickInsidePortaledOverlay(target)).toBe(true);

    document.body.removeChild(popover);
  });

  test('a click on an unrelated element is not treated as inside a known portal', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    expect(isClickInsidePortaledOverlay(target)).toBe(false);

    document.body.removeChild(target);
  });
});

// DaterangePicker legacy components are migrated with
// `properties.legacyInvalidDates = {{true}}` so their historical "Invalid date"
// exposures keep working. The opt-in moment is the user explicitly editing the
// widget's date data — Default start date, Default end date, or Format — in
// the inspector: the flag is cleared and the component keeps the corrected
// exposure from then on. The flag is only ever cleared, never set back, and
// components without the flag (new ones) are left untouched. Unrelated
// properties, style edits (e.g. label alignment), and fx-mode toggles must not
// clear it.
describe('shouldClearLegacyInvalidDates', () => {
  const legacyDefinition = { properties: { legacyInvalidDates: { value: '{{true}}' } } };

  const change = (overrides = {}) => ({
    componentType: 'DaterangePicker',
    paramName: 'defaultStartDate',
    paramType: 'properties',
    attr: 'value',
    definition: legacyDefinition,
    ...overrides,
  });

  test('editing Default start date on a legacy DaterangePicker clears the flag', () => {
    expect(shouldClearLegacyInvalidDates(change())).toBe(true);
  });

  test('editing Default end date clears the flag', () => {
    expect(shouldClearLegacyInvalidDates(change({ paramName: 'defaultEndDate' }))).toBe(true);
  });

  test('editing Format clears the flag', () => {
    expect(shouldClearLegacyInvalidDates(change({ paramName: 'format' }))).toBe(true);
  });

  test('a style edit such as label alignment never touches the flag', () => {
    expect(shouldClearLegacyInvalidDates(change({ paramName: 'alignment', paramType: 'styles', value: 'side' }))).toBe(
      false
    );
  });

  test('editing an unrelated property (label) does not clear the flag', () => {
    expect(shouldClearLegacyInvalidDates(change({ paramName: 'label' }))).toBe(false);
  });

  test('toggling fx mode on a date property is not a value edit and does not clear the flag', () => {
    expect(shouldClearLegacyInvalidDates(change({ attr: 'fxActive' }))).toBe(false);
  });

  test('a new component without the flag is left untouched', () => {
    expect(shouldClearLegacyInvalidDates(change({ definition: { properties: {} } }))).toBe(false);
  });

  test('a definition without properties is left untouched', () => {
    expect(shouldClearLegacyInvalidDates(change({ definition: {} }))).toBe(false);
  });

  test('an already-cleared flag is not rewritten by further date edits', () => {
    const cleared = { properties: { legacyInvalidDates: { value: '{{false}}' } } };
    expect(shouldClearLegacyInvalidDates(change({ definition: cleared }))).toBe(false);
  });

  test('other component types are never affected', () => {
    expect(shouldClearLegacyInvalidDates(change({ componentType: 'DatetimePickerV2' }))).toBe(false);
  });
});
