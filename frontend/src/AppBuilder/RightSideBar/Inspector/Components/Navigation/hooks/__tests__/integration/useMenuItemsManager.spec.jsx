import React from 'react';
import { act } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import useStore from '@/AppBuilder/_stores/store';
import { useMenuItemsManager } from '../../useMenuItemsManager';

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

// cleanupItemEvents/renameItemEventRefs go through the real, network-backed event-handler store
// actions (delete/update hit the app-version events API) — mock that one true boundary (HTTP)
// rather than the store action itself, per this skill's supported seams.
const scenarioWithEventsApi = (putResponse) =>
  defineAppBuilderScenario({
    id: 'nav-menu-items-manager-events-api',
    name: 'useMenuItemsManager event handler cleanup/rename',
    primarySeam: 'rtl',
    surface: 'app-editor',
    edition: 'ce',
    environment: 'development',
    layout: 'desktop',
    version: 'draft',
    transferPath: 'not-applicable',
    access: 'authenticated',
    capabilities: {
      network: [
        {
          method: 'delete',
          url: 'http://localhost:3000/api/v2/apps/:appId/versions/:versionId/events/:eventId',
          json: { affected: 1 },
        },
        ...(putResponse
          ? [
              {
                method: 'put',
                url: 'http://localhost:3000/api/v2/apps/:appId/versions/:versionId/events',
                json: putResponse,
              },
            ]
          : []),
      ],
    },
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

  test('[Navigation-ID-005] an id edit and another field edit landing in the same tick both survive', () => {
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
  test('[Navigation-ID-002] keeps the same reference across unrelated re-renders', () => {
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
  test('[Navigation-ID-001] an id matching another item is rejected, leaving the original id in place', () => {
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

describe('useMenuItemsManager: resync preserves row identity', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  // Regression for: an item's popover (and anything nested inside it, e.g. the
  // per-item Event Manager) closing on its own mid-edit. Inspector.jsx rebuilds
  // `component` as a new object on every render, which used to re-key every item
  // (SortableTree keys rows by `_key`) and remount the row, wiping any open popover.
  test('[Navigation-CRUD-008] an item keeps its `_key` across a resync triggered by an unrelated `component` reference change', () => {
    const paramUpdated = jest.fn();
    const buildComponent = () => ({
      id: 'nav1',
      component: {
        definition: {
          properties: {
            menuItems: { value: [{ id: 'item1', label: 'Item 1' }] },
          },
        },
      },
    });

    let api;
    session.render(
      <TestHost component={buildComponent()} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />
    );
    const firstKey = api.menuItems.find((item) => item.id === 'item1')._key;
    expect(firstKey).toBeTruthy();

    // New `component` object, same content, no `_key` — as Inspector.jsx re-renders.
    session.render(
      <TestHost component={buildComponent()} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />
    );

    expect(api.menuItems.find((item) => item.id === 'item1')._key).toBe(firstKey);
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
  test('[Navigation-ID-003] leading/trailing whitespace is stripped from the stored id', () => {
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

/** An onClick event bound to one menu item, matching the shape `cleanupItemEvents`/`renameItemEventRefs` read. */
const clickEventFor = (sourceId, itemId, uniqueSuffix) => ({
  id: `evt-${uniqueSuffix}`,
  index: 0,
  sourceId,
  name: `evt-${uniqueSuffix}`,
  target: 'component',
  event: { eventId: 'onClick', ref: itemId, actionId: 'set-custom-variable', key: 'seen', value: 'YES' },
});

describe('useMenuItemsManager: add item / add group / add item to group', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('[Navigation-CRUD-001] Add menu item appends a new top-level item with a unique generated id', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: { definition: { properties: { menuItems: { value: [{ id: 'item1', label: 'Item 1' }] } } } },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    act(() => api.handleAddItem());

    expect(api.menuItems).toHaveLength(2);
    const added = api.menuItems.find((menuItem) => menuItem.id !== 'item1');
    expect(added.id).toBeTruthy();
    expect(added.id).not.toBe('item1');
    expect(added.isGroup).toBe(false);
  });

  test('[Navigation-CRUD-002] Add new group appends a new top-level group with an empty children array', () => {
    const paramUpdated = jest.fn();
    const component = { id: 'nav1', component: { definition: { properties: { menuItems: { value: [] } } } } };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    act(() => api.handleAddGroup());

    expect(api.menuItems).toHaveLength(1);
    expect(api.menuItems[0].isGroup).toBe(true);
    expect(api.menuItems[0].children).toEqual([]);
  });

  test('[Navigation-CRUD-003] Add item to group appends a child to that group, not top-level', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: {
            menuItems: { value: [{ id: 'group1', label: 'Group 1', isGroup: true, children: [] }] },
          },
        },
      },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    act(() => api.handleAddItemToGroup('group1'));

    expect(api.menuItems).toHaveLength(1); // top-level count unchanged
    expect(api.menuItems[0].children).toHaveLength(1);
    expect(api.menuItems[0].children[0].isGroup).toBe(false);
  });
});

describe('useMenuItemsManager: delete item, with bound-event cleanup', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: scenarioWithEventsApi() });
  });

  test('[Navigation-CRUD-004] Deleting a top-level item removes it and cleans up any onClick event bound to its id', async () => {
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

    await session.store.act(() =>
      useStore.getState().eventsSlice.setEvents([clickEventFor('nav1', 'item1', 1)], 'canvas')
    );

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    await act(async () => api.handleDeleteItem('key-1', null));

    expect(api.menuItems.map((menuItem) => menuItem.id)).toEqual(['item2']);
    expect(session.store.read((state) => state.eventsSlice.getModuleEvents('canvas'))).toHaveLength(0);
  });

  test('[Navigation-CRUD-005] Deleting a child item removes only that child, leaving its siblings and the group intact', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: {
            menuItems: {
              value: [
                {
                  id: 'group1',
                  _key: 'gkey-1',
                  label: 'Group 1',
                  isGroup: true,
                  children: [
                    { id: 'child1', _key: 'ckey-1', label: 'Child 1' },
                    { id: 'child2', _key: 'ckey-2', label: 'Child 2' },
                  ],
                },
              ],
            },
          },
        },
      },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    act(() => api.handleDeleteItem('ckey-1', 'group1'));

    expect(api.menuItems).toHaveLength(1);
    expect(api.menuItems[0].children.map((child) => child.id)).toEqual(['child2']);
  });

  test('[Navigation-CRUD-006] Deleting a group also cleans up events bound to every one of its children', async () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: {
            menuItems: {
              value: [
                {
                  id: 'group1',
                  _key: 'gkey-1',
                  label: 'Group 1',
                  isGroup: true,
                  children: [
                    { id: 'child1', _key: 'ckey-1', label: 'Child 1' },
                    { id: 'child2', _key: 'ckey-2', label: 'Child 2' },
                  ],
                },
              ],
            },
          },
        },
      },
    };

    await session.store.act(() =>
      useStore
        .getState()
        .eventsSlice.setEvents([clickEventFor('nav1', 'child1', 'c1'), clickEventFor('nav1', 'child2', 'c2')], 'canvas')
    );

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    await act(async () => api.handleDeleteItem('gkey-1', null));

    expect(api.menuItems).toHaveLength(0);
    expect(session.store.read((state) => state.eventsSlice.getModuleEvents('canvas'))).toHaveLength(0);
  });
});

describe('useMenuItemsManager: reorder strips dnd-internal fields', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('[Navigation-CRUD-007] Reordering persists the new order and strips parentId/depth/index, normalizing an emptied group to children: []', () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: {
          properties: {
            menuItems: {
              value: [
                { id: 'item1', _key: 'key-1', label: 'Item 1' },
                { id: 'group1', _key: 'gkey-1', label: 'Group 1', isGroup: true, children: [] },
              ],
            },
          },
        },
      },
    };

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    // Shape @dnd-kit hands back after a reorder: dnd-internal bookkeeping fields present,
    // the previously-empty group now carries a leftover `children: undefined`.
    const reordered = [
      {
        id: 'group1',
        _key: 'gkey-1',
        label: 'Group 1',
        isGroup: true,
        children: undefined,
        parentId: null,
        depth: 0,
        index: 0,
      },
      { id: 'item1', _key: 'key-1', label: 'Item 1', parentId: null, depth: 0, index: 1 },
    ];

    act(() => api.handleReorder(reordered));

    const lastPersisted = paramUpdated.mock.calls.at(-1)[2];
    expect(lastPersisted.map((menuItem) => menuItem.id)).toEqual(['group1', 'item1']);
    for (const menuItem of lastPersisted) {
      expect(menuItem.parentId).toBeUndefined();
      expect(menuItem.depth).toBeUndefined();
      expect(menuItem.index).toBeUndefined();
    }
    expect(lastPersisted[0].children).toEqual([]);
    expect(lastPersisted[1].children).toBeUndefined();
  });
});

describe('useMenuItemsManager: renaming an id propagates to a bound event ref', () => {
  let session;

  beforeEach(() => {
    // The store only applies the renamed `ref` to its own event list once the (mocked) save
    // response echoes back an updated event matching the original event's `id`.
    session = new AppBuilderTestSession({
      scenario: scenarioWithEventsApi([clickEventFor('nav1', 'item1-renamed', 1)]),
    });
  });

  test('[Navigation-ID-004] Renaming an item id updates the ref of any onClick event bound to it', async () => {
    const paramUpdated = jest.fn();
    const component = {
      id: 'nav1',
      component: {
        definition: { properties: { menuItems: { value: [{ id: 'item1', _key: 'key-1', label: 'Item 1' }] } } },
      },
    };

    await session.store.act(() =>
      useStore.getState().eventsSlice.setEvents([clickEventFor('nav1', 'item1', 1)], 'canvas')
    );

    let api;
    session.render(<TestHost component={component} paramUpdated={paramUpdated} onReady={(next) => (api = next)} />);

    await act(async () => api.handleItemChange('id', 'item1-renamed', 'key-1', null));

    const events = session.store.read((state) => state.eventsSlice.getModuleEvents('canvas'));
    expect(events).toHaveLength(1);
    expect(events[0].event.ref).toBe('item1-renamed');
  });
});
