/**
 * SPEC — Multi Select (MultiselectV2) — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry/scroll scenarios from TESTING.md:
 *   MultiselectV2-BRW-001 — a long option list is virtualized, scrolls, and opens near the first selected option
 *   MultiselectV2-BRW-002 — a field near the bottom of the viewport opens its menu upward at full height
 *   MultiselectV2-BRW-004 — the selected-labels summary truncates to the field and re-truncates on resize / in a modal
 *   MultiselectV2-BRW-009 — the select-all row stays pinned at the top of the menu while the list scrolls
 * Menu geometry needs real layout, so those apps are seeded through the components API (addMultiselectsViaApi) and
 * opened in the viewer (the editor's Preview URL).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addMultiselectsViaApi, multiselectOptions, multiselectValues, modalItem, visitMultiselectApp,
 * openMultiselectMenu, closeMultiselectMenu, clickMultiselectOption, multiselectState, getMultiselectState,
 * scrollMultiselectMenuTo, waitForStableRect.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { multiselectV2Selector as S } from "Selectors/appBuilder/components/multiselectV2";
import { multiselectV2Text as T } from "Texts/appBuilder/components/multiselectV2";
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
import { waitForStableRect } from "Support/utils/appBuilder/components/dropdownV2";
import {
    addMultiselectsViaApi,
    multiselectOptions,
    multiselectValues,
    modalItem,
    visitMultiselectApp,
    openMultiselectMenu,
    closeMultiselectMenu,
    clickMultiselectOption,
    multiselectState,
    getMultiselectState,
    scrollMultiselectMenuTo,
    waitForMenuScrollSettled,
} from "Support/utils/appBuilder/components/multiselectV2";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;
// dynamic: distinct lowercase words of at least 5 letters
const words = (n) =>
    Cypress._.uniq(Array.from({ length: n * 6 }, () => fake.firstName.toLowerCase()).filter((w) => w.length >= 5)).slice(0, n);

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Multi Select (MultiselectV2) — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-MultiselectV2-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with its default selection', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            verifyWidgetCount(T.widgetPrefix, 1);
            // values ['1','2'] select option1 + option2 on mount. source: multiselectV2.js:424
            cy.get(S.summary(W)).should('have.text', T.defaultSummary);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
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
            verifyWidgetCount(T.widgetPrefix, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(T.widgetPrefix, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyWidgetCount(T.widgetPrefix, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 300);
            closeQueryPanel();

            multiSelectWidgets([W, `${T.widgetPrefix}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'tagpicker'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        // Known product bug for option-list widgets: the inspector's option editor (Select.jsx) remounts after undo and
        // rewrites the options, which wipes the redo entry — this stays red until that is fixed.
        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            cy.forceClickOnCanvas();
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-MultiselectV2-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        // ── MultiselectV2-BRW-001 ────────────────────────────────────────────
        // CustomMenuList.jsx:30-35 virtualizes rows (@tanstack/react-virtual, estimate 40px, overscan 15) and
        // CustomMenuList.jsx:44-67 scrolls the first selected option (value[0]) to the centre once per open.
        const COUNT = 500; // dynamic: long list size
        const MAX_ROWS = 60; // a window, not the list: visible rows + 2 × overscan 15
        const longLabels = () => Array.from({ length: COUNT }, (_, i) => `${i} ${fake.firstName.slice(0, 8)}`); // dynamic
        const expectWindow = (s, labels, mustInclude) => {
            const idx = s.menu.options.map((o) => o.index);
            expect(idx.length, 'rendered rows').to.be.gt(3).and.lte(MAX_ROWS);
            expect(Math.max(...idx) - Math.min(...idx) + 1, 'rendered rows are contiguous').to.eq(idx.length);
            expect(idx, `row ${mustInclude} rendered`).to.include(mustInclude);
            s.menu.options.forEach((o) => expect(o.text, `row ${o.index} label`).to.eq(labels[o.index]));
            expect(s.menu.body.scrollHeight, 'scroller sized for the whole list').to.be.gt(COUNT * 30);
        };
        const expectRowVisible = (s, index) => {
            const row = s.menu.options.find((o) => o.index === index);
            expect(row, `row ${index}`).to.exist;
            expect(row.top, `row ${index} top in view`).to.be.gte(s.menu.body.top - 1);
            expect(row.bottom, `row ${index} bottom in view`).to.be.lte(s.menu.body.bottom + 1);
        };

        it('[MultiselectV2-BRW-001] A long list renders only a window of rows, scrolls, and opens at the first selected option', () => {
            const FIRST = 420; // dynamic: first selected option, deep in the list
            const SECOND = 450; // dynamic: a second selected option further down
            const labels = longLabels();
            addMultiselectsViaApi([
                {
                    name: 'mslong',
                    layout: { top: 40, left: 2, width: 12, height: 40 },
                    properties: { options: multiselectOptions(labels), values: multiselectValues([labels[FIRST], labels[SECOND]]) },
                },
            ]);
            visitMultiselectApp(S.field('mslong'));
            cy.get(S.summary('mslong')).should('have.text', `${labels[FIRST]}, ${labels[SECOND]}`);

            openMultiselectMenu('mslong');
            multiselectState('mslong', (s) => {
                expectWindow(s, labels, FIRST);
                expect(s.menu.options.map((o) => o.index), 'top of the list not rendered').to.not.include(0);
                expect(s.menu.body.scrollTop, 'scrolled to the first selection').to.be.gt(0);
                expectRowVisible(s, FIRST);
                expect(s.menu.options.find((o) => o.index === FIRST).checked, 'first selected row is ticked').to.eq(true);
            });
            waitForMenuScrollSettled('mslong');

            scrollMultiselectMenuTo('mslong', 'top');
            multiselectState('mslong', (s) => {
                expectWindow(s, labels, 0);
                expectRowVisible(s, 0);
                expect(s.menu.options.map((o) => o.index), 'selected row recycled out of the window').to.not.include(FIRST);
            });

            scrollMultiselectMenuTo('mslong', 'bottom');
            multiselectState('mslong', (s) => {
                expectWindow(s, labels, COUNT - 1);
                expectRowVisible(s, COUNT - 1);
            });
            // a row picked from the scrolled-in window adds that option; the menu stays open
            clickMultiselectOption('mslong', labels[COUNT - 3]);
            cy.get(S.summary('mslong')).should('have.text', `${labels[FIRST]}, ${labels[SECOND]}, ${labels[COUNT - 3]}`);
            closeMultiselectMenu('mslong');

            // a fresh open starts at the first selected option again, not where the list was left
            openMultiselectMenu('mslong');
            multiselectState('mslong', (s) => {
                expectWindow(s, labels, FIRST);
                expectRowVisible(s, FIRST);
            });
        });

        // align:'center' cannot centre the last row; the scroller must still end with that row fully visible.
        // Product bug (kept red): rows measure 36px against the virtualizer's 40px estimate and the open-time
        // scrollToIndex stops ~10px short of the scroller's end, so the last selected row stays ~4px clipped.
        it('[MultiselectV2-BRW-001] Opening with only the last option selected reveals that row completely', () => {
            const labels = longLabels();
            addMultiselectsViaApi([
                {
                    name: 'mslast',
                    layout: { top: 40, left: 2, width: 12, height: 40 },
                    properties: { options: multiselectOptions(labels), values: multiselectValues([labels[COUNT - 1]]) },
                },
            ]);
            visitMultiselectApp(S.field('mslast'));
            cy.get(S.summary('mslast')).should('have.text', labels[COUNT - 1]);
            openMultiselectMenu('mslast');
            multiselectState('mslast', (s) => {
                expectWindow(s, labels, COUNT - 1);
                expectRowVisible(s, COUNT - 1);
            });
        });

        // ── MultiselectV2-BRW-002 ────────────────────────────────────────────
        // MultiselectV2.jsx:643-646 — menuPlacement="auto" with minMenuHeight 300 declared up front: with less than
        // that below the field the menu is placed above it; the scroller keeps its 300px cap (CustomMenuList.jsx:117).
        it('[MultiselectV2-BRW-002] A field near the bottom of the viewport opens its menu upward at full height', () => {
            const labels = Array.from({ length: 20 }, (_, i) => `${i} ${fake.firstName.slice(0, 8)}`); // dynamic: > 300px of rows
            const options = multiselectOptions(labels);
            const none = multiselectValues([]);
            addMultiselectsViaApi([
                { name: 'mstop', layout: { top: 40, left: 2, width: 12, height: 40 }, properties: { options, values: none } },
                // dynamic: the viewer header + canvas offset put this field's bottom a few px above the 960px viewport edge
                { name: 'msbottom', layout: { top: 870, left: 2, width: 12, height: 40 }, properties: { options, values: none } },
            ]);
            visitMultiselectApp(S.field('mstop'));
            waitForStableRect(S.field('msbottom'));

            // control: a field with room below opens downward
            openMultiselectMenu('mstop');
            multiselectState('mstop', (s) => {
                expect(s.menu.top, 'menu below the top field').to.be.gte(s.control.bottom - 1);
            });
            closeMultiselectMenu('mstop');

            getMultiselectState('msbottom').then((s) => {
                // precondition: the bottom field is fully on screen with less than one menu height below it
                expect(s.control.bottom, 'bottom field on screen').to.be.lte(s.viewport.innerHeight);
                expect(s.viewport.innerHeight - s.control.bottom, 'room below the field').to.be.lt(T.minMenuHeight);
            });
            openWithoutScroll('msbottom');
            multiselectState('msbottom', (s) => {
                expect(s.menu.bottom, 'menu sits above the field').to.be.lte(s.control.top + 1);
                expect(s.menu.top, 'menu top on screen').to.be.gte(0);
                expect(s.menu.body.clientHeight, 'scroller keeps its full height').to.be.closeTo(T.menuBodyMaxHeight, 1);
                expect(s.menu.bottom, 'menu not pushed off the bottom').to.be.lte(s.viewport.innerHeight);
            });
            // the upward menu is usable: a row in it selects
            clickMultiselectOption('msbottom', labels[2]);
            cy.get(S.summary('msbottom')).should('have.text', labels[2]);
        });

        // ── MultiselectV2-BRW-004 ────────────────────────────────────────────
        // CustomValueContainer.jsx:18-40,67 — the summary's max-width is the observed width of its container span,
        // re-read by a ResizeObserver; text-truncate gives the ellipsis.
        const longWords = () => words(8).map((w) => `${w}${w}`.slice(0, 14)); // dynamic: 8 labels of ~10-14 chars
        const expectTruncatedInField = (s, label) => {
            expect(s.summary.textOverflow, `${label}: ellipsis`).to.eq('ellipsis');
            expect(s.summary.scrollWidth, `${label}: text is longer than the field`).to.be.gt(s.summary.clientWidth + 20);
            expect(s.summary.maxWidth, `${label}: max-width follows its container`).to.be.closeTo(s.summary.containerWidth, 1);
            expect(s.summary.right, `${label}: summary ends before the indicators`).to.be.lte(s.indicators.left + 0.5);
            expect(s.summary.left, `${label}: summary starts inside the control`).to.be.gte(s.control.left);
        };

        it('[MultiselectV2-BRW-004] The selected-labels summary truncates to the field and re-truncates when the field resizes', () => {
            const labels = longWords();
            addMultiselectsViaApi([
                {
                    name: 'mssum',
                    layout: { top: 40, left: 2, width: 12, height: 40 },
                    properties: {
                        options: multiselectOptions(labels),
                        values: multiselectValues(labels),
                        showAllSelectedLabel: { value: '{{false}}' }, // labels, not "All items are selected." (multiselectV2.js:431)
                    },
                },
                // control: one short selection fits and is not truncated
                {
                    name: 'msshort',
                    layout: { top: 120, left: 2, width: 12, height: 40 },
                    properties: { options: multiselectOptions(labels), values: multiselectValues([labels[0]]) },
                },
            ]);
            visitMultiselectApp(S.field('mssum'));
            cy.get(S.summary('mssum')).should('have.text', labels.join(', '));
            multiselectState('msshort', (s) => {
                expect(s.summary.text).to.eq(labels[0]);
                expect(s.summary.scrollWidth, 'short summary not truncated').to.be.lte(s.summary.clientWidth);
            });

            let wide;
            multiselectState('mssum', (s) => {
                expectTruncatedInField(s, 'wide');
                wide = s;
            });

            // narrower viewport → the grid columns shrink → the field narrows
            cy.viewport(900, Cypress.config('viewportHeight')); // dynamic: narrower than the 1440 default
            multiselectState('mssum', (s) => {
                expect(s.control.width, 'field narrowed').to.be.lt(wide.control.width - 60);
                expectTruncatedInField(s, 'narrow');
                expect(s.summary.maxWidth, 'max-width shrank with the field').to.be.lt(wide.summary.maxWidth - 60);
            });

            // and back: the truncation widens again
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            multiselectState('mssum', (s) => {
                expect(s.control.width, 'field widened').to.be.closeTo(wide.control.width, 2);
                expectTruncatedInField(s, 'wide again');
                expect(s.summary.maxWidth, 'max-width grew back').to.be.closeTo(wide.summary.maxWidth, 2);
            });
        });

        it('[MultiselectV2-BRW-004] Opened inside a modal, the summary is truncated to the modal field', () => {
            const labels = longWords();
            const MODAL = crypto.randomUUID();
            addMultiselectsViaApi([
                modalItem({ id: MODAL, name: 'mdl' }),
                {
                    name: 'msmodal',
                    parent: MODAL,
                    layout: { top: 10, left: 2, width: 15, height: 40 },
                    properties: {
                        options: multiselectOptions(labels),
                        values: multiselectValues(labels),
                        showAllSelectedLabel: { value: '{{false}}' },
                    },
                },
            ]);
            visitMultiselectApp('[data-cy="mdl-launch-button"]');
            cy.get('[data-cy="mdl-launch-button"]').click();
            cy.get(S.field('msmodal')).should('be.visible');
            cy.get(S.summary('msmodal')).should('have.text', labels.join(', '));
            multiselectState('msmodal', (s) => {
                expect(s.control.width, 'field laid out in the modal').to.be.gt(100);
                expectTruncatedInField(s, 'in modal');
            });
        });

        // ── MultiselectV2-BRW-009 ────────────────────────────────────────────
        // CustomMenuList.jsx:129-151 — the select-all row (value multiselect-custom-menulist-select-all) is
        // position:sticky at the top of the virtualized list; showAllOption: multiselectV2.js:115-121.
        const selectAllRow = (s) => s.menu.options.find((o) => o.text === T.selectAllLabel);
        const expectSelectAllPinned = (s, label) => {
            const row = selectAllRow(s);
            expect(row, `${label}: select-all row rendered`).to.exist;
            expect(row.top, `${label}: select-all row at the top of the scroller`).to.be.closeTo(s.menu.body.top, 6);
            expect(s.menu.body.scrollTop, `${label}: list scrolled`).to.be.gt(0);
        };
        const pinnedApp = () => {
            const labels = Array.from({ length: 300 }, (_, i) => `${i} ${fake.firstName.slice(0, 8)}`); // dynamic: long list
            addMultiselectsViaApi([
                {
                    name: 'msall',
                    layout: { top: 40, left: 2, width: 12, height: 40 },
                    properties: {
                        options: multiselectOptions(labels),
                        values: multiselectValues([]),
                        showAllOption: { value: '{{true}}' }, // source: multiselectV2.js:115
                    },
                },
            ]);
            visitMultiselectApp(S.field('msall'));
            openMultiselectMenu('msall');
            multiselectState('msall', (s) => expect(selectAllRow(s), 'select-all row first').to.include({ index: 0 }));
            waitForMenuScrollSettled('msall');
            return labels;
        };

        it('[MultiselectV2-BRW-009] The select-all row stays pinned while the list scrolls a few rows, and still selects all', () => {
            pinnedApp();
            scrollMultiselectMenuTo('msall', 200); // dynamic: ~5 rows down
            multiselectState('msall', (s) => {
                expectSelectAllPinned(s, 'scrolled 200px');
                expect(selectAllRow(s).onTop, 'select-all row is the element on top at its position').to.eq(true);
            });
            getMultiselectState('msall').then((s) => {
                const row = selectAllRow(s);
                cy.get(`${S.menu(s.id)} ${S.menuBody}`).realClick({ x: 20, y: (row.top + row.bottom) / 2 - s.menu.body.top, scrollBehavior: false });
            });
            cy.get(S.summary('msall')).should('have.text', T.allSelectedSummary);
        });

        // Product bug (kept red): the sticky row is a virtualized item (index 0) — once the list scrolls past the 15-row
        // overscan the virtualizer stops rendering it, so select-all disappears instead of staying pinned.
        it('[MultiselectV2-BRW-009] The select-all row stays pinned when the list is scrolled deep into a long list', () => {
            pinnedApp();
            scrollMultiselectMenuTo('msall', 2000); // dynamic: ~55 rows down, beyond the 15-row overscan
            multiselectState('msall', (s) => {
                expect(s.menu.options.map((o) => o.index), 'deep rows rendered').to.include(60);
                expectSelectAllPinned(s, 'scrolled 2000px');
            });
            scrollMultiselectMenuTo('msall', 'bottom');
            multiselectState('msall', (s) => expectSelectAllPinned(s, 'scrolled to the bottom'));
        });
    });
});

// opens a field without scrolling it (the click would otherwise centre it and leave room below)
function openWithoutScroll(name) {
    cy.get(S.field(name)).click({ scrollBehavior: false });
    getMultiselectState(name).then((s) => cy.get(S.menu(s.id)).should('be.visible'));
}
