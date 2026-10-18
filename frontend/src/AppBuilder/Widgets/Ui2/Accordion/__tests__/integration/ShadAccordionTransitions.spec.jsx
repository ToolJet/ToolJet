/**
 * UI 2.0 Accordion after its sections or mode change: openIndexes and isExpanded describe the sections drawn open
 * (release audit 50), and sections past the first 200 are reachable, not dropped in silence (53). Titles carry
 * [ShadAccordion-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'sections1';
const ITEMS = [
  { title: 'Alpha', content: 'First contents' },
  { title: 'Beta', content: 'Second contents' },
  { title: 'Gamma', content: 'Third contents' },
];
const json = (v) => `{{${JSON.stringify(v)}}}`;
const widget = createWidgetHarness({ componentType: 'ShadAccordion', handle: 'accordion1', id: ID, widgetHeight: 320 });
const triggers = () => screen.queryAllByRole('button').filter((b) => b.hasAttribute('aria-expanded'));
const drawnOpen = () => triggers().flatMap((b, i) => (b.getAttribute('aria-expanded') === 'true' ? [i] : []));
const coherent = () =>
  expect({ openIndexes: widget.exposed().openIndexes, isExpanded: widget.exposed().isExpanded }).toEqual({
    openIndexes: drawnOpen(),
    isExpanded: drawnOpen().length > 0,
  });
const mount = async (open = [2], multiple = true, items = ITEMS) => {
  widget.render({
    currentMode: 'view',
    properties: { items: binding(json(items)), defaultOpen: binding(json(open)), multiple: binding(json(multiple)) },
  });
  widget.setEvents(countInvocationsOn(ID, 'onChange'));
  await waitFor(() => expect(triggers().length).toBeGreaterThan(0));
};
const update = (name, value) => widget.setComponentProperty(ID, name, json(value), 'properties');

describe('UI 2.0 Accordion transitions', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadAccordion-STATE-001] fewer sections drop an open index that no longer exists, with no event', async () => {
    await mount();
    update('items', ITEMS.slice(0, 1));
    await waitFor(() => expect(triggers()).toHaveLength(1));
    coherent();
    expect(widget.exposed()).toMatchObject({ openIndexes: [], isExpanded: false });
    expect(widget.variables().calls ?? 0).toBe(0);
  });

  test('[ShadAccordion-STATE-002] no sections are no open sections', async () => {
    await mount();
    update('items', []);
    await waitFor(() => expect(triggers()).toHaveLength(0));
    coherent();
  });

  test('[ShadAccordion-STATE-003] a single-open accordion reports the one section it draws open', async () => {
    await mount([0, 2], true);
    coherent();
    update('multiple', false);
    await waitFor(() => expect(drawnOpen()).toEqual([0]));
    coherent();
  });

  test('[ShadAccordion-STATE-004] single-open with several defaults reports only the one drawn open', async () => {
    await mount([0, 2], false);
    coherent();
    expect(widget.exposed().openIndexes).toEqual([0]);
  });

  test('[ShadAccordion-STATE-005] a content refresh keeps the open section, and actions still work after a shrink', async () => {
    await mount();
    update(
      'items',
      ITEMS.map((x) => ({ ...x, content: `${x.content} updated` }))
    );
    await screen.findByText('Third contents updated');
    coherent();
    update('items', ITEMS.slice(0, 1));
    await widget.act('expand', 0);
    coherent();
    expect(widget.exposed().openIndexes).toEqual([0]);
  });

  test.each([[[-1]], [[0.5]], [['']], [[null]], [['x']]])(
    '[ShadAccordion-STATE-006] defaultOpen %j opens nothing and reports nothing open',
    async (defaults) => {
      await mount(defaults, true);
      coherent();
      expect(widget.exposed()).toMatchObject({ openIndexes: [], isExpanded: false });
    }
  );

  test('[ShadAccordion-STATE-007] "01" reads as section 1, as expand("01") does, in defaults and in actions', async () => {
    await mount(['01'], true);
    await waitFor(() => expect(drawnOpen()).toEqual([1]));
    coherent();
    await widget.act('collapse', '01');
    coherent();
    expect(widget.exposed().openIndexes).toEqual([]);
  });

  test('[ShadAccordion-STATE-008] an invalid first default does not displace a valid single-open choice', async () => {
    await mount([-1, 2], false);
    await waitFor(() => expect(drawnOpen()).toEqual([2]));
    coherent();
  });

  test('[ShadAccordion-LIM-001] sections past the first 200 are behind Show more, and an open one is drawn', async () => {
    const many = Array.from({ length: 201 }, (_, i) => ({ title: `Section ${i}`, content: `Body ${i}` }));
    await mount([], true, many);
    expect(triggers()).toHaveLength(200);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Show 1 more of 1' })));
    expect(triggers()).toHaveLength(201);
    expect(screen.getByText('Section 200')).toBeInTheDocument();
  });

  test('[ShadAccordion-LIM-002] expand(index) past the first 200 draws and opens that section', async () => {
    const many = Array.from({ length: 250 }, (_, i) => ({ title: `Section ${i}`, content: `Body ${i}` }));
    await mount([], true, many);
    await widget.act('expand', 240);
    await waitFor(() => expect(screen.getByText('Section 240')).toBeInTheDocument());
    coherent();
    expect(widget.exposed().openIndexes).toEqual([240]);
  });
});
