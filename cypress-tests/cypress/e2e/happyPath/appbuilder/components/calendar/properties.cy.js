/**
 * SPEC — Calendar — properties facet.
 * FOR AI: TESTING.md browser scenario Calendar-BRW-002 — "Show popover when event is clicked"
 * (showPopOverOnEventClick, calendar.js:31-34, default false calendar.js:116-118):
 *   - on: clicking an event opens CalendarEventPopover (CalendarPopover.jsx) positioned from the clicked event's
 *     getBoundingClientRect (Calendar.jsx:167-180): right of the event, top-aligned; when that would overflow the
 *     main canvas it flips left of the event's right edge, below the event (CalendarPopover.jsx:52-74);
 *     an outside click closes it (CalendarPopover.jsx:28-46);
 *   - off: the click still selects the event (onCalendarEventSelect fires) but no popover opens;
 *   - the popover hosts a sub-canvas (`<componentId>-popover`) that rejects Calendar and Kanban children
 *     (restrictedWidgetsConfig.js Calendar: ['Calendar', 'Kanban']; componentsSlice.js canAddToParent toast) while
 *     an ordinary widget can be dropped into it.
 * Helpers: addCalendarsViaApi, calendarProperties, calendarBoxes, calendarComponentId, counterEvent, counterText,
 * expectCounter, openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { calendarSelector as S } from "Selectors/appBuilder/components/calendar";
import { calendarText as T } from "Texts/appBuilder/components/calendar";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    addCalendarsViaApi,
    calendarProperties,
    calendarBoxes,
    calendarComponentId,
} from "Support/utils/appBuilder/components/calendar";
import { pinBrowserTimezone, openDateAppInViewer } from "Support/utils/appBuilder/components/dateTimeCommon";

const PX = 8; // the popover is offset by the widget box padding + root border (CalendarPopover.jsx:54-55)
const title = () => fake.firstName.slice(0, 10) || 'Standup'; // dynamic: event titles
// dynamic: fixed explicit times — Mon 13 Jun (left of the week) and Sat 18 Jun (right edge of the week)
const monday = (t) => ({ title: t, start: '06-13-2022 10:00', end: '06-13-2022 11:00', allDay: false });
const saturday = (t) => ({ title: t, start: '06-18-2022 10:00', end: '06-18-2022 11:00', allDay: false });

describe('Calendar — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Calendar-properties-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── Calendar-BRW-002 (open / position / close / off) ────────────────────
    it('[Calendar-BRW-002] With the popover on, clicking an event opens the positioned popover; off, it does not', () => {
        addCalendarsViaApi([
            {
                name: 'popon',
                layout: { top: 40, left: 2, width: 30, height: 450 },
                properties: calendarProperties({ view: 'week', events: [monday(title())], popover: true, startTime: T.bandStart, endTime: T.bandEnd }),
                events: [counterEvent('onCalendarEventSelect', 'onselects')], // calendar.js:37
            },
            {
                name: 'popflip',
                // right edge of the canvas (13 + 30 = 43 columns): the popover cannot open to the event's right
                layout: { top: 520, left: 13, width: 30, height: 450 },
                properties: calendarProperties({ view: 'week', events: [saturday(title())], popover: true, startTime: T.bandStart, endTime: T.bandEnd }),
            },
            {
                name: 'popoff',
                layout: { top: 1000, left: 2, width: 30, height: 450 },
                properties: calendarProperties({ view: 'week', events: [monday(title())], popover: false, startTime: T.bandStart, endTime: T.bandEnd }),
                events: [counterEvent('onCalendarEventSelect', 'offselects')],
            },
            counterText('onselects', 'onselects', { top: 1480, left: 2, width: 10 }),
            counterText('offselects', 'offselects', { top: 1480, left: 14, width: 10 }),
        ]);
        openDateAppInViewer(S.event('popon'));
        cy.get(S.popover('popon')).should('have.css', 'display', 'none');

        // on: opens to the right of the event, top-aligned with it
        cy.get(S.event('popon')).click();
        expectCounter('onselects', 'onselects', 1);
        cy.get(S.popover('popon')).should('have.css', 'display', 'block');
        calendarBoxes('popon', (b) => {
            const ev = b.events[0].rect;
            const pop = b.popover.rect;
            expect(pop.width, 'popover width').to.be.closeTo(T.popoverWidth, 1);
            expect(pop.height, 'popover min height').to.be.gte(T.popoverMinHeight - 1);
            expect(pop.left, 'popover starts at the event right edge').to.be.closeTo(ev.right, PX);
            expect(pop.top, 'popover top-aligned with the event').to.be.closeTo(ev.top, PX);
            // the popover body is a droppable sub-canvas filling it
            expect(b.popover.canvas, 'popover sub-canvas').to.not.eq(null);
            expect(b.popover.canvas.width, 'sub-canvas width').to.be.closeTo(T.popoverWidth, 4);
            expect(b.popover.canvas.left, 'sub-canvas inside the popover').to.be.gte(pop.left - 1);
            expect(b.popover.canvas.right, 'sub-canvas inside the popover').to.be.lte(pop.right + 1);
        });
        cy.get(S.popoverCanvas('popon')).should('have.length', 1);

        // an outside click closes it; clicking the event again re-opens it
        cy.get(commonWidgetSelector.draggableWidget('onselects')).click();
        cy.get(S.popover('popon')).should('have.css', 'display', 'none');
        cy.get(S.event('popon')).click();
        cy.get(S.popover('popon')).should('have.css', 'display', 'block');
        expectCounter('onselects', 'onselects', 2);
        cy.get(commonWidgetSelector.draggableWidget('onselects')).click();
        cy.get(S.popover('popon')).should('have.css', 'display', 'none');

        // flip: an event at the right edge of the canvas opens the popover leftwards, under the event
        cy.get(S.event('popflip')).click();
        cy.get(S.popover('popflip')).should('have.css', 'display', 'block');
        cy.get('#real-canvas').then(($c) => {
            const canvasRight = $c[0].getBoundingClientRect().left + $c[0].clientWidth;
            calendarBoxes('popflip', (b) => {
                const ev = b.events[0].rect;
                const pop = b.popover.rect;
                expect(pop.right, 'flipped popover ends at the event right edge').to.be.closeTo(ev.right, PX);
                expect(pop.top, 'flipped popover sits under the event').to.be.closeTo(ev.bottom, PX);
                expect(pop.right, 'flipped popover stays inside the canvas').to.be.lte(canvasRight + 1);
            });
        });
        cy.get(commonWidgetSelector.draggableWidget('onselects')).click();
        cy.get(S.popover('popflip')).should('have.css', 'display', 'none');

        // off: the click selects the event but no popover opens
        cy.get(S.event('popoff')).click();
        expectCounter('offselects', 'offselects', 1);
        cy.get(S.popover('popoff')).should('have.css', 'display', 'none');
        cy.get(S.popoverCanvas('popoff')).should('not.exist');
    });

    // ── Calendar-BRW-002 (restricted children) ──────────────────────────────
    it('[Calendar-BRW-002] Calendar and Kanban cannot be dropped into the event popover; a Button can', () => {
        addCalendarsViaApi([
            {
                name: 'cal',
                layout: { top: 40, left: 2, width: 26, height: 500 },
                properties: calendarProperties({ view: 'week', events: [monday(title())], popover: true, startTime: T.bandStart, endTime: T.bandEnd }),
            },
        ]);
        cy.openApp('', undefined, undefined, S.event('cal'));
        // select the widget first: in the editor the first mousedown selects the Calendar and swallows that click
        cy.get(S.toolbarLabel('cal')).click();
        cy.get(S.event('cal')).click();
        cy.get(S.popover('cal')).should('have.css', 'display', 'block');
        cy.get(S.popoverCanvas('cal')).should('be.visible');

        calendarComponentId('cal').then((id) => {
            const popoverCanvas = `#canvas-${id}-popover`;
            const childCount = () => cy.get(popoverCanvas).find('[data-cy^="draggable-widget-"]');

            // restricted: Calendar
            cy.dragAndDropWidget(T.displayName, 120, 80, T.displayName, popoverCanvas);
            cy.contains(T.restrictedToast(T.displayName)).should('be.visible');
            cy.get(commonWidgetSelector.draggableWidget(T.defaultWidgetName)).should('not.exist');
            cy.get(S.popover('cal')).should('have.css', 'display', 'block');
            childCount().should('have.length', 0);

            // restricted: Kanban
            cy.dragAndDropWidget(T.kanbanDisplayName, 120, 80, T.kanbanDisplayName, popoverCanvas);
            cy.contains(T.restrictedToast(T.kanbanDisplayName)).should('be.visible');
            cy.get(commonWidgetSelector.draggableWidget('kanban1')).should('not.exist');
            childCount().should('have.length', 0);

            // control: an ordinary widget lands inside the popover sub-canvas
            cy.dragAndDropWidget(T.buttonDisplayName, 120, 80, T.buttonDisplayName, popoverCanvas);
            cy.get(`${popoverCanvas} ${commonWidgetSelector.draggableWidget('button1')}`).should('be.visible');
            childCount().should('have.length', 1);
        });
    });
});
