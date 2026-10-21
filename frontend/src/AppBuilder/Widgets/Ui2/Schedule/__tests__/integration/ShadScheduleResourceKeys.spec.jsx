/**
 * UI 2.0 Schedule, release audit round 6 (Codex R6-01): a resource id that names an inherited Object property
 * ('constructor', 'toString', '__proto__') crashed the widget into its "Something went wrong" fallback. Real store,
 * real RenderWidget, real widget: the booking renders, selects and is disabled like any other.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadSchedule',
  id: 'r6keys',
  handle: 'r6keys',
  widgetWidth: 700,
  widgetHeight: 420,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const expr = (x) => binding(`{{${JSON.stringify(x)}}}`);
const props = (resources, bookings) => ({
  resources: expr(resources),
  bookings: expr(bookings),
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
});
const booked = (resource, id = 1) => ({
  id,
  resource,
  start: '2026-10-20T09:00:00',
  end: '2026-10-20T10:00:00',
  title: 'Service appointment',
});

test.each(['room', 'constructor', 'toString', '__proto__'])(
  'a booking on resource %s renders, selects, and refuses a click once disabled',
  async (id) => {
    w.render({
      currentMode: 'view',
      properties: props(
        [
          { id, name: 'Audit room' },
          { id: 'spare', name: 'Spare room' },
        ],
        [booked(id)]
      ),
    });
    await waitFor(() => expect(document.querySelector('[data-booking="1"]')).not.toBeNull());
    expect(screen.queryByText(/Something went wrong/)).toBeNull();
    expect(document.querySelector(`[data-resource="${id}"]`)).toHaveTextContent('Audit room');
    const b = document.querySelector('[data-booking="1"]');
    fireEvent.click(b);
    await waitFor(() => expect(w.exposed().selectedBookingId).toBe(1));
    expect(w.exposed().selectedBooking).toMatchObject({ resource: id, title: 'Service appointment' });
    await w.act('setDisable', true);
    expect(b).toBeDisabled();
  }
);
