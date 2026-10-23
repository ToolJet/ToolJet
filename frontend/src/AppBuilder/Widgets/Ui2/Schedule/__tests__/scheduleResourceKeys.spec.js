import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit round 6 (Codex R6-01): a resource id is any text, and the Schedule kept a resource's bookings in a
// plain object keyed by it, so an id that names an inherited Object property ('constructor', 'toString', '__proto__')
// found that property as its entry and the widget crashed pushing onto it. Entries are now own keys only.
import { placeBookings, scheduleRange, scheduleResources } from '@/AppBuilder/Widgets/Ui2/Schedule/scheduleModel';
import { timelineMinWidth } from '@/AppBuilder/Widgets/Ui2/Schedule/scheduleLayout';
import { pickBooking, resolveSelection } from '@/AppBuilder/Widgets/Ui2/Schedule/scheduleSelection';

const fields = { resourceField: 'resource', startField: 'start', endField: 'end', titleField: 'title', idField: 'id' };
const range = () => scheduleRange({ date: '2026-10-20', scale: 'days', days: 1, dayStart: 8, dayEnd: 18 });
const booking = (resource, id = 1) => ({
  id,
  resource,
  start: '2026-10-20T09:00:00',
  end: '2026-10-20T10:00:00',
  title: 'Service appointment',
});
const INHERITED = ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf'];

describe('resource ids that name an inherited Object property', () => {
  test.each(INHERITED)('a booking on %s is placed on its own entry', (id) => {
    const resources = scheduleResources([{ id, name: 'Audit room' }], [], 'resource');
    const placed = placeBookings([booking(id)], fields, range(), resources);
    expect(Object.prototype.hasOwnProperty.call(placed, id)).toBe(true);
    expect(placed[id].items.map((b) => b.title)).toEqual(['Service appointment']);
    expect(Object.keys(placed)).toEqual([id]);
    expect(timelineMinWidth(range(), placed)).toBeGreaterThan(0);
  });

  test.each(INHERITED)('a resource %s with no bookings has no entry', (id) => {
    const resources = scheduleResources([{ id, name: 'Audit room' }, 'Room B'], [], 'resource');
    const placed = placeBookings([booking('Room B')], fields, range(), resources);
    expect(placed[id]).toBeUndefined();
    expect(Object.keys(placed)).toEqual(['Room B']);
  });

  test.each(INHERITED)('inferred from the bookings, %s is a resource and keeps its booking', (id) => {
    const resources = scheduleResources([], [booking(id), booking('room', 2)], 'resource');
    expect(resources.map((r) => r.key)).toEqual([id, 'room']);
    const placed = placeBookings([booking(id), booking('room', 2)], fields, range(), resources);
    expect(placed[id].items).toHaveLength(1);
  });

  test.each(INHERITED)(
    'a selected booking on %s resolves, and a pick on it without bookings resolves to nothing',
    (id) => {
      const r = range();
      const resources = scheduleResources([{ id, name: 'Audit room' }, 'Room B'], [], 'resource');
      const placed = placeBookings([booking(id)], fields, r, resources);
      const item = placed[id].items[0];
      expect(resolveSelection(pickBooking(resources[0], item), placed, resources, r, '12h')).toMatchObject({
        kind: 'booking',
        resource: id,
        key: '1',
      });
      const none = placeBookings([booking('Room B', 2)], fields, r, resources);
      expect(resolveSelection({ kind: 'booking', resource: id, key: '1' }, none, resources, r, '12h')).toBeNull();
      // A plain object built elsewhere (an older caller) is read by its own keys too.
      expect(resolveSelection({ kind: 'booking', resource: id, key: '1' }, {}, resources, r, '12h')).toBeNull();
    }
  );
});
