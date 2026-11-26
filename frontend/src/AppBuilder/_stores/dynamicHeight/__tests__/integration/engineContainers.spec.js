/**
 * The dynamic height engine's container specifics: Tabs, Accordion, the modal body, a JSON-schema Form, a module's
 * root, FlexContainer children, and solving a whole module after its saved layout changed.
 *
 * Runs on the real composed store, seeded through `seedApp`, as engine.spec.js does. Widgets are 10 columns wide at
 * column 0 unless a spec says otherwise, so each one sits under the one above it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { ROOT_CANVAS, flushDynamicHeight } from '../../engine';
import { bootModule, uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const pass = (options) => flushDynamicHeight(useStore.getState, options);
const temps = () => s().temporaryLayouts;

const DH = { dynamicHeight: binding('{{true}}') };
const NO_HEADER = { showHeader: binding('{{false}}') };

const BOX = uuid(1);
const TABS = uuid(2);
const ACCORDION = uuid(3);
const MODAL = uuid(4);
const FORM = uuid(5);
const FLEX = uuid(6);
const INSTANCE = uuid(50);
const ROOT = uuid(51);

describe('dynamic height engine: Tabs', () => {
  // A Tabs drawn 200 high showing t1, with a widget on t1 and on t2, and a widget 20px under the Tabs.
  // Tabs chrome is 82px (tab strip and pane padding, containerChrome.js).
  const tabsPage = () => ({
    [TABS]: widget(TABS, 'Tabs', { top: 0, height: 200, properties: { ...DH, defaultTab: binding('t1') } }),
    onFirst: widget('onFirst', 'Text', { parent: `${TABS}-t1`, top: 0, properties: DH }),
    onSecond: widget('onSecond', 'Text', { parent: `${TABS}-t2`, top: 0, properties: DH }),
    after: widget('after', 'Text', { top: 220 }),
  });

  it('[DynamicHeight-ENGINE-016] sizes a Tabs from the tab it shows', () => {
    seedApp(tabsPage());
    pass({ changes: [{ id: 'onFirst', height: 300 }] });
    expect(temps()[TABS]).toEqual({ top: 0, height: 382 });
    expect(temps().after).toEqual({ top: 402, height: 40 });
  });

  it('[DynamicHeight-ENGINE-017] places a hidden tab’s content without resizing the Tabs', () => {
    seedApp(tabsPage());
    pass({ changes: [{ id: 'onSecond', height: 300 }] });
    expect(temps()).toEqual({ onSecond: { top: 0, height: 300 } });
  });

  it('[DynamicHeight-ENGINE-018] resizes a Tabs when another tab is shown', () => {
    seedApp(tabsPage());
    s().setTemporaryLayouts({ onSecond: { top: 0, height: 300 } });
    s().setExposedValue(TABS, 'currentTab', 't2');
    pass({ changes: [{ id: TABS }] });
    expect(temps()[TABS]).toEqual({ top: 0, height: 382 });
  });
});

describe('dynamic height engine: Accordion', () => {
  it('[DynamicHeight-ENGINE-019] draws a closed Accordion as its header, and moves what is below it up', () => {
    seedApp({
      [ACCORDION]: widget(ACCORDION, 'Accordion', {
        top: 0,
        height: 200,
        properties: { ...DH, showHeader: binding('{{true}}'), headerHeight: binding('{{40}}') },
      }),
      after: widget('after', 'Text', { top: 220 }),
    });
    s().setExposedValue(ACCORDION, 'isExpanded', false);
    pass({ changes: [{ id: ACCORDION }] });
    // header 40 + 12
    expect(temps()).toEqual({ [ACCORDION]: { top: 0, height: 52 }, after: { top: 72, height: 40 } });
  });
});

describe('dynamic height engine: modal body', () => {
  it('[DynamicHeight-ENGINE-020] sizes the modal body from its content, and leaves the canvas alone', () => {
    seedApp({
      [MODAL]: widget(MODAL, 'ModalV2', {
        top: 0,
        properties: { ...DH, ...NO_HEADER, showFooter: binding('{{false}}') },
      }),
      inBody: widget('inBody', 'Text', { parent: MODAL, top: 0, properties: DH }),
      after: widget('after', 'Text', { top: 60 }),
    });
    pass({ changes: [{ id: 'inBody', height: 300 }] });
    // Only the body's height: the modal is drawn over the page, its trigger keeps its place. 300 + 18px of body chrome.
    expect(temps()).toEqual({ inBody: { top: 0, height: 300 }, [`${MODAL}-body`]: { height: 318 } });
  });
});

describe('dynamic height engine: Form generated from a JSON schema', () => {
  it('[DynamicHeight-ENGINE-021] takes the schema form at the height it was measured', () => {
    seedApp({
      [FORM]: widget(FORM, 'Form', {
        top: 0,
        height: 300,
        properties: { ...DH, generateFormFrom: binding('jsonSchema') },
      }),
      after: widget('after', 'Text', { top: 320 }),
    });
    pass({ changes: [{ id: FORM, height: 450 }] });
    expect(temps()).toEqual({ [FORM]: { top: 0, height: 450 }, after: { top: 470, height: 40 } });
  });
});

describe('dynamic height engine: a module root', () => {
  // A module root drawn at top 30 (where the module editor shows it), with one widget in it. 6px of module chrome.
  const modulePage = () => ({
    [ROOT]: widget(ROOT, 'ModuleContainer', { top: 30, height: 200, properties: DH }),
    inModule: widget('inModule', 'Text', { parent: ROOT, top: 0, properties: DH }),
  });

  it('[DynamicHeight-ENGINE-022] draws an embedded module’s root at the top of its instance', () => {
    seedApp({ [INSTANCE]: widget(INSTANCE, 'ModuleViewer', { top: 0, height: 300, properties: DH }) });
    bootModule(INSTANCE);
    seedApp(modulePage(), { moduleId: INSTANCE });
    pass({ changes: [{ id: 'inModule', moduleId: INSTANCE, height: 300 }] });
    expect(temps()[`${INSTANCE}::${ROOT}`]).toEqual({ top: 0, height: 306 });
  });

  it('[DynamicHeight-ENGINE-023] keeps the module root where it is drawn in the module editor', () => {
    seedApp(modulePage());
    pass({ changes: [{ id: 'inModule', height: 300 }] });
    expect(temps()[ROOT]).toEqual({ top: 30, height: 306 });
  });
});

describe('dynamic height engine: FlexContainer', () => {
  // UI 2.0 layout, 12px padding: chrome is 12 × 2 + 2px of box padding × 2 + 1px of border × 2 = 30.
  const flexPage = (properties, children) => ({
    [FLEX]: widget(FLEX, 'FlexContainer', {
      top: 0,
      height: 60,
      properties: { ...DH, layoutVersion: binding('2'), padding: binding('12'), gap: binding('8'), ...properties },
    }),
    ...children,
    after: widget('after', 'Text', { top: 80 }),
  });

  it('[DynamicHeight-ENGINE-024] gives flex children their heights only, and sizes the container by flex rules', () => {
    seedApp(
      flexPage(
        { direction: binding('column') },
        {
          first: widget('first', 'Text', { parent: FLEX, top: 0, properties: DH }),
          second: widget('second', 'Text', { parent: FLEX, top: 0 }),
        }
      )
    );
    pass({ changes: [{ id: 'first', height: 100 }] });
    // Stacked: 100 + 8 + 40, plus 30 of chrome. The children's saved tops mean nothing in a flex container.
    expect(temps()).toEqual({
      first: { height: 100 },
      [FLEX]: { top: 0, height: 178 },
      after: { top: 198, height: 40 },
    });
  });

  it('[DynamicHeight-ENGINE-025] wraps a flex row at the width it was measured at', () => {
    const cards = Object.fromEntries(
      ['c1', 'c2', 'c3'].map((id) => [
        id,
        widget(id, 'Text', { parent: FLEX, top: 0, height: 50, layout: { widthPx: 600, fillWidth: false } }),
      ])
    );
    seedApp(flexPage({ direction: binding('row'), flexWrap: binding('{{true}}') }, cards));
    // 1288 wide, 1264 inside the padding: two 600px cards fit on a line, the third wraps.
    pass({ changes: [{ id: FLEX }], measureWidth: (id) => (id === FLEX ? 1288 : null) });
    expect(temps()[FLEX]).toEqual({ top: 0, height: 50 + 8 + 50 + 30 });

    // Not measured yet: one line.
    useStore.setState({ temporaryLayouts: {} });
    pass({ changes: [{ id: FLEX }] });
    expect(temps()[FLEX]).toEqual({ top: 0, height: 50 + 30 });
  });
});

describe('dynamic height engine: a whole module solved again', () => {
  it('[DynamicHeight-ENGINE-026] places every canvas again after a saved layout changed', () => {
    // A Container grown to 380 by its first widget; then the builder moves the second widget down by 40.
    const page = (underTop) => ({
      [BOX]: widget(BOX, 'Container', { top: 0, height: 200, properties: { ...DH, ...NO_HEADER } }),
      inner: widget('inner', 'Text', { parent: BOX, top: 0, properties: DH }),
      under: widget('under', 'Text', { parent: BOX, top: underTop }),
      after: widget('after', 'Text', { top: 220 }),
    });
    seedApp(page(60));
    pass({ changes: [{ id: 'inner', height: 300 }] });
    expect(temps()[BOX]).toEqual({ top: 0, height: 380 });

    seedApp(page(100));
    const { solvedSlots } = pass({ fullModules: ['canvas'] });
    expect(solvedSlots).toEqual([BOX, ROOT_CANVAS]);
    expect(temps().under).toEqual({ top: 360, height: 40 });
    expect(temps()[BOX]).toEqual({ top: 0, height: 420 });
    expect(temps().after).toEqual({ top: 440, height: 40 });
  });

  it('[DynamicHeight-ENGINE-027] skips a canvas whose container is not on the page', () => {
    seedApp({
      a: widget('a', 'Text', { top: 0 }),
      orphan: widget('orphan', 'Text', { parent: uuid(99), top: 0 }),
    });
    const { solvedSlots } = pass({ fullModules: ['canvas'] });
    expect(solvedSlots).toEqual([ROOT_CANVAS]);
  });
});
