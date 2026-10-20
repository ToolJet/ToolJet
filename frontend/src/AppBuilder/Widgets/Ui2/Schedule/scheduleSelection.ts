// ToolJet UI 2.0 Schedule: what is selected (Schedule.tsx). A click keeps who or what was picked, never a copy of it:
// a booking by its key on its resource, a slot by its resource and times. What is highlighted and exposed is resolved
// from that against the schedule as it is now, so after a refresh both show the current booking or slot; while it is
// not on the schedule (the booking is gone, the date or slot length moved past it) nothing is selected, and it is
// selected again if it comes back.
import { slotValue } from './scheduleModel';
import type {
  PlacedBooking,
  PlacedBookings,
  ScheduleRange,
  ScheduleResource,
  ScheduleSelected,
  ScheduleSlot,
} from './scheduleTypes';

/** Who or what a click picked. */
export type SchedulePick =
  | { kind: 'booking'; resource: string; key: string }
  | { kind: 'slot'; resource: string; start: number; end: number };

export const pickBooking = (resource: ScheduleResource, item: PlacedBooking): SchedulePick => ({
  kind: 'booking',
  resource: resource.key,
  key: item.key,
});

export const pickSlot = (resource: ScheduleResource, slot: ScheduleSlot): SchedulePick => ({
  kind: 'slot',
  resource: resource.key,
  start: slot.start,
  end: slot.end,
});

/** The selection as it is now, or null when what was picked is not on the schedule. A booking moved to another
 *  resource is still found by its key. */
export const resolveSelection = (
  pick: SchedulePick | null,
  placed: PlacedBookings,
  resources: ScheduleResource[],
  range: ScheduleRange,
  hourFormat: unknown
): ScheduleSelected | null => {
  if (!pick) return null;
  if (pick.kind === 'booking') {
    const own = placed[pick.resource]?.items.find((b) => b.key === pick.key);
    if (own) return { kind: 'booking', resource: pick.resource, key: own.key, item: own };
    for (const [resource, entry] of Object.entries(placed)) {
      const item = entry.items.find((b) => b.key === pick.key);
      if (item) return { kind: 'booking', resource, key: item.key, item };
    }
    return null;
  }
  const resource = resources.find((r) => r.key === pick.resource);
  const index = range.slots.findIndex((s) => s.start === pick.start && s.end === pick.end);
  if (!resource || index === -1) return null;
  return {
    kind: 'slot',
    resource: resource.key,
    index,
    value: slotValue(resource, range.slots[index], hourFormat, range.scale),
  };
};

/** What the schedule exposes for a selection. */
export const selectionExposed = (selected: ScheduleSelected | null) => ({
  selectedBooking: selected?.kind === 'booking' ? selected.item.row : {},
  selectedBookingId: selected?.kind === 'booking' ? selected.item.id ?? null : null,
  selectedSlot: selected?.kind === 'slot' ? selected.value : {},
});

/** The selection as one value for an effect's dependencies: its resource and its booking key or slot index, '' for
 *  none. It changes when another booking or slot is picked, not when a refresh resolves the same one again. */
export const selectionTarget = (selected: ScheduleSelected | null): string =>
  selected
    ? JSON.stringify([selected.resource, selected.kind, selected.kind === 'booking' ? selected.key : selected.index])
    : '';

/** Brings the selected booking or slot into view along a scrolled time axis (the scroll container's scroll-padding
 *  keeps it clear of the sticky resource column). */
export const revealTarget = (root: HTMLElement | null, target: string): void => {
  if (!root || !target) return;
  const [resource, kind, which] = JSON.parse(target) as [string, string, string | number];
  const row = Array.from(root.querySelectorAll<HTMLElement>('[data-resource]')).find(
    (el) => el.dataset.resource === resource
  );
  const el =
    kind === 'booking'
      ? Array.from(row?.querySelectorAll<HTMLElement>('[data-booking]') ?? []).find((b) => b.dataset.booking === which)
      : row?.querySelectorAll<HTMLElement>('button.sc-slot')[Number(which)];
  el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
};
