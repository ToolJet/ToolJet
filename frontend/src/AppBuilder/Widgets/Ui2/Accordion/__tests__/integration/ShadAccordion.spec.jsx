/**
 * UI 2.0 Accordion: titled sections that open and close to show their text, one at a time or several.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Accordion itself does. Titles carry [ShadAccordion-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'acc1';
const widget = createWidgetHarness({
  componentType: 'ShadAccordion',
  handle: 'accordion1',
  id: ID,
  widgetHeight: 240,
  widgetWidth: 400,
  defaultProperties: {
    items: binding(
      "{{[{ title: 'Inclusions', content: 'Crew, fuel and linen' }, { title: 'Cancellation', content: 'Free until 30 days out' }, { title: 'Deposit', content: 'Thirty percent on booking' }]}}"
    ),
  },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const section = (title) => screen.getByRole('button', { name: title });
const toggle = async (title) => {
  await act(async () => fireEvent.click(section(title)));
};
const isOpen = (title) => section(title).getAttribute('aria-expanded') === 'true';

describe('UI 2.0 Accordion', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadAccordion-DEF-001] shows every section title closed, and exposes nothing open', async () => {
    render();

    expect(await screen.findByRole('button', { name: 'Inclusions' })).toBeInTheDocument();
    expect(['Inclusions', 'Cancellation', 'Deposit'].map(isOpen)).toEqual([false, false, false]);
    expect(screen.queryByText('Crew, fuel and linen')).not.toBeInTheDocument();
    await waitFor(() => expect(exposed().openIndexes).toEqual([]));
    expect(exposed().isExpanded).toBe(false);
  });

  test('[ShadAccordion-PROP-001] defaultOpen opens those sections at start', async () => {
    render({ properties: { defaultOpen: binding('{{[1]}}') } });

    expect(await screen.findByText('Free until 30 days out')).toBeVisible();
    expect(isOpen('Inclusions')).toBe(false);
    await waitFor(() => expect(exposed().openIndexes).toEqual([1]));
    expect(exposed().isExpanded).toBe(true);
  });

  test('[ShadAccordion-PROP-002] by default one section is open at a time: opening another closes the first', async () => {
    render();
    await screen.findByRole('button', { name: 'Inclusions' });

    await toggle('Inclusions');
    await toggle('Cancellation');

    expect(isOpen('Inclusions')).toBe(false);
    expect(isOpen('Cancellation')).toBe(true);
    await waitFor(() => expect(exposed().openIndexes).toEqual([1]));
  });

  test('[ShadAccordion-PROP-003] multiple keeps several sections open together', async () => {
    render({ properties: { multiple: binding('{{true}}'), defaultOpen: binding('{{[0, 2]}}') } });
    await waitFor(() => expect(exposed().openIndexes).toEqual([0, 2]));

    await toggle('Cancellation');

    expect(['Inclusions', 'Cancellation', 'Deposit'].map(isOpen)).toEqual([true, true, true]);
    await waitFor(() => expect([...exposed().openIndexes].sort()).toEqual([0, 1, 2]));
  });

  test('[ShadAccordion-PROP-004] items take label and children as the title and the text', async () => {
    render({
      properties: {
        items: binding("{{[{ label: 'Baggage', children: 'One bag each' }]}}"),
        defaultOpen: binding('{{[0]}}'),
      },
    });

    expect(await screen.findByRole('button', { name: 'Baggage' })).toBeInTheDocument();
    expect(screen.getByText('One bag each')).toBeInTheDocument();
  });

  // Thousands of sections (a query's rows bound by mistake) froze the page drawing them all.
  test('[ShadAccordion-PROP-005] draws at most 200 sections of a very long list', async () => {
    const items = Array.from({ length: 300 }, (_, i) => ({ title: `Section ${i}`, content: `Text ${i}` }));
    render({ properties: { items: binding(`{{${JSON.stringify(items)}}}`) } });

    expect(await screen.findByRole('button', { name: 'Section 199' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(200);
    expect(screen.queryByRole('button', { name: 'Section 200' })).not.toBeInTheDocument();
  });

  test('[ShadAccordion-EVT-001] opening a section fires onExpand and then onChange, which read the open sections', async () => {
    render();
    await handle([
      ...setVariableOn(ID, 'onExpand', { key: 'expanded', value: '{{components.accordion1.isExpanded}}' }),
      ...setVariableOn(ID, 'onChange', { value: '{{components.accordion1.openIndexes}}' }),
      ...countInvocationsOn(ID, 'onCollapse', { key: 'collapses' }),
    ]);

    await toggle('Deposit');

    await waitFor(() => expect(widget.variables().seen).toEqual([2]));
    expect(widget.variables().expanded).toBe(true);
    expect(widget.variables().collapses).toBeUndefined();
  });

  test('[ShadAccordion-EVT-002] closing the open section fires onCollapse and onChange', async () => {
    render({ properties: { defaultOpen: binding('{{[0]}}') } });
    await handle([
      ...setVariableOn(ID, 'onCollapse', { key: 'collapsed', value: '{{components.accordion1.isExpanded}}' }),
      ...setVariableOn(ID, 'onChange', { value: '{{components.accordion1.openIndexes}}' }),
    ]);

    await toggle('Inclusions');

    await waitFor(() => expect(widget.variables().collapsed).toBe(false));
    expect(widget.variables().seen).toEqual([]);
    expect(isOpen('Inclusions')).toBe(false);
  });

  test('[ShadAccordion-EVT-003] switching the open section of a one-at-a-time accordion fires both onExpand and onCollapse', async () => {
    render({ properties: { defaultOpen: binding('{{[0]}}') } });
    await handle([
      ...countInvocationsOn(ID, 'onExpand', { key: 'expands' }),
      ...countInvocationsOn(ID, 'onCollapse', { key: 'collapses' }),
      ...countInvocationsOn(ID, 'onChange', { key: 'changes' }),
    ]);

    await toggle('Cancellation');

    await waitFor(() => expect(widget.variables().changes).toBe(1));
    expect(widget.variables()).toMatchObject({ expands: 1, collapses: 1 });
  });

  test('[ShadAccordion-ACT-001] expand(index) opens that section and fires onExpand; out-of-range indexes do nothing', async () => {
    render();
    await handle(setVariableOn(ID, 'onExpand', { value: '{{components.accordion1.openIndexes}}' }));

    await widget.act('expand', 5);
    expect(exposed().openIndexes).toEqual([]);

    await widget.act('expand', 1);

    await waitFor(() => expect(isOpen('Cancellation')).toBe(true));
    expect(exposed()).toMatchObject({ openIndexes: [1], isExpanded: true });
    await waitFor(() => expect(widget.variables().seen).toEqual([1]));
  });

  test('[ShadAccordion-ACT-002] expand() with no index opens every section of a multiple accordion, the first of a single one', async () => {
    render({ properties: { multiple: binding('{{true}}') } });
    await widget.act('expand');
    await waitFor(() => expect(exposed().openIndexes).toEqual([0, 1, 2]));

    // The same accordion switched to one-at-a-time, as a changed property re-renders it.
    await act(async () => render({ properties: { multiple: binding('{{false}}') } }));
    await widget.act('collapse');
    await widget.act('expand');
    await waitFor(() => expect(exposed().openIndexes).toEqual([0]));
    expect(isOpen('Inclusions')).toBe(true);
  });

  test('[ShadAccordion-ACT-003] collapse(index) closes that section, and collapse() closes them all', async () => {
    render({ properties: { multiple: binding('{{true}}'), defaultOpen: binding('{{[0, 1, 2]}}') } });
    await waitFor(() => expect(exposed().openIndexes).toEqual([0, 1, 2]));

    await widget.act('collapse', 1);
    await waitFor(() => expect(exposed().openIndexes).toEqual([0, 2]));
    expect(isOpen('Cancellation')).toBe(false);

    await widget.act('collapse');
    await waitFor(() => expect(exposed()).toMatchObject({ openIndexes: [], isExpanded: false }));
  });

  test('[ShadAccordion-STY-001] title, text, divider and icon colours reach the sections as CSS variables', async () => {
    const { container } = render({
      styles: {
        titleColor: binding('#0f172a'),
        textColor: binding('#475569'),
        dividerColor: binding('#e11d48'),
        iconColor: binding('#16a34a'),
      },
    });

    await screen.findByRole('button', { name: 'Inclusions' });
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#0f172a');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#475569');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-icon')).toBe('#16a34a');
    expect(section('Inclusions').className).toContain('var(--lk-title');
  });
});
