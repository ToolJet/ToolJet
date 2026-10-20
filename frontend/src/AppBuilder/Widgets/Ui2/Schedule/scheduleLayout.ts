// ToolJet UI 2.0 Schedule: how wide its time axis is drawn (Schedule.tsx). Below that width the axis scrolls sideways
// in the widget, the resource column staying put, rather than squeezing the slots: a day 8 AM to 7 PM in a 943px card
// drew its half-hour meetings 31px wide, the title cut to nothing.
import type { PlacedBookings, ScheduleRange } from './scheduleTypes';

/** A day column holds "Mon 12 Oct" and a truncated booking at 80px: at 96 a week beside a 190px resource column needed
 *  862px, and a two-thirds-width card cut Sunday off behind a scroll. An hour column holds its label at 72px. */
const DAY_MIN_PX = 80;
const HOUR_MIN_PX = 72;
/** The least a slot of the hours scale is drawn: 15-minute slots across a working day were squeezed to 20px. */
export const SLOT_MIN_PX = 28;
/** The least the shortest booking of the hours scale is given, its 2px gaps included: a 40px bar shows a few letters
 *  of its title on each of two lines (ScheduleRow drops its padding to 4px). */
export const BOOKING_MIN_PX = 44;
/** What the shortest booking may ask of a slot: a one-minute booking would otherwise ask for metres. */
const SLOT_MAX_PX = 64;

/** The least width of the time axis in px. The days scale: 80px a day, as it always was. The hours scale: 72px an hour,
 *  SLOT_MIN_PX a slot, and room for its shortest booking to be BOOKING_MIN_PX wide (up to SLOT_MAX_PX a slot). */
export const timelineMinWidth = (range: ScheduleRange, placed: PlacedBookings): number => {
  if (range.scale === 'days') return range.columns.length * DAY_MIN_PX;
  let min = Math.max(range.columns.length * HOUR_MIN_PX, range.slots.length * SLOT_MIN_PX);
  let shortest = Infinity;
  for (const entry of Object.values(placed || {}))
    for (const b of entry.items) if (b.width > 0 && b.width < shortest) shortest = b.width;
  if (Number.isFinite(shortest)) {
    const cap = range.slots.length * SLOT_MAX_PX;
    min = Math.max(min, Math.min(cap, Math.ceil((BOOKING_MIN_PX * 100) / shortest - 1e-6)));
  }
  return min;
};

/** The least a booking's bar is drawn, in px: on the hours scale enough to show it is there and its tone, whatever its
 *  length (the timeline is wide enough for the shortest one in all but extreme cases); the days scale as it was. */
export const barMinWidth = (range: ScheduleRange): number => (range.scale === 'days' ? 6 : 20);
