/**
 * Table scrolling: a scroll renders the rows coming into view and nothing else of the table.
 * - The header is not rendered again: it measures its text while rendering, which makes the browser lay out the whole
 *   table. Anything else that re-renders the table still re-renders it.
 * - The body's style (the placeholder rows drawn as its background) stays the same: a change restyles the whole body.
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { tableConfig } from '@/AppBuilder/WidgetManager/widgets/table';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'table-scrolling',
  name: 'Table scrolling renders only the rows coming into view',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

const ROW_HEIGHT = 46;
const rowsOf = (count, label) => Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `${label} ${i + 1}` }));
const COLUMNS = [
  { id: 'c-id', key: 'id', name: 'id', columnType: 'number' },
  { id: 'c-name', key: 'name', name: 'name', columnType: 'string' },
];

let session;
let headerMeasures;
let positionWrites;
const writesToBody = () => positionWrites.get(body().style) ?? [];
const clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
const backgroundPosition = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'backgroundPosition');

function renderTable(styles = {}) {
  const { definition } = tableConfig;
  const table = componentDefinition('t1', 'table1', 'Table', {
    ...definition.properties,
    data: binding('{{variables.rows}}'),
    columns: { value: COLUMNS },
    autogenerateColumns: { value: false },
    enablePagination: binding('{{false}}'),
  });
  table.component.definition.styles = { ...definition.styles, ...styles };
  table.component.definition.others = definition.others;
  state().setVariable('rows', rowsOf(200, 'row'), MODULE_ID);
  seedApp({ t1: table }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('edit', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('t1', 'Table', { currentMode: 'edit' })} />);
}

const scroller = () => document.querySelector('.jet-data-table');
const body = () => scroller().querySelector('tbody');
const rowAt = (index) => body().querySelector(`tr[data-index="${index}"]`);

async function scrollTo(top) {
  const el = scroller();
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 10 * ROW_HEIGHT });
  el.scrollTop = top;
  fireEvent.scroll(el);
  await drain();
}

describe('Table scrolling', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
    headerMeasures = 0;
    // The header's text is measured (for its overflow tooltip) each time the header renders.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        if (this.classList.contains('header-text')) headerMeasures += 1;
        return clientWidth.get.call(this);
      },
    });
    // Background positions as React writes them, by style (jsdom drops the value: it can't parse it).
    positionWrites = new Map();
    Object.defineProperty(CSSStyleDeclaration.prototype, 'backgroundPosition', {
      configurable: true,
      get: backgroundPosition.get,
      set(value) {
        positionWrites.set(this, [...(positionWrites.get(this) ?? []), value]);
        backgroundPosition.set.call(this, value);
      },
    });
  });

  afterEach(() => {
    delete HTMLElement.prototype.clientWidth;
    Object.defineProperty(CSSStyleDeclaration.prototype, 'backgroundPosition', backgroundPosition);
  });

  test('a scroll renders the rows in view, not the header; other changes still render the header', async () => {
    renderTable();
    await drain();
    await waitFor(() => expect(rowAt(0)).not.toBeNull());
    await scrollTo(ROW_HEIGHT);

    const measuresBefore = headerMeasures;
    await scrollTo(60 * ROW_HEIGHT);
    await waitFor(() => expect(rowAt(62)).not.toBeNull());
    expect(rowAt(0)).toBeNull();
    expect(headerMeasures).toBe(measuresBefore);

    state().setVariable('rows', rowsOf(200, 'renamed'), MODULE_ID);
    await drain();
    await waitFor(() => expect(rowAt(62).textContent).toContain('renamed 63'));
    expect(headerMeasures).toBeGreaterThan(measuresBefore);
  });

  test('the placeholder rows keep the same style while scrolling', async () => {
    renderTable();
    await drain();
    await waitFor(() => expect(rowAt(0)).not.toBeNull());
    expect(writesToBody()).toEqual(['0 0px']);

    for (const row of [7, 31, 60, 15]) {
      await scrollTo(row * ROW_HEIGHT);
      expect(rowAt(row)).not.toBeNull();
    }
    expect(writesToBody()).toEqual(['0 0px']);
  });

  test('striped: the stripes start at the first rendered row, which is plain', async () => {
    renderTable({ tableType: { value: 'table-striped' } });
    await drain();
    await waitFor(() => expect(rowAt(0)).not.toBeNull());

    for (const row of [7, 31, 60, 15, 8]) {
      await scrollTo(row * ROW_HEIGHT);
      const first = Number(body().querySelector('tr[data-index]').dataset.index);
      // Two rows per stripe period: the pattern sits at the first rendered row's place within it.
      expect(writesToBody().at(-1)).toBe(`0 ${(first % 2) * ROW_HEIGHT}px`);
    }
    expect(new Set(writesToBody())).toEqual(new Set(['0 0px', `0 ${ROW_HEIGHT}px`]));
  });
});
