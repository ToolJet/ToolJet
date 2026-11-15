/**
 * SPEC — Calendar — userflow facet.
 * FOR AI: TESTING.md browser scenario Calendar-BRW-004 — "Time band, Today, keyboard, and grid layout":
 *   - startTime / endTime (calendar.js:20-24, Calendar.jsx:53-54,165-166 min/max) bound the visible time band of
 *     the week and day grids (gutter labels, slot groups, event placement); without them the band is the whole day;
 *   - the Today toolbar button returns from a past defaultDate to the current date (Calendar.jsx:181-186
 *     onNavigate → currentDate + onCalendarNavigate) and the today cell is highlighted;
 *   - keyboard: Tab walks the toolbar buttons, Enter / Space activate them, Escape cancels a drag selection in
 *     progress (react-big-calendar Selection) so no slot is selected;
 *   - grid layout: month = 7 equal day columns × the needed week rows under aligned weekday headers; week = 7
 *     equal day columns right of the time gutter; day = one column;
 *   - an invalid defaultView must visually recover to month view (TESTING.md D-08: its exposed currentView is
 *     the config default; whether the grid recovers is browser-owned).
 * Dates are fixed explicit values (06-15-2022); "today" is read in the AUT window with the browser timezone
 * pinned (CDP).
 * Helpers: addCalendarsViaApi, calendarProperties, clickCalendarToolbar, startDragSelect, endDragSelect,
 * calendarBoxes, todayInBrowser, counterEvent, counterText, expectCounter, dateProbe, expectDateProbe,
 * openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { calendarSelector as S } from "Selectors/appBuilder/components/calendar";
import { calendarText as T } from "Texts/appBuilder/components/calendar";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    addCalendarsViaApi,
    calendarProperties,
    clickCalendarToolbar,
    startDragSelect,
    endDragSelect,
    calendarBoxes,
    todayInBrowser,
} from "Support/utils/appBuilder/components/calendar";
import {
    pinBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const PX = 1.5; // sub-pixel / border tolerance
const title = () => fake.firstName.slice(0, 10) || 'Review'; // dynamic: event title

// `n` rects laid out left to right with equal widths and no gaps
const expectEqualContiguous = (rects, label) => {
    rects.forEach((r, i) => {
        expect(r.width, `${label} ${i} width`).to.be.closeTo(rects[0].width, PX);
        if (i > 0) expect(r.left, `${label} ${i} starts where ${i - 1} ends`).to.be.closeTo(rects[i - 1].right, PX);
    });
};
const expectInside = (inner, outer, label) => {
    expect(inner.left, `${label} (left)`).to.be.gte(outer.left - PX);
    expect(inner.right, `${label} (right)`).to.be.lte(outer.right + PX);
    expect(inner.top, `${label} (top)`).to.be.gte(outer.top - PX);
    expect(inner.bottom, `${label} (bottom)`).to.be.lte(outer.bottom + PX);
};

describe('Calendar — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Calendar-userflow-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── Calendar-BRW-004 (time band) ────────────────────────────────────────
    it('[Calendar-BRW-004] startTime / endTime bound the week and day time grid; without them the grid spans the whole day', () => {
        const ev = title();
        addCalendarsViaApi([
            {
                name: 'band',
                layout: { top: 40, left: 2, width: 30, height: 560 },
                properties: calendarProperties({
                    view: 'week',
                    startTime: T.bandStart, // 08:00
                    endTime: T.bandEnd, // 18:00
                    events: [{ title: ev, start: '06-15-2022 10:00', end: '06-15-2022 11:00', allDay: false }],
                }),
            },
            // control: no startTime / endTime → the definition defaults (start / end of the current day)
            { name: 'fullday', layout: { top: 640, left: 2, width: 30, height: 560 }, properties: calendarProperties({ view: 'week' }) },
        ]);
        openDateAppInViewer(S.timeView('band'));

        const expectBand = (context) =>
            calendarBoxes('band', (b) => {
                expect(b.gutter, `${context}: gutter labels 08:00 → 17:00`).to.deep.eq(T.bandGutter);
                b.columns.forEach((c, i) => expect(c.groups, `${context}: column ${i} hour groups`).to.eq(T.bandGutter.length));
                // 10:00 is 2 of the 10 band hours below the top of its column, 1 hour tall
                const col = b.columns.find((c) => c.rect.left <= b.events[0].rect.left + PX && c.rect.right >= b.events[0].rect.right - PX).rect;
                const hour = col.height / T.bandGutter.length;
                expect(b.events[0].rect.top - col.top, `${context}: 10:00 event offset in the band`).to.be.closeTo(2 * hour, 4);
                expect(b.events[0].rect.height, `${context}: 1h event height`).to.be.closeTo(hour, 4);
            });
        expectBand('week');
        calendarBoxes('fullday', (b) => {
            expect(b.gutter[0], 'full day: first label').to.eq(T.fullDayFirstLabel);
            expect(b.gutter[b.gutter.length - 1], 'full day: last label').to.eq(T.fullDayLastLabel);
            expect(b.columns[0].groups, 'full day: 24 hour groups').to.eq(24);
        });

        clickCalendarToolbar('band', T.toolbar.day);
        cy.get(S.toolbarLabel('band')).should('contain.text', 'Jun 15');
        calendarBoxes('band', (b) => expect(b.columns, 'day view: one column').to.have.length(1));
        expectBand('day');
    });

    // ── Calendar-BRW-004 (Today) ────────────────────────────────────────────
    it('[Calendar-BRW-004] Today returns from a past default date to the current date and highlights it', () => {
        addCalendarsViaApi([
            {
                name: 'cal',
                layout: { top: 40, left: 2, width: 30, height: 520 },
                properties: calendarProperties({ view: 'month', dateFormat: T.dayFormat, defaultDate: T.defaultDay }),
                events: [counterEvent('onCalendarNavigate', 'navs')], // calendar.js:39
            },
            counterText('navs', 'navs', { top: 580, left: 2, width: 10 }),
            dateProbe('probe', 'cal', ['currentDate'], { top: 640 }),
        ]);
        openDateAppInViewer(S.monthView('cal'));
        cy.get(S.toolbarLabel('cal')).should('have.text', T.monthLabel);
        cy.get(S.todayCell('cal')).should('not.exist'); // June 2022 does not contain today

        clickCalendarToolbar('cal', T.toolbar.next);
        cy.get(S.toolbarLabel('cal')).should('have.text', T.nextMonthLabel);
        expectDateProbe('probe', { currentDate: '07-15-2022' });

        clickCalendarToolbar('cal', T.toolbar.today);
        todayInBrowser().then((today) => {
            cy.get(S.toolbarLabel('cal')).should('have.text', today.monthLabel);
            expectDateProbe('probe', { currentDate: today.day }, 'currentDate after Today');
            expectCounter('navs', 'navs', 2);
            // the current day is the one highlighted cell, under today's date number
            cy.get(S.todayCell('cal')).should('have.length', 1).and('have.css', 'opacity', '0.1'); // Calendar.scss:21-24
            cy.document().should((doc) => {
                const cell = doc.querySelector(S.todayCell('cal')).getBoundingClientRect();
                const dates = [...doc.querySelectorAll(`${S.draggableWidget('cal')} .rbc-date-cell`)].filter((d) => {
                    const r = d.getBoundingClientRect();
                    return r.left >= cell.left - PX && r.right <= cell.right + PX && r.top >= cell.top - PX && r.bottom <= cell.bottom + PX;
                });
                expect(dates.map((d) => Number(d.textContent.trim())), 'today cell date number').to.deep.eq([today.date]);
            });
        });
    });

    // ── Calendar-BRW-004 (keyboard) ─────────────────────────────────────────
    it('[Calendar-BRW-004] Keyboard: Tab walks the toolbar, Enter / Space activate it, Escape cancels a drag selection', () => {
        addCalendarsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 20, left: 2, width: 10, height: 40 } },
            {
                name: 'cal',
                layout: { top: 80, left: 2, width: 30, height: 520 },
                properties: calendarProperties({ view: 'month', startTime: T.bandStart, endTime: T.bandEnd }),
                events: [counterEvent('onCalendarNavigate', 'navs'), counterEvent('onCalendarSlotSelect', 'slotselects')], // calendar.js:38-39
            },
            counterText('navs', 'navs', { top: 640, left: 2, width: 10 }),
            counterText('slotselects', 'slotselects', { top: 640, left: 14, width: 10 }),
            dateProbe('probe', 'cal', ['currentDate', 'currentView', 'selectedSlots'], { top: 700, height: 80 }),
        ]);
        openDateAppInViewer(S.monthView('cal'));
        const expectFocused = (text) =>
            cy.document().should((doc) => {
                const el = doc.activeElement;
                expect(el && el.closest(S.toolbar('cal')), `focus inside the calendar toolbar (${text})`).to.not.eq(null);
                expect(el.tagName, 'focused element').to.eq('BUTTON');
                expect(el.textContent, 'focused toolbar button').to.eq(text);
            });

        cy.get(`${commonWidgetSelector.draggableWidget('before')} input`).click();
        cy.realPress('Tab');
        expectFocused(T.toolbar.today); // Tab from the widget above reaches the calendar's first control
        cy.realPress('Tab');
        expectFocused(T.toolbar.back);
        cy.realPress('Tab');
        expectFocused(T.toolbar.next);
        cy.realPress('Enter');
        cy.get(S.toolbarLabel('cal')).should('have.text', T.nextMonthLabel);
        expectCounter('navs', 'navs', 1);
        cy.realPress('Tab'); // the label is not focusable
        expectFocused(T.toolbar.month);
        cy.realPress('Tab');
        expectFocused(T.toolbar.week);
        cy.realPress('Space');
        cy.get(S.activeViewButton('cal')).should('have.text', T.toolbar.week);
        expectDateProbe('probe', { currentDate: '07-15-2022 00:00', currentView: 'week', selectedSlots: {} }, 'after keyboard navigation');

        // Escape while dragging: the selection box disappears and nothing is selected
        startDragSelect(S.timeSlot('cal', 2, 2), S.timeSlot('cal', 2, 5)); // Tue, 09:00 → 10:30 (band starts 08:00)
        cy.get(S.slotSelection('cal')).should('be.visible');
        cy.realPress('Escape');
        cy.get(S.slotSelection('cal')).should('not.exist');
        endDragSelect(S.timeSlot('cal', 2, 5));
        expectCounter('slotselects', 'slotselects', 0);
        expectDateProbe('probe', { currentDate: '07-15-2022 00:00', currentView: 'week', selectedSlots: {} }, 'Escape cancelled the selection');

        // control: the same drag without Escape selects
        startDragSelect(S.timeSlot('cal', 2, 2), S.timeSlot('cal', 2, 5));
        endDragSelect(S.timeSlot('cal', 2, 5));
        expectCounter('slotselects', 'slotselects', 1);
    });

    // ── Calendar-BRW-004 (grid layout) ──────────────────────────────────────
    it('[Calendar-BRW-004] Month, week and day grids lay out aligned, equal columns inside the widget', () => {
        addCalendarsViaApi([
            { name: 'cal', layout: { top: 40, left: 2, width: 30, height: 600 }, properties: calendarProperties({ view: 'month', startTime: T.bandStart, endTime: T.bandEnd }) },
        ]);
        openDateAppInViewer(S.monthView('cal'));

        // month: June 2022 needs 5 week rows (29 May … 2 Jul)
        calendarBoxes('cal', (b) => {
            expectInside(b.calendar, b.box, 'calendar inside the widget');
            expectInside(b.monthView, b.calendar, 'month grid inside the calendar');
            expect(b.monthHeaders.map((h) => h.text), 'weekday headers').to.deep.eq(T.weekdayHeaders);
            expect(b.monthRows, 'week rows').to.have.length(5);
            expect(b.monthRows[0].dates, 'first row').to.deep.eq(['29', '30', '31', '01', '02', '03', '04']);
            expect(b.monthRows[4].dates, 'last row').to.deep.eq(['26', '27', '28', '29', '30', '01', '02']);
            b.monthRows.forEach((row, r) => {
                expect(row.cells, `row ${r} day cells`).to.have.length(7);
                expectEqualContiguous(row.cells, `row ${r} cell`);
                expect(row.rect.height, `row ${r} height`).to.be.closeTo(b.monthRows[0].rect.height, PX);
                if (r > 0) expect(row.rect.top, `row ${r} under row ${r - 1}`).to.be.closeTo(b.monthRows[r - 1].rect.bottom, PX + 1);
                row.cells.forEach((c, i) => expect(c.left, `row ${r} cell ${i} under its weekday header`).to.be.closeTo(b.monthHeaders[i].rect.left, PX));
                expectInside(row.rect, b.monthView, `row ${r} inside the month grid`);
            });
            expect(b.monthRows[4].rect.bottom, 'rows fill the month grid').to.be.closeTo(b.monthView.bottom, 3);
        });

        // week: 7 equal day columns to the right of the time gutter, under their date headers
        clickCalendarToolbar('cal', T.toolbar.week);
        calendarBoxes('cal', (b) => {
            expect(b.dayHeaders.map((h) => h.text), 'week headers').to.deep.eq(T.weekHeaders);
            expect(b.columns, 'week day columns').to.have.length(7);
            expectEqualContiguous(b.columns.map((c) => c.rect), 'week column');
            b.columns.forEach((c, i) => expect(c.rect.left, `week column ${i} under its header`).to.be.closeTo(b.dayHeaders[i].rect.left, PX + 1));
            expect(b.columns[0].rect.left, 'gutter left of the first day').to.be.closeTo(b.gutterRect.right, PX + 1);
            expectInside({ ...b.columns[6].rect, top: b.timeView.top, bottom: b.timeView.bottom }, b.timeView, 'last day column inside the time view');
            expect(b.timeContent.scrollWidth, 'week fits without horizontal scroll').to.be.lte(b.timeContent.clientWidth + 1);
        });

        // day: a single column filling the grid right of the gutter
        clickCalendarToolbar('cal', T.toolbar.day);
        calendarBoxes('cal', (b) => {
            expect(b.columns, 'day column').to.have.length(1);
            expect(b.columns[0].rect.left, 'day column starts at the gutter').to.be.closeTo(b.gutterRect.right, PX + 1);
            expect(b.columns[0].rect.right, 'day column fills the grid').to.be.closeTo(b.timeContent.rect.left + b.timeContent.clientWidth, 3);
        });
    });

    // ── Calendar-BRW-004 (invalid defaultView) ──────────────────────────────
    // PRODUCT BUG (kept red): react-big-calendar renders with view = the invalid defaultView before Calendar.jsx's
    // normalization effect (Calendar.jsx:100-110) runs, throws "Cannot read properties of undefined (reading
    // 'title')", and the widget is replaced by the inline error boundary — it never recovers to month view.
    it('[Calendar-BRW-004] An invalid defaultView recovers to the month view', () => {
        const badId = crypto.randomUUID(); // pinned so the error-boundary wrapper can be found
        addCalendarsViaApi([
            { name: 'good', layout: { top: 40, left: 2, width: 20, height: 400 }, properties: calendarProperties({ view: 'month' }) },
            { id: badId, name: 'bad', layout: { top: 480, left: 2, width: 20, height: 400 }, properties: calendarProperties({ view: 'year' }) },
        ]);
        openDateAppInViewer(S.monthView('good'));
        cy.get(S.widgetWrapper(badId)).should('exist');
        cy.get(S.widgetWrapper(badId)).should(($w) => {
            expect({
                errorBoundary: $w.find('[data-cy="error-boundary-fallback"]').length,
                monthView: $w.find('.rbc-month-view').length,
                activeView: $w.find('.rbc-toolbar button.rbc-active').text(),
                label: $w.find('.rbc-toolbar-label').text(),
            }, 'invalid defaultView rendering').to.deep.eq({ errorBoundary: 0, monthView: 1, activeView: T.toolbar.month, label: T.monthLabel });
        });
    });
});
