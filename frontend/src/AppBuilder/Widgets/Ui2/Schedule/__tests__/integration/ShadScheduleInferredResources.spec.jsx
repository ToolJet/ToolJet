/**
 * UI 2.0 Schedule, release audit round 6 (Codex R6-02): resources inferred from the bookings stopped at 1,000, so
 * "Show more" offered 950 of 5,000 and the rest, with their bookings, vanished. Real store, real RenderWidget, real
 * widget: it draws 50 rows and counts every other resource.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadSchedule',
  id: 'r6infer',
  handle: 'r6infer',
  widgetWidth: 700,
  widgetHeight: 420,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const rows = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  resource: `r${i}`,
  start: '2026-10-20T09:00:00',
  end: '2026-10-20T10:00:00',
  title: `Service ${i}`,
}));

test('5,000 inferred resources draw 50 rows and offer the other 4,950', async () => {
  w.render({
    currentMode: 'view',
    properties: {
      resources: binding('{{[]}}'),
      bookings: binding(`{{${JSON.stringify(rows)}}}`),
      resourceField: binding('resource'),
      startField: binding('start'),
      endField: binding('end'),
      titleField: binding('title'),
      idField: binding('id'),
      date: binding('2026-10-20'),
      scale: binding('days'),
      days: binding(1),
      dayStart: binding(8),
      dayEnd: binding(18),
    },
  });
  await waitFor(() => expect(document.querySelector('[data-resource="r0"]')).not.toBeNull());
  expect(document.querySelectorAll('[data-resource]')).toHaveLength(50);
  fireEvent.click(screen.getByRole('button', { name: 'Show 50 more of 4950' }));
  await waitFor(() => expect(document.querySelectorAll('[data-resource]')).toHaveLength(100));
  expect(screen.getByRole('button', { name: 'Show 50 more of 4900' })).toBeInTheDocument();
  expect(document.querySelector('[data-resource="r99"] [data-booking="99"]')).not.toBeNull();
}, 30000);
