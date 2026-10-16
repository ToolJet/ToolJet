/**
 * The UI 2.0 List view's rows and Kanban's custom cards are sized by the reflow as the native Listview's rows are: a
 * child growing in row r bubbles to the widget at [r], which writes the row's height under its own id at [r] and
 * stops (the widget is a leaf at its own level; its own reflow follows once React draws the taller row).
 *
 * Before, the bubble fell into the generic container path: the row was floored at the whole widget's height, temps
 * for the widget's siblings were written under the row's context, and the bubble went on to the canvas at [r].
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();
const flushRow = (id, index) =>
  state().flushReflows([{ id, layout: 'desktop', isContainer: true, contextIndices: [index], moduleId: 'canvas' }]);

const child = (id, parent, layout, properties = {}) => {
  const definition = componentDefinition(id, id, 'ShadText', properties);
  definition.component.parent = parent;
  definition.layouts = { desktop: layout };
  return definition;
};

const widget = (id, type, properties) => {
  const definition = componentDefinition(id, id, type, properties);
  definition.layouts = { desktop: { top: 0, left: 0, width: 20, height: 500 } };
  return definition;
};

// A sibling drawn below the widget, which a row's growth must not move.
const below = () => {
  const definition = componentDefinition('below', 'below', 'ShadButton');
  definition.layouts = { desktop: { top: 520, left: 0, width: 10, height: 40 } };
  return definition;
};

describe('per-row reflow of the UI 2.0 List view', () => {
  const seed = (properties = {}) =>
    seedApp({
      list: widget('list', 'ShadListView', { rowHeight: binding('{{72}}'), ...properties }),
      note: child('note', 'list', { top: 10, left: 0, width: 10, height: 30 }),
      below: below(),
    });

  it('writes the grown row under its context and nothing for the siblings there', () => {
    seed();
    state().setTemporaryLayouts({ 'note-1': { top: 10, height: 140 } });
    flushRow('list', 1);
    const temps = state().temporaryLayouts;
    expect(temps['list-1'].height).toBe(10 + 140 + 8);
    expect(temps['below-1']).toBeUndefined();
    expect(temps['note-1'].height).toBe(140);
    // The widget's own height and the canvas are left to the list's own reflow.
    expect(temps.list).toBeUndefined();
    expect(temps.below).toBeUndefined();
  });

  it('keeps a short row at its row height, clamped as the list clamps it', () => {
    seed();
    flushRow('list', 0);
    expect(state().temporaryLayouts['list-0'].height).toBe(72);
    seed({ rowHeight: binding('{{9000}}') });
    flushRow('list', 0);
    expect(state().temporaryLayouts['list-0'].height).toBe(4000);
  });

  it('keeps the slot of a hidden component, as the native rows do', () => {
    seedApp({
      list: widget('list', 'ShadListView', { rowHeight: binding('{{72}}') }),
      note: child('note', 'list', { top: 10, left: 0, width: 10, height: 30 }),
      extra: child('extra', 'list', { top: 50, left: 0, width: 10, height: 100 }, { visibility: binding('{{false}}') }),
    });
    flushRow('list', 0);
    expect(state().temporaryLayouts['list-0'].height).toBe(150 + 8);
  });

  it('stays at its row height with dynamic height off', () => {
    seed({ dynamicHeight: binding('{{false}}') });
    state().setTemporaryLayouts({ 'note-1': { top: 10, height: 140 } });
    flushRow('list', 1);
    expect(state().temporaryLayouts['list-1'].height).toBe(72);
  });
});

describe('per-card reflow of the UI 2.0 Kanban', () => {
  const seed = (extraVisibility) =>
    seedApp({
      board: widget('board', 'ShadKanban', { cardLayout: binding('custom'), cardHeight: binding('{{120}}') }),
      title: child('title', 'board', { top: 0, left: 0, width: 10, height: 50 }),
      details: child(
        'details',
        'board',
        { top: 40, left: 0, width: 10, height: 60 },
        extraVisibility ? { visibility: binding(extraVisibility) } : {}
      ),
      below: below(),
    });

  it('keeps cardHeight when everything on the card shows, and grows past it', () => {
    seed();
    flushRow('board', 0);
    expect(state().temporaryLayouts['board-0'].height).toBe(120);
    state().setTemporaryLayouts({ 'details-0': { top: 40, height: 200 } });
    flushRow('board', 0);
    expect(state().temporaryLayouts['board-0'].height).toBe(40 + 200 + 8);
    expect(state().temporaryLayouts['below-0']).toBeUndefined();
  });

  it('fits what is left, below cardHeight, when something on the card is hidden', () => {
    seed('{{false}}');
    flushRow('board', 0);
    expect(state().temporaryLayouts['board-0'].height).toBe(50 + 8);
  });

  it('never shrinks below 40px', () => {
    seedApp({
      board: widget('board', 'ShadKanban', { cardLayout: binding('custom'), cardHeight: binding('{{120}}') }),
      tiny: child('tiny', 'board', { top: 0, left: 0, width: 10, height: 10 }),
      gone: child('gone', 'board', { top: 20, left: 0, width: 10, height: 60 }, { visibility: binding('{{false}}') }),
    });
    flushRow('board', 0);
    expect(state().temporaryLayouts['board-0'].height).toBe(40);
  });
});
