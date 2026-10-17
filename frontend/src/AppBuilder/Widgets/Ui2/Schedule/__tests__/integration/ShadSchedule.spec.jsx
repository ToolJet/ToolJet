/**
 * UI 2.0 Schedule: resources down the side, hours or days across, bookings as blocks, free slots and a now-line.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Schedule itself does. Titles carry [ShadSchedule-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'sch1';
const widget = createWidgetHarness({
  componentType: 'ShadSchedule',
  handle: 'schedule1',
  id: ID,
  widgetHeight: 420,
  widgetWidth: 900,
});

const VANS =
  "{{[{ ref: 'J-1', van: 'Van 1', job: 'Boiler service', from: '2026-10-20 09:00', to: '2026-10-20 11:00', state: 'Confirmed', who: 'Maya' }, { ref: 'J-2', van: 'Van 2', job: 'Leak repair', from: '2026-10-20 13:30', to: '2026-10-20 14:30', state: 'Cancelled', who: 'Owen' }]}}";
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const resources = () => [...document.querySelectorAll('[data-resource]')].map((r) => r.getAttribute('data-resource'));
const resourceRow = (key) => document.querySelector(`[data-resource="${key}"]`);
const header = () => [
  ...document.querySelectorAll('.sc-schedule > div > div > div:first-child > div:last-child > div'),
];
const booking = (key) => document.querySelector(`[data-booking="${key}"]`);
const slots = (key) => [...resourceRow(key).querySelectorAll('button.sc-slot')];
const exposed = () => widget.exposed() ?? {};
const vans = (extra = {}) => ({
  resources: binding('{{[]}}'),
  bookings: binding(VANS),
  resourceField: binding('van'),
  startField: binding('from'),
  endField: binding('to'),
  titleField: binding('job'),
  statusField: binding('state'),
  idField: binding('ref'),
  date: binding('2026-10-20'),
  ...extra,
});
const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('UI 2.0 Schedule', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSchedule-DEF-001] shows the sample rooms with captions, 8 AM to 6 PM, and their bookings', async () => {
    render();

    await waitFor(() => expect(resources()).toEqual(['atlas', 'borealis', 'cove', 'dune']));
    expect(resourceRow('cove')).toHaveTextContent('12 seats, screen');
    expect(screen.getByText('Room')).toBeInTheDocument();
    expect(header().map((c) => c.textContent)).toEqual([
      '8 AM',
      '9 AM',
      '10 AM',
      '11 AM',
      '12 PM',
      '1 PM',
      '2 PM',
      '3 PM',
      '4 PM',
      '5 PM',
    ]);
    // 30-minute slots: twenty a row.
    expect(slots('atlas')).toHaveLength(20);
    // 09:00 and 11:00 in an 8-to-6 day: 10% and 30% along.
    expect(booking('1')).toHaveTextContent('Design review');
    expect(booking('1').style.left).toBe('calc(10% + 2px)');
    expect(booking('2').style.left).toBe('calc(30% + 2px)');
    expect(booking('1')).toHaveAttribute('data-tone', 'success');
    expect(booking('6').querySelector('.tw-line-through')).toHaveTextContent('Interview');
    expect(exposed()).toMatchObject({ selectedBooking: {}, selectedBookingId: null, selectedSlot: {} });
  });

  test('[ShadSchedule-PROP-001] bookings map through resourceField, startField, endField, titleField, statusField and idField', async () => {
    render({ properties: vans() });

    // With no resources, the rows come from the bookings' resource values.
    await waitFor(() => expect(resources()).toEqual(['Van 1', 'Van 2']));
    expect(booking('J-1')).toHaveTextContent('Boiler service');
    expect(booking('J-1').getAttribute('title')).toMatch(/^Boiler service · 9 AM.*11 AM · Confirmed$/);
    expect(booking('J-1').style.left).toBe('calc(10% + 2px)');
    expect(booking('J-2').className).toContain('tw-opacity-70');
  });

  test('[ShadSchedule-PROP-002] subtitleField adds a second line to the booking', async () => {
    render({ properties: vans({ subtitleField: binding('who') }) });

    await waitFor(() => expect(booking('J-1').getAttribute('title')).toContain('· Maya'));
    expect(booking('J-1')).toHaveTextContent('Maya');
  });

  test('[ShadSchedule-PROP-003] resources take names, captions and avatars; resourceTitle heads the column', async () => {
    render({
      properties: vans({
        resources: binding(
          "{{[{ id: 'Van 1', name: 'Van 1', caption: 'North', avatar: 'https://example.com/v1.png' }, 'Van 2', 'Van 3']}}"
        ),
        resourceTitle: binding('vehicle_name'),
      }),
    });

    await waitFor(() => expect(resources()).toEqual(['Van 1', 'Van 2', 'Van 3']));
    expect(resourceRow('Van 1')).toHaveTextContent('North');
    expect(resourceRow('Van 1').querySelector('img')).toHaveAttribute('src', 'https://example.com/v1.png');
    // A field-like heading reads as a label.
    expect(screen.getByText('Vehicle name')).toBeInTheDocument();
  });

  test('[ShadSchedule-PROP-004] dayStart, dayEnd and slotMinutes set the hours shown and the slots in them', async () => {
    render({
      properties: vans({ dayStart: binding('{{9}}'), dayEnd: binding('{{12}}'), slotMinutes: binding('{{60}}') }),
    });

    await waitFor(() => expect(header().map((c) => c.textContent)).toEqual(['9 AM', '10 AM', '11 AM']));
    expect(slots('Van 1')).toHaveLength(3);
    expect(slots('Van 1')[0]).toHaveAccessibleName('Van 1, 9 AM to 10 AM, free');
    // The 9 AM job starts at the left edge; the 1:30 PM one is outside the hours shown.
    expect(booking('J-1').style.left).toBe('calc(0% + 2px)');
    expect(booking('J-2')).toBeNull();
  });

  test('[ShadSchedule-PROP-005] hourFormat 24h writes hours on the 24-hour clock', async () => {
    render({
      properties: vans({ hourFormat: binding('24h'), dayStart: binding('{{13}}'), dayEnd: binding('{{15}}') }),
    });

    await waitFor(() => expect(header().map((c) => c.textContent)).toEqual(['13:00', '14:00']));
  });

  test('[ShadSchedule-PROP-006] scale days with date and days shows that many days from the date, a slot a day', async () => {
    render({ properties: vans({ scale: binding('days'), days: binding('{{3}}') }) });

    await waitFor(() => expect(header().map((c) => c.textContent)).toEqual(['Tue20 Oct', 'Wed21', 'Thu22']));
    expect(document.querySelector('.sc-schedule')).toHaveAttribute('data-scale', 'days');
    expect(slots('Van 1')).toHaveLength(3);
    expect(slots('Van 1')[1]).toHaveAccessibleName('Van 1, Wed 21 Oct, free');
  });

  test('[ShadSchedule-PROP-007] resourceWidth and rowHeight size the resource column and the rows', async () => {
    render({ properties: vans({ resourceWidth: binding('{{220}}'), rowHeight: binding('{{80}}') }) });

    await waitFor(() => expect(resourceRow('Van 1').firstChild.style.width).toBe('220px'));
    expect(resourceRow('Van 1').firstChild.style.height).toBe('80px');
  });

  test('[ShadSchedule-EVT-001] clicking a booking fires onBookingClicked with selectedBooking and selectedBookingId set', async () => {
    render({ properties: vans() });
    widget.setEvents(setVariableOn(ID, 'onBookingClicked', { value: '{{components.schedule1.selectedBooking.job}}' }));

    await waitFor(() => expect(booking('J-1')).toBeTruthy());
    fireEvent.click(booking('J-1'));

    await waitFor(() => expect(widget.variables().seen).toBe('Boiler service'));
    expect(exposed().selectedBookingId).toBe('J-1');
    expect(booking('J-1')).toHaveAttribute('aria-pressed', 'true');
  });

  test('[ShadSchedule-EVT-002] clicking a free slot fires onSlotClicked with selectedSlot set', async () => {
    render({ properties: vans() });
    widget.setEvents(setVariableOn(ID, 'onSlotClicked', { value: '{{components.schedule1.selectedSlot.startTime}}' }));

    await waitFor(() => expect(slots('Van 2')).toHaveLength(20));
    fireEvent.click(slots('Van 2')[3]);

    await waitFor(() => expect(widget.variables().seen).toBe('09:30'));
    expect(exposed().selectedSlot).toMatchObject({
      resourceId: 'Van 2',
      resource: 'Van 2',
      date: '2026-10-20',
      startTime: '09:30',
      endTime: '10:00',
      label: '9:30 AM to 10 AM',
    });
    expect(slots('Van 2')[3]).toHaveAttribute('data-selected', 'true');
    expect(exposed().selectedBooking).toEqual({});
  });

  test('[ShadSchedule-PROP-008] highlightSelected off selects without marking the booking', async () => {
    render({ properties: vans({ highlightSelected: binding('{{false}}') }) });

    await waitFor(() => expect(booking('J-1')).toBeTruthy());
    fireEvent.click(booking('J-1'));
    await waitFor(() => expect(exposed().selectedBookingId).toBe('J-1'));
    expect(booking('J-1')).toHaveAttribute('aria-pressed', 'false');
  });

  // Drawn after the bookings loaded, the line sat at the left edge until the next 30-second tick: a week view showed
  // now on Monday (2026-10-14). It is placed when it mounts.
  test('[ShadSchedule-PROP-009] showNowLine draws the now-line at today the moment it mounts; off draws none', async () => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const week = { scale: binding('days'), days: binding('{{7}}'), date: binding(isoDay(monday)) };
    render({ properties: vans(week) });

    await waitFor(() => expect(document.querySelector('[data-now-line]')).toBeTruthy());
    const at = Number(document.querySelector('[data-now-line]').style.getPropertyValue('--now'));
    expect(at).toBeGreaterThan(((now.getDay() + 6) % 7) / 7 - 0.01);
    expect(document.querySelector('[data-today="true"]')).toBeTruthy();

    render({ properties: vans({ ...week, showNowLine: binding('{{false}}') }) });
    await waitFor(() => expect(document.querySelector('[data-now-line]')).toBeNull());
  });

  test('[ShadSchedule-PROP-010] emptyText shows with no resources and no bookings', async () => {
    render({
      properties: { resources: binding('{{[]}}'), bookings: binding('{{[]}}'), emptyText: binding('No vans today') },
    });

    expect(await screen.findByText('No vans today')).toBeInTheDocument();
  });

  test('[ShadSchedule-STY-001] colours, accent, now-line colour and radius reach the schedule as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#ffffff'),
        borderColor: binding('#e2e8f0'),
        textColor: binding('#475569'),
        accentColor: binding('#2563eb'),
        nowColor: binding('#f97316'),
        borderRadius: binding('{{8}}'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-now')).toBe('#f97316'));
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#e2e8f0');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#475569');
    expect(root.style.getPropertyValue('--lk-accent')).toBe('#2563eb');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('8px');
  });
});
