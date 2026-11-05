import React from 'react';
import { render, waitFor, fireEvent, renderHook } from '@testing-library/react';
import { createWidgetHarness, binding, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import EditorSelecto from '@/AppBuilder/AppCanvas/Selecto';
import { DragLayer } from '@/AppBuilder/RightSideBar/ComponentManagerTab/DragLayer';
import { dragContextBuilder } from '@/AppBuilder/AppCanvas/Grid/helpers/dragEnd';
import { handleDeactivateTargets, showGridLines } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import useTransientStore from '@/AppBuilder/_stores/transientStore';
import useStore from '@/AppBuilder/_stores/store';
import { HotkeyProvider } from '@/AppBuilder/AppCanvas/HotkeyProvider';
import { pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';
import useCallbackActions from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/useCallbackActions';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-hot-toast';

jest.mock('@/AppBuilder/AppCanvas/copyPasteWidgetsUtils', () => ({
  ...jest.requireActual('@/AppBuilder/AppCanvas/copyPasteWidgetsUtils'),
  pasteComponents: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
// The whole Inspector pulls an icon that the jsdom build of lucide cannot draw; the icons are not under test.
jest.mock(
  'lucide-react',
  () => new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name] : () => null) })
);
const mockHandleDrop = jest.fn();
let mockDragSpec;
let mockDropSpec;
let mockSelectoProps;
// The grid background needs react-dnd's drag layer; jsdom has no drag, so the flag is flipped per test.
const mockDragLayer = { on: false };
// The drag source is stubbed only while the Drops describe is running; every other describe gets the real useDrag.
const mockDrag = { on: false };
jest.mock('react-dnd', () => {
  const actual = jest.requireActual('react-dnd');
  return {
    ...actual,
    useDrag: (factory) => {
      if (!mockDrag.on) return actual.useDrag(factory);
      mockDragSpec = factory();
      return [{ isDragging: false }, jest.fn(), jest.fn()];
    },
    useDrop: (spec, deps) => {
      if (mockDrag.on) mockDropSpec = typeof spec === 'function' ? spec() : spec;
      return actual.useDrop(spec, deps);
    },
    useDragLayer: (collect) =>
      mockDragLayer.on ? { isDragging: true, clientOffset: null, draggedItem: null } : actual.useDragLayer(collect),
  };
});
jest.mock('@/AppBuilder/AppCanvas/Hooks/useCanvasDropHandler', () => ({
  useCanvasDropHandler: () => ({ handleDrop: mockHandleDrop }),
}));
jest.mock('@/AppBuilder/RightSideBar/WidgetBox', () => ({ WidgetBox: () => null }));
jest.mock('@/modules/Modules/components', () => ({ ModuleWidgetBox: () => null }));
jest.mock('react-selecto', () => {
  const mockReact = require('react');
  return {
    __esModule: true,
    default: (props) => {
      mockSelectoProps = props;
      return mockReact.createElement('span');
    },
  };
});

describe('ListviewBuilderClicks', () => {
  /**
   * Listview 2.0 builder: a click on a read-only record changes nothing (tj-ee#5559 AC7, Listview-BLD-007).
   * Drives Selecto's real `dragCondition`, which is what turns a canvas click into a selection; react-selecto
   * itself is replaced by a probe that hands over its props, because jsdom has no pointer gestures.
   */

  const ID = 'lv1';
  const records = `{{${JSON.stringify(Array.from({ length: 3 }, (_, index) => ({ name: `r${index}` })))}}}`;
  const txt = () => {
    const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    return definition;
  };
  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(records),
      mode: binding('list'),
      columns: binding('{{1}}'),
      rowHeight: binding('100'),
      rowsPerPage: binding('{{2}}'),
      enablePagination: binding('{{true}}'),
      visibility: binding('{{true}}'),
    },
    defaultStyles: {},
    defaultExtraComponents: { txt1: txt() },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const copy = (index) => document.querySelectorAll('.ele-txt1')[index];
  const click = (target) => mockSelectoProps.dragCondition({ inputEvent: { target, shiftKey: false } });

  async function mount() {
    widget.render({ currentMode: 'edit' });
    await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(2));
    // The harness has no WidgetWrapper, so the list's own box is marked the way WidgetWrapper marks it.
    const box = document.getElementById(ID);
    box.classList.add('moveable-box');
    box.setAttribute('widgetid', ID);
    render(<EditorSelecto />);
  }

  describe('Listview builder: clicking read-only records', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-007] a click on a component copy selects neither the copy nor the list', async () => {
      // Break this catches: the click walking up to the list's box and selecting the whole ListView.
      await mount();
      await widget.session.store.act(() => store().setSelectedComponents(['txt1']));

      click(copy(1));

      expect(store().selectedComponents).toEqual(['txt1']);
    });

    test('[Listview-BLD-007] a click on the record background of a copy changes nothing either', async () => {
      // Break this catches: only the component being guarded, so the copy's empty canvas still selects the list.
      await mount();
      await widget.session.store.act(() => store().setSelectedComponents(['txt1']));

      click(document.querySelectorAll('.list-item')[1].querySelector('.real-canvas'));

      expect(store().selectedComponents).toEqual(['txt1']);
    });

    test('[Listview-BLD-007] a click on the pager still selects the list', async () => {
      // Break this catches: the guard swallowing every click inside the list, so the pager can no longer select it.
      await mount();
      await widget.session.store.act(() => store().setSelectedComponents(['txt1']));

      click(document.querySelector('[data-cy="container-pagination"]'));

      expect(store().selectedComponents).toEqual([ID]);
    });

    test('[Listview-REC-008] a click on a component in a disabled record 1 selects nothing, and the ListView stays selectable', async () => {
      // Break this catches: the disabled record 1 staying an editable original, so its component is selectable.
      widget.render({ currentMode: 'edit', properties: { disableRecords: binding(`{{listItem.name === 'r0'}}`) } });
      await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(2));
      const box = document.getElementById(ID);
      box.classList.add('moveable-box');
      box.setAttribute('widgetid', ID);
      render(<EditorSelecto />);
      await widget.session.store.act(() => store().setSelectedComponents(['txt1']));

      click(copy(0));
      click(document.querySelector('.list-item .real-canvas'));
      expect(store().selectedComponents).toEqual(['txt1']);

      // A blocked record lets the pointer through to the list, so the author can still reach the expression.
      click(document.querySelector('[role="list"]'));
      expect(store().selectedComponents).toEqual([ID]);
    });

    test('[Listview-BLD-007] a click on the editable record 1 still selects its component', async () => {
      // Break this catches: the guard also catching the original, which would make record 1 unselectable.
      await mount();
      const original = copy(0);
      original.classList.add('moveable-box');

      click(original.firstElementChild ?? original);

      expect(store().selectedComponents).toEqual(['txt1']);
    });
  });
});

describe('ListviewBuilderDrops', () => {
  /**
   * Listview 2.0 builder: a drop on a read-only record is refused (tj-ee#5559 AC1-AC3), for a component dragged
   * from the panel and for a component moved on the canvas. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
   * (Listview-BLD-001..003). Runs the real DragLayer `end` and the real drag context; jsdom has no hit testing,
   * so `elementsFromPoint` answers with the record canvas under test.
   */

  beforeAll(() => {
    mockDrag.on = true;
  });
  afterAll(() => {
    mockDrag.on = false;
  });

  const ID = 'lv1';
  const records = `{{${JSON.stringify(Array.from({ length: 7 }, (_, index) => ({ name: `r${index}` })))}}}`;
  const txt = () => {
    const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    return definition;
  };
  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(records),
      mode: binding('list'),
      columns: binding('{{1}}'),
      rowHeight: binding('100'),
      rowsPerPage: binding('{{3}}'),
      enablePagination: binding('{{true}}'),
      visibility: binding('{{true}}'),
    },
    defaultStyles: {},
    defaultExtraComponents: { txt1: txt() },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const rows = () => [...document.querySelectorAll('.list-item')];
  const canvasOf = (row) => row.querySelector('.real-canvas');
  const pointerOver = (element) => {
    document.elementsFromPoint = () => [element];
    document.elementFromPoint = () => element;
  };
  const releaseOn = (element) => {
    pointerOver(element);
    mockDragSpec.end(
      { componentType: 'Button', component: { component: 'Button' } },
      { getClientOffset: () => ({ x: 5, y: 5 }) }
    );
  };
  const boxes = [
    { id: ID, parent: null, component: { component: 'Listview', parent: null } },
    { id: 'txt1', parent: ID, component: { component: 'Text', parent: ID } },
  ];
  const moveOver = (element) => {
    pointerOver(element);
    return dragContextBuilder({
      event: { target: document.querySelector('.ele-txt1'), clientX: 5, clientY: 5 },
      widgets: boxes,
    });
  };

  async function mount() {
    widget.render({ currentMode: 'edit' });
    await waitFor(() => expect(rows()).toHaveLength(3));
    render(<DragLayer index={0} component={{ component: 'Button' }} />);
  }

  describe('Listview builder: drops on read-only records are refused', () => {
    beforeEach(() => {
      mockHandleDrop.mockClear();
      return widget.setup();
    });
    afterEach(() => {
      widget.teardown();
      delete document.elementsFromPoint;
      delete document.elementFromPoint;
    });

    test('[Listview-BLD-001] a panel drop lands on record 1 of page 1 and is refused on records 2 and 3', async () => {
      // Break this catches: a drop on a copy reaching handleDrop, which adds the component to the shared record template.
      await mount();

      releaseOn(canvasOf(rows()[0]));
      expect(mockHandleDrop).toHaveBeenCalledTimes(1);
      mockHandleDrop.mockClear();

      releaseOn(canvasOf(rows()[1]));
      releaseOn(canvasOf(rows()[2]));
      expect(mockHandleDrop).not.toHaveBeenCalled();
    });

    describe('with the hit list a browser returns', () => {
      // A browser's elementsFromPoint skips an inert record, so the list under it is the first thing found.
      const recordBox = (index) => ({ left: 0, right: 600, top: index * 100, bottom: index * 100 + 100 });
      const mountDisabled = async (name) => {
        widget.render({
          currentMode: 'edit',
          properties: { disableRecords: binding(`{{listItem.name === '${name}'}}`) },
        });
        await waitFor(() => expect(rows()).toHaveLength(3));
        rows().forEach((row, index) => {
          row.getBoundingClientRect = () => recordBox(index);
        });
        render(<DragLayer index={0} component={{ component: 'Button' }} />);
      };
      const hitList = (...extra) => {
        const list = document.querySelector('[role="list"]');
        const top = (extra.length ? extra : [null]).map((node) => node ?? list);
        const hits = [...top, document.body];
        document.elementsFromPoint = () => hits;
        document.elementFromPoint = () => hits[0];
      };
      const releaseAt = (x, y) =>
        mockDragSpec.end(
          { componentType: 'Button', component: { component: 'Button' } },
          { getClientOffset: () => ({ x, y }) }
        );
      const moveAt = (x, y) =>
        dragContextBuilder({
          event: { target: document.querySelector('.ele-txt1'), clientX: x, clientY: y },
          widgets: boxes,
        });

      test.each([
        ['record 1', 'r0', 50],
        ['record 2', 'r1', 150],
        ['record 3', 'r2', 250],
      ])('[Listview-REC-008] a panel drop and a move onto the disabled %s are refused', async (_label, name, y) => {
        // Break this catches: the refuse check asking only the hit list, which never contains an inert record.
        await mountDisabled(name);
        hitList();

        releaseAt(5, y);

        expect(mockHandleDrop).not.toHaveBeenCalled();
        expect(moveAt(5, y).isDroppable).toBe(false);
      });

      test.each([
        ['disabled record', 'r1', 150, true],
        ['enabled record 3', 'r1', 250, true],
        ['enabled record 1', 'r1', 50, false],
      ])('[Listview-REC-008] a real drop on a %s: the offset is gone by drag end', async (_label, name, y, refused) => {
        // Break this catches: the refuse check reading the offset at drag end, where react-dnd has already reset it after the drop.
        await mountDisabled(name);
        const copy = canvasOf(rows()[Math.floor(y / 100)]);
        if (y === 150) hitList();
        else pointerOver(copy);
        const dropResult = mockDropSpec.drop({}, { getClientOffset: () => ({ x: 5, y }) });

        expect(dropResult?.refused ?? false).toBe(refused);
        mockDragSpec.end(
          { componentType: 'Button', component: { component: 'Button' } },
          { getClientOffset: () => null, getDropResult: () => dropResult }
        );
        expect(mockHandleDrop).toHaveBeenCalledTimes(refused ? 0 : 1);
      });

      test('[Listview-REC-008] an enabled record next to a disabled one still takes a drop', async () => {
        // Break this catches: the refuse check refusing the whole list once any record is disabled.
        await mountDisabled('r1');
        pointerOver(canvasOf(rows()[0]));

        releaseOn(canvasOf(rows()[0]));

        expect(mockHandleDrop).toHaveBeenCalledTimes(1);
      });

      test('[Listview-REC-008] a point in the list outside every disabled record takes the drop', async () => {
        // Break this catches: any hit on the list refusing the drop once one record is disabled.
        await mountDisabled('r0');
        hitList();

        releaseAt(5, 350);

        expect(mockHandleDrop).toHaveBeenCalledTimes(1);
      });

      test('[Listview-REC-008] a point the scrolling list clips, or the pager covers, is not a disabled record', async () => {
        // Break this catches: the record box alone deciding, so a clipped record refuses a drop outside the list.
        await mountDisabled('r0');

        hitList(document.querySelector('[data-cy="container-pagination"]'), null);
        releaseAt(5, 50);
        expect(mockHandleDrop).toHaveBeenCalledTimes(1);
        mockHandleDrop.mockClear();

        document.elementsFromPoint = () => [document.body];
        releaseAt(5, 50);
        expect(mockHandleDrop).toHaveBeenCalledTimes(1);
      });
    });

    test('[Listview-BLD-001] a panel drop on record 1 of page 2 is refused', async () => {
      // Break this catches: the gate reading the page-relative index, so page 2's first record accepts the drop.
      await mount();
      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

      releaseOn(canvasOf(rows()[0]));

      expect(mockHandleDrop).not.toHaveBeenCalled();
    });

    test('[Listview-BLD-002] a panel drop on record 1 of server page 2 is refused', async () => {
      // Break this catches: server rows (the whole data, a page-relative index) making page 2's first record a drop target.
      widget.render({
        currentMode: 'edit',
        properties: {
          data: binding(`{{${JSON.stringify([{ name: 'a' }, { name: 'b' }, { name: 'c' }])}}}`),
          serverSidePagination: binding('{{true}}'),
          totalRecords: binding('{{7}}'),
        },
      });
      await waitFor(() => expect(rows()).toHaveLength(3));
      render(<DragLayer index={0} component={{ component: 'Button' }} />);
      releaseOn(canvasOf(rows()[0]));
      expect(mockHandleDrop).toHaveBeenCalledTimes(1);
      mockHandleDrop.mockClear();

      await widget.act('setPage', 2);
      await waitFor(() => expect(widget.exposed()?.pageIndex).toBe(2));
      releaseOn(canvasOf(rows()[0]));

      expect(mockHandleDrop).not.toHaveBeenCalled();
    });

    test('[Listview-BLD-001] moving a component onto a copy record is not a valid drop; onto record 1 it is', async () => {
      // Break this catches: the move target lookup ignoring copy records, so the component is re-parented into a copy.
      await mount();

      expect(moveOver(canvasOf(rows()[0])).isDroppable).toBe(true);
      expect(moveOver(canvasOf(rows()[2])).isDroppable).toBe(false);

      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));
      expect(moveOver(canvasOf(rows()[0])).isDroppable).toBe(false);
    });
  });
});

describe('ListviewBuilderRules', () => {
  /**
   * Listview 2.0 builder editing and hover rules (tj-ee#5559): only record 1 of page 1 is editable, the others
   * fade and outline around it. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
   * (Listview-BLD-001..009). Real store, real RenderWidget, real children in every record.
   *
   * jsdom does no layout and drops var(): visuals are asserted as classes, inline opacity and store state.
   */

  const ID = 'lv1';
  const INNER = 'lv2';
  const records = (count) =>
    `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `r${index}` })))}}}`;

  function child(id, name, type, properties, parent = ID) {
    const definition = componentDefinition(id, name, type, properties);
    definition.component.parent = parent;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const baseProperties = {
    dataSourceSelector: binding('rawJson'),
    data: binding(records(7)),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{3}}'),
    enablePagination: binding('{{true}}'),
  };
  const baseStyles = {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  };

  const textChild = () => child('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: baseProperties,
    defaultStyles: baseStyles,
    defaultExtraComponents: { txt1: textChild() },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const NESTED = `{{[{ name: 'o1', items: [{ name: 'a' }, { name: 'b' }] }, { name: 'o2', items: [{ name: 'c' }, { name: 'd' }] }]}}`;
  const innerListview = () =>
    child(INNER, 'listview2', 'Listview', {
      ...baseProperties,
      data: binding('{{listItem.items}}'),
      rowsPerPage: binding('{{10}}'),
      enablePagination: binding('{{false}}'),
      rowHeight: binding('100'),
    });
  const innerText = () => child('txt2', 'text2', 'Text', { text: binding('{{listItem.name}}') }, INNER);

  const nestedWidget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: {
      ...baseProperties,
      data: binding(NESTED),
      rowsPerPage: binding('{{1}}'),
      rowHeight: binding('250'),
    },
    defaultStyles: baseStyles,
    defaultExtraComponents: { [INNER]: innerListview(), txt2: innerText() },
    capabilities: { dnd: true },
    widgetHeight: 800,
    widgetWidth: 600,
  });

  const user = () => widget.session.user;
  const rows = () => [...document.querySelectorAll('.list-item')];
  const copiesOf = (id) => [...document.querySelectorAll(`.ele-${id}`)];
  const editable = (id) => copiesOf(id).map((node) => node.classList.contains('moveable-box'));
  const dotted = (id) => copiesOf(id).map((node) => node.classList.contains('listview-copy-outline'));
  const faded = () => rows().map((row) => row.style.opacity === '0.4');
  const framed = () => rows().map((row) => row.classList.contains('listview-record-moving'));
  const gridded = () => rows().map((row) => !!row.querySelector('.show-grid'));
  const act = (fn) => widget.session.store.act(fn);
  const goToPage2 = async () => {
    await widget.act('setPage', 2);
    await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));
  };

  async function mount(harness, options = {}, count = 3) {
    harness.render({ currentMode: 'edit', ...options });
    await waitFor(() => expect(rows()).toHaveLength(count));
  }

  const serverProperties = {
    data: binding(records(3)),
    serverSidePagination: binding('{{true}}'),
    totalRecords: binding('{{7}}'),
  };

  afterEach(() => {
    mockDragLayer.on = false;
    store().setDraggingComponentId?.(null);
    store().setResizingComponentId?.(null);
  });

  describe('Listview builder: only record 1 of page 1 is editable', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-001] client pagination: record 1 of page 1 is editable, record 1 of page 2 is not', async () => {
      // Break this catches: gating on the page-relative index, so the first record of every page is editable.
      await mount(widget);
      await waitFor(() => expect(editable('txt1')).toEqual([true, false, false]));

      await widget.act('setPage', 2);

      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));
      await waitFor(() => expect(editable('txt1')).toEqual([false, false, false]));
    });

    test('[Listview-BLD-002] server pagination: record 1 of page 2 is not editable', async () => {
      // Break this catches: the server rows (whole data, page-relative index) making page 2's first record editable.
      await mount(widget, { properties: serverProperties });
      await waitFor(() => expect(editable('txt1')).toEqual([true, false, false]));

      await widget.act('setPage', 2);

      await waitFor(() => expect(widget.exposed()?.pageIndex).toBe(2));
      await waitFor(() => expect(editable('txt1')).toEqual([false, false, false]));
    });
  });

  describe('Listview builder: a nested list', () => {
    beforeEach(nestedWidget.setup);
    afterEach(nestedWidget.teardown);

    test('[Listview-BLD-003] a nested list in record 1 of page 2 is read-only; on page 1 only its first record is editable', async () => {
      // Break this catches: the lock reading the outer page-relative index, so page 2's first outer record stays editable.
      await mount(nestedWidget, {}, 3);
      await waitFor(() => expect(editable('txt2')).toEqual([true, false]));

      await nestedWidget.act('setPage', 2);

      await waitFor(() => expect(copiesOf('txt2').map((node) => node.textContent.slice(-1))).toEqual(['c', 'd']));
      await waitFor(() => expect(editable('txt2')).toEqual([false, false]));
    });
  });

  describe('Listview builder: fade around the main record', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-005] hovering the main record fades records 2..K to 40% and leaving restores them', async () => {
      // Break this catches: no fade, a fade on the main record, or one that sticks after the pointer leaves.
      await mount(widget);
      expect(faded()).toEqual([false, false, false]);

      await user().hover(rows()[0]);
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      await user().unhover(rows()[0]);
      await waitFor(() => expect(faded()).toEqual([false, false, false]));
    });

    test('[Listview-BLD-005] hovering record 2 or 3 does nothing', async () => {
      // Break this catches: any record, not only the main one, starting the fade.
      await mount(widget);

      await user().hover(rows()[1]);

      expect(faded()).toEqual([false, false, false]);
      expect(framed()).toEqual([false, false, false]);
    });

    test('[Listview-BLD-005] the fade holds for the whole drag and resize of a component in the main record', async () => {
      // Break this catches: the fade tied to the pointer only, so it drops the moment the drag leaves record 1.
      await mount(widget);

      await act(() => store().setDraggingComponentId('txt1'));
      await waitFor(() => expect(faded()).toEqual([false, true, true]));
      await act(() => store().setDraggingComponentId(null));
      await waitFor(() => expect(faded()).toEqual([false, false, false]));

      await act(() => store().setResizingComponentId('txt1'));
      await waitFor(() => expect(faded()).toEqual([false, true, true]));
      await act(() => store().setResizingComponentId(null));
      await waitFor(() => expect(faded()).toEqual([false, false, false]));
    });

    test('[Listview-BLD-005] dragging a component that is not in the list does not fade it', async () => {
      // Break this catches: any drag on the page fading every list.
      await mount(widget);

      await act(() => store().setDraggingComponentId('somewhere-else'));

      expect(faded()).toEqual([false, false, false]);
    });

    test('[Listview-BLD-005] on page 2 there is no main record, so nothing fades', async () => {
      // Break this catches: the first record of page 2 acting as the main record.
      await mount(widget);
      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

      await user().hover(rows()[0]);
      await act(() => store().setDraggingComponentId('txt1'));

      expect(faded()).toEqual([false, false, false]);
      expect(framed()).toEqual([false, false, false]);
    });

    test('[Listview-BLD-005] moving or resizing inside record 1 gives it a thin outline that adds no layout', async () => {
      // Break this catches: no frame around the record being edited, or one drawn as a border that shifts the layout.
      await mount(widget);
      expect(framed()).toEqual([false, false, false]);

      await act(() => store().setDraggingComponentId('txt1'));

      await waitFor(() => expect(framed()).toEqual([true, false, false]));
      expect(rows()[0].style.border).toBe('');
    });
  });

  describe('Listview builder: outlines on copies', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-006] a component selected in record 1 keeps its solid outline and its copies get the dotted one', async () => {
      // Break this catches: copies with no dotted outline, a dotted outline on the main one, or one left after deselect.
      await mount(widget);
      expect(dotted('txt1')).toEqual([false, false, false]);

      await act(() => store().setSelectedComponents(['txt1']));

      await waitFor(() => expect(dotted('txt1')).toEqual([false, true, true]));
      expect(copiesOf('txt1')[0].classList.contains('active-target')).toBe(true);

      await act(() => store().setSelectedComponents([]));
      await waitFor(() => expect(dotted('txt1')).toEqual([false, false, false]));
    });

    test('[Listview-BLD-007] hovering a component in record 3 outlines only that one, and hovering the record does not', async () => {
      // Break this catches: the hover outlining every copy of the component, or the record itself.
      await mount(widget);

      await user().hover(rows()[2]);
      expect(dotted('txt1')).toEqual([false, false, false]);

      await user().hover(copiesOf('txt1')[2]);
      await waitFor(() => expect(dotted('txt1')).toEqual([false, false, true]));

      await user().unhover(copiesOf('txt1')[2]);
      await waitFor(() => expect(dotted('txt1')).toEqual([false, false, false]));
    });

    test('[Listview-BLD-007] clicking a component in record 3 leaves the selection unchanged', async () => {
      // Break this catches: a click on a copy selecting it (or clearing the selection).
      await mount(widget);
      await act(() => store().setSelectedComponents(['txt1']));

      await user().click(copiesOf('txt1')[2]);

      expect(store().selectedComponents).toEqual(['txt1']);

      await act(() => store().setSelectedComponents([]));
      await user().click(copiesOf('txt1')[2]);
      expect(store().selectedComponents).toEqual([]);
    });
  });

  describe('Listview builder: grid background while dragging', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-001] only record 1 of page 1 shows the grid while dragging, never record 1 of page 2', async () => {
      // Break this catches: the grid gate reading the page-relative index, so page 2's first record shows the grid.
      mockDragLayer.on = true;
      await mount(widget);
      expect(gridded()).toEqual([true, false, false]);

      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

      expect(gridded()).toEqual([false, false, false]);
    });

    test('[Listview-BLD-008] preview shows no grid while dragging', async () => {
      // Break this catches: the grid shown outside the builder.
      mockDragLayer.on = true;
      await mount(widget, { currentMode: 'view' });

      expect(gridded()).toEqual([false, false, false]);
    });

    test('[Listview-BLD-001] the record background sits on the record, under a transparent canvas, so the grid lines show', async () => {
      // Break this catches: a record background painted on the canvas itself, which hides the grid lines.
      mockDragLayer.on = true;
      await mount(widget, { styles: { listStyle: binding('bordered'), recordBackgroundColor: binding('#ff0000') } });

      const canvas = rows()[0].querySelector('.show-grid');
      expect(rows()[0].style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(canvas.style.backgroundColor).toBe('transparent');
    });
  });

  const HEADER_CHILD = () => child('hdr1', 'title1', 'Text', { text: binding('Title') }, `${ID}-header`);
  const withHeader = { showHeader: binding('{{true}}') };

  describe('Listview builder: a drag in the header does not fade the records', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-005] dragging or selecting a header component fades nothing and frames nothing', async () => {
      // Break this catches: the header slot counting as a record, so editing the header fades every record.
      await mount(widget, { properties: withHeader, extraComponents: { hdr1: HEADER_CHILD() } });

      await act(() => store().setDraggingComponentId('hdr1'));
      expect(faded()).toEqual([false, false, false]);
      expect(framed()).toEqual([false, false, false]);

      await act(() => {
        store().setDraggingComponentId(null);
        store().setSelectedComponents(['hdr1']);
      });
      expect(faded()).toEqual([false, false, false]);
    });
  });

  describe('Listview builder: fade while a record 1 component is selected', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-005] records 2..K stay faded while a record 1 component is selected, pointer elsewhere', async () => {
      // Break this catches: the fade tied to hover and drag only, so selecting a component leaves the copies at full strength.
      await mount(widget);

      await act(() => store().setSelectedComponents(['txt1']));
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      await act(() => store().setSelectedComponents([]));
      await waitFor(() => expect(faded()).toEqual([false, false, false]));
    });

    test('[Listview-BLD-005] selecting something that is not in the list does not fade it', async () => {
      // Break this catches: any selection fading every list.
      await mount(widget);

      await act(() => store().setSelectedComponents(['somewhere-else']));

      expect(faded()).toEqual([false, false, false]);
    });

    test('[Listview-BLD-005] a selection kept while the pager shows page 2 fades nothing', async () => {
      // Break this catches: page 2's first record being treated as the main record.
      await mount(widget);
      await act(() => store().setSelectedComponents(['txt1']));
      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

      expect(faded()).toEqual([false, false, false]);
    });

    test('[Listview-BLD-005] the fade does not come back from a hover that ended while record 1 was gone', async () => {
      // Break this catches: a stale hover flag when record 1 unmounts under the pointer (no mouseleave ever fires).
      await mount(widget);
      await user().hover(rows()[0]);
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      await act(() => {
        widget.setComponentProperty(ID, 'data', binding(records(0)).value, 'properties');
      });
      await waitFor(() => expect(rows()).toHaveLength(0));
      await act(() => {
        widget.setComponentProperty(ID, 'data', binding(records(7)).value, 'properties');
      });
      await waitFor(() => expect(rows()).toHaveLength(3));

      expect(faded()).toEqual([false, false, false]);
    });
  });

  describe('Listview builder: dotted copies on another page', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-006] with a record 1 component selected and page 2 shown, the first record of the page is not dotted', async () => {
      // Break this catches: every copy dotted, so page 2's first record looks like a copy of the selection.
      await mount(widget);
      await act(() => store().setSelectedComponents(['txt1']));
      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

      expect(dotted('txt1')).toEqual([false, true, true]);
    });

    test('[Listview-BLD-006] the dotted outline survives the drag clean-up that strips other outlines', async () => {
      // Break this catches: reusing the class that handleDeactivateTargets removes, so a drop clears the copies' outline.
      await mount(widget);
      await act(() => store().setSelectedComponents(['txt1']));
      await waitFor(() => expect(dotted('txt1')).toEqual([false, true, true]));

      handleDeactivateTargets();

      expect(dotted('txt1')).toEqual([false, true, true]);
    });

    test('[Listview-BLD-006] the outline is the same dotted style as a non-dragging component', () => {
      // Break this catches: a new look instead of the existing token and style.
      const css = require('fs').readFileSync(
        require('path').resolve(__dirname, '../../../../AppCanvas/Grid/Grid.css'),
        'utf8'
      );
      expect(css).toMatch(
        /\.non-dragging-component,\s*\.listview-copy-outline\s*\{[^}]*dotted var\(--border-accent-weak\)/
      );
    });
  });

  describe('Listview builder: hover outlines the innermost copy only', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-007] hovering a child inside a Container copy outlines the child, not the Container', async () => {
      // Break this catches: the parent staying outlined once the pointer moves onto its child.
      const box = child('cont1', 'container1', 'Container', {});
      const inner = child('txt3', 'text3', 'Text', { text: binding('In box') }, 'cont1');
      await mount(widget, { extraComponents: { cont1: box, txt3: inner } });
      await waitFor(() => expect(copiesOf('txt3')).toHaveLength(3));

      await user().hover(copiesOf('cont1')[2]);
      await waitFor(() => expect(dotted('cont1')).toEqual([false, false, true]));

      await user().hover(copiesOf('txt3')[2]);

      await waitFor(() => expect(dotted('txt3')).toEqual([false, false, true]));
      expect(dotted('cont1')).toEqual([false, false, false]);
      expect(dotted('txt3')).toEqual([false, false, true]);
    });

    test('[Listview-BLD-007] hovering a copy does not stop the event reaching ancestors', async () => {
      // Break this catches: stopPropagation on mouseover, which hides the hover from every ancestor handler.
      let seen = 0;
      const onOver = () => {
        seen += 1;
      };
      await mount(widget);
      document.body.addEventListener('mouseover', onOver);
      await user().hover(copiesOf('txt1')[2]);
      document.body.removeEventListener('mouseover', onOver);

      expect(seen).toBeGreaterThan(0);
    });
  });

  describe('Listview builder: grid lines on a move', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-001] a component move turns the grid on in record 1 of page 1 only', async () => {
      // Break this catches: showGridLines (run on every move start) painting the grid on every record.
      await mount(widget);

      showGridLines();

      expect(gridded()).toEqual([true, false, false]);

      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));
      showGridLines();
      expect(gridded()).toEqual([false, false, false]);
    });
  });

  describe('Listview builder: grid lines survive a re-render during a move', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-001] record 1 keeps the grid for the whole move of one of its components', async () => {
      // Break this catches: React rewriting record 1's className when the drag starts, wiping the class showGridLines added.
      await mount(widget);
      showGridLines();
      expect(gridded()).toEqual([true, false, false]);

      await act(() => store().setDraggingComponentId('txt1'));

      expect(gridded()).toEqual([true, false, false]);
    });
  });

  describe('Listview builder: hovering a copy does not light up the original', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-007] hovering a copy leaves the hovered-component id alone, so record 1 shows no handle', async () => {
      // Break this catches: the copy publishing the shared component id, which opens the original's config handle.
      await mount(widget);

      await user().hover(copiesOf('txt1')[2]);
      expect(useTransientStore.getState().hoveredComponentForGrid).toBe('');

      await user().hover(copiesOf('txt1')[0]);
      expect(useTransientStore.getState().hoveredComponentForGrid).toBe('txt1');
    });
  });

  describe('Listview builder: the fade stays on the Moveable controls', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const controls = (targetId) => {
      const box = document.createElement('div');
      box.className = 'moveable-control-box';
      box.setAttribute('target-id', targetId);
      const handle = document.createElement('div');
      box.appendChild(handle);
      document.body.appendChild(box);
      return { box, handle };
    };

    test('[Listview-BLD-005] pointer on the border or resize handles of a record 1 component keeps records 2..K faded', async () => {
      // Break this catches: the controls living outside the record, so reaching them ends the hover and the fade.
      await mount(widget);
      await user().hover(rows()[0]);
      await waitFor(() => expect(faded()).toEqual([false, true, true]));
      const { box, handle } = controls('txt1');

      await user().unhover(rows()[0]);
      await user().hover(handle);
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      await user().hover(document.body);
      await waitFor(() => expect(faded()).toEqual([false, false, false]));
      box.remove();
    });

    test('[Listview-BLD-005] moving from the border into the component keeps records 2..K faded', async () => {
      // Break this catches: the border's mouseout clearing the hover after React already re-entered record 1.
      await mount(widget);
      const { box, handle } = controls('txt1');
      rows()[0].parentElement.appendChild(box);
      await user().hover(handle);
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      const inside = rows()[0].querySelector('.real-canvas');
      fireEvent.mouseOut(handle, { relatedTarget: inside });
      fireEvent.mouseOver(inside, { relatedTarget: handle });

      await waitFor(() => expect(faded()).toEqual([false, true, true]));
      box.remove();
    });

    test('[Listview-BLD-005] controls of a component outside the list do not fade it', async () => {
      // Break this catches: any Moveable control box on the page fading every list.
      await mount(widget);
      const { box, handle } = controls('somewhere-else');

      await user().hover(handle);

      expect(faded()).toEqual([false, false, false]);
      box.remove();
    });
  });

  describe('Listview builder: nested header on a copy record', () => {
    const innerHeaderChild = () => child('hdr2', 'title2', 'Text', { text: binding('Inner') }, `${INNER}-header`);
    const harness = createWidgetHarness({
      componentType: 'Listview',
      handle: 'listview1',
      id: ID,
      defaultProperties: {
        ...baseProperties,
        data: binding(NESTED),
        rowsPerPage: binding('{{1}}'),
        rowHeight: binding('250'),
      },
      defaultStyles: baseStyles,
      defaultExtraComponents: {
        [INNER]: child(INNER, 'listview2', 'Listview', {
          ...baseProperties,
          data: binding('{{listItem.items}}'),
          rowsPerPage: binding('{{10}}'),
          enablePagination: binding('{{false}}'),
          showHeader: binding('{{true}}'),
        }),
        txt2: innerText(),
        hdr2: innerHeaderChild(),
      },
      capabilities: { dnd: true },
      widgetHeight: 800,
      widgetWidth: 600,
    });
    beforeEach(harness.setup);
    afterEach(harness.teardown);

    test('[Listview-BLD-003] the header of a nested list in record 1 of page 2 is read-only', async () => {
      // Break this catches: the header context dropping the copy flag, so page 2's nested header stays editable.
      await mount(harness, {}, 3);
      await waitFor(() => expect(editable('hdr2')).toEqual([true]));

      await harness.act('setPage', 2);

      await waitFor(() => expect(copiesOf('txt2').map((node) => node.textContent.slice(-1))).toEqual(['c', 'd']));
      await waitFor(() => expect(editable('hdr2')).toEqual([false]));
    });
  });

  describe('Listview builder: a disabled record 1 locks the template', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const DISABLE_R0 = binding(`{{listItem.name === 'r0'}}`);
    const handles = () => [...document.querySelectorAll('.list-item .listview-record-resize-handle')];
    const setDisable = (value) =>
      act(() => widget.setComponentProperty(ID, 'disableRecords', binding(value).value, 'properties'));

    test('[Listview-REC-008] record 1 is read-only with no resize handle, and editable again once enabled', async () => {
      // Break this catches: the builder gate ignoring Disable records, so a disabled record 1 stays the editable original.
      await mount(widget, { properties: { disableRecords: DISABLE_R0 } });
      await waitFor(() => expect(editable('txt1')).toEqual([false, false, false]));
      expect(handles()).toHaveLength(0);
      expect(rows()[0].querySelector('.real-canvas')).toHaveAttribute('data-listview-copy', 'true');

      await setDisable('{{false}}');

      await waitFor(() => expect(editable('txt1')).toEqual([true, false, false]));
      expect(handles()).toHaveLength(1);
    });

    test('[Listview-REC-008] hovering a disabled record 1 fades nothing, shows no frame, handle or copy outline', async () => {
      // Break this catches: the main-record hover still starting from a disabled record 1.
      await mount(widget, { properties: { disableRecords: DISABLE_R0 } });

      // user-event refuses a pointer on pointer-events: none, which a script or a stale hover would not.
      fireEvent.mouseOver(rows()[0], { relatedTarget: document.body });
      fireEvent.mouseOver(copiesOf('txt1')[0], { relatedTarget: rows()[0] });

      expect(faded()).toEqual([true, false, false]);
      expect(framed()).toEqual([false, false, false]);
      expect(dotted('txt1')).toEqual([false, false, false]);
    });

    test('[Listview-REC-008] a disabled record 1 does not fade the others when a component moves or is selected', async () => {
      // Break this catches: the drag or selection fade running for a record 1 nobody can edit.
      await mount(widget, { properties: { disableRecords: DISABLE_R0 } });

      await act(() => {
        store().setSelectedComponents(['txt1']);
        store().setDraggingComponentId('txt1');
      });

      expect(faded()).toEqual([true, false, false]);
      expect(framed()).toEqual([false, false, false]);
    });

    test('[Listview-REC-008] a disabled record 2 leaves record 1 editable, and fades only once with the hover fade', async () => {
      // Break this catches: the lock spreading to every record, or the hover fade stacking a second fade on a disabled record.
      await mount(widget, { properties: { disableRecords: binding(`{{listItem.name === 'r1'}}`) } });
      await waitFor(() => expect(editable('txt1')).toEqual([true, false, false]));

      await user().hover(rows()[0]);

      await waitFor(() => expect(faded()).toEqual([false, true, true]));
      expect(rows()[1].style.opacity).toBe('0.4');
    });
  });

  describe('Listview builder: the lock clears the selection once', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-REC-008] a child selected in record 1 leaves the selection when the lock starts, other components stay', async () => {
      // Break this catches: the lock leaving a selected child in the selection, so keys still act on the template.
      await mount(widget, { properties: { disableRecords: binding('{{false}}') } });
      await act(() => store().setSelectedComponents(['txt1', ID]));

      await act(() =>
        widget.setComponentProperty(ID, 'disableRecords', binding(`{{listItem.name === 'r0'}}`).value, 'properties')
      );

      await waitFor(() => expect(store().selectedComponents).toEqual([ID]));
    });

    test('[Listview-REC-008] the child can be selected again later: the clear happens once, when the lock starts', async () => {
      // Break this catches: a store filter or a repeating effect that keeps a locked child out of the selection.
      await mount(widget, { properties: { disableRecords: binding(`{{listItem.name === 'r0'}}`) } });

      await act(() => store().setSelectedComponents(['txt1']));

      expect(store().selectedComponents).toEqual(['txt1']);
    });
  });

  describe('Listview builder: a locked child is look only', () => {
    beforeEach(async () => {
      await widget.setup();
      pasteComponents.mockClear();
      toast.success.mockClear();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { readText: jest.fn().mockResolvedValue('{}'), writeText: jest.fn() },
      });
    });
    afterEach(widget.teardown);

    const key = (code, extra = {}) => fireEvent.keyDown(document, { code, key: code, ...extra });
    const mountHotkeys = async (disableRecords = `{{listItem.name === 'r0'}}`) => {
      await mount(widget, { properties: { disableRecords: binding(disableRecords) } });
      render(<HotkeyProvider mode="edit" currentLayout="desktop" />);
      return () => store().getCurrentPageComponents()['txt1']?.layouts.desktop;
    };
    const componentCount = () => Object.keys(store().getCurrentPageComponents()).length;

    test.each([
      ['ArrowRight', {}],
      ['Backspace', {}],
      ['KeyD', { metaKey: true }],
      ['KeyX', { metaKey: true }],
      ['KeyV', { metaKey: true }],
    ])('[Listview-REC-014] %s on a selected locked child does nothing and shows no popup', async (code, extra) => {
      // Break this catches: the editing keys acting on a child of a locked record that was selected from the sidebar.
      const layout = await mountHotkeys();
      const before = { ...layout(), count: componentCount(), toasts: 0 };
      await act(() => store().setSelectedComponents(['txt1']));

      key(code, extra);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect({ ...layout(), count: componentCount(), toasts: toast.success.mock.calls.length }).toEqual(before);
      expect(store().showWidgetDeleteConfirmation).toBe(false);
      expect(store().isUserEditingTheVersion).toBeFalsy();
      expect(pasteComponents).not.toHaveBeenCalled();
    });

    test('[Listview-REC-014] Escape still clears the selection, and a mix of locked and unlocked children blocks the whole action', async () => {
      // Break this catches: Escape blocked with the rest, or one unlocked component letting the action through.
      await mountHotkeys();
      await act(() => store().setSelectedComponents(['txt1', ID]));

      key('Backspace');
      expect(store().showWidgetDeleteConfirmation).toBe(false);

      key('Escape');
      await waitFor(() => expect(store().selectedComponents).toEqual([]));
    });

    test('[Listview-REC-014] a child of an unlocked list still deletes with Backspace and moves with the arrows', async () => {
      // Break this catches: the new gate blocking every selection instead of only a locked one.
      const layout = await mountHotkeys('{{false}}');
      const left = layout().left;
      await act(() => store().setSelectedComponents(['txt1']));

      key('ArrowRight');
      await waitFor(() => expect(layout().left).toBe(left + 1));
      key('Backspace');

      expect(store().showWidgetDeleteConfirmation).toBe(true);
    });

    test('[Listview-REC-014] a frozen version still shows the released-version popup, as before', async () => {
      // Break this catches: the new gate running before the freeze gate and hiding its popup.
      await mountHotkeys('{{false}}');
      await act(() => store().setSelectedComponents(['txt1']));
      await act(() => useStore.setState({ isVersionReleased: true }));

      key('Backspace');

      expect(store().isUserEditingTheVersion).toBe(true);
      expect(store().showWidgetDeleteConfirmation).toBe(false);
      await act(() => useStore.setState({ isVersionReleased: false }));
    });

    test('[Listview-REC-015] the left sidebar Delete Component is refused for a locked child and works for a normal one', async () => {
      // Break this catches: the sidebar opening the delete dialog for a child of a locked record.
      await mount(widget, { properties: { disableRecords: binding(`{{listItem.name === 'r0'}}`) } });
      const { result } = renderHook(() => useCallbackActions());
      const remove = () =>
        result.current.find((group) => group.for === 'components').actions.find((a) => a.name === 'Delete Component');

      remove().dispatchAction({ nodeName: 'text1' });
      expect(store().showWidgetDeleteConfirmation).toBe(false);

      await act(() => widget.setComponentProperty(ID, 'disableRecords', binding('{{false}}').value, 'properties'));
      await waitFor(() => expect(editable('txt1')[0]).toBe(true));
      remove().dispatchAction({ nodeName: 'text1' });

      expect(store().showWidgetDeleteConfirmation).toBe(true);
    });

    test('[Listview-REC-019] on page 2 of a client list a locked child still ignores Backspace and the sidebar delete', async () => {
      // Break this catches: the lock needing record 1 on screen, so page 2 leaves the template editable.
      await mountHotkeys();
      await goToPage2();
      await act(() => store().setSelectedComponents(['txt1']));

      key('Backspace');
      const { result } = renderHook(() => useCallbackActions());
      result.current
        .find((group) => group.for === 'components')
        .actions.find((a) => a.name === 'Delete Component')
        .dispatchAction({ nodeName: 'text1' });

      expect(store().showWidgetDeleteConfirmation).toBe(false);
    });

    test('[Listview-REC-019] a first row that is enabled locks nothing, even when record 3 is disabled, on either page', async () => {
      // Break this catches: any disabled record, not the first row of the data, locking the template.
      await mountHotkeys(`{{listItem.name === 'r2'}}`);
      expect(store().lockedListviews).toEqual({});
      await goToPage2();
      expect(store().lockedListviews).toEqual({});
      await act(() => store().setSelectedComponents(['txt1']));

      key('Backspace');

      expect(store().showWidgetDeleteConfirmation).toBe(true);
    });

    test('[Listview-REC-019] with server pagination the lock is known only while page 1 shows', async () => {
      // Break this catches: a guess about page 1 from the rows of another page (here page 2 also starts with r0); the gap is in D-21.
      await mount(widget, {
        properties: { ...serverProperties, disableRecords: binding(`{{listItem.name === 'r0'}}`) },
      });
      await waitFor(() => expect(store().lockedListviews).toEqual({ [ID]: 'canvas' }));

      await widget.act('setPage', 2);
      await act(() =>
        widget.setComponentProperty(
          ID,
          'data',
          binding(`{{[{ name: 'r0' }, { name: 'x1' }, { name: 'x2' }]}}`).value,
          'properties'
        )
      );

      await waitFor(() => expect(store().lockedListviews).toEqual({}));
    });

    test('[Listview-REC-019] new data that disables the first row, seen from page 2, clears the selection', async () => {
      // Break this catches: the selection clear waiting for page 1, so a child stays selected under a lock.
      await mountHotkeys(`{{listItem.name === 'zz'}}`);
      await goToPage2();
      await act(() => store().setSelectedComponents(['txt1', ID]));

      await act(() =>
        widget.setComponentProperty(
          ID,
          'data',
          binding(
            `{{[{ name: 'zz' }, { name: 'r1' }, { name: 'r2' }, { name: 'r3' }, { name: 'r4' }, { name: 'r5' }, { name: 'r6' }]}}`
          ).value,
          'properties'
        )
      );

      await waitFor(() => expect(store().selectedComponents).toEqual([ID]));
      expect(store().lockedListviews).toEqual({ [ID]: 'canvas' });
    });

    describe('the right panel', () => {
      const renderInspector = (selectedComponentId) =>
        render(
          <MemoryRouter>
            <Inspector
              componentDefinitionChanged={jest.fn()}
              darkMode={false}
              pages={[]}
              selectedComponentId={selectedComponentId}
              handleRightSidebarToggle={jest.fn()}
            />
          </MemoryRouter>
        );
      const guarded = (container) => ({
        header: container.querySelector('.panel-header-name'),
        menu: container.querySelector('[data-cy="component-inspector-options"]'),
        body: container.querySelector('.inspector > div > div:last-child'),
      });

      test('[Listview-REC-013] a locked child shows greyed, with the name, the menu and the properties unreachable by Tab', async () => {
        // Break this catches: a locked child editable in the right panel, or reachable by keyboard.
        await mount(widget, { properties: { disableRecords: binding(`{{listItem.name === 'r0'}}`) } });
        await act(() => store().setSelectedComponents(['txt1']));

        const { container } = renderInspector('txt1');

        const { header, menu, body } = guarded(container);
        [header, menu, body].forEach((node) => {
          expect(node.closest('.disabled') ?? node.querySelector('.disabled') ?? node).toBeTruthy();
          expect(node.inert).toBe(true);
        });
        expect(header.classList.contains('disabled')).toBe(true);
        expect(body.classList.contains('disabled')).toBe(true);
      });

      test('[Listview-REC-019] on page 2 a locked child shows greyed and inert in the right panel', async () => {
        // Break this catches: the panel reading the lock only while record 1 shows.
        await mount(widget, { properties: { disableRecords: binding(`{{listItem.name === 'r0'}}`) } });
        await goToPage2();
        await act(() => store().setSelectedComponents(['txt1']));

        const { container } = renderInspector('txt1');

        const { header, body } = guarded(container);
        expect(header.inert).toBe(true);
        expect(body.inert).toBe(true);
      });

      test('[Listview-REC-013] a child of an unlocked list, and the ListView itself, are not greyed or inert', async () => {
        // Break this catches: the look-only state leaking onto every selection.
        await mount(widget, { properties: { disableRecords: binding('{{false}}') } });

        for (const id of ['txt1', ID]) {
          await act(() => store().setSelectedComponents([id]));
          const { container, unmount } = renderInspector(id);
          const { header, menu, body } = guarded(container);
          [header, menu, body].forEach((node) => expect(node.inert).toBeFalsy());
          expect(header.classList.contains('disabled')).toBe(false);
          unmount();
        }
      });
    });
  });

  describe('Listview builder: a click on a record does not focus a locked template', () => {
    beforeEach(async () => {
      await widget.setup();
      pasteComponents.mockClear();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { readText: jest.fn().mockResolvedValue('{}'), writeText: jest.fn() },
      });
    });
    afterEach(widget.teardown);

    const recordCanvas = (index) => rows()[index].querySelector('.real-canvas');

    test('[Listview-REC-016] clicking an enabled record of a locked list leaves paste and select all off the template', async () => {
      // Break this catches: the click on a copy making the locked ListView the paste and select-all target.
      await mount(widget, { properties: { disableRecords: binding(`{{listItem.name === 'r0'}}`) } });
      render(<HotkeyProvider mode="edit" currentLayout="desktop" />);

      fireEvent.click(recordCanvas(1));
      fireEvent.keyDown(document, { code: 'KeyV', key: 'v', metaKey: true });

      await waitFor(() => expect(pasteComponents).toHaveBeenCalled());
      expect(pasteComponents.mock.calls[0][0]).not.toBe(ID);
      expect(store().focusedParentId).not.toBe(ID);
    });

    test('[Listview-REC-019] on page 2 a click on a record still keeps the locked template off the paste target', async () => {
      // Break this catches: the focus rule needing the first record on screen.
      await mount(widget, { properties: { disableRecords: binding(`{{listItem.name === 'r0'}}`) } });
      await goToPage2();
      render(<HotkeyProvider mode="edit" currentLayout="desktop" />);

      fireEvent.click(recordCanvas(1));
      fireEvent.keyDown(document, { code: 'KeyV', key: 'v', metaKey: true });

      await waitFor(() => expect(pasteComponents).toHaveBeenCalled());
      expect(pasteComponents.mock.calls[0][0]).not.toBe(ID);
    });

    test('[Listview-REC-016] on a list that is not locked a click on a copy still focuses the ListView, as before', async () => {
      // Break this catches: the focus change reaching every copy instead of only a locked list.
      await mount(widget, { properties: { disableRecords: binding('{{false}}') } });
      render(<HotkeyProvider mode="edit" currentLayout="desktop" />);

      fireEvent.click(recordCanvas(1));
      fireEvent.keyDown(document, { code: 'KeyV', key: 'v', metaKey: true });

      await waitFor(() => expect(pasteComponents).toHaveBeenCalled());
      expect(pasteComponents.mock.calls[0][0]).toBe(ID);
    });
  });

  describe('Listview builder: a disabled record is dimmed once', () => {
    const innerDisabled = () =>
      child(INNER, 'listview2', 'Listview', {
        ...baseProperties,
        data: binding('{{listItem.items}}'),
        rowsPerPage: binding('{{10}}'),
        enablePagination: binding('{{false}}'),
        disableRecords: binding(`{{listItem.name === 'd'}}`),
      });
    const harness = createWidgetHarness({
      componentType: 'Listview',
      handle: 'listview1',
      id: ID,
      defaultProperties: {
        ...baseProperties,
        data: binding(NESTED),
        rowsPerPage: binding('{{2}}'),
        rowHeight: binding('250'),
      },
      defaultStyles: baseStyles,
      defaultExtraComponents: { [INNER]: innerDisabled(), txt2: innerText() },
      capabilities: { dnd: true },
      widgetHeight: 800,
      widgetWidth: 600,
    });
    beforeEach(harness.setup);
    afterEach(harness.teardown);

    test('[Listview-REC-005] a disabled inner record under the outer hover fade is not dimmed a second time', async () => {
      // Break this catches: 0.4 on the faded outer record and 0.4 again on the inner one, which shows as 0.16.
      await mount(harness, {}, 6);

      await user().hover(rows()[0]);

      await waitFor(() => expect(rows()[3].style.opacity).toBe('0.4'));
      expect(rows()[5]).toHaveAttribute('aria-disabled', 'true');
      expect(rows()[5].style.opacity).toBe('');
    });

    test('[Listview-REC-005] a disabled inner record inside a disabled outer record is not dimmed a second time', async () => {
      // Break this catches: stacked fades on a record whose whole branch is already dimmed.
      await mount(harness, { properties: { disableRecords: binding(`{{listItem.name === 'o2'}}`) } }, 6);

      expect(rows()[3]).toHaveAttribute('aria-disabled', 'true');
      expect(rows()[3].style.opacity).toBe('0.4');
      expect(rows()[5]).toHaveAttribute('aria-disabled', 'true');
      expect(rows()[5].style.opacity).toBe('');
    });

    test('[Listview-REC-006] a child in an inner list under a disabled outer record gets no copy outline on hover', async () => {
      // Break this catches: the outline flag not following the record down into a nested list.
      await mount(harness, { properties: { disableRecords: binding(`{{listItem.name === 'o2'}}`) } }, 6);

      fireEvent.mouseOver(copiesOf('txt2')[2], { relatedTarget: document.body });
      fireEvent.mouseOver(copiesOf('txt2')[1], { relatedTarget: document.body });

      expect(dotted('txt2')).toEqual([false, true, false, false]);
    });
  });

  describe('Listview builder: preview shows no builder highlights', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-BLD-008] no fade, outline or dotted copies in preview', async () => {
      // Break this catches: a builder rule running in view mode (fade, record frame, dotted copies).
      await mount(widget, { currentMode: 'view' });

      await user().hover(rows()[0]);
      await act(() => {
        store().setSelectedComponents(['txt1']);
        store().setDraggingComponentId('txt1');
      });
      await user().hover(copiesOf('txt1')[2]);

      expect(faded()).toEqual([false, false, false]);
      expect(framed()).toEqual([false, false, false]);
      expect(dotted('txt1')).toEqual([false, false, false]);
    });
  });
});
