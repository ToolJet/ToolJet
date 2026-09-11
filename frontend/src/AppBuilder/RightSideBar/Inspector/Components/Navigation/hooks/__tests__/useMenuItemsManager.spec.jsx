import React from 'react';
import { act } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { useMenuItemsManager } from '../useMenuItemsManager';

const scenario = defineAppBuilderScenario({
  id: 'nav-menu-items-manager-race',
  name: 'useMenuItemsManager same-tick edit race',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {},
});

function TestHost({ component, paramUpdated, onReady }) {
  const api = useMenuItemsManager(component, paramUpdated);
  onReady(api);
  return null;
}

// Regression for: editing a Nav item's Id, then clicking a different field inside
// the same popover (e.g. a toggle) right after, reverted the id back to its old
// value. Two bugs compounded: (1) `handleItemChange` recomputed the next `menuItems`
// from the hook's closed-over state variable, so two same-tick calls (the Id field's
// blur-commit and the other field's click-driven onChange, both firing before React
// re-renders in between) both read the same stale snapshot and the second clobbered
// the first; (2) both calls identified "which item" by `item.id` — itself the field
// being edited — so once the first call renamed it, the second could no longer find
// the item at all. Every field's onChange now identifies its item by the stable
// `_key` (see Tree/SortableTree's getItemKey), and mutations read/write a ref kept
// in sync synchronously so same-tick calls chain instead of racing.
describe('useMenuItemsManager: same-tick edit race', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('an id edit and another field edit landing in the same tick both survive', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: {
            menuItems: {
              value: [{ id: 'item1', _key: 'key-1', label: 'Item 1', visible: { value: false } }],
            },
          },
        },
      },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    // Both calls inside one `act` so React does not re-render between them —
    // reproducing two same-tick DOM events racing on the hook's internal state.
    // Both target the item by its stable `_key` ('key-1'), exactly as every field's
    // onChange in NavItemPopover does — not by `id`, which the first call renames.
    act(() => {
      api.handleItemChange('id', 'item1-renamed', 'key-1', null);
      api.handleItemChange('visible.value', true, 'key-1', null);
    });

    const lastPersisted = paramUpdated.mock.calls.at(-1)[2];
    expect(lastPersisted).toHaveLength(1);
    expect(lastPersisted[0].id).toBe('item1-renamed');
    expect(lastPersisted[0].visible.value).toBe(true);
  });
});

describe('useMenuItemsManager: validateItemId identity', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  // Regression for: typing a new Id then clicking elsewhere inside the same popover
  // (not necessarily on another field) reverted the id to its old value.
  // NavItemPopover passes `validateItemId` into the Id field's `validationFn`, which
  // SingleLineCodeEditor's value-reset effect depends on — a fresh reference on any
  // unrelated re-render re-fires that effect and wipes an in-progress edit back to
  // `initialValue`. `validateItemId` must keep the same reference across renders.
  test('keeps the same reference across unrelated re-renders', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: { menuItems: { value: [{ id: 'item1', _key: 'key-1', label: 'Item 1' }] } },
        },
      },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);
    const firstReference = api.validateItemId;

    // Trigger an unrelated re-render of the hook (e.g. hovering a different row).
    act(() => {
      api.setHoveredItemIndex(0);
    });

    expect(api.validateItemId).toBe(firstReference);
  });
});

describe('useMenuItemsManager: rejects a colliding id', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  // Regression for: renaming an item's id to collide with another item's id showed
  // the expected validation error, but the colliding value was still applied to local
  // state (just never persisted) — two items then briefly shared an id, which
  // SortableTree's own dedup guard (keyed by id) silently rendered as one, dropping
  // the other from the Properties panel list. The colliding id must never be applied
  // at all, not even locally — the item keeps its previous id outright.
  test('an id matching another item is rejected, leaving the original id in place', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: {
            menuItems: {
              value: [
                { id: 'item1', _key: 'key-1', label: 'Item 1' },
                { id: 'item2', _key: 'key-2', label: 'Item 2' },
              ],
            },
          },
        },
      },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    act(() => {
      api.handleItemChange('id', 'item2', 'key-1', null);
    });

    expect(api.menuItems.find((item) => item._key === 'key-1').id).toBe('item1');
    expect(paramUpdated).not.toHaveBeenCalled();
  });
});

describe('useMenuItemsManager: trims a new id', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  // Validation already judges the trimmed form of a candidate id (validateStaticId),
  // but the raw, untrimmed value used to be the one actually stored — a value like
  // "  item2  " could pass validation (no trimmed collision) yet persist with
  // invisible leading/trailing whitespace baked into the id.
  test('leading/trailing whitespace is stripped from the stored id', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: { menuItems: { value: [{ id: 'item1', _key: 'key-1', label: 'Item 1' }] } },
        },
      },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    act(() => {
      api.handleItemChange('id', '  item1-renamed  ', 'key-1', null);
    });

    expect(api.menuItems.find((item) => item._key === 'key-1').id).toBe('item1-renamed');
    const lastPersisted = paramUpdated.mock.calls.at(-1)[2];
    expect(lastPersisted[0].id).toBe('item1-renamed');
  });
});
