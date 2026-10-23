// ToolJet UI 2.0 Schedule: the shapes of its range, resources, bookings and selection (scheduleModel.ts).

/** A data row as bound: any fields, of any value. */
export type Row = Record<string, unknown>;

export interface ParsedTime {
  time: number;
  dateOnly: boolean;
}

export interface ScheduleColumn {
  key: string;
  start: number;
  end: number;
  label: string;
  sub: string;
  today: boolean;
}

export interface ScheduleSlot {
  start: number;
  end: number;
  edge: boolean;
}

export interface ScheduleRange {
  scale: 'hours' | 'days';
  start: number;
  end: number;
  columns: ScheduleColumn[];
  slots: ScheduleSlot[];
  /** The hours scale: whether its day is today. */
  today?: boolean;
}

export interface ScheduleResource {
  key: string;
  id: string;
  name: string;
  caption: string;
  avatar: string;
}

/** A booking placed on the range: left and width in % of it, its lane among overlapping bookings. */
export interface PlacedBooking {
  key: string;
  id: unknown;
  row: Row;
  index: number;
  title: string;
  subtitle: string;
  status: string;
  tone: string;
  start: number;
  end: number;
  spanStart: number;
  spanEnd: number;
  left: number;
  width: number;
  time: string;
  lane: number;
}

/** placeBookings builds it without a prototype; read an entry with placedOn (scheduleSelection). */
export type PlacedBookings = Record<string, { lanes: number; items: PlacedBooking[] }>;

/** What the schedule has selected: a booking, or an empty slot of a resource. */
export type ScheduleSelected =
  | { kind: 'booking'; resource: string; key: string; item: PlacedBooking }
  | { kind: 'slot'; resource: string; index: number; value: SlotSelection | Record<string, never> };

/** The schedule's booking field properties, as bound. */
export interface BookingFields {
  resourceField?: unknown;
  startField?: unknown;
  endField?: unknown;
  titleField?: unknown;
  subtitleField?: unknown;
  statusField?: unknown;
  idField?: unknown;
  hourFormat?: unknown;
}

/** A slot as the app reads it (selectedSlot). */
export interface SlotSelection {
  resourceId: string;
  resource: string;
  start: string;
  end: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
}

/** A booking left off the schedule because of its dates, and why. */
export interface BookingProblem {
  index: number;
  id: unknown;
  title: string;
  problem: string;
}
