// ToolJet UI 2.0 pack: the Schedule (Widgets/Shadcn/ShadSchedule.jsx), resources down the side and time across, for
// rooms, desks, shifts, on-call rotas, equipment and bookings. Data-driven like the other sections: every part is a
// property the visual builder edits.
import { ARRAY, NUMBER, STRING, choice, code, colorStyle, shadConfig, sizeStyle, toggle } from './shadcnPackHelpers.js';

const RESOURCES =
  "{{[{ id: 'atlas', name: 'Atlas', caption: '8 seats' }, { id: 'borealis', name: 'Borealis', caption: '4 seats' }, { id: 'cove', name: 'Cove', caption: '12 seats, screen' }, { id: 'dune', name: 'Dune', caption: '2 seats' }]}}";
const BOOKINGS =
  "{{[{ id: 1, room: 'atlas', title: 'Design review', start: '09:00', end: '10:30', status: 'Confirmed', host: 'Maya Chen' }, { id: 2, room: 'atlas', title: '1:1 with Owen', start: '11:00', end: '11:30', status: 'Tentative', host: 'Owen Hart' }, { id: 3, room: 'borealis', title: 'Sprint planning', start: '10:00', end: '12:00', status: 'Confirmed', host: 'Priya Nair' }, { id: 4, room: 'cove', title: 'All hands', start: '13:00', end: '14:00', status: 'Confirmed', host: 'Leo Martins' }, { id: 5, room: 'cove', title: 'Customer call', start: '15:30', end: '16:30', status: 'Pending', host: 'Maya Chen' }, { id: 6, room: 'dune', title: 'Interview', start: '14:00', end: '15:00', status: 'Cancelled', host: 'Grace Ho' }]}}";

export const shadScheduleConfig = shadConfig({
  name: 'ShadSchedule',
  displayName: 'Schedule',
  description:
    "Resource schedule: resources down the side (rooms, desks, people on shift or on call, vehicles, equipment) and time across, with bookings drawn as blocks. scale 'hours' shows one day (date, empty for today) from dayStart to dayEnd (hours, 0 to 24) with empty slots of slotMinutes; scale 'days' shows `days` days from date (a week of shifts, an on-call rota). resources: ['Atlas', 'Cove'] or [{ id, name, caption, avatar }] (empty: the distinct values of the bookings' resourceField). bookings: rows read through startField and endField (an ISO date-time, 'YYYY-MM-DD HH:mm', 'HH:mm' for a time on the shown day, or 'YYYY-MM-DD' for a whole day; no end lasts an hour), resourceField (a resource's id or name), titleField, subtitleField (a second line: the host, the person) and statusField (toned by its words: Confirmed green, Tentative or Pending amber, Cancelled red, Booked blue; or a tone name). Overlapping bookings of one resource stack in lanes. A now-line marks the current time on today (showNowLine). A click on a booking exposes selectedBooking (its row) and selectedBookingId and fires onBookingClick; a click on an empty slot exposes selectedSlot { resourceId, resource, start, end (ISO), date, startTime, endTime, label } and fires onSlotClick (open a booking form from it). hourFormat 12h or 24h; resourceTitle heads the resource column. Scrolls sideways when the hours do not fit. Height: grows with its rows (40px header plus rowHeight, default 56, per resource; more where bookings overlap)",
  defaultSize: { width: 43, height: 300 },
  withHeight: true,
  properties: {
    resources: code('Resources', ARRAY, [], { placeholder: "[{ id: 'atlas', name: 'Atlas', caption: '8 seats' }]" }),
    bookings: code('Bookings', ARRAY, [], {
      placeholder: "[{ id: 1, room: 'atlas', title: 'Design review', start: '09:00', end: '10:30' }]",
    }),
    resourceField: code("Resource field (a resource's id or name)", STRING, 'resource'),
    startField: code('Start field', STRING, 'start'),
    endField: code('End field', STRING, 'end'),
    titleField: code('Title field', STRING, 'title'),
    subtitleField: code('Second line field', STRING, ''),
    statusField: code('Status field (toned by its words)', STRING, 'status'),
    idField: code('Id field', STRING, 'id'),
    scale: choice('Time across', ['hours', 'days'], 'hours', { hours: 'Hours of a day', days: 'Days' }),
    date: code('Date shown (empty for today)', STRING, ''),
    dayStart: code('Day starts at (hour, or a time such as 09:00)', { type: 'union', schemas: [NUMBER, STRING] }, 8),
    dayEnd: code('Day ends at (hour, or a time such as 18:00)', { type: 'union', schemas: [NUMBER, STRING] }, 18),
    slotMinutes: code('Slot length (minutes)', NUMBER, 30),
    days: code('Days shown', NUMBER, 7),
    hourFormat: choice('Hour format', ['12h', '24h'], '12h', { '12h': '12 hour', '24h': '24 hour' }),
    resourceTitle: code('Resource column title', STRING, ''),
    resourceWidth: code('Resource column width (px)', NUMBER, 168),
    rowHeight: code('Row height (px)', NUMBER, 56),
    showNowLine: toggle('Show the current time', true),
    highlightSelected: toggle('Highlight the selected booking', true),
    emptyText: code('Empty text', STRING, 'No resources to schedule'),
  },
  defaults: {
    resources: { value: RESOURCES },
    bookings: { value: BOOKINGS },
    resourceField: { value: 'room' },
    startField: { value: 'start' },
    endField: { value: 'end' },
    titleField: { value: 'title' },
    subtitleField: { value: '' },
    statusField: { value: 'status' },
    idField: { value: 'id' },
    scale: { value: 'hours' },
    date: { value: '' },
    dayStart: { value: '{{8}}' },
    dayEnd: { value: '{{18}}' },
    slotMinutes: { value: '{{30}}' },
    days: { value: '{{7}}' },
    hourFormat: { value: '12h' },
    resourceTitle: { value: 'Room' },
    resourceWidth: { value: '{{168}}' },
    rowHeight: { value: '{{56}}' },
    showNowLine: { value: '{{true}}' },
    highlightSelected: { value: '{{true}}' },
    emptyText: { value: 'No resources to schedule' },
  },
  styles: {
    backgroundColor: colorStyle('Background'),
    borderColor: colorStyle('Grid line color'),
    textColor: colorStyle('Label color'),
    accentColor: colorStyle('Booking accent (bookings without a status, the selection)'),
    nowColor: colorStyle('Current time line color'),
    borderRadius: sizeStyle('Radius'),
  },
  events: {
    onBookingClick: { displayName: 'On booking click' },
    onSlotClick: { displayName: 'On empty slot click' },
  },
  exposedVariables: { selectedBooking: {}, selectedBookingId: null, selectedSlot: {} },
});
