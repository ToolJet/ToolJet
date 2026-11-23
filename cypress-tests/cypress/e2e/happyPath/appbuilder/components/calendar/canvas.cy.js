/**
 * SPEC — Calendar — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo) + the geometry TESTING.md browser scenario:
 *   Calendar-BRW-003 — `resources` (calendar.js:18, Calendar.jsx:44,162-164 resourceIdAccessor 'resourceId' /
 *                      resourceTitleAccessor 'title') split the day and week views into one column group per
 *                      resource with each event in its resource's column; `cellSizeInViewsClassifiedByResource`
 *                      (calendar.js:44-51, Calendar.jsx:144) sets the column spacing: compact (theme.scss
 *                      `.calendar-widget.compact` → 50px min) fits the resource week in the widget, spacious keeps
 *                      react-big-calendar's 140px min columns and scrolls horizontally.
 * Dates are fixed explicit values (06-15-2022) and the browser timezone is pinned (CDP).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addCalendarsViaApi, calendarProperties, clickCalendarToolbar, calendarBoxes, readCalendarBoxes,
 * openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { calendarSelector as S } from "Selectors/appBuilder/components/calendar";
import { calendarText as T } from "Texts/appBuilder/components/calendar";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    verifyWidgetCount,
    duplicateWidgetByKeyboard,
    duplicateWidgetFromMenu,
    copyPasteWidget,
    cutWidget,
    pasteWidget,
    nudgeWidget,
    selectAllWidgets,
    multiSelectWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import {
    addCalendarsViaApi,
    calendarProperties,
    clickCalendarToolbar,
    calendarBoxes,
    readCalendarBoxes,
} from "Support/utils/appBuilder/components/calendar";
import { pinBrowserTimezone, openDateAppInViewer } from "Support/utils/appBuilder/components/dateTimeCommon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const PX = 1.5; // sub-pixel / border tolerance

// the horizontal span of `inner` lies inside `outer`
const expectInsideX = (inner, outer, label) => {
    expect(inner.left, `${label} (left)`).to.be.gte(outer.left - PX);
    expect(inner.right, `${label} (right)`).to.be.lte(outer.right + PX);
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Calendar — canvas facet', { testIsolation: false }, () => {
    describe('canvas operations', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Calendar-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 300, 100);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            cy.get(S.calendar(W)).should('be.visible');
            cy.get(S.activeViewButton(W)).should('have.text', T.toolbar.month); // calendar.js:99 defaultView 'month'
            verifyWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 500, 400);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                // shrink: the default Calendar already spans 30 of 43 columns
                cy.resizeWidget(W, before.x + before.w - 200, before.y + before.h - 150);
                verifyWidgetResized(W, before);
            });
        });

        it('nudge (arrow keys) moves the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                nudgeWidget(W, 'ArrowRight', 12);
                verifyWidgetMoved(W, before);
            });
        });

        it('duplicate via keyboard (Cmd/Ctrl+D)', () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 300, 750);
            closeQueryPanel();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'bookings'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('resource columns (running app)', () => {
        // dynamic: event titles; fixed explicit times on Wed 15 Jun 2022, one per resource
        const alpha = fake.firstName.slice(0, 10) || 'Alpha';
        const beta = `${fake.lastName.slice(0, 10) || 'Beta'}2`;
        const EVENTS = [
            { title: alpha, start: '06-15-2022 10:00', end: '06-15-2022 11:00', allDay: false, resourceId: 1 },
            { title: beta, start: '06-15-2022 13:00', end: '06-15-2022 14:30', allDay: false, resourceId: 2 },
        ];
        const band = { startTime: T.bandStart, endTime: T.bandEnd };
        const titles = T.resources.map((r) => r.title);
        const eventRect = (b, t) => b.events.find((e) => e.title === t).rect;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Calendar-canvas-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── Calendar-BRW-003 (day + week columns) ───────────────────────────
        it('[Calendar-BRW-003] Resources split the day and week views into resource columns holding their own events', () => {
            addCalendarsViaApi([
                { name: 'res', layout: { top: 40, left: 2, width: 30, height: 520 }, properties: calendarProperties({ view: 'day', events: EVENTS, resources: T.resources, ...band }) },
                // control: the same events without resources
                { name: 'plain', layout: { top: 600, left: 2, width: 30, height: 520 }, properties: calendarProperties({ view: 'day', events: EVENTS, ...band }) },
            ]);
            openDateAppInViewer(S.resourceTimeView('res'));

            // day view: one column per resource, headed by the resource titles, left to right
            calendarBoxes('res', (b) => {
                expect(b.resourceView, 'resource time view').to.eq(true);
                expect(b.resourceHeaders.map((h) => h.text), 'resource headers').to.deep.eq(titles);
                expect(b.columns, 'one day column per resource').to.have.length(T.resources.length);
                // the time grid's vertical scrollbar (when the band overflows) narrows the columns but not the
                // headers — allow each column its share of the scrollbar width
                const scrollbar = b.timeContent.rect.width - b.timeContent.clientWidth;
                b.resourceHeaders.forEach((h, i) => {
                    expect(h.rect.left, `${h.text} header over its column`).to.be.closeTo(b.columns[i].rect.left, 2 + i * scrollbar / 2);
                    expect(h.rect.width, `${h.text} header as wide as its column`).to.be.closeTo(b.columns[i].rect.width, 2 + scrollbar / 2);
                });
                expect(b.columns[1].rect.left, 'Room B right of Room A').to.be.gte(b.columns[0].rect.right - PX);
                expect(b.columns[0].rect.width, 'columns share the width').to.be.closeTo(b.columns[1].rect.width, 2);
                expectInsideX(eventRect(b, alpha), b.columns[0].rect, 'resource 1 event in the Room A column');
                expectInsideX(eventRect(b, beta), b.columns[1].rect, 'resource 2 event in the Room B column');
                expectInsideX(b.columns[1].rect, b.calendar, 'columns inside the calendar');
            });
            // control: without resources the day is a single column holding both events
            calendarBoxes('plain', (b) => {
                expect(b.resourceView, 'plain time view').to.eq(false);
                expect(b.resourceHeaders, 'no resource headers').to.have.length(0);
                expect(b.columns, 'single day column').to.have.length(1);
                expectInsideX(eventRect(b, alpha), b.columns[0].rect, 'event 1 in the day column');
                expectInsideX(eventRect(b, beta), b.columns[0].rect, 'event 2 in the day column');
            });

            // week view: each resource spans its own seven day columns
            clickCalendarToolbar('res', T.toolbar.week);
            cy.get(S.toolbarLabel('res')).should('have.text', T.weekLabel);
            calendarBoxes('res', (b) => {
                expect(b.resourceHeaders.map((h) => h.text), 'week resource headers').to.deep.eq(titles);
                expect(b.dayHeaders.map((h) => h.text), 'day headers under each resource').to.deep.eq([...T.weekHeaders, ...T.weekHeaders]);
                expect(b.columns, 'resources × days columns').to.have.length(14);
                b.resourceHeaders.forEach((h, i) => {
                    expect(h.rect.left, `${h.text} starts over its first day`).to.be.closeTo(b.dayHeaders[i * 7].rect.left, 2);
                    expect(h.rect.right, `${h.text} ends over its last day`).to.be.closeTo(b.dayHeaders[i * 7 + 6].rect.right, 2);
                });
                // 15 Jun is day 3 of the week: Room A → column 3, Room B → column 7 + 3
                expectInsideX(eventRect(b, alpha), b.columns[3].rect, 'resource 1 event in Room A / 15 Jun');
                expectInsideX(eventRect(b, beta), b.columns[10].rect, 'resource 2 event in Room B / 15 Jun');
            });
        });

        // ── Calendar-BRW-003 (cell size) ────────────────────────────────────
        it('[Calendar-BRW-003] Compact cells fit the resource week in the widget; spacious keeps wide columns and scrolls horizontally', () => {
            addCalendarsViaApi([
                {
                    name: 'compact',
                    layout: { top: 40, left: 2, width: 30, height: 480 },
                    properties: calendarProperties({ view: 'week', events: EVENTS, resources: T.resources, ...band }),
                    styles: { cellSizeInViewsClassifiedByResource: { value: T.cellSize.compact } }, // calendar.js:48
                },
                {
                    name: 'spacious',
                    layout: { top: 560, left: 2, width: 30, height: 480 },
                    properties: calendarProperties({ view: 'week', events: EVENTS, resources: T.resources, ...band }),
                    styles: { cellSizeInViewsClassifiedByResource: { value: T.cellSize.spacious } }, // calendar.js:49
                },
            ]);
            openDateAppInViewer(S.resourceTimeView('compact'));

            calendarBoxes('compact', (b) => {
                expect(b.className, 'compact class').to.contain(T.cellSize.compact);
                expect(b.columns, 'resource week columns').to.have.length(14);
                b.columns.forEach((c, i) => {
                    expect(c.rect.width, `compact column ${i} min width`).to.be.gte(T.compactMinColumn - PX);
                    expect(c.rect.width, `compact column ${i} narrower than spacious`).to.be.lt(T.spaciousMinColumn - PX);
                });
                expect(b.timeContent.scrollWidth, 'compact: no horizontal overflow').to.be.lte(b.timeContent.clientWidth + 1);
                expectInsideX(b.columns[13].rect, b.timeContent.rect, 'last compact column visible');
            });
            calendarBoxes('spacious', (b) => {
                expect(b.className, 'spacious class').to.contain(T.cellSize.spacious);
                expect(b.columns, 'resource week columns').to.have.length(14);
                b.columns.forEach((c, i) => expect(c.rect.width, `spacious column ${i} min width`).to.be.gte(T.spaciousMinColumn - PX));
                expect(b.timeContent.scrollWidth, 'spacious: columns overflow the widget').to.be.gt(b.timeContent.clientWidth + T.spaciousMinColumn);
                expect(b.columns[13].rect.left, 'last spacious column starts beyond the visible area').to.be.gt(b.timeContent.rect.right);
            });

            // the overflow is reachable: a horizontal wheel scrolls the grid and the headers follow it
            readCalendarBoxes('spacious').then((before) => {
                cy.get(S.timeContent('spacious')).realMouseWheel({ deltaX: 600, scrollBehavior: false });
                cy.get(S.timeContent('spacious')).should(($t) => expect($t[0].scrollLeft, 'grid scrolled right').to.be.gt(100));
                cy.get(S.timeContent('spacious')).then(($t) => {
                    const scrolled = $t[0].scrollLeft;
                    calendarBoxes('spacious', (b) => {
                        expect(b.columns[0].rect.left, 'columns moved left by the scroll').to.be.closeTo(before.columns[0].rect.left - scrolled, 2);
                        expect(b.dayHeaders[0].rect.left, 'day headers follow the grid').to.be.closeTo(b.columns[0].rect.left, 2);
                        expect(b.resourceHeaders[1].rect.left, 'resource headers follow the grid').to.be.closeTo(b.columns[7].rect.left, 2);
                    });
                });
            });
        });
    });
});
