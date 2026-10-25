import React, { useEffect } from 'react';
import { act, render } from '@testing-library/react';

// A pack's custom Kanban card is a host row canvas. Its components are laid out absolutely; text that wraps in a narrow
// column grows and the reflow pushes the components below it down, while the row stayed at the card height: the Ant
// card clipped its button and the shadcn card scrolled (2026-10-24). A row the pack asks to fit ({ fit: true }) is
// drawn at its components' bottom, never below the card height.
const mockRows = [];
jest.mock('@/AppBuilder/Widgets/Listview/ListviewSubcontainer', () => ({
  ListviewSubcontainer: (props) => {
    mockRows[props.index] = { rowHeight: props.rowHeight, isDynamicHeightEnabled: props.isDynamicHeightEnabled };
    return null;
  },
}));
jest.mock('@/AppBuilder/_stores/store', () => {
  const { create: createStore } = jest.requireActual('zustand');
  return {
    __esModule: true,
    default: createStore(() => ({})),
  };
});

const { installBrowserStubs } = require('./fuzz/packTestEnv');
const useStore = require('@/AppBuilder/_stores/store').default;
const { usePackHost, fittedRowHeight } = require('@/AppBuilder/Widgets/LibraryComponent/usePackHost');

const LAYOUTS = {
  date: { layouts: { desktop: { top: 10, height: 32 } } },
  route: { layouts: { desktop: { top: 54, height: 40 } } },
  button: { layouts: { desktop: { top: 146, height: 28 } } },
};

const resetStore = (temporaryLayouts = {}) =>
  useStore.setState(
    {
      containerChildrenMapping: { kb: ['date', 'route', 'button'] },
      getCurrentPageComponents: () => LAYOUTS,
      temporaryLayouts,
      updateCustomResolvables: () => {},
      initExposedValueArrayForChildren: () => {},
      updateDependencyValues: () => {},
      resolvedStore: { modules: { canvas: { exposedValues: {} } } },
      modules: { canvas: {} },
    },
    true
  );

const Harness = ({ items, rowHeight, options, fit = false }) => {
  const { host, light } = usePackHost(
    { id: 'kb', width: 600, height: 500, currentLayout: 'desktop', darkMode: false, setExposedVariable: () => {} },
    { rowsEnabled: true, rowVariable: 'cardData', fit }
  );
  useEffect(() => host.setRows(items, rowHeight, options), [host, items, rowHeight, options]);
  return <>{light}</>;
};

const ITEMS = [{ id: 1 }, { id: 2 }];

installBrowserStubs();

beforeEach(() => {
  mockRows.length = 0;
  resetStore();
});

describe('fittedRowHeight', () => {
  const base = {
    childIds: ['date', 'route', 'button'],
    components: LAYOUTS,
    currentLayout: 'desktop',
    rowContext: [0],
    moduleId: 'canvas',
    rowHeight: 194,
  };

  test('a card whose components fit keeps its card height', () => {
    expect(fittedRowHeight({ ...base, temporaryLayouts: {} })).toBe(194);
  });

  test('a card whose components were pushed down grows to their bottom plus the card gap', () => {
    // The measured case: the date wrapped (32 to 48) and the reflow moved the route to 94 and the button to 186.
    const temporaryLayouts = { 'date-0': { height: 48 }, 'route-0': { top: 94 }, 'button-0': { top: 186 } };
    expect(fittedRowHeight({ ...base, temporaryLayouts })).toBe(186 + 28 + 8);
  });

  test("reads only its own row's layouts", () => {
    const temporaryLayouts = { 'button-1': { top: 400 } };
    expect(fittedRowHeight({ ...base, temporaryLayouts })).toBe(194);
    expect(fittedRowHeight({ ...base, rowContext: [1], temporaryLayouts })).toBe(436);
  });

  test("a module's rows read the module's layouts", () => {
    const temporaryLayouts = { 'button-0': { top: 400 }, 'mod::button-0': { top: 300 } };
    expect(fittedRowHeight({ ...base, moduleId: 'mod', temporaryLayouts })).toBe(336);
  });

  test('a component hidden on this card is left out, so a pushed-down hidden button does not grow the card', () => {
    const temporaryLayouts = { 'route-0': { top: 94 }, 'button-0': { top: 186 } };
    expect(fittedRowHeight({ ...base, temporaryLayouts, isVisible: (childId) => childId !== 'button' })).toBe(194);
  });

  test('a card with no components keeps its card height', () => {
    expect(fittedRowHeight({ ...base, childIds: undefined, temporaryLayouts: {} })).toBe(194);
  });
});

describe('pack rows on the host', () => {
  test('a fitted row follows its components as the reflow moves them, never below the card height', () => {
    render(<Harness items={ITEMS} rowHeight={194} options={{ fit: true }} />);
    expect(mockRows.map((r) => r.rowHeight)).toEqual([194, 194]);
    act(() => useStore.setState({ temporaryLayouts: { 'route-1': { top: 94 }, 'button-1': { top: 186 } } }));
    expect(mockRows.map((r) => r.rowHeight)).toEqual([194, 222]);
    act(() => useStore.setState({ temporaryLayouts: {} }));
    expect(mockRows.map((r) => r.rowHeight)).toEqual([194, 194]);
  });

  test('a fitted row leaves out the components hidden on that card (resolved per row)', () => {
    useStore.setState({
      getResolvedComponent: (childId, ctx) =>
        childId === 'button' && ctx[0] === 1 ? { properties: { visibility: false } } : { properties: {} },
      getExposedPropertyForAdditionalActions: () => undefined,
    });
    render(<Harness items={ITEMS} rowHeight={194} options={{ fit: true }} />);
    act(() => useStore.setState({ temporaryLayouts: { 'button-0': { top: 186 }, 'button-1': { top: 186 } } }));
    expect(mockRows.map((r) => r.rowHeight)).toEqual([222, 194]);
  });

  test('a fitted row is sized by the host, not by the reflow of the whole widget (floored at its height)', () => {
    render(<Harness items={ITEMS} rowHeight={194} options={{ fit: true }} fit />);
    expect(mockRows.every((r) => r.isDynamicHeightEnabled === false)).toBe(true);
  });

  test('a row the pack does not fit keeps the row height, as before', () => {
    render(<Harness items={ITEMS} rowHeight={72} />);
    act(() => useStore.setState({ temporaryLayouts: { 'button-0': { top: 186 } } }));
    expect(mockRows.map((r) => r.rowHeight)).toEqual([72, 72]);
  });

  test("a widget with Dynamic height keeps the native List view's dynamic rows for rows it does not fit", () => {
    render(<Harness items={ITEMS} rowHeight={72} fit />);
    expect(mockRows.every((r) => r.isDynamicHeightEnabled === true)).toBe(true);
  });
});
