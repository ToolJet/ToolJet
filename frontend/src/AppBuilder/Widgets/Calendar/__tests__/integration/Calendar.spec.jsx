import { waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for Calendar (react-big-calendar).
// Contract: frontend/ee/test/app-builder/widgets/Calendar/TESTING.md.
// Characterization specs: each is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.
//
// Facts pinned here (all characterized as-is, no production change):
//  - react-big-calendar mounts under jsdom but is lazy (TrackedSuspense), so every
//    test waits on the real `.rbc-calendar`, never on a config-default exposed var.
//  - selectedEvent/selectedSlots are published by the REAL eventsSlice (not the widget);
//    selectedEvent.start/end are timezone-dependent ISO strings, asserted shape-only.
//  - currentDate/currentView are the deterministic exposed contract, seeded fixed.
//  - Calendar has NO CSA, NO validation, NO loading/disabled - only visibility.

const ID = 'calendar1';

const defaultProperties = {
  dateFormat: binding('MM-DD-YYYY'),
  defaultDate: binding('06-15-2022'),
  events: binding(
    "{{[{ title: 'Sample event', start: '06-15-2022', end: '06-15-2022', allDay: true, color: 'lightgreen' }]}}"
  ),
  resources: binding('{{[]}}'),
  defaultView: binding("{{'month'}}"),
  startTime: binding('06-15-2022'),
  endTime: binding('06-15-2022'),
  displayToolbar: binding('{{true}}'),
  displayViewSwitcher: binding('{{true}}'),
  highlightToday: binding('{{true}}'),
  showPopOverOnEventClick: binding('{{false}}'),
};

const defaultStyles = {
  visibility: binding('{{true}}'),
  cellSizeInViewsClassifiedByResource: binding('spacious'),
  weekDateFormat: binding('DD MMM'),
  borderColor: binding('var(--cc-weak-border)'),
  borderRadius: binding('{{6}}'),
};

const widget = createWidgetHarness({
  componentType: 'Calendar',
  handle: ID,
  id: ID,
  defaultProperties,
  defaultStyles,
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const calRoot = () => document.querySelector('.scrollbar-container');
const rbc = () => document.querySelector('.rbc-calendar');
const toolbarBtn = (text) =>
  Array.from(document.querySelectorAll('.rbc-toolbar button')).find((b) => b.textContent === text);
const waitCal = () => waitFor(() => expect(rbc()).toBeTruthy(), { timeout: 8000 });
const clickBtn = (btn) => widget.session.store.act(async () => fireEvent.click(btn));

const navCounter = () =>
  setVariableOn(ID, 'onCalendarNavigate', { key: 'navCount', value: '{{(variables.navCount ?? 0) + 1}}' });
const viewCounter = () =>
  setVariableOn(ID, 'onCalendarViewChange', { key: 'viewCount', value: '{{(variables.viewCount ?? 0) + 1}}' });
const eventCounter = () =>
  setVariableOn(ID, 'onCalendarEventSelect', { key: 'evtCount', value: '{{(variables.evtCount ?? 0) + 1}}' });

describe('Calendar widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Calendar-VAR-001] mount publishes currentDate/currentView and react-big-calendar renders', async () => {
    // Break this catches: not publishing currentDate on mount (Calendar.jsx:96-98)
    // or the currentView normalization effect (Calendar.jsx:100-107).
    widget.render({});
    await waitCal();

    await waitFor(() => expect(exposed().currentDate).toBe('06-15-2022'));
    expect(exposed().currentView).toBe('month');
  });

  test('[Calendar-VIEW-001] defaultView day/week pass through to currentView', async () => {
    // Break this catches: the allowed-view pass-through in the defaultView effect
    // (Calendar.jsx:101-102), so a valid view is dropped.
    widget.render({ properties: { defaultView: binding("{{'week'}}") } });
    await waitCal();
    await waitFor(() => expect(exposed().currentView).toBe('week'));

    widget.render({ properties: { defaultView: binding("{{'day'}}") } });
    await waitCal();
    await waitFor(() => expect(exposed().currentView).toBe('day'));
  });

  test('[Calendar-VIEW-002] clicking the view switcher updates currentView and fires onCalendarViewChange', async () => {
    // Break this catches: onView not updating currentView / not firing the event
    // (Calendar.jsx:162-166).
    widget.render({ events: viewCounter() });
    await waitCal();

    await clickBtn(toolbarBtn('Week'));

    await waitFor(() => expect(exposed().currentView).toBe('week'));
    expect(widget.variables().viewCount).toBe(1);
  });

  test('[Calendar-VIEW-004] a defaultView binding change re-publishes currentView', async () => {
    // Break this catches: the defaultView effect not reacting to a property change
    // (Calendar.jsx:100-107 deps); regression 98eccc5390.
    widget.render({});
    await waitCal();
    await waitFor(() => expect(exposed().currentView).toBe('month'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultView', 'week', 'properties');
    });

    await waitFor(() => expect(exposed().currentView).toBe('week'));
  });

  test('[Calendar-NAV-001] clicking Next advances currentDate and fires onCalendarNavigate', async () => {
    // Break this catches: onNavigate not updating currentDate / not firing the event
    // (Calendar.jsx:191-196).
    widget.render({ events: navCounter() });
    await waitCal();
    await waitFor(() => expect(exposed().currentDate).toBe('06-15-2022'));

    await clickBtn(toolbarBtn('Next'));

    await waitFor(() => expect(exposed().currentDate).toBe('07-15-2022'));
    expect(widget.variables().navCount).toBe(1);
  });

  test('[Calendar-NAV-002] clicking Back moves currentDate back and fires onCalendarNavigate', async () => {
    // Break this catches: onNavigate mis-formatting the date or not firing the event
    // (Calendar.jsx:191-196).
    widget.render({ events: navCounter() });
    await waitCal();
    await waitFor(() => expect(exposed().currentDate).toBe('06-15-2022'));

    await clickBtn(toolbarBtn('Back'));

    await waitFor(() => expect(exposed().currentDate).toBe('05-15-2022'));
    expect(widget.variables().navCount).toBe(1);
  });

  test('[Calendar-NAV-003] a defaultDate binding change re-inits currentDate', async () => {
    // Break this catches: the defaultDate effect not re-publishing currentDate
    // (Calendar.jsx:108-115).
    widget.render({});
    await waitCal();
    await waitFor(() => expect(exposed().currentDate).toBe('06-15-2022'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultDate', '08-20-2022', 'properties');
    });

    await waitFor(() => expect(exposed().currentDate).toBe('08-20-2022'));
  });

  test('[Calendar-EVENT-001] clicking an event publishes selectedEvent and fires onCalendarEventSelect', async () => {
    // Break this catches: onSelectEvent not firing onCalendarEventSelect with the
    // event payload (Calendar.jsx:167-181 -> eventsSlice.js:366-369).
    widget.render({ events: eventCounter() });
    await waitCal();
    await waitFor(() => expect(document.querySelector('.rbc-event')).toBeTruthy());

    await clickBtn(document.querySelector('.rbc-event'));

    await waitFor(() => expect(exposed().selectedEvent?.title).toBe('Sample event'));
    const se = exposed().selectedEvent;
    expect(se.allDay).toBe(true);
    expect(se.color).toBe('lightgreen');
    // start/end are timezone-dependent Date objects (D-02) - assert shape, not an instant
    expect(se.start).toBeTruthy();
    expect(Number.isNaN(new Date(se.start).getTime())).toBe(false);
    expect(widget.variables().evtCount).toBe(1);
  });

  test('[Calendar-DATE-001] currentDate honors a custom dateFormat', async () => {
    // Break this catches: not formatting currentDate with the widget dateFormat
    // (Calendar.jsx:96-98).
    widget.render({ properties: { dateFormat: binding('YYYY/MM/DD'), defaultDate: binding('2022/06/15') } });
    await waitCal();

    await waitFor(() => expect(exposed().currentDate).toBe('2022/06/15'));
  });

  test('[Calendar-DATE-002] an invalid defaultDate leaves currentDate unpublished', async () => {
    // Break this catches: publishing currentDate for an invalid date instead of
    // guarding on parseDate null (Calendar.jsx:17-24,96-98).
    widget.render({ properties: { defaultDate: binding('not-a-date') } });
    await waitCal();

    // give the mount effect a tick, then assert it stayed unpublished
    await waitFor(() => expect(rbc()).toBeTruthy());
    expect(exposed().currentDate).toBeFalsy();
  });

  test('[Calendar-STYLE-001] visibility=false hides the root with display:none', async () => {
    // Break this catches: dropping the visibility -> display:none mapping
    // (Calendar.jsx:126).
    widget.render({ styles: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(calRoot()).toBeTruthy(), { timeout: 8000 });

    expect(calRoot()).toHaveStyle({ display: 'none' });
  });

  test('[Calendar-STYLE-002] borderColor is applied to the root inline border', async () => {
    // Break this catches: not forwarding borderColor to the root inline border
    // (Calendar.jsx:129).
    widget.render({ styles: { borderColor: binding('rgb(255, 0, 0)') } });
    await waitCal();

    expect(calRoot().getAttribute('style')).toContain('1px solid rgb(255, 0, 0)');
  });

  test('[Calendar-STYLE-003] borderRadius is applied to the root inline style', async () => {
    // Break this catches: not forwarding borderRadius to the root inline style
    // (Calendar.jsx:130).
    widget.render({ styles: { borderRadius: binding('{{12}}') } });
    await waitCal();

    expect(calRoot()).toHaveStyle({ borderRadius: '12px' });
  });

  test('[Calendar-STYLE-004] highlightToday=false adds the dont-highlight-today class', async () => {
    // Break this catches: dropping the highlightToday -> dont-highlight-today class
    // (Calendar.jsx:137).
    widget.render({ properties: { highlightToday: binding('{{false}}') } });
    await waitCal();

    expect(rbc().className).toContain('dont-highlight-today');
  });

  test('[Calendar-STYLE-005] displayViewSwitcher=false adds the hide-view-switcher class', async () => {
    // Break this catches: dropping the displayViewSwitcher -> hide-view-switcher
    // class (Calendar.jsx:139).
    widget.render({ properties: { displayViewSwitcher: binding('{{false}}') } });
    await waitCal();

    expect(rbc().className).toContain('hide-view-switcher');
  });

  test('[Calendar-STYLE-006] cellSize class on mount and resources-week-cls on week view', async () => {
    // Break this catches: dropping the cellSize class or the week -> resources-week-cls
    // class (Calendar.jsx:136,138).
    widget.render({ styles: { cellSizeInViewsClassifiedByResource: binding('compact') } });
    await waitCal();
    expect(rbc().className).toContain('compact');

    await clickBtn(toolbarBtn('Week'));
    await waitFor(() => expect(rbc().className).toContain('resources-week-cls'));
  });

  test('[Calendar-TOOLBAR-001] displayToolbar=false removes the toolbar', async () => {
    // Break this catches: not forwarding displayToolbar to react-big-calendar
    // (Calendar.jsx:206), so the toolbar always renders.
    widget.render({ properties: { displayToolbar: binding('{{false}}') } });
    await waitCal();

    expect(document.querySelector('.rbc-toolbar')).toBeNull();
  });

  test('[Calendar-WEEKFMT-001] weekDateFormat drives the week-view header', async () => {
    // Break this catches: the custom week header not using styles.weekDateFormat
    // (Calendar.jsx:117-122).
    widget.render({
      properties: { defaultView: binding("{{'week'}}") },
      styles: { weekDateFormat: binding('DD MMM') },
    });
    await waitCal();

    await waitFor(() => expect(document.body.textContent).toContain('15 Jun'));
  });

  test('[Calendar-PREC-001] a user navigate survives an unrelated property re-resolve', async () => {
    // Break this catches: re-initialising currentDate from defaultDate on an
    // unrelated re-resolve (Calendar.jsx:108-115), clobbering the user navigate.
    widget.render({ events: navCounter() });
    await waitCal();
    await clickBtn(toolbarBtn('Next'));
    await waitFor(() => expect(exposed().currentDate).toBe('07-15-2022'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'highlightToday', '{{false}}', 'properties');
    });

    expect(exposed().currentDate).toBe('07-15-2022');
  });
});
