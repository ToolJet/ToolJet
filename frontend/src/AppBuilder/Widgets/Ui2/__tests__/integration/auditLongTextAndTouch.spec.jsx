// Found by end-user tests with hostile data and touch (19 Oct). jsdom has no layout, so these check the classes that
// keep text inside its box and controls reachable without hover:
// - a Kanban card title of one 500-character word ran past the card, cut mid-word (the line under it wrapped);
// - a 200-character tag ran 358px out of its sheet: a chip now stops at the row's width and ends in an ellipsis, with
//   the whole tag on hover;
// - a Kanban column's collapse button showed only on hover or focus, so a touch user never saw it, and its target was
//   20x24px: it shows where there is no hover, at 24px.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { screen, waitFor } from '@testing-library/react';

const LONG = 'X'.repeat(500);

describe('Kanban', () => {
  const w = createWidgetHarness({
    componentType: 'ShadKanban',
    handle: 'board1',
    id: 'kb1',
    widgetHeight: 500,
    widgetWidth: 900,
    capabilities: { dnd: true },
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  const render = () =>
    w.render({
      currentMode: 'view',
      properties: {
        data: binding(`{{[{ id: 1, name: '${LONG}', stage: 'new' }]}}`),
        columns: binding("{{[{ id: 'new', title: 'New' }, { id: 'won', title: 'Won' }]}}"),
        statusField: binding('stage'),
        idField: binding('id'),
        titleField: binding('name'),
      },
    });

  test('[UI2-AUDIT-LONGTEXT-001] a card title breaks a long word instead of running past the card', async () => {
    render();
    const title = await screen.findByText(LONG);
    expect(title.className).toMatch(/\[overflow-wrap:anywhere\]/);
  });

  test('[UI2-AUDIT-TOUCH-001] the collapse button shows without hover and is a 24px target', async () => {
    render();
    const button = await screen.findByRole('button', { name: 'Collapse New' });
    expect(button.className).toMatch(/\[@media\(hover:none\)\]:tw-opacity-100/);
    expect(button.className).toMatch(/tw-p-1(\s|$)/);
  });
});

describe('Tags', () => {
  const w = createWidgetHarness({
    componentType: 'ShadTags',
    handle: 'tags1',
    id: 'tags1',
    widgetHeight: 40,
    widgetWidth: 320,
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test('[UI2-AUDIT-LONGTEXT-002] a long tag stops at the row width, ends in an ellipsis and shows in full on hover', async () => {
    w.render({ currentMode: 'view', properties: { tags: binding(`{{['Short', '${LONG.slice(0, 200)}']}}`) } });
    const text = await waitFor(() => screen.getByText(LONG.slice(0, 200)));
    const chip = text.closest('[class*="tw-inline-flex"]');
    expect(chip.className).toMatch(/tw-max-w-full/);
    expect(text.className).toMatch(/tw-truncate/);
    expect(chip.getAttribute('title')).toBe(LONG.slice(0, 200));
  });
});
