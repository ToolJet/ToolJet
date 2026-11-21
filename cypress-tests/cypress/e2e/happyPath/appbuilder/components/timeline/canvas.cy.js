/**
 * SPEC — Timeline — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo), plus the reflow / measurement / scrolling half of TESTING.md browser scenario:
 *   Timeline-BRW-001 — in a running app, dynamic height measures and applies the real content height (grows past
 *                      and shrinks back to the authored height, re-measures on data / hideDate change, siblings
 *                      reflow), recovers through ResizeObserver when mounted under a hidden ancestor, and the
 *                      non-dynamic path keeps the authored height and really scrolls (overflow: auto).
 * (Editor-vs-running-app split in contexts.cy.js; box-shadow rendering in styles.cy.js.)
 * Dynamic height only runs in view mode (Timeline.jsx:24), so those apps are seeded through the components API
 * (addTimelinesViaApi) and opened in the viewer. Card geometry: Timeline.jsx:41-51; reflow + hidden-ancestor
 * ResizeObserver: useDynamicHeight.jsx (offsetParent === null → observe, reflow once shown).
 * Helpers: addTimelinesViaApi, timelineDataExpr, timelineBoxes, expectHugsContent, expectFixedHeight,
 * expectStackedBelow, widgetTop, openDividerAppInViewer, getWidgetRect, verifyWidgetMoved, verifyWidgetResized,
 * verifyWidgetCount, duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget,
 * nudgeWidget, selectAllWidgets, multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu,
 * deleteWidgetFromMenu, undo, redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { timelineSelector } from "Selectors/appBuilder/components/timeline";
import { timelineText } from "Texts/appBuilder/components/timeline";
import {
    addTimelinesViaApi,
    timelineDataExpr,
    timelineBoxes,
    expectHugsContent,
    expectFixedHeight,
    expectStackedBelow,
    widgetTop,
} from "Support/utils/appBuilder/components/timeline";
import { openDividerAppInViewer } from "Support/utils/appBuilder/components/divider";
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
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = timelineText.defaultWidgetName;
const T = timelineText;
const PREFIX = T.widgetPrefix;
const ON = { value: '{{true}}' }; // timeline.js:98 toggle value
const GAP = 10; // dynamic: authored gap between a timeline and the widget under it
const AUTHORED = 150; // dynamic: authored timeline height (px)
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 8) || 'Item';

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Timeline — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Timeline-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places a 20-column, 270px Timeline with the three default items', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            verifyWidgetCount(PREFIX, 1);
            cy.get('#real-canvas').then(($c) => {
                const column = $c[0].getBoundingClientRect().width / T.gridColumns;
                timelineBoxes(W, (b) => {
                    expect(b.wrapper.width, 'registered width').to.be.closeTo(column * T.defaultGridWidth, 1.5);
                    expectFixedHeight(b, T.defaultHeight, 'dropped');
                    expect(b.itemCount, 'default items').to.eq(T.defaultItemCount);
                    expect(b.dateCount, 'dates shown by default').to.eq(T.defaultItemCount);
                });
            });
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions and the card follows', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
                verifyWidgetResized(W, before);
                timelineBoxes(W, (b) => {
                    expect(b.card.height, 'card grew with the widget').to.be.gt(before.h);
                    expect(b.card.height, 'card = box - padding').to.be.closeTo(b.box.height - 2 * T.boxPadding, 1.5);
                });
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
            timelineBoxes(`${PREFIX}2`, (b) => expect(b.itemCount, 'duplicate keeps the items').to.eq(T.defaultItemCount));
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
            timelineBoxes(W, (b) => expect(b.itemCount, 'pasted items').to.eq(T.defaultItemCount));
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 300);
            closeQueryPanel();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'roadmap'); // asserts new name internally
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

    describe('running app — dynamic height', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Timeline-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Timeline-BRW-001: real measurement + sibling reflow ──────────────
        // `count` drives the number of items, `hidedate` drives hideDate; `tldyn` has dynamic height, `tlfixed`
        // (same data, dynamic height off — the timeline.js:98 default) is the control that must never grow.
        it('[Timeline-BRW-001] Dynamic height grows the widget to its real content, re-measures on data and hideDate changes, shrinks back to the authored height, and the sibling below keeps its gap', () => {
            const data = { value: timelineDataExpr('Number(components.count.value) || 1', word()) };
            const hideDate = { value: "{{components.hidedate.value === 'yes'}}" };
            addTimelinesViaApi([
                { type: 'TextInput', name: 'count', layout: { top: 10, left: 30, width: 8, height: 40 } },
                { type: 'TextInput', name: 'hidedate', layout: { top: 60, left: 30, width: 8, height: 40 } },
                {
                    name: 'tldyn',
                    layout: { top: 40, left: 2, width: 12, height: AUTHORED },
                    properties: { data, hideDate, dynamicHeight: ON },
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 12, height: 40 },
                    properties: { text: { value: word() } },
                },
                { name: 'tlfixed', layout: { top: 40, left: 15, width: 12, height: AUTHORED }, properties: { data, hideDate } },
            ]);
            openDividerAppInViewer(timelineSelector.card('tldyn'));

            // one short item: the content fits, so the widget stays at the authored height (min-height floor)
            timelineBoxes('tldyn', (b) => {
                expect(b.itemCount, 'one item').to.eq(1);
                expect(b.contentHeight, 'content shorter than the authored height').to.be.lt(AUTHORED - 2 * T.boxPadding);
                expectHugsContent(b, AUTHORED, 'one item');
                expect(b.wrapper.height, 'authored height kept').to.be.closeTo(AUTHORED, 1.5);
            });
            expectStackedBelow('tldyn', 'below', GAP, 'one item');
            widgetTop('below').as('belowTop0');

            // eight items: the widget grows to the real content height and pushes the sibling down
            cy.get(input('count')).type('8');
            timelineBoxes('tldyn', (b) => {
                expect(b.itemCount, 'eight items').to.eq(8);
                expectHugsContent(b, AUTHORED, 'eight items');
                expect(b.wrapper.height, 'grew well past the authored height').to.be.gt(AUTHORED * 2);
            });
            expectStackedBelow('tldyn', 'below', GAP, 'eight items');
            // control: without dynamic height the same content scrolls inside the authored box
            timelineBoxes('tlfixed', (b) => {
                expect(b.itemCount, 'control: eight items').to.eq(8);
                expectFixedHeight(b, AUTHORED, 'control');
                expect(b.scrollHeight, 'control: content overflows').to.be.gt(b.clientHeight + 100);
            });

            // hideDate on: the simple list is shorter (no date column padding) — re-measured with the same height/width
            cy.get(timelineSelector.draggableWidget('tldyn')).then(($b) => $b[0].parentElement.getBoundingClientRect().height).as('withDates');
            cy.get(input('hidedate')).type('yes');
            cy.get('@withDates').then((withDates) => {
                timelineBoxes('tldyn', (b) => {
                    expect(b.listClass, 'simple list').to.contain(T.simpleListClass);
                    expect(b.dateCount, 'dates hidden').to.eq(0);
                    expectHugsContent(b, AUTHORED, 'hideDate');
                    expect(b.wrapper.height, 'shrank without the date column').to.be.lt(withDates - 20);
                });
            });
            expectStackedBelow('tldyn', 'below', GAP, 'hideDate');

            // back to one item with dates: shrinks to the authored height, the sibling returns to its place
            cy.get(input('hidedate')).clear();
            cy.get(input('count')).clear();
            timelineBoxes('tldyn', (b) => {
                expect(b.itemCount, 'one item again').to.eq(1);
                expect(b.dateCount, 'dates back').to.eq(1);
                expectHugsContent(b, AUTHORED, 'shrunk');
                expect(b.wrapper.height, 'back to the authored height').to.be.closeTo(AUTHORED, 1.5);
            });
            expectStackedBelow('tldyn', 'below', GAP, 'shrunk');
            cy.get('@belowTop0').then((top0) =>
                widgetTop('below').should((top) => expect(top, 'sibling back at its authored top').to.be.closeTo(top0, 1.5))
            );
        });

        // ── Timeline-BRW-001: hidden-ancestor mount → ResizeObserver recovery ──
        // The Container's visibility hides its subtree (display:none) so the Timeline mounts with offsetParent null;
        // useDynamicHeight defers the reflow and runs it once the ancestor is shown. `belowin` sits under the
        // Timeline inside the Container: it only moves if the deferred reflow measured the real height.
        it('[Timeline-BRW-001] Mounted under a hidden container, the Timeline measures its real height once shown and pushes its in-container sibling down', () => {
            const containerId = crypto.randomUUID();
            const authoredIn = 100; // dynamic: authored height inside the container
            addTimelinesViaApi([
                { type: 'TextInput', name: 'show', layout: { top: 10, left: 30, width: 8, height: 40 } },
                { type: 'TextInput', name: 'count', layout: { top: 60, left: 30, width: 8, height: 40 } },
                {
                    type: 'Container',
                    id: containerId,
                    name: 'box',
                    layout: { top: 40, left: 2, width: 25, height: 700 },
                    properties: { visibility: { value: "{{components.show.value === 'yes'}}" } },
                },
                {
                    name: 'tlin',
                    parent: containerId,
                    layout: { top: 10, left: 1, width: 30, height: authoredIn },
                    properties: {
                        data: { value: timelineDataExpr('Number(components.count.value) || 2', word()) },
                        dynamicHeight: ON,
                    },
                },
                {
                    type: 'Text',
                    name: 'belowin',
                    parent: containerId,
                    layout: { top: 10 + authoredIn + GAP, left: 1, width: 30, height: 40 },
                    properties: { text: { value: word() } },
                },
            ]);
            openDividerAppInViewer(input('show'));

            // hidden ancestor: nothing is measured yet
            timelineBoxes('tlin', (b) => {
                expect(b.itemCount, 'mounted with two items').to.eq(2);
                expect(b.card.height, 'hidden: no layout box').to.eq(0);
            });
            // the data changes while the ancestor is still hidden
            cy.get(input('count')).type('6');
            timelineBoxes('tlin', (b) => expect(b.itemCount, 'six items while hidden').to.eq(6));

            // show the container: the deferred reflow runs with a real measurement
            cy.get(input('show')).type('yes');
            timelineBoxes('tlin', (b) => {
                expectHugsContent(b, authoredIn, 'shown');
                expect(b.wrapper.height, 'grew past the authored height').to.be.gt(authoredIn * 3);
            });
            expectStackedBelow('tlin', 'belowin', GAP, 'shown');

            // hide again, shrink the data while hidden, show again: measured again
            cy.get(input('show')).clear();
            timelineBoxes('tlin', (b) => expect(b.card.height, 'hidden again').to.eq(0));
            cy.get(input('count')).clear().type('3');
            cy.get(input('show')).type('yes');
            timelineBoxes('tlin', (b) => {
                expect(b.itemCount, 'three items').to.eq(3);
                expectHugsContent(b, authoredIn, 'shown again');
            });
            expectStackedBelow('tlin', 'belowin', GAP, 'shown again');
        });

        // ── Timeline-BRW-001: non-dynamic path really scrolls ────────────────
        it('[Timeline-BRW-001] Without dynamic height the Timeline keeps its authored height and its overflowing items scroll inside the card', () => {
            addTimelinesViaApi([
                {
                    name: 'tlfixed',
                    layout: { top: 40, left: 2, width: 12, height: AUTHORED },
                    properties: { data: { value: timelineDataExpr(8, word()) } }, // dynamic: eight items overflow 150px
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 12, height: 40 },
                    properties: { text: { value: word() } },
                },
            ]);
            openDividerAppInViewer(timelineSelector.card('tlfixed'));
            timelineBoxes('tlfixed', (b) => {
                expectFixedHeight(b, AUTHORED, 'viewer');
                expect(b.scrollTop, 'starts at the top').to.eq(0);
                expect(b.scrollHeight, 'content overflows').to.be.gt(b.clientHeight + 100);
                expect(b.lastItem.top, 'last item below the visible area').to.be.gt(b.card.bottom);
            });
            expectStackedBelow('tlfixed', 'below', GAP, 'fixed');

            // a real wheel scrolls the card to its end; the last item comes into view and the widget does not move
            cy.get(timelineSelector.card('tlfixed')).realMouseWheel({ deltaY: 2000, scrollBehavior: false });
            timelineBoxes('tlfixed', (b) => {
                expect(b.scrollTop, 'scrolled to the end').to.be.closeTo(b.scrollHeight - b.clientHeight, 1.5);
                expect(b.lastItem.bottom, 'last item visible inside the card').to.be.lte(b.card.bottom + 1.5);
                expectFixedHeight(b, AUTHORED, 'after scroll');
            });
            expectStackedBelow('tlfixed', 'below', GAP, 'after scroll');
        });
    });
});
