/**
 * SPEC — Calendar — events facet.
 * FOR AI: TESTING.md browser scenario Calendar-BRW-001 — click-dragging across empty cells fires On Slot Select
 * (calendar.js:38) once and publishes `selectedSlots` {slots, start, end, resourceId, action} formatted with
 * dateFormat (Calendar.jsx:72-87 slotSelectHandler → eventsSlice). react-big-calendar's Selection needs a REAL
 * drag (mousedown → mousemove past the click tolerance → mouseup, with real element geometry), so the drag is
 * driven through CDP (dragSelectSlots) in the running app.
 * Dates: fixed explicit dateFormat/defaultDate (06-15-2022) and a browser pinned to Asia/Kolkata (CDP) — slot
 * times are local, the pin only removes machine dependence.
 * Observed through: an exact set-variable counter on onCalendarSlotSelect + a Text probe of selectedSlots.
 * Helpers: addCalendarsViaApi, calendarProperties, clickCalendarToolbar, dragSelectSlots, startDragSelect,
 * endDragSelect, calendarBoxes, counterEvent, counterText, expectCounter, dateProbe, expectDateProbe,
 * openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { calendarSelector as S } from "Selectors/appBuilder/components/calendar";
import { calendarText as T } from "Texts/appBuilder/components/calendar";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    addCalendarsViaApi,
    calendarProperties,
    clickCalendarToolbar,
    dragSelectSlots,
    startDragSelect,
    endDragSelect,
    calendarBoxes,
} from "Support/utils/appBuilder/components/calendar";
import {
    pinBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'cal';
// dynamic: one timed event on Wed 15 Jun 2022, 13:00–14:30 (outside every dragged range)
const EVENTS = [{ title: fake.firstName.slice(0, 12) || 'Busy', start: '06-15-2022 13:00', end: '06-15-2022 14:30', allDay: false }];

describe('Calendar — events facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Calendar-events-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    const seed = (properties) =>
        addCalendarsViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 30, height: 600 },
                properties,
                events: [counterEvent('onCalendarSlotSelect', 'slotselects')], // calendar.js:38
            },
            counterText('slotselects', 'slotselects', { top: 660, left: 2, width: 10 }),
            dateProbe('probe', W, ['selectedSlots'], { top: 720, height: 80 }),
        ]);

    // ── Calendar-BRW-001 (month view) ───────────────────────────────────────
    it('[Calendar-BRW-001] Dragging across month cells fires On Slot Select once and publishes the selected days', () => {
        seed(calendarProperties({ view: 'month', events: EVENTS }));
        openDateAppInViewer(S.monthView(W));
        cy.get(S.toolbarLabel(W)).should('have.text', T.monthLabel);
        expectCounter('slotselects', 'slotselects', 0);

        // month row 3 = 19–25 Jun 2022; cells 1..3 = Mon 20 → Wed 22 (no events there)
        startDragSelect(S.monthCell(W, 3, 1), S.monthCell(W, 3, 3));
        calendarBoxes(W, (b) => expect(b.selectedCells, 'cells highlighted while dragging').to.eq(3));
        endDragSelect(S.monthCell(W, 3, 3));

        expectCounter('slotselects', 'slotselects', 1);
        expectDateProbe('probe', {
            selectedSlots: {
                slots: ['06-20-2022 00:00', '06-21-2022 00:00', '06-22-2022 00:00'],
                start: '06-20-2022 00:00',
                end: '06-23-2022 00:00', // react-big-calendar month selections end at the next day's midnight
                action: 'select',
            },
        }, 'month selectedSlots');

        // a second drag replaces selectedSlots and fires again (exactly once more)
        dragSelectSlots(S.monthCell(W, 1, 4), S.monthCell(W, 1, 5)); // Thu 9 → Fri 10 (no events there)
        expectCounter('slotselects', 'slotselects', 2);
        expectDateProbe('probe', {
            selectedSlots: {
                slots: ['06-09-2022 00:00', '06-10-2022 00:00'],
                start: '06-09-2022 00:00',
                end: '06-11-2022 00:00',
                action: 'select',
            },
        }, 'second month selectedSlots');
    });

    // ── Calendar-BRW-001 (week view, time slots) ────────────────────────────
    it('[Calendar-BRW-001] Dragging down a week-view day column selects half-hour slots in the dateFormat', () => {
        seed(calendarProperties({ view: 'week', events: EVENTS, startTime: T.bandStart, endTime: T.bandEnd }));
        openDateAppInViewer(S.timeView(W));
        cy.get(S.toolbarLabel(W)).should('have.text', T.weekLabel);

        // column 3 = Wed 15 Jun; the band starts 08:00 → slot 2 = 09:00, slot 5 = 10:30
        startDragSelect(S.timeSlot(W, 3, 2), S.timeSlot(W, 3, 5));
        calendarBoxes(W, (b) => {
            expect(b.slotSelection, 'selection box drawn while dragging').to.not.eq(null);
            const col = b.columns[3].rect;
            expect(b.slotSelection.left, 'selection inside the dragged column (left)').to.be.gte(col.left - 1);
            expect(b.slotSelection.right, 'selection inside the dragged column (right)').to.be.lte(col.right + 1);
        });
        endDragSelect(S.timeSlot(W, 3, 5));

        expectCounter('slotselects', 'slotselects', 1);
        expectDateProbe('probe', {
            selectedSlots: {
                slots: ['06-15-2022 09:00', '06-15-2022 09:30', '06-15-2022 10:00', '06-15-2022 10:30', '06-15-2022 11:00'],
                start: '06-15-2022 09:00',
                end: '06-15-2022 11:00',
                resourceId: null,
                action: 'select',
            },
        }, 'week selectedSlots');

        // day view: a short drag down the single day column selects from the band start
        clickCalendarToolbar(W, T.toolbar.day);
        cy.get(S.toolbarLabel(W)).should('contain.text', 'Jun 15');
        dragSelectSlots(S.timeSlot(W, 0, 0), S.timeSlot(W, 0, 1)); // 08:00 → 08:30
        expectCounter('slotselects', 'slotselects', 2);
        expectDateProbe('probe', {
            selectedSlots: {
                slots: ['06-15-2022 08:00', '06-15-2022 08:30', '06-15-2022 09:00'],
                start: '06-15-2022 08:00',
                end: '06-15-2022 09:00',
                resourceId: null,
                action: 'select',
            },
        }, 'day selectedSlots');
    });

    it('[Calendar-BRW-001] selectedSlots follows a custom dateFormat', () => {
        const fmt = 'YYYY/MM/DD HH:mm'; // dynamic: a non-default format
        seed(calendarProperties({
            view: 'week',
            dateFormat: fmt,
            defaultDate: '2022/06/15 00:00',
            startTime: '2022/06/15 08:00',
            endTime: '2022/06/15 18:00',
        }));
        openDateAppInViewer(S.timeView(W));
        cy.get(S.toolbarLabel(W)).should('have.text', T.weekLabel);
        dragSelectSlots(S.timeSlot(W, 1, 4), S.timeSlot(W, 1, 5)); // Mon 13 Jun, 10:00 → 10:30
        expectCounter('slotselects', 'slotselects', 1);
        expectDateProbe('probe', {
            selectedSlots: {
                slots: ['2022/06/13 10:00', '2022/06/13 10:30', '2022/06/13 11:00'],
                start: '2022/06/13 10:00',
                end: '2022/06/13 11:00',
                resourceId: null,
                action: 'select',
            },
        }, 'custom-format selectedSlots');
    });
});
