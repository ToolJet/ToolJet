/**
 * UI 2.0 Kanban: a board draws its first 50 columns and a Show more button for the rest, as lists do with their rows,
 * so a card in a later column can always be reached. From the UI 2.0 release audit (finding 53): the 51st column and
 * its cards were dropped without a sign, even after addCard put a card there.
 *
 * Real store, real RenderWidget, real widget.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'board1';
const widget = createWidgetHarness({
  componentType: 'ShadKanban',
  handle: 'board1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 900,
  capabilities: { dnd: true },
});
const json = (value) => `{{${JSON.stringify(value)}}}`;
const drawnColumns = () => document.querySelectorAll('[data-collapsed]');

const render = async (count) => {
  widget.render({
    currentMode: 'view',
    properties: {
      columns: binding(json(Array.from({ length: count }, (_, i) => ({ id: `stage${i}`, title: `Stage ${i}` })))),
      data: binding(json([{ id: 'last', title: 'Boundary card', status: `stage${count - 1}` }])),
      statusField: binding('status'),
      idField: binding('id'),
      titleField: binding('title'),
    },
  });
  await waitFor(() => expect(drawnColumns()).toHaveLength(Math.min(count, 50)));
};

describe('[finding 53] a UI 2.0 Kanban with more than 50 columns', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('draws all of 50 columns with no Show more (control)', async () => {
    await render(50);
    expect(screen.getByText('Boundary card')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Show \d+ more/ })).toBeNull();
  });

  test('says how many columns are not drawn and draws them on request', async () => {
    await render(51);
    expect(screen.queryByText('Boundary card')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 more of 1' }));
    await waitFor(() => expect(drawnColumns()).toHaveLength(51));
    expect(screen.getByText('Boundary card')).toBeInTheDocument();
  });

  test('a card added to a column not drawn yet can be reached', async () => {
    await render(51);
    await act(async () => widget.exposed().addCard({ id: 'new', title: 'Added beyond the first 50' }, 'stage50'));
    expect(widget.exposed().updatedCardData).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 more of 1' }));
    await waitFor(() => expect(screen.getByText('Added beyond the first 50')).toBeInTheDocument());
  });
});
