/**
 * UI 2.0 Schedule: room-booking day boards as AI builds configure them (2026-10-20). A one-day board on the days
 * scale (scale 'days', days 1) drew a single day column with every meeting across it; a day board 8 AM to 7 PM in a
 * 943px card drew its half-hour meetings 31px wide. Real store, real RenderWidget, real widget, with the two apps'
 * own settings and bookings. Titles carry [ShadSchedule-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, waitFor, fireEvent } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'sch2';
const widget = createWidgetHarness({
  componentType: 'ShadSchedule',
  handle: 'dayBoard',
  id: ID,
  widgetHeight: 420,
  widgetWidth: 943,
});

const iso = (h, m) => new Date(2026, 9, 20, h, m).toISOString();
const render = (properties) => widget.render({ currentMode: 'view', properties });
const header = () => [
  ...document.querySelectorAll('.sc-schedule [data-schedule-scroll] > div > div:first-child > div:last-child > div'),
];
const booking = (key) => document.querySelector(`[data-booking="${key}"]`);
const slots = (key) => [...document.querySelector(`[data-resource="${key}"]`).querySelectorAll('button.sc-slot')];
const scroller = () => document.querySelector('[data-schedule-scroll]');
const timeline = () => scroller().firstChild;
const leftOf = (el) => Number(el.style.left.match(/calc\(([\d.]+)%/)[1]);

// App 19a4ca0a, dayBoard: its settings and its scheduleData rows on 20 Oct.
const DAY_BOARD = {
  resources: binding("{{[{ id: 1, name: 'Summit' }, { id: 4, name: 'Harbor' }, { id: 9, name: 'Atrium' }]}}"),
  bookings: binding(
    `{{[{ id: 12, room_id: 9, meeting_title: 'Engineering standup', organizer: 'Aisha Bello', start_time: '${iso(
      8,
      30
    )}', end_time: '${iso(
      9,
      0
    )}', status: 'Confirmed' }, { id: 13, room_id: 1, meeting_title: 'Q4 roadmap sync', organizer: 'Priya Raman', start_time: '${iso(
      9,
      0
    )}', end_time: '${iso(10, 0)}', status: 'Confirmed' }]}}`
  ),
  resourceField: binding('room_id'),
  startField: binding('start_time'),
  endField: binding('end_time'),
  titleField: binding('meeting_title'),
  subtitleField: binding('organizer'),
  statusField: binding('status'),
  idField: binding('id'),
  scale: binding('days'),
  date: binding('2026-10-20'),
  dayStart: binding('08:00'),
  dayEnd: binding('19:00'),
  slotMinutes: binding('{{30}}'),
  days: binding('{{1}}'),
  resourceWidth: binding('{{168}}'),
  rowHeight: binding('{{56}}'),
};

// App d8697491, schedule1: hours 8 AM to 7 PM in 30-minute slots, its bookingRows on 20 Oct.
const HOURS_BOARD = {
  resources: binding("{{[{ id: 1, name: 'Summit' }, { id: 2, name: 'Pine' }, { id: 6, name: 'Cedar' }]}}"),
  bookings: binding(
    "{{[{ id: 1, room_id: 1, meeting_title: 'Leadership sync', host_label: 'maya', start_at: '2026-10-20T09:00:00', end_at: '2026-10-20T10:00:00', status: 'Confirmed' }, { id: 4, room_id: 2, meeting_title: 'Design standup', host_label: 'tom', start_at: '2026-10-20T09:30:00', end_at: '2026-10-20T10:00:00', status: 'Confirmed' }, { id: 5, room_id: 2, meeting_title: '1:1 with Tom', host_label: 'ana', start_at: '2026-10-20T13:00:00', end_at: '2026-10-20T13:30:00', status: 'Confirmed' }, { id: 10, room_id: 6, meeting_title: 'Sprint catch-up', host_label: 'li', start_at: '2026-10-20T11:00:00', end_at: '2026-10-20T11:30:00', status: 'Confirmed' }]}}"
  ),
  resourceField: binding('room_id'),
  startField: binding('start_at'),
  endField: binding('end_at'),
  titleField: binding('meeting_title'),
  subtitleField: binding('host_label'),
  statusField: binding('status'),
  idField: binding('id'),
  scale: binding('hours'),
  date: binding('2026-10-20'),
  dayStart: binding('08:00'),
  dayEnd: binding('19:00'),
  slotMinutes: binding('{{30}}'),
  days: binding('{{7}}'),
  resourceWidth: binding('{{168}}'),
  rowHeight: binding('{{56}}'),
};

describe('UI 2.0 Schedule day boards', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSchedule-DAY-001] a one-day days board draws an hour axis and each meeting at its time', async () => {
    render(DAY_BOARD);

    await waitFor(() => expect(booking('13')).toBeTruthy());
    expect(document.querySelector('.sc-schedule')).toHaveAttribute('data-scale', 'hours');
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
      '6 PM',
    ]);
    expect(slots('1')).toHaveLength(22);
    // 09:00 to 10:00 of an 8 AM to 7 PM day: an hour in, an hour long; not the whole width.
    expect(leftOf(booking('13'))).toBeCloseTo((1 / 11) * 100, 3);
    expect(booking('13').style.width).toMatch(/^calc\(9\.09\d*% - 4px\)$/);
    expect(leftOf(booking('12'))).toBeCloseTo((0.5 / 11) * 100, 3);
    expect(slots('1')[0]).toHaveAccessibleName('Summit, 8 AM to 8:30 AM, free');
  });

  test('[ShadSchedule-DAY-002] a multi-day days board is drawn as before: a column a day, 80px each', async () => {
    render({ ...DAY_BOARD, days: binding('{{7}}') });

    await waitFor(() => expect(header()).toHaveLength(7));
    expect(document.querySelector('.sc-schedule')).toHaveAttribute('data-scale', 'days');
    expect(timeline().style.minWidth).toBe(`${168 + 7 * 80}px`);
    expect(booking('13').style.minWidth).toBe('6px');
  });

  test('[ShadSchedule-DAY-003] half-hour meetings on an 11-hour day keep a readable width and the board scrolls', async () => {
    render(HOURS_BOARD);

    await waitFor(() => expect(booking('5')).toBeTruthy());
    // 22 half-hour slots at 44px each, beside the 168px resource column: wider than the 943px card, so it scrolls.
    expect(timeline().style.minWidth).toBe(`${168 + 22 * 44}px`);
    expect(scroller().className).toContain('tw-overflow-x-auto');
    expect(scroller().style.scrollPaddingLeft).toBe('168px');
    // The resource column stays put while the hours scroll.
    expect(document.querySelector('[data-resource="2"]').firstChild.className).toContain('tw-sticky');
    // A short meeting is never drawn to nothing, and its full text is in its title.
    expect(booking('5').style.minWidth).toBe('20px');
    expect(booking('5').getAttribute('title')).toBe('1:1 with Tom · 1 PM to 1:30 PM · ana · Confirmed');
    expect(booking('5').querySelector('.tw-font-semibold')).toHaveTextContent('1:1 with Tom');
    // 40px across: its padding goes to the title.
    expect(booking('5').className).toContain('tw-px-1');
    expect(booking('1').className).toContain('tw-px-2');
  });

  test('[ShadSchedule-DAY-004] a selected meeting scrolls into view past the resource column', async () => {
    const scrollIntoView = jest.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(HOURS_BOARD);
      await waitFor(() => expect(booking('5')).toBeTruthy());
      scrollIntoView.mockClear();

      act(() => booking('5').focus());
      fireEvent.click(booking('5'));

      await waitFor(() => expect(widget.exposed().selectedBookingId).toBe(5));
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(booking('5'));
      expect(booking('5')).toHaveAttribute('aria-pressed', 'true');

      // A free slot picked by keyboard is brought into view the same way.
      scrollIntoView.mockClear();
      fireEvent.click(slots('6')[20]);
      await waitFor(() => expect(widget.exposed().selectedSlot.startTime).toBe('18:00'));
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(slots('6')[20]);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});
