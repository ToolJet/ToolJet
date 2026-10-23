import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit round 6 (Codex R6-02): with no resources set, the Schedule infers them from the bookings, and it
// stopped at the first 1,000, so the bookings of every later resource vanished and "Show more" counted only the
// first 1,000. Every distinct resource is inferred now; the widget draws them 50 at a time (Schedule.tsx).
import { placeBookings, scheduleRange, scheduleResources } from '@/AppBuilder/Widgets/Ui2/Schedule/scheduleModel';

const fields = { resourceField: 'resource', startField: 'start', endField: 'end', titleField: 'title', idField: 'id' };
const range = () => scheduleRange({ date: '2026-10-20', scale: 'days', days: 1, dayStart: 8, dayEnd: 18 });
const booking = (resource, id) => ({
  id,
  resource,
  start: '2026-10-20T09:00:00',
  end: '2026-10-20T10:00:00',
  title: `Service ${id}`,
});

test('5,000 resources inferred from 5,000 bookings are all kept, with every booking placed, well under a second', () => {
  const rows = Array.from({ length: 5000 }, (_, i) => booking(`r${i}`, i));
  const start = performance.now();
  const resources = scheduleResources([], rows, 'resource');
  const placed = placeBookings(rows, fields, range(), resources);
  const ms = performance.now() - start;
  expect(resources).toHaveLength(5000);
  expect(resources[4999]).toMatchObject({ key: 'r4999', id: 'r4999', name: 'r4999' });
  expect(Object.keys(placed)).toHaveLength(5000);
  expect(placed.r4999.items.map((b) => b.title)).toEqual(['Service 4999']);
  expect(ms).toBeLessThan(1000);
});

test('inferred resources are the distinct values in order of appearance, however many bookings share them', () => {
  const rows = Array.from({ length: 6000 }, (_, i) => booking(`r${i % 3000}`, i));
  const resources = scheduleResources([], rows, 'resource');
  expect(resources).toHaveLength(3000);
  expect(resources.slice(0, 3).map((r) => r.id)).toEqual(['r0', 'r1', 'r2']);
  expect(placeBookings(rows, fields, range(), resources).r2999.items).toHaveLength(2);
});
