import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { placeBookings, scheduleRange, scheduleResources } from '@/AppBuilder/Widgets/Ui2/Schedule/scheduleModel';
import {
  BOOKING_MIN_PX,
  SLOT_MIN_PX,
  barMinWidth,
  timelineMinWidth,
} from '@/AppBuilder/Widgets/Ui2/Schedule/scheduleLayout';

// Two room-booking boards an AI build drew badly (2026-10-20). A one-day board on the days scale (scale 'days',
// days 1) drew one day column, every meeting a bar across the whole width and no hour axis. A day board 8 AM to 7 PM
// in 30-minute slots in a 943px card drew its half-hour meetings 31px wide, the title cut to nothing.

const at = (h, m = 0, d = 20) => new Date(2026, 9, d, h, m);
const iso = (h, m) => at(h, m).toISOString();
const NOW = at(12).getTime();

// Case 1 (app 19a4ca0a, dayBoard): its rooms and its bookings on 20 Oct, as its scheduleData query returns them.
const DAY_BOARD = {
  scale: 'days',
  days: 1,
  date: '2026-10-20',
  dayStart: '08:00',
  dayEnd: '19:00',
  slotMinutes: 30,
  hourFormat: '12h',
};
const DAY_BOARD_FIELDS = {
  resourceField: 'room_id',
  startField: 'start_time',
  endField: 'end_time',
  titleField: 'meeting_title',
  subtitleField: 'organizer',
  statusField: 'status',
  idField: 'id',
};
const DAY_BOARD_ROOMS = [
  { id: 1, name: 'Summit' },
  { id: 4, name: 'Harbor' },
  { id: 9, name: 'Atrium' },
];
const DAY_BOARD_BOOKINGS = [
  {
    id: 12,
    room_id: 9,
    meeting_title: 'Engineering standup',
    organizer: 'Aisha Bello',
    start_time: iso(8, 30),
    end_time: iso(9, 0),
    status: 'Confirmed',
  },
  {
    id: 13,
    room_id: 1,
    meeting_title: 'Q4 roadmap sync',
    organizer: 'Priya Raman',
    start_time: iso(9, 0),
    end_time: iso(10, 0),
    status: 'Confirmed',
  },
  {
    id: 14,
    room_id: 4,
    meeting_title: 'Design critique',
    organizer: 'Marco Silva',
    start_time: iso(9, 30),
    end_time: iso(10, 30),
    status: 'Confirmed',
  },
];

// Case 2 (app d8697491, schedule1): hours 8 AM to 7 PM, 30-minute slots, days 7 (not read on the hours scale).
const HOURS_BOARD = {
  scale: 'hours',
  days: 7,
  date: '2026-10-20',
  dayStart: '08:00',
  dayEnd: '19:00',
  slotMinutes: 30,
  hourFormat: '12h',
};
const HOURS_FIELDS = { ...DAY_BOARD_FIELDS, startField: 'start_at', endField: 'end_at', subtitleField: 'host_label' };
const HOURS_BOOKINGS = [
  {
    id: 1,
    room_id: 1,
    meeting_title: 'Leadership sync',
    start_at: '2026-10-20T09:00:00',
    end_at: '2026-10-20T10:00:00',
  },
  {
    id: 4,
    room_id: 2,
    meeting_title: 'Design standup',
    start_at: '2026-10-20T09:30:00',
    end_at: '2026-10-20T10:00:00',
  },
  { id: 5, room_id: 2, meeting_title: '1:1 with Tom', start_at: '2026-10-20T13:00:00', end_at: '2026-10-20T13:30:00' },
  {
    id: 10,
    room_id: 6,
    meeting_title: 'Sprint catch-up',
    start_at: '2026-10-20T11:00:00',
    end_at: '2026-10-20T11:30:00',
  },
].map((b) => ({ ...b, status: 'Confirmed' }));

describe('a one-day board (scale days, days 1)', () => {
  const range = scheduleRange(DAY_BOARD, NOW);
  const rooms = scheduleResources(DAY_BOARD_ROOMS);
  const placed = placeBookings(DAY_BOARD_BOOKINGS, DAY_BOARD_FIELDS, range, rooms);

  it('draws the hours of that day, dayStart to dayEnd in slots of slotMinutes', () => {
    expect(range.scale).toBe('hours');
    expect(range.columns.map((c) => c.label)).toEqual([
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
    expect(range.slots).toHaveLength(22);
    expect(range.start).toBe(at(8).getTime());
    expect(range.end).toBe(at(19).getTime());
    expect(range.today).toBe(true);
  });

  it('places each meeting at its own time, not across the whole day', () => {
    const bar = (room) => placed[room].items[0];
    // 08:30 to 09:00 in an 11-hour day: half an hour in, half an hour long.
    expect(bar('9').left).toBeCloseTo((0.5 / 11) * 100, 6);
    expect(bar('9').width).toBeCloseTo((0.5 / 11) * 100, 6);
    expect(bar('1').left).toBeCloseTo((1 / 11) * 100, 6);
    expect(bar('1').width).toBeCloseTo((1 / 11) * 100, 6);
    expect(bar('4').left).toBeCloseTo((1.5 / 11) * 100, 6);
    expect(bar('9').time).toBe('8:30 AM to 9 AM');
  });

  it('keeps every multi-day days board as it was: a column and a slot a day', () => {
    for (const days of [2, 7, 31]) {
      const week = scheduleRange({ ...DAY_BOARD, days }, NOW);
      expect(week.scale).toBe('days');
      expect(week.columns).toHaveLength(days);
      expect(week.slots).toHaveLength(days);
    }
  });
});

describe('timelineMinWidth', () => {
  it('fits a 30-minute meeting at a readable width on an 11-hour day: the board scrolls instead', () => {
    const range = scheduleRange(HOURS_BOARD, NOW);
    expect(range.slots).toHaveLength(22);
    const placed = placeBookings(HOURS_BOOKINGS, HOURS_FIELDS, range, scheduleResources([1, 2, 6]));
    const min = timelineMinWidth(range, placed);
    // The shortest meeting, half an hour of eleven, is at least BOOKING_MIN_PX across.
    expect(min).toBe(22 * BOOKING_MIN_PX);
    expect((min * placed['2'].items[0].width) / 100).toBeGreaterThanOrEqual(BOOKING_MIN_PX);
  });

  it('gives each slot at least SLOT_MIN_PX on the hours scale, an hour at least 72px', () => {
    const quarter = scheduleRange({ ...HOURS_BOARD, slotMinutes: 15 }, NOW);
    expect(timelineMinWidth(quarter, {})).toBe(44 * SLOT_MIN_PX);
    // 30-minute slots with no short bookings: the hour columns' 72px, as before.
    expect(timelineMinWidth(scheduleRange(HOURS_BOARD, NOW), {})).toBe(11 * 72);
  });

  it('caps what a very short booking asks for', () => {
    const range = scheduleRange(HOURS_BOARD, NOW);
    const placed = placeBookings(
      [{ id: 1, room_id: 1, start_at: '2026-10-20T09:00:00', end_at: '2026-10-20T09:01:00' }],
      HOURS_FIELDS,
      range,
      scheduleResources([1])
    );
    expect(timelineMinWidth(range, placed)).toBe(22 * 64);
  });

  it('keeps the days scale as it was: 80px a day, whatever its bookings', () => {
    const week = scheduleRange({ ...DAY_BOARD, days: 7 }, NOW);
    const placed = placeBookings(DAY_BOARD_BOOKINGS, DAY_BOARD_FIELDS, week, scheduleResources(DAY_BOARD_ROOMS));
    expect(timelineMinWidth(week, placed)).toBe(7 * 80);
    expect(barMinWidth(week)).toBe(6);
  });

  it('never draws a booking on the hours scale narrower than a readable sliver', () => {
    expect(barMinWidth(scheduleRange(HOURS_BOARD, NOW))).toBeGreaterThanOrEqual(20);
  });
});
