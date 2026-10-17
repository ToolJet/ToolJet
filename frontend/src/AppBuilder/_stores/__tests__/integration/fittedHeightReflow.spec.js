/**
 * A UI 2.0 widget fits its content in the viewer, so it can settle below the height it was drawn at (a List view drawn
 * 260 tall whose three rows need 236). Its height must not depend on the order the reflows arrive in: before, a
 * sibling above that reflowed after the list's own measure moved the list down and floored it back at its drawn
 * height, so one build settled at 236 or 260 from run to run.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

const placed = (id, type, layout, properties = {}) => {
  const definition = componentDefinition(id, id, type, properties);
  definition.layouts = { desktop: layout };
  return definition;
};

// Draws a widget's wrapper at the root context with the height the viewer measures for it.
const drawn = (id, height) => {
  let element = document.querySelector(`.ele-${id}`);
  if (!element) {
    element = document.createElement('div');
    element.className = `ele-${id}`;
    element.setAttribute('data-layout-context', 'root');
    Object.defineProperty(element, 'offsetParent', { get: () => document.body });
    document.body.appendChild(element);
  }
  Object.defineProperty(element, 'offsetHeight', { configurable: true, get: () => height });
};

// The leaf reflow a widget's useDynamicHeight schedules after it draws.
const measure = (id) =>
  state().flushReflows([{ id, layout: 'desktop', isContainer: false, contextIndices: null, moduleId: 'canvas' }]);

const seed = (listType = 'ShadListView') =>
  seedApp({
    above: placed('above', 'Text', { top: 0, left: 0, width: 20, height: 40 }, { dynamicHeight: binding('{{true}}') }),
    list: placed('list', listType, { top: 60, left: 0, width: 20, height: 260 }),
  });

describe('reflow of a UI 2.0 widget that fits below its drawn height', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const settle = (order) => {
    seed();
    drawn('list', 236);
    drawn('above', 64);
    order.forEach(measure);
    return state().temporaryLayouts.list;
  };

  it('settles at the same height whether the list or the widget above it measures first', () => {
    const listFirst = settle(['list', 'above']);
    const aboveFirst = settle(['above', 'list']);
    expect(listFirst).toEqual(expect.objectContaining({ top: 84, height: 236 }));
    expect(aboveFirst).toEqual(expect.objectContaining({ top: 84, height: 236 }));
  });

  it('keeps its fitted height over repeated moves from above', () => {
    seed();
    drawn('list', 236);
    measure('list');
    const heights = [64, 90, 64].map((aboveHeight) => {
      drawn('above', aboveHeight);
      measure('above');
      return state().temporaryLayouts.list.height;
    });
    expect(heights).toEqual([236, 236, 236]);
  });

  it('leaves a native widget moved from above floored at its drawn height, as before', () => {
    seed('Text');
    drawn('list', 236);
    drawn('above', 64);
    measure('list');
    measure('above');
    expect(state().temporaryLayouts.list.height).toBe(260);
  });
});
