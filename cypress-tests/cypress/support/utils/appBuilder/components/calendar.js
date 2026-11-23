/**
 * MODULE — appBuilder/components/calendar: browser-only helpers for the Calendar widget (react-big-calendar,
 * frontend/src/AppBuilder/Widgets/Calendar/Calendar.jsx).
 * FOR AI: addCalendarsViaApi seeds Calendars (+ probes / helper widgets / events) through the shared
 * addDateWidgetsViaApi; calendarProperties builds a deterministic property set (fixed dates — never the moment()
 * config defaults, TESTING.md D-03); clickCalendarToolbar drives Today/Back/Next/Month/Week/Day; dragSelectSlots
 * performs a REAL mouse drag (react-big-calendar Selection needs real mousedown/mousemove/mouseup geometry);
 * calendarBoxes / readCalendarBoxes snapshot the grid, headers, events and popover as plain objects;
 * todayInBrowser reads "today" in the pinned browser timezone. Probes / viewer / timezone pinning live in
 * dateTimeCommon.js.
 */
import { calendarText as T } from "Texts/appBuilder/components/calendar";
import { calendarSelector as S } from "Selectors/appBuilder/components/calendar";
import { addDateWidgetsViaApi } from "Support/utils/appBuilder/components/dateTimeCommon";

/**
 * @tjBlock  contexts
 * @tjUsage  addCalendarsViaApi([{ name: 'cal', properties: calendarProperties({ view: 'week' }) }, dateProbe('probe', 'cal', ['currentView'])])
 * @tjDom    addDateWidgetsViaApi with componentType Calendar and the calendar.js:6-9 default size (30 cols × 600px)
 */
export const addCalendarsViaApi = (items, opts = {}) =>
  addDateWidgetsViaApi(items, { componentType: T.componentType, defaultSize: T.defaultSize, ...opts });

/**
 * @tjBlock  properties
 * @tjUsage  calendarProperties({ view: 'day', events: [{ title: 'A', start: '06-15-2022 10:00', end: '06-15-2022 11:00' }], resources: T.resources, popover: true })
 * @tjDom    the `properties` object for addCalendarsViaApi: fixed dateFormat/defaultDate (06-15-2022), defaultView,
 *           events/resources as `{{<json>}}`, optional startTime/endTime band, showPopOverOnEventClick, extra keys
 */
export const calendarProperties = ({
  view = T.defaultView,
  dateFormat = T.dateFormat,
  defaultDate = T.defaultDate,
  events = [],
  resources,
  startTime,
  endTime,
  popover,
  ...rest
} = {}) => {
  const props = {
    dateFormat: { value: dateFormat },
    defaultDate: { value: defaultDate },
    defaultView: { value: `{{${JSON.stringify(view)}}}` },
    events: { value: `{{${JSON.stringify(events)}}}` },
  };
  if (resources) props.resources = { value: `{{${JSON.stringify(resources)}}}` };
  if (startTime) props.startTime = { value: startTime };
  if (endTime) props.endTime = { value: endTime };
  if (popover !== undefined) props.showPopOverOnEventClick = { value: `{{${popover}}}` };
  Object.entries(rest).forEach(([k, v]) => {
    props[k] = typeof v === "object" && v !== null && "value" in v ? v : { value: v };
  });
  return props;
};

/**
 * @tjBlock  userflow
 * @tjUsage  clickCalendarToolbar('cal', 'Next')
 * @tjDom    clicks the react-big-calendar toolbar <button> whose text is exactly `label` (no data-cy on the toolbar)
 */
export const clickCalendarToolbar = (name, label) =>
  cy.get(S.toolbarButtons(name)).contains(new RegExp(`^${label}$`)).click();

/**
 * @tjBlock  userflow
 * @tjUsage  dragSelectSlots(S.monthCell('cal', 3, 1), S.monthCell('cal', 3, 3), { escape: true })
 * @tjDom    REAL mouse (CDP): mousedown at `from`, two moves (past the click tolerance, then onto `to`), optional
 *           Escape while still dragging, mouseup at `to`. Points are `{x,y}` px inside each element (default:
 *           horizontal centre and vertical centre, or `yFromBottom` px above its bottom edge — clear of date numbers / events in month cells).
 *           scrollBehavior:false so the page never scrolls between the moves.
 */
export const dragSelectSlots = (from, to, { escape = false, yFromBottom } = {}) => {
  const point = (sel) =>
    cy.get(sel).first().then(($el) => {
      const r = $el[0].getBoundingClientRect();
      return { x: Math.round(r.width / 2), y: Math.round(yFromBottom === undefined ? r.height / 2 : r.height - yFromBottom) };
    });
  const noScroll = { scrollBehavior: false };
  point(from).then((p) => {
    cy.get(from).first().realMouseDown({ ...noScroll, position: p });
    cy.get(from).first().realMouseMove(p.x + 12, p.y + 8, { ...noScroll, position: "topLeft" });
  });
  point(to).then((p) => {
    cy.get(to).first().realMouseMove(p.x, p.y, { ...noScroll, position: "topLeft" });
    if (escape) cy.realPress("Escape");
    cy.get(to).first().realMouseUp({ ...noScroll, position: p });
  });
};

/**
 * @tjBlock  userflow
 * @tjUsage  startDragSelect(S.timeSlot('cal', 3, 2), S.timeSlot('cal', 3, 5)); …assert mid-drag…; endDragSelect(S.timeSlot('cal', 3, 5))
 * @tjDom    the first half of dragSelectSlots (mousedown + moves, button still held) so a test can read the
 *           in-progress selection; endDragSelect releases the button at the centre of `to`
 */
export const startDragSelect = (from, to) => {
  const noScroll = { scrollBehavior: false };
  cy.get(from).first().realMouseDown({ ...noScroll, position: "center" });
  cy.get(from).first().realMouseMove(12, 8, { ...noScroll, position: "center" });
  cy.get(to).first().realMouseMove(0, 0, { ...noScroll, position: "center" });
};
export const endDragSelect = (to) => cy.get(to).first().realMouseUp({ scrollBehavior: false, position: "center" });

const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const snapshot = (doc, name) => {
  const box = doc.querySelector(S.draggableWidget(name));
  if (!box) return { rendered: false };
  const q = (s) => box.querySelector(s);
  const qa = (s) => [...box.querySelectorAll(s)];
  const cal = q(".rbc-calendar");
  const tc = q(".rbc-time-content");
  const pop = q('.popover[id$="-popover"]');
  return {
    rendered: true,
    box: rect(box),
    root: rect(q(".scrollbar-container")),
    calendar: rect(cal),
    className: cal ? cal.className.replace(/\s+/g, " ").trim() : null,
    label: q(".rbc-toolbar-label")?.textContent ?? null,
    activeView: q(".rbc-toolbar button.rbc-active")?.textContent ?? null,
    monthView: rect(q(".rbc-month-view")),
    monthHeaders: qa(".rbc-month-header .rbc-header").map((h) => ({ text: h.textContent.trim(), rect: rect(h) })),
    monthRows: qa(".rbc-month-row").map((row) => ({
      rect: rect(row),
      cells: [...row.querySelectorAll(".rbc-day-bg")].map(rect),
      dates: [...row.querySelectorAll(".rbc-date-cell")].map((c) => c.textContent.trim()),
    })),
    selectedCells: qa(".rbc-selected-cell").length,
    todayCells: qa(".rbc-day-bg.rbc-today").length,
    timeView: rect(q(".rbc-time-view")),
    resourceView: !!q(".rbc-time-view-resources"),
    resourceHeaders: qa(".rbc-time-header .rbc-row-resource .rbc-header").map((h) => ({ text: h.textContent.trim(), rect: rect(h) })),
    dayHeaders: qa(".rbc-time-header-cell .rbc-header").map((h) => ({ text: h.textContent.trim(), rect: rect(h) })),
    gutter: qa(".rbc-time-gutter .rbc-label").map((l) => l.textContent.trim()),
    gutterRect: rect(q(".rbc-time-gutter")),
    columns: qa(".rbc-time-content .rbc-day-slot").map((c) => ({
      rect: rect(c),
      groups: c.querySelectorAll(".rbc-timeslot-group").length,
    })),
    timeContent: tc
      ? { rect: rect(tc), scrollWidth: tc.scrollWidth, clientWidth: tc.clientWidth, scrollHeight: tc.scrollHeight, clientHeight: tc.clientHeight }
      : null,
    slotSelection: rect(q(".rbc-slot-selection")),
    events: qa(".rbc-event").map((e) => ({ title: e.querySelector(".rbc-event-content")?.textContent.trim(), rect: rect(e) })),
    popover: pop ? { display: pop.style.display, rect: rect(pop), canvas: rect(pop.querySelector('[data-cy="real-canvas"]')) } : null,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  calendarBoxes('cal', (b) => expect(b.columns).to.have.length(7))
 * @tjDom    retries the callback with a plain-object snapshot of the widget: box/root/calendar rects, rbc className,
 *           toolbar label + active view, month headers/rows/cells/dates, selected + today cell counts, time view
 *           (resource headers, day headers, gutter labels, day columns + their timeslot-group count, time-content
 *           scroll sizes, slot-selection rect), events {title, rect} and the event popover {display, rect, canvas}
 */
export const calendarBoxes = (name, assertFn) => cy.document().should((doc) => assertFn(snapshot(doc, name)));

/**
 * @tjBlock  canvas
 * @tjUsage  readCalendarBoxes('cal').then((b) => …)
 * @tjDom    one-shot read of the calendarBoxes snapshot (plain object)
 */
export const readCalendarBoxes = (name) => cy.document().then((doc) => snapshot(doc, name));

/**
 * @tjBlock  contexts
 * @tjUsage  calendarComponentId('cal').then((id) => …)
 * @tjDom    the Calendar root's `id` attribute (Calendar.jsx:131 id={id}) = the component id
 */
export const calendarComponentId = (name) =>
  cy.get(S.root(name)).first().invoke("attr", "id").then((id) => {
    expect(id, `${name} component id`).to.match(/^[0-9a-f-]{36}$/);
    return id;
  });

/**
 * @tjBlock  userflow
 * @tjUsage  todayInBrowser().then(({ day, monthLabel }) => …)
 * @tjDom    "today" read inside the AUT window (its Date/Intl follow the pinned CDP timezone):
 *           day = MM-DD-YYYY, monthLabel = "<Month> <YYYY>" (react-big-calendar month toolbar label)
 */
export const todayInBrowser = () =>
  cy.window().then((win) => {
    const now = new win.Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      day: `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${now.getFullYear()}`,
      monthLabel: `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`,
      date: now.getDate(),
    };
  });
