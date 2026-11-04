/**
 * Listview 2.0 overflow: text in a record's children never wraps; it clips with an ellipsis and the full text
 * shows in a tooltip on hover. Only components inside a ListView record change. Contract:
 * frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-OVF-001..005). Real store, real RenderWidget.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'lv1';
const LONG = 'A very long record title that cannot fit in a narrow card';
const RECORDS = `{{[{ name: '${LONG}', cta: '${LONG} button' }]}}`;

function child(id, name, type, properties) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const listview = createWidgetHarness({
  componentType: 'Listview',
  handle: 'listview1',
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(RECORDS),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('80'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: {
    txt1: child('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}'), textFormat: binding('plainText') }),
    btn1: child('btn1', 'button1', 'Button', { text: binding('{{listItem.cta}}') }),
  },
  capabilities: { dnd: true },
  widgetHeight: 300,
  widgetWidth: 200,
});

const standaloneText = createWidgetHarness({
  componentType: 'Text',
  handle: 'text9',
  id: 'txt9',
  defaultProperties: {
    text: binding(LONG),
    textFormat: binding('plainText'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
  },
  widgetHeight: 40,
  widgetWidth: 200,
});

const recordText = () => document.querySelector('.list-item .text-widget-section > div');
const recordButtonLabel = () => document.querySelector('.list-item [data-cy$="-label"]');

// jsdom has no layout: report the text as wider than its box (browser geometry is a genuine boundary).
let scrollSpy;
let clientSpy;
beforeEach(() => {
  scrollSpy = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400);
  clientSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
});
afterEach(() => {
  scrollSpy.mockRestore();
  clientSpy.mockRestore();
});

describe('Listview: overflow', () => {
  beforeEach(listview.setup);
  afterEach(listview.teardown);

  test('[Listview-OVF-001] text in a record does not wrap and clips with an ellipsis', async () => {
    // Break this catches: a card whose title wraps onto a second line and spills out of the record.
    listview.render({ currentMode: 'view' });
    await waitFor(() => expect(recordText()).toBeInTheDocument());

    expect(recordText().textContent).toBe(LONG);
    expect(recordText().style.whiteSpace).toBe('nowrap');
    expect(recordText().style.overflow).toBe('hidden');
    expect(recordText().style.textOverflow).toBe('ellipsis');
  });

  test('[Listview-OVF-002] hovering clipped record text shows the full text in a tooltip', async () => {
    // Break this catches: text clipped with no way to read the rest.
    listview.render({ currentMode: 'view' });
    await waitFor(() => expect(recordText()).toBeInTheDocument());

    await listview.session.user.hover(recordText());

    const tooltip = await waitFor(() => {
      const node = document.querySelector('[role="tooltip"]');
      expect(node).toBeInTheDocument();
      return node;
    });
    expect(tooltip.textContent).toBe(LONG);
  });

  test('[Listview-OVF-003] a Button label in a record clips with an ellipsis and shows a tooltip', async () => {
    // Break this catches: a button label that wraps ("But\n1") inside a narrow grid card.
    listview.render({ currentMode: 'view' });
    await waitFor(() => expect(recordButtonLabel()).toBeInTheDocument());

    expect(recordButtonLabel().style.whiteSpace).toBe('nowrap');
    expect(recordButtonLabel().style.textOverflow).toBe('ellipsis');
    await listview.session.user.hover(recordButtonLabel());
    await waitFor(() => expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(`${LONG} button`));
  });

  test('[Listview-OVF-004] text that fits shows no tooltip', async () => {
    // Break this catches: a tooltip on every record, repeating text that is fully visible.
    scrollSpy.mockReturnValue(100);
    listview.render({ currentMode: 'view' });
    await waitFor(() => expect(recordText()).toBeInTheDocument());

    await listview.session.user.hover(recordText());

    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
});

describe('Text outside a ListView', () => {
  beforeEach(standaloneText.setup);
  afterEach(standaloneText.teardown);

  test('[Listview-OVF-005] a Text outside a ListView keeps wrapping and shows no tooltip', async () => {
    // Break this catches: the clipping leaking to every Text in the app.
    standaloneText.render({ currentMode: 'view' });
    await waitFor(() => expect(document.querySelector('.text-widget-section > div')).toBeInTheDocument());

    const text = document.querySelector('.text-widget-section > div');
    expect(text.style.whiteSpace).not.toBe('nowrap');
    expect(text.style.textOverflow).not.toBe('ellipsis');
    await standaloneText.session.user.hover(text);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
});
