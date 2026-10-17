import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import {
  resourceHeading,
  bookingFace,
  MAX_LANES,
  MAX_SLOTS,
  bookingTone,
  clockText,
  parseTime,
  placeBookings,
  positionOf,
  scheduleRange,
  scheduleResources,
  slotValue,
  startDay,
} from '@/AppBuilder/Widgets/Ui2/Schedule/scheduleModel';

const DAY = new Date(2026, 9, 12); // Mon 12 Oct 2026, local
const at = (h, m = 0, d = 12) => new Date(2026, 9, d, h, m).getTime();

describe('parseTime', () => {
  it('reads times of day on the given day, days, local date-times and ISO text', () => {
    expect(parseTime('09:30', DAY)).toEqual({ time: at(9, 30), dateOnly: false });
    expect(parseTime('9:30 pm', DAY).time).toBe(at(21, 30));
    expect(parseTime('12 am', DAY).time).toBe(at(0));
    expect(parseTime('2026-10-14', DAY)).toEqual({ time: new Date(2026, 9, 14).getTime(), dateOnly: true });
    expect(parseTime('2026-10-14 08:15', DAY).time).toBe(at(8, 15, 14));
    expect(parseTime(new Date(2026, 9, 12, 7).toISOString(), DAY).time).toBe(at(7));
    expect(parseTime(at(5), DAY).time).toBe(at(5));
  });
  it('gives null for junk', () => {
    for (const v of [
      null,
      undefined,
      '',
      'soon',
      '25:00',
      '13 pm',
      '2026-13-45',
      NaN,
      {},
      [],
      new Date('x'),
      'x'.repeat(100),
      'Room 42',
    ])
      expect(parseTime(v, DAY)).toBeNull();
  });
});

describe('scheduleRange', () => {
  it('shows the hours of a day as columns, with slots of slotMinutes', () => {
    const r = scheduleRange({ date: '2026-10-12', dayStart: 8, dayEnd: 18, slotMinutes: 30 }, at(10));
    expect([r.start, r.end]).toEqual([at(8), at(18)]);
    expect(r.columns.map((c) => c.label).slice(0, 3)).toEqual(['8 AM', '9 AM', '10 AM']);
    expect(r.columns).toHaveLength(10);
    expect(r.slots).toHaveLength(20);
    expect(r.slots.filter((s) => s.edge)).toHaveLength(10);
    expect(r.today).toBe(true);
    expect(scheduleRange({ date: '2026-10-12', hourFormat: '24h' }).columns[0].label).toBe('08:00');
  });
  it('keeps bounds in order and slots at most MAX_SLOTS', () => {
    const r = scheduleRange({ date: '2026-10-12', dayStart: 30, dayEnd: -4, slotMinutes: 1 });
    expect(r.columns).toHaveLength(1);
    const wide = scheduleRange({ date: '2026-10-12', dayStart: 0, dayEnd: 24, slotMinutes: 5 });
    expect(wide.slots.length).toBeLessThanOrEqual(MAX_SLOTS);
    expect(wide.end).toBe(new Date(2026, 9, 13).getTime());
    expect(scheduleRange({ dayStart: 'x', dayEnd: null, slotMinutes: NaN }).columns).toHaveLength(10);
  });
  it('shows days on the days scale, marking today', () => {
    const r = scheduleRange({ scale: 'days', date: '2026-10-12', days: 7 }, at(9, 0, 14));
    expect(r.columns.map((c) => c.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(r.columns.map((c) => c.today)).toEqual([false, false, true, false, false, false, false]);
    expect(r.columns[0].sub).toBe('12 Oct');
    expect(r.slots).toHaveLength(7);
    expect(scheduleRange({ scale: 'days', days: 900 }).columns).toHaveLength(31);
  });
  it('starts today without a date', () => {
    expect(startDay('', at(15)).getTime()).toBe(at(0));
    expect(startDay('junk', at(15)).getTime()).toBe(at(0));
  });
});

describe('scheduleResources', () => {
  it('reads names and objects, keeping repeated ids apart', () => {
    const list = scheduleResources([
      'Atlas',
      { id: 'c', name: 'Cove', caption: '12 seats' },
      { name: 'Atlas' },
      null,
      {},
    ]);
    expect(list.map((r) => [r.key, r.name, r.caption])).toEqual([
      ['Atlas', 'Atlas', ''],
      ['c', 'Cove', '12 seats'],
      ['Atlas~1', 'Atlas', ''],
    ]);
  });
  it('takes the bookings resources when none are given', () => {
    const list = scheduleResources([], [{ room: 'B' }, { room: 'A' }, { room: 'B' }, 3], 'room');
    expect(list.map((r) => r.name)).toEqual(['B', 'A']);
  });
});

describe('placeBookings', () => {
  const range = scheduleRange({ date: '2026-10-12', dayStart: 8, dayEnd: 18 }, at(10));
  const resources = scheduleResources([{ id: 'a', name: 'Atlas' }, 'Cove']);
  const fields = {
    resourceField: 'room',
    startField: 'start',
    endField: 'end',
    titleField: 'title',
    statusField: 'status',
    subtitleField: 'host',
  };

  it('places bookings by id or name, clipped to the range', () => {
    const out = placeBookings(
      [
        { id: 1, room: 'a', title: 'Review', start: '09:00', end: '10:00', status: 'Confirmed', host: 'Ada' },
        { id: 2, room: 'Cove', title: 'Early', start: '07:00', end: '09:00' },
        { id: 3, room: 'Atlas', title: 'Out', start: '19:00', end: '20:00' },
        { id: 4, room: 'nowhere', title: 'Lost', start: '09:00' },
        { id: 5, room: 'a', title: 'No start' },
      ],
      fields,
      range,
      resources
    );
    expect(out.a.items.map((b) => b.title)).toEqual(['Review']);
    const review = out.a.items[0];
    expect(review.left).toBeCloseTo(10);
    expect(review.width).toBeCloseTo(10);
    expect([review.tone, review.status, review.subtitle, review.time]).toEqual([
      'success',
      'Confirmed',
      'Ada',
      '9 AM to 10 AM',
    ]);
    expect(out.Cove.items[0].left).toBe(0);
    expect(out.Cove.items[0].width).toBeCloseTo(10);
  });

  it('stacks overlapping bookings in lanes, at most MAX_LANES', () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({ id: i, room: 'a', start: '09:00', end: '11:00' }));
    rows.push({ id: 'later', room: 'a', start: '12:00', end: '13:00' });
    const out = placeBookings(rows, fields, range, resources);
    expect(out.a.lanes).toBe(MAX_LANES);
    expect(Math.max(...out.a.items.map((b) => b.lane))).toBe(MAX_LANES - 1);
    expect(out.a.items.find((b) => b.id === 'later').lane).toBe(0);
  });

  it('gives a booking with no end an hour, and keeps repeated ids apart', () => {
    const out = placeBookings(
      [
        { id: 1, room: 'a', start: '09:00' },
        { id: 1, room: 'a', start: '13:00', end: '12:00' },
      ],
      fields,
      range,
      resources
    );
    const [a, b] = out.a.items;
    expect(a.end - a.start).toBe(3600000);
    expect(b.end - b.start).toBe(1800000);
    expect([a.key, b.key]).toEqual(['1', '1~1']);
  });

  it('runs whole days on the days scale', () => {
    const week = scheduleRange({ scale: 'days', date: '2026-10-12', days: 7 }, at(10));
    const out = placeBookings(
      [{ room: 'a', start: '2026-10-13', end: '2026-10-14', status: 'warning' }],
      fields,
      week,
      resources
    );
    const b = out.a.items[0];
    expect(b.left).toBeCloseTo(100 / 7);
    expect(b.width).toBeCloseTo(200 / 7);
    expect([b.tone, b.status, b.time]).toEqual(['warning', '', '']);
  });

  it('never throws on junk', () => {
    for (const v of [null, 'x', 3, {}, [null, 3, [], { room: {} }, { room: 'a', start: {} }]])
      expect(() => placeBookings(v, fields, range, resources)).not.toThrow();
    expect(placeBookings([{ room: 'a', start: '9:00' }], null, range, resources)).toEqual({});
  });
});

describe('helpers', () => {
  it('tones bookings by their status words', () => {
    expect(['Confirmed', 'Tentative', 'Cancelled', 'Booked', 'danger', 'whatever', null].map(bookingTone)).toEqual([
      'success',
      'warning',
      'danger',
      'info',
      'danger',
      '',
      '',
    ]);
  });
  it('places now on the range', () => {
    const range = scheduleRange({ date: '2026-10-12' }, at(10));
    expect(positionOf(range, at(13))).toBeCloseTo(50);
    expect(positionOf(range, at(7))).toBeNull();
    expect(clockText(at(9, 5), '24h')).toBe('09:05');
  });
  it('describes a slot', () => {
    const range = scheduleRange({ date: '2026-10-12' }, at(10));
    const v = slotValue({ id: 'a', name: 'Atlas' }, range.slots[3]);
    expect(v).toMatchObject({
      resourceId: 'a',
      resource: 'Atlas',
      date: '2026-10-12',
      startTime: '09:30',
      endTime: '10:00',
    });
    expect(v.label).toBe('9:30 AM to 10 AM');
    expect(new Date(v.start).getTime()).toBe(at(9, 30));
    const week = scheduleRange({ scale: 'days', date: '2026-10-12' }, at(10));
    expect(slotValue({ id: 'a', name: 'Atlas' }, week.slots[1], '12h', 'days').label).toBe('Tue 13 Oct');
  });
});

// On the days scale a one-hour class was placed by its time of day across the whole day, so a week of gym classes drew
// as 10px slivers with no label (2026-10-14). A timed booking shorter than a day fills its day; several on one day stack.
describe('placeBookings, timed bookings on the days scale', () => {
  const range = scheduleRange(
    { scale: 'days', date: '2026-10-12', days: 7 },
    new Date('2026-10-12T09:00:00').getTime()
  );
  const resources = [{ key: 'r1', id: 'Nora', name: 'Nora' }];
  const fields = { resourceField: 'coach', startField: 'start', endField: 'end', titleField: 'title' };
  const placed = placeBookings(
    [
      { coach: 'Nora', start: '2026-10-12T06:00:00', end: '2026-10-12T07:00:00', title: 'Spin' },
      { coach: 'Nora', start: '2026-10-12T18:00:00', end: '2026-10-12T19:00:00', title: 'Yoga' },
      { coach: 'Nora', start: '2026-10-13T07:00:00', end: '2026-10-13T08:00:00', title: 'HIIT' },
    ],
    fields,
    range,
    resources
  ).r1;

  it('fills the day column, keeping its own time', () => {
    const [spin, yoga, hiit] = placed.items;
    expect(spin.width).toBeCloseTo(100 / 7, 5);
    expect(spin.left).toBeCloseTo(0, 5);
    expect(hiit.left).toBeCloseTo(100 / 7, 5);
    expect(spin.time).toMatch(/6/);
    expect(yoga.left).toBeCloseTo(spin.left, 5);
  });

  it('stacks the bookings of one day in lanes', () => {
    const [spin, yoga, hiit] = placed.items;
    expect(spin.lane).not.toBe(yoga.lane);
    expect(hiit.lane).toBe(0);
    expect(placed.lanes).toBe(2);
  });
});

describe('bookingFace', () => {
  // Bookings in 30-minute slots read "Ju... 11:..." with both lines cut (vet clinic, volunteer shifts, lab equipment,
  // 2026-10-14). A narrow booking gives its title both lines; its place on the grid already says the time.
  it('shows the title and a second line when the booking is wide enough', () => {
    expect(bookingFace(160, 40, true)).toEqual({ titleLines: 1, showSecond: true });
  });
  it('gives a narrow booking title two lines and drops the second', () => {
    expect(bookingFace(80, 40, true)).toEqual({ titleLines: 2, showSecond: false });
  });
  it('keeps one line in a lane too short for two', () => {
    expect(bookingFace(80, 28, true)).toEqual({ titleLines: 1, showSecond: false });
    expect(bookingFace(160, 28, true)).toEqual({ titleLines: 1, showSecond: false });
  });
});

describe('a day written as clock times', () => {
  // dayStart="09:00" and dayEnd="18:00" failed the number-only property and fell back to 8 to 18 (five apps,
  // 2026-10-14). A clock time is its hour; an end that is not on the hour rounds up.
  it('reads the hours from clock times', () => {
    const r = scheduleRange({ date: '2026-10-12', dayStart: '09:00', dayEnd: '17:30' });
    expect(r.columns[0].key).toBe('9');
    expect(r.columns[r.columns.length - 1].key).toBe('17');
    expect(r.columns).toHaveLength(9);
  });
});

describe('resourceHeading', () => {
  // resourceTitle="boat_name" headed a boat rental schedule "Boat_name" (2026-10-14).
  it('reads a field name as words and keeps a written title', () => {
    expect(resourceHeading('boat_name')).toBe('Boat name');
    expect(resourceHeading('vetName')).toBe('Vet name');
    expect(resourceHeading('room')).toBe('Room');
    expect(resourceHeading('Court & coach')).toBe('Court & coach');
    expect(resourceHeading('')).toBe('');
  });
});

// Audit 54: repeated ids were made unique by trying ~1, ~2 ... from the start for every repeat, so n rows with one id
// took n(n+1)/2 checks before the schedule drew. The next free suffix is now remembered per id.
describe('repeated ids', () => {
  const room = { key: 'room', id: 'room', name: 'Room', caption: '', avatar: '' };
  const range = () => scheduleRange({ date: '2026-10-12', dayStart: 9, dayEnd: 10 }, at(8));

  it('keeps every key unique, next to ids that already carry a suffix', () => {
    const keys = scheduleResources(['a', 'a', 'a~1', 'a', { id: 'a~2', name: 'Two' }, 'a'], [], '').map((r) => r.key);
    expect(keys).toEqual(['a', 'a~1', 'a~1~1', 'a~2', 'a~2~1', 'a~3']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives 30,000 resources or bookings with one id their keys in linear time', () => {
    const started = Date.now();
    const resources = scheduleResources(
      Array.from({ length: 30000 }, () => ({ id: 'x', name: 'X' })),
      [],
      ''
    );
    const rows = Array.from({ length: 30000 }, () => ({ id: 'b', room: 'room', from: '2026-10-12 09:00' }));
    const placed = placeBookings(rows, { resourceField: 'room', startField: 'from' }, range(), [room]);
    expect(Date.now() - started).toBeLessThan(1500);
    expect(new Set(resources.map((r) => r.key)).size).toBe(30000);
    const keys = placed.room.items.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
