/**
 * UI 2.0 Schedule: resources down the side, hours or days across, bookings as blocks, free slots and a now-line.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Schedule itself does. Titles carry [ShadSchedule-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

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
    // Under the 9 to 11 AM job, so booked (it once read "free", audit 33).
    expect(slots('Van 1')[0]).toHaveAccessibleName('Van 1, 9 AM to 10 AM, booked: Boiler service');
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

  // Audit 53: after 2,000 bookings every later row was left out without a trace, so a shown resource lost a booking
  // because one further down had many. Every booking is placed; a row draws at most MAX_ROW_BOOKINGS and says how
  // many more it has.
  describe('many bookings', () => {
    const json = (v) => `{{${JSON.stringify(v)}}}`;
    const hour = { date: binding('2026-10-17'), dayStart: binding('{{9}}'), dayEnd: binding('{{10}}') };
    const fields = {
      resourceField: binding('room'),
      startField: binding('from'),
      endField: binding('to'),
      titleField: binding('title'),
      idField: binding('id'),
    };
    const rows = (room, n) =>
      Array.from({ length: n }, (_, i) => ({
        id: `${room}-${i}`,
        room,
        title: `${room} ${i}`,
        from: '2026-10-17 09:00',
      }));

    test('[ShadSchedule-PROP-011] a shown resource keeps its booking when a resource further down has thousands', async () => {
      const rooms = [
        { id: 'front', name: 'Front' },
        ...Array.from({ length: 50 }, (_, i) => ({ id: `r${i}`, name: `R${i}` })),
      ];
      const target = { id: 'target', room: 'front', title: 'Board meeting', from: '2026-10-17 09:00' };
      render({
        properties: {
          ...hour,
          ...fields,
          resources: binding(json(rooms)),
          bookings: binding(json([...rows('r49', 2100), target])),
        },
      });

      await waitFor(() => expect(screen.getByText('Board meeting')).toBeInTheDocument());
      expect(resourceRow('r49')).toBeNull();
    });

    test('[ShadSchedule-PROP-012] a row with more bookings than it draws says how many more', async () => {
      render({
        properties: {
          ...hour,
          ...fields,
          resources: binding(json(['busy'])),
          bookings: binding(json(rows('busy', 205))),
        },
      });

      await waitFor(() => expect(resourceRow('busy').querySelectorAll('[data-booking]')).toHaveLength(200));
      expect(resourceRow('busy').querySelector('[data-more-bookings]')).toHaveTextContent('+5 more');
    });
  });

  // Audit 74: on the day the clocks went forward the slot after 02:00 ran from 03:30 back to 03:00, and its click sent
  // that backwards interval to onSlotClicked. (Exercised in a zone with the change by npm run test:ui2-dates-tz.)
  test('[ShadSchedule-EVT-003] on the day the clocks change, every slot clicked ends after it starts', async () => {
    render({
      properties: {
        date: binding('2026-03-08'),
        dayStart: binding('{{0}}'),
        dayEnd: binding('{{4}}'),
        slotMinutes: binding('{{30}}'),
        resources: binding("{{[{ id: 'room', name: 'Room' }]}}"),
        bookings: binding('{{[]}}'),
      },
    });
    widget.setEvents(
      setVariableOn(ID, 'onSlotClicked', { key: 'picked', value: '{{components.schedule1.selectedSlot}}' })
    );
    await waitFor(() => expect(slots('room').length).toBeGreaterThan(0));

    for (const slot of slots('room')) {
      fireEvent.click(slot);
      await waitFor(() => expect(widget.variables().picked).toEqual(exposed().selectedSlot));
      const { start, end, date } = exposed().selectedSlot;
      expect(new Date(end).getTime()).toBeGreaterThan(new Date(start).getTime());
      expect(date).toBe('2026-03-08');
    }
  });

  // Audit 33: every slot was announced "free", and a keyboard could select the interval underneath a booking (Tab to
  // "Atlas, 9 AM to 9:30 AM, free" under Design review, Enter, onSlotClicked). A slot says what is in it; one a
  // booking covers cannot be picked as free, and a cancelled booking does not take its time.
  describe('slots under bookings', () => {
    const atlas = (bookings) => ({
      date: binding('2026-10-20'),
      resources: binding("{{[{ id: 'atlas', name: 'Atlas' }]}}"),
      bookings: binding(`{{${JSON.stringify(bookings)}}}`),
      resourceField: binding('room'),
      startField: binding('from'),
      endField: binding('to'),
      titleField: binding('title'),
      statusField: binding('state'),
      idField: binding('id'),
      dayStart: binding('{{8}}'),
      dayEnd: binding('{{12}}'),
      slotMinutes: binding('{{30}}'),
    });
    const review = { id: 'r', room: 'atlas', title: 'Design review', from: '2026-10-20 09:00', to: '2026-10-20 10:15' };

    test('[ShadSchedule-PROP-013] a booked slot says so, names the booking, and cannot be picked', async () => {
      render({ properties: atlas([review]) });
      widget.setEvents(setVariableOn(ID, 'onSlotClicked', { key: 'picked', value: 'yes' }));

      const booked = await screen.findByRole('button', { name: 'Atlas, 9 AM to 9:30 AM, booked: Design review' });
      expect(booked).toBeDisabled();
      fireEvent.click(booked);
      expect(widget.variables().picked).toBeUndefined();
      expect(exposed().selectedSlot).toEqual({});
      expect(screen.getByRole('button', { name: 'Atlas, 8 AM to 8:30 AM, free' })).toBeEnabled();
      expect(
        screen.getByRole('button', { name: 'Atlas, 10 AM to 10:30 AM, partly booked: Design review' })
      ).toBeEnabled();
      expect(screen.queryByRole('button', { name: /9 AM to 9:30 AM, free/ })).toBeNull();
    });

    test('[ShadSchedule-PROP-014] a cancelled booking leaves its slots free', async () => {
      render({ properties: atlas([{ ...review, state: 'Cancelled' }]) });

      expect(await screen.findByRole('button', { name: 'Atlas, 9 AM to 9:30 AM, free' })).toBeEnabled();
    });
  });

  // Audit 75: the Schedule kept a copy of what was clicked, and highlighted by slot position or booking key. After a
  // refresh the highlight showed the current slot or booking while selectedSlot and selectedBooking (and a workflow
  // reading them) still held the old one. The selection is now the booking (by its id) or the slot (resource and
  // times); what is highlighted and exposed is that, as it is now, and nothing while it is not on the schedule.
  describe('a selection through a refresh', () => {
    const json = (v) => `{{${JSON.stringify(v)}}}`;
    const row = (id, title, extra = {}) => ({
      id,
      title,
      room: 'room',
      from: '2026-10-17 09:00',
      to: '2026-10-17 10:00',
      note: 'old',
      ...extra,
    });
    const mount = (bookings = []) => {
      render({
        properties: {
          date: binding('2026-10-17'),
          dayStart: binding('{{8}}'),
          dayEnd: binding('{{12}}'),
          slotMinutes: binding('{{30}}'),
          hourFormat: binding('24h'),
          resources: binding("{{[{ id: 'room', name: 'Room' }]}}"),
          bookings: binding(json(bookings)),
          resourceField: binding('room'),
          startField: binding('from'),
          endField: binding('to'),
          titleField: binding('title'),
          idField: binding('id'),
        },
      });
      widget.setEvents(
        [
          ...countInvocationsOn(ID, 'onBookingClicked', { key: 'bookingClicks' }),
          ...countInvocationsOn(ID, 'onSlotClicked', { key: 'slotClicks' }),
        ].map((e, i) => ({ ...e, id: `selection-${i}` }))
      );
    };
    const set = (key, value) => act(() => widget.setComponentProperty(ID, key, json(value), 'properties'));
    const highlighted = () => document.querySelectorAll('[data-selected="true"]');

    test('[ShadSchedule-EVT-004] a booking refreshed under the same id is exposed as it is now', async () => {
      mount([row('a', 'Original')]);
      fireEvent.click(await waitFor(() => booking('a')));
      await waitFor(() => expect(exposed().selectedBooking).toMatchObject({ title: 'Original' }));

      const updated = row('a', 'Updated', { note: 'current' });
      set('bookings', [updated]);
      await waitFor(() => expect(exposed().selectedBooking).toEqual(updated));
      expect(highlighted()).toHaveLength(1);
      expect(highlighted()[0]).toHaveTextContent('Updated');
      expect(widget.variables().bookingClicks).toBe(1);

      set('bookings', []);
      await waitFor(() => expect(exposed().selectedBooking).toEqual({}));
      expect(exposed().selectedBookingId).toBeNull();
      const replacement = row('a', 'Replacement');
      set('bookings', [replacement]);
      await waitFor(() => expect(exposed().selectedBooking).toEqual(replacement));
      expect(highlighted()[0]).toHaveTextContent('Replacement');
    });

    test('[ShadSchedule-EVT-005] a slot is selected by its resource and times, not its place in the row', async () => {
      mount();
      await waitFor(() => expect(slots('room')).toHaveLength(8));
      fireEvent.click(slots('room')[1]);
      await waitFor(() => expect(exposed().selectedSlot).toMatchObject({ date: '2026-10-17', startTime: '08:30' }));

      set('resources', [{ id: 'room', name: 'Renamed room' }]);
      await waitFor(() => expect(exposed().selectedSlot.resource).toBe('Renamed room'));
      expect(slots('room')[1]).toHaveAttribute('data-selected', 'true');

      set('slotMinutes', 60);
      await waitFor(() => expect(exposed().selectedSlot).toEqual({}));
      expect(highlighted()).toHaveLength(0);
      set('slotMinutes', 30);
      await waitFor(() => expect(exposed().selectedSlot.startTime).toBe('08:30'));

      set('date', '2026-10-18');
      await waitFor(() => expect(exposed().selectedSlot).toEqual({}));
      expect(highlighted()).toHaveLength(0);
      expect(widget.variables().slotClicks).toBe(1);
    });
  });

  // Audit round 2: malformed dates were placed on another day or dropped without a trace. The Schedule places none
  // of them and says so; a date property that is not a date is said too (the schedule shows today).
  describe('malformed dates', () => {
    const malformed = [
      { ref: 'J-1', van: 'Van 1', job: 'Boiler service', from: '2026-10-20 09:00', to: '2026-10-20 11:00' },
      { ref: 'J-2', van: 'Van 1', job: 'Leak repair', from: '2026-02-30 13:00', to: '' },
      { ref: 'J-3', van: 'Van 1', job: 'Gas check', from: '2026-10-20 15:00', to: '2026-10-20 14:00' },
    ];

    test('[ShadSchedule-PROP-015] bookings with malformed dates are not placed, and the schedule says which', async () => {
      render({ properties: vans({ bookings: binding(`{{${JSON.stringify(malformed)}}}`) }) });

      await waitFor(() => expect(booking('J-1')).not.toBeNull());
      expect(booking('J-2')).toBeNull();
      expect(booking('J-3')).toBeNull();
      const note = document.querySelector('[data-schedule-problems]');
      expect(note).toHaveTextContent('2 bookings not shown: their dates are not valid');
      expect(note).toHaveAttribute(
        'title',
        'Leak repair (J-2): its start is not a date\nGas check (J-3): it ends before it starts'
      );
    });

    test('[ShadSchedule-PROP-016] a date that is not a date is said, not quietly replaced by today', async () => {
      render({ properties: vans({ date: binding('2026-13-45') }) });

      await waitFor(() => expect(document.querySelector('[data-schedule-problems]')).not.toBeNull());
      expect(document.querySelector('[data-schedule-problems]')).toHaveTextContent(
        'The date "2026-13-45" is not a date; showing today'
      );
    });
  });
});
