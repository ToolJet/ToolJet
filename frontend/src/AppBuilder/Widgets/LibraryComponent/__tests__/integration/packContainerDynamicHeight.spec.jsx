import React from 'react';
import { act, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  MODULE_ID,
  store,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { seedApp, componentDefinition } from '@/test/app-builder';
import WidgetWrapper from '@/AppBuilder/AppCanvas/WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { useBuiltinPacksStore } from '@/_stores/builtinPacksStore';
import {
  loadLibraryModule,
  slotAttributeName,
  toolJetSdk as ToolJet,
} from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

// QA: Dynamic height did nothing on a pack container. A Rocket 2.0 Card drawn 200px tall with Dynamic height on kept
// its 200px in a released app while the Text in its body grew: the text was clipped and scrolled inside the card, and
// the Text below the card never moved. A native Container set up the same way grows with its components, goes back to
// its drawn height when they shrink, and frees a hidden component's space only when the component collapses when
// hidden. A pack container now does the same, a pack list's rows grow with their components as a native List view's
// do, and a pack dialog's body grows with its components as a native Modal's does. The store, the widget wrapper, the
// inline SDK, the host and the reflow are the real ones; the network and the bundle's module loading are replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const ID = 'pack1';
const HASH = 'abc123def4567890';
const API = 'http://localhost:3000/api';
// The card's drawn height. The host gets the box less the 2px padding every widget's box has on each side.
const DRAWN = 200;
const HOST_HEIGHT = `${DRAWN - 4}px`;

// A container from a pack, as the Rocket 2.0 Card is: a title over a body that builders drop components into.
const Card = () => (
  <div>
    <div>Card title</div>
    <ToolJet.Slot name="body" />
  </div>
);

// A list from a pack, as the Rocket 2.0 ListView in its Components mode: one row of ToolJet components per item.
const ROW_HEIGHT = 72;
const ITEMS = [{ id: 1 }, { id: 2 }];
const List = () => {
  ToolJet.useRows(ITEMS, ROW_HEIGHT);
  return (
    <div>
      {ITEMS.map((item, index) => (
        <ToolJet.RowSlot key={item.id} name="row" index={index} item={item} />
      ))}
    </div>
  );
};

// A dialog from a pack: its body, a canvas of components, is drawn in the popup layer, outside the widget's box.
const Dialog = () => <ToolJet.PopupSlot name="body" style={{ height: 120 }} />;

const manifest = {
  manifestVersion: 2,
  components: {
    Card: { displayName: 'Card', props: [], fit: false, slots: [{ name: 'body', kind: 'slot' }] },
    List: { displayName: 'List', props: [], fit: true, slots: [{ name: 'row', kind: 'rows' }] },
    Dialog: { displayName: 'Dialog', props: [], fit: false, slots: [{ name: 'body', kind: 'popup' }] },
  },
};

const widget = createWidgetHarness({
  componentType: 'PackComponent',
  handle: 'card1',
  id: ID,
  defaultProperties: { pack: binding('shadcn'), componentName: binding('Card') },
  defaultStyles: { boxShadow: binding('0px 0px 0px 0px #00000040') },
  preload: ['Text'],
  capabilities: {
    // The body is a ToolJet canvas, which is a drop target.
    dnd: true,
    network: [
      {
        url: `${API}/builtin-packs`,
        json: [{ pack: 'shadcn', displayName: 'shadcn', version: '2.1.31', hash: HASH, hasCss: true }],
      },
      { url: `${API}/builtin-packs/shadcn/${HASH}/manifest.json`, json: manifest },
    ],
  },
});

// A Text in the card's body (or the dialog's), laid out on the body's canvas.
const inBody = (id, top, height, properties = {}) => {
  const child = componentDefinition(id, id, 'Text', { text: binding(id), ...properties });
  child.component.parent = `${ID}-body`;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top, left: 0, width: 20, height } };
  child.layouts.mobile = { ...child.layouts.desktop };
  return child;
};

// A Text in the list's row, laid out on the row's canvas: a row's components are the list's own children.
const inRow = (id, top, height) => {
  const child = inBody(id, top, height);
  child.component.parent = ID;
  return child;
};

function renderPack({ componentName = 'Card', dynamicHeight = true, mode = 'view', children = {} } = {}) {
  const definition = componentDefinition(ID, 'card1', 'PackComponent', {
    pack: binding('shadcn'),
    componentName: binding(componentName),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding(`{{${dynamicHeight}}}`),
  });
  definition.component.definition.styles = { boxShadow: binding('0px 0px 0px 0px #00000040') };
  definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  definition.layouts = { desktop: { top: 0, left: 0, width: 20, height: DRAWN } };
  definition.layouts.mobile = { ...definition.layouts.desktop };
  seedApp({ [ID]: definition, ...children }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode(mode, MODULE_ID);
  return widget.session.render(
    <WidgetWrapper
      id={ID}
      moduleId={MODULE_ID}
      currentLayout="desktop"
      inCanvas={true}
      mode={mode}
      darkMode={false}
      gridWidth={10}
      onOptionChange={() => {}}
      onOptionsChange={() => {}}
    />
  );
}

// The body's drop area: the canvas the card's components are laid out on, projected into the card's body.
const dropArea = () => document.querySelector(`[slot="${slotAttributeName('body')}"]`)?.firstElementChild;
// The element the card draws in (its shadow host), and the box around it that the widget's height measures.
const cardHost = () => document.querySelector('[data-cy="card1"]');
const cardBox = () => cardHost()?.parentElement;
// Row `index` of the list: the canvas its components are laid out on, projected into the list's RowSlot.
const rowCanvas = (index) => document.querySelector(`[slot="tj-row-${ID}-${index}"] .list-item`);
// The dialog's body: the canvas its components are laid out on, in the popup layer.
const popupCanvas = () => document.querySelector(`[slot="tj-slot-${ID}-body"]`)?.firstElementChild;

describe('pack container with Dynamic height', () => {
  beforeAll(() => import('@/AppBuilder/AppCanvas/ConfigHandle/MentionComponentInChat'));

  let clientWidth;
  beforeEach(async () => {
    await widget.setup();
    loadLibraryModule.mockResolvedValue({ Card, List, Dialog });
    act(() => useStore.setState({ license: { featureAccess: { customComponentLibraries: false } } }));
    // The body's canvas lays its components out across the width the pack gives it.
    clientWidth = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
  });
  afterEach(() => {
    clientWidth.mockRestore();
    widget.teardown();
    loadLibraryModule.mockReset();
    useBuiltinPacksStore.setState({ packs: null, manifests: {} });
  });

  test('[PackComponent-DYNHEIGHT-001] in a released app its drop area takes the height of its components, and follows them as they grow and shrink', async () => {
    // Break this catches: the drop area kept at the card's drawn size, so a component that grew past it was clipped
    // and scrolled inside the card, and the card never grew (QA: Dynamic height does nothing on pack containers).
    renderPack({ children: { first: inBody('first', 10, 40), second: inBody('second', 60, 40) } });
    await waitFor(() => expect(dropArea()).toBeTruthy());

    // The lowest component ends at 100, plus the 8px a UI 2.0 card keeps under its lowest component.
    await waitFor(() => expect(dropArea().style.height).toBe('108px'));

    // The first Text grows to 300 (its own dynamic height) and the reflow pushes the second one down under it.
    act(() => store().setTemporaryLayouts({ first: { top: 10, height: 300 }, second: { top: 320, height: 40 } }));
    await waitFor(() => expect(dropArea().style.height).toBe('368px'));

    act(() => store().setTemporaryLayouts({ first: { top: 10, height: 40 }, second: { top: 60, height: 40 } }));
    await waitFor(() => expect(dropArea().style.height).toBe('108px'));
  });

  test('[PackComponent-DYNHEIGHT-002] a hidden component keeps its space when it does not collapse when hidden', async () => {
    // Break this catches: a hidden component's space freed although it does not collapse when hidden, so the card
    // shrank under it where a native Container keeps its height.
    renderPack({
      children: {
        first: inBody('first', 10, 40),
        second: inBody('second', 60, 40, { visibility: binding('{{false}}') }),
      },
    });
    await waitFor(() => expect(dropArea()).toBeTruthy());

    await waitFor(() => expect(dropArea().style.height).toBe('108px'));
  });

  test('[PackComponent-DYNHEIGHT-003] a hidden component that collapses when hidden gives its space back', async () => {
    // Break this catches: a card kept tall around the empty band a collapsed component left.
    renderPack({
      children: {
        first: inBody('first', 10, 40),
        second: inBody('second', 60, 40, {
          visibility: binding('{{false}}'),
          collapseWhenHidden: binding('{{true}}'),
        }),
      },
    });
    await waitFor(() => expect(dropArea()).toBeTruthy());

    await waitFor(() => expect(dropArea().style.height).toBe('58px'));
  });

  test('[PackComponent-DYNHEIGHT-004] the card draws at the height of its content, never shorter than it was drawn', async () => {
    // Break this catches: the card held at its drawn box whatever its content (it never grows), or let shrink below
    // its drawn height when its components are short (a native Container keeps its drawn height).
    renderPack({ children: { first: inBody('first', 10, 40) } });
    await waitFor(() => expect(dropArea()).toBeTruthy());

    expect(cardBox().style.height).toBe('auto');
    expect(cardHost().style.minHeight).toBe(HOST_HEIGHT);
  });

  test('[PackComponent-DYNHEIGHT-005] with Dynamic height off its drop area fills the box the card was drawn at', async () => {
    // Break this catches: a card without Dynamic height sized to its components, moving every saved app's layout.
    renderPack({ dynamicHeight: false, children: { first: inBody('first', 10, 40) } });
    await waitFor(() => expect(dropArea()).toBeTruthy());

    expect(dropArea().style.height).toBe('');
    expect(cardBox().style.height).toBe(HOST_HEIGHT);
  });

  test('[PackComponent-DYNHEIGHT-006] in the editor it keeps the box it was drawn at', async () => {
    // Break this catches: the editor resizing a card under the builder's hands; only a released app fits it.
    renderPack({ mode: 'edit', children: { first: inBody('first', 10, 40) } });
    await waitFor(() => expect(dropArea()).toBeTruthy());

    expect(dropArea().style.height).toBe('');
    expect(cardBox().style.height).toBe(HOST_HEIGHT);
  });

  test("[PackComponent-DYNHEIGHT-015] a list's rows grow with their components, never below the row height", async () => {
    // Break this catches: a row held at its row height while its components grew (the text cut off, the component
    // under it hidden), or sized by the native row reflow, which floored every row at the whole list's drawn height.
    renderPack({ componentName: 'List', children: { cell: inRow('cell', 0, 100) } });
    await waitFor(() => expect(rowCanvas(1)).toBeTruthy());

    // The row's lowest component ends at 100, plus the 8px a UI 2.0 row keeps under it.
    await waitFor(() => expect(rowCanvas(0).style.height).toBe('108px'));
    expect(rowCanvas(1).style.height).toBe('108px');

    // The component shrinks under the row height: the row keeps it.
    act(() => store().setTemporaryLayouts({ 'cell-0': { top: 0, height: 30 } }));
    await waitFor(() => expect(rowCanvas(0).style.height).toBe(`${ROW_HEIGHT}px`));
    expect(rowCanvas(1).style.height).toBe('108px');
  });

  test("[PackComponent-DYNHEIGHT-016] with Dynamic height off a list's rows keep the row height", async () => {
    // Break this catches: every saved list's rows resized to their components with Dynamic height off.
    renderPack({ componentName: 'List', dynamicHeight: false, children: { cell: inRow('cell', 0, 100) } });
    await waitFor(() => expect(rowCanvas(1)).toBeTruthy());

    expect(rowCanvas(0).style.height).toBe(`${ROW_HEIGHT}px`);
    expect(rowCanvas(1).style.height).toBe(`${ROW_HEIGHT}px`);
  });

  test("[PackComponent-DYNHEIGHT-017] a dialog's body takes the height of its components", async () => {
    // Break this catches: the body's canvas held at the dialog's body height, its components scrolling inside it,
    // where a native Modal with Dynamic height grows with them.
    renderPack({ componentName: 'Dialog', children: { first: inBody('first', 0, 300) } });
    await waitFor(() => expect(popupCanvas()).toBeTruthy());

    await waitFor(() => expect(popupCanvas().style.height).toBe('308px'));
    // The dialog's own box on the page (its trigger) keeps the height it was drawn at.
    expect(cardBox().style.height).toBe(HOST_HEIGHT);
  });

  test("[PackComponent-DYNHEIGHT-018] with Dynamic height off a dialog's body is as tall as the dialog makes it", async () => {
    // Break this catches: every saved dialog's body resized to its components with Dynamic height off.
    renderPack({ componentName: 'Dialog', dynamicHeight: false, children: { first: inBody('first', 0, 300) } });
    await waitFor(() => expect(popupCanvas()).toBeTruthy());

    expect(popupCanvas().style.height).toBe('');
  });
});

describe('reflow around a pack container with Dynamic height', () => {
  const page = () => {
    const card = componentDefinition('card', 'card1', 'PackComponent', {
      pack: binding('shadcn'),
      componentName: binding('Card'),
      dynamicHeight: binding('{{true}}'),
    });
    card.layouts = { desktop: { top: 0, left: 0, width: 20, height: 200 } };
    const inner = componentDefinition('inner', 'text1', 'Text');
    inner.component.parent = 'card-body';
    inner.layouts = { desktop: { top: 10, left: 0, width: 20, height: 40 } };
    const below = componentDefinition('below', 'text2', 'Text');
    below.layouts = { desktop: { top: 220, left: 0, width: 20, height: 40 } };
    return { card, inner, below };
  };

  test('[PackComponent-DYNHEIGHT-007] a reflow inside its drop area leaves the card at the height it measured', () => {
    // Break this catches: a component in the card's body reflowing (a Text whose value changed) sizing the card as a
    // grid container. Its components sit on `<id>-body`, not on the card, so it went back to its drawn 200px over the
    // 420 it had measured, and the Text below it rode up over the card.
    seedApp(page());
    useStore.getState().setTemporaryLayouts({ card: { top: 0, height: 420 }, below: { top: 440, height: 40 } });

    useStore
      .getState()
      .flushReflows([{ id: 'inner', layout: 'desktop', isContainer: false, contextIndices: null, moduleId: 'canvas' }]);

    const temps = useStore.getState().temporaryLayouts;
    expect(temps.card.height).toBe(420);
    expect(temps.below.top).toBe(440);
  });

  test('[PackComponent-DYNHEIGHT-008] a reflow in a row of a pack list still sizes that row', () => {
    // Break this catches: the drop-area rule above swallowing a pack list's rows, whose components sit on the list
    // itself; the row then kept its height while its component grew.
    const list = componentDefinition('list', 'list1', 'PackComponent', {
      pack: binding('shadcn'),
      componentName: binding('ListView'),
      dynamicHeight: binding('{{true}}'),
    });
    list.layouts = { desktop: { top: 0, left: 0, width: 20, height: 100 } };
    const cell = componentDefinition('cell', 'text1', 'Text');
    cell.component.parent = 'list';
    cell.layouts = { desktop: { top: 10, left: 0, width: 20, height: 40 } };
    seedApp({ list, cell });
    useStore.getState().setTemporaryLayouts({ 'cell-1': { top: 10, height: 300 } });

    useStore
      .getState()
      .flushReflows([{ id: 'cell', layout: 'desktop', isContainer: false, contextIndices: [1], moduleId: 'canvas' }]);

    expect(useStore.getState().temporaryLayouts['list-1']?.height).toBe(10 + 300);
  });
});
