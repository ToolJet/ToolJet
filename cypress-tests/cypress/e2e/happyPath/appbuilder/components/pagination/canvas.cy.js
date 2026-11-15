/**
 * SPEC — Pagination — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + TESTING.md browser scenario:
 *   Pagination-BRW-004 — at real widget widths the page window, ellipses and operators fit inside the component
 *                        box without overflow or wrapping; below roughly 170px (the six-item floor, D-07) the clip
 *                        hides the right end of the row rather than letting it spill, and > / >> stay usable.
 *                        Here: a seeded width × page-count × alignment matrix in the editor and the running app, the
 *                        sub-floor clip (D-07 overflow-x: clip, D-09 min-width: 0 — no spill on either side even
 *                        centred) with real clicks on the clipped operators, and a canvas resize that re-fits the row.
 * The window budget comes from the measured items (Pagination.jsx:352-365); which pages the window shows is
 * Engineering's (PGL-001..003) and is not pinned here — only that whatever it shows fits.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * resizeWidgetBy, addPaginationsViaApi, openPaginationAppInViewer, paginationBoxes, getPaginationGeometry,
 * expectRowInsideBox, clickPaginationItem, paginationHitAt, currentPageText, expectCurrentPage, moveMouseAway.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { paginationSelector } from "Selectors/appBuilder/components/pagination";
import { paginationText } from "Texts/appBuilder/components/pagination";
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
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";
import {
    addPaginationsViaApi,
    openPaginationAppInViewer,
    paginationBoxes,
    getPaginationGeometry,
    expectRowInsideBox,
    clickPaginationItem,
    paginationHitAt,
    currentPageText,
    expectCurrentPage,
    moveMouseAway,
} from "Support/utils/appBuilder/components/pagination";

const W = paginationText.defaultWidgetName;
const T = paginationText;
const OP = T.operators;
const PREFIX = T.widgetPrefix;
const ALIGNMENTS = ['left', 'center', 'right']; // pagination.js:62-70 alignButtons values

// BRW-004 matrix: grid widths from the six-item floor (6 cols ≈ 192px) to the full row, × page count and current
// page (1-, 2-, 3- and 4-digit labels; window at the start, middle and end), × alignment
const WIDTHS = [6, 7, 8, 10, 12, 15, 20, 43]; // dynamic: grid columns (≈32px each at 1440px)
const PAGE_SETS = [
    { pages: 20, current: 1 },
    { pages: 20, current: 10 },
    { pages: 150, current: 75 },
    { pages: 1000, current: 500 },
    { pages: 9999, current: 9999 },
]; // dynamic: page counts / current pages
const FIT_CASES = WIDTHS.flatMap((width, w) =>
    PAGE_SETS.map(({ pages, current }, p) => ({
        name: `w${width}p${pages}c${current}`,
        pages,
        item: {
            name: `w${width}p${pages}c${current}`,
            layout: { top: 20 + (w * PAGE_SETS.length + p) * 40, left: 0, width, height: 30 }, // dynamic: stacked slots
            properties: {
                numberOfPages: { value: `{{${pages}}}` },
                defaultPageIndex: { value: `{{${current}}}` },
            },
            styles: { alignment: { value: ALIGNMENTS[(w + p) % ALIGNMENTS.length] } },
        },
    }))
);
// The editor canvas is narrower than the viewer's, so the same column count can land below the floor there:
// a box whose content area (box − 2×2px padding) holds the six-item floor must fit outright; a smaller one may only
// clip (never spill).
const BOX_PADDING = 4; // dynamic: RenderWidget inner padding, 2px each side (measured)
const expectFits = (where) =>
    FIT_CASES.forEach(({ name, pages }) => {
        getPaginationGeometry(name).then((g) =>
            expectRowInsideBox(name, {
                context: `${name} (${where}, ${Math.round(g.box.width)}px)`,
                clipped: g.box.width - BOX_PADDING >= T.sixItemFloor ? false : 'auto',
            })
        );
        // a window that leaves pages out marks the gap with an ellipsis
        paginationBoxes(name, (b) => {
            const shown = b.items.filter((i) => i.kind === 'page').length;
            if (shown < pages) {
                expect(b.items.some((i) => i.kind === 'ellipsis'), `${name} (${where}): ellipsis for hidden pages`).to.eq(true);
            }
        });
    });

describe('Pagination — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Pagination-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places a 5-page row on page 1', () => {
            verifyWidgetCount(PREFIX, 1);
            // pagination.js:115,118 — 5 pages, page 1 highlighted, all four operators
            paginationBoxes(W, (b) => {
                expect(b.items.filter((i) => i.kind === 'page').map((i) => i.label)).to.deep.eq(
                    Array.from({ length: T.defaultNumberOfPages }, (_, i) => String(i + 1))
                );
                expect(b.items.filter((i) => i.active).map((i) => i.label)).to.deep.eq([String(T.defaultPageIndex)]);
                expect(b.items.filter((i) => i.kind === 'operator')).to.have.length(4);
            });
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
            cy.dragAndDropWidget(T.displayName, 650, 300);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, `${PREFIX}renamed`); // asserts new name internally
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

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Pagination-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            moveMouseAway();
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── Pagination-BRW-004 — width × page count × alignment ─────────────
        it('[Pagination-BRW-004] From the six-item floor up, the window, ellipses and operators fit inside the box on one row, in the editor and the running app', () => {
            addPaginationsViaApi(FIT_CASES.map((c) => c.item));
            const first = FIT_CASES[0].name; // top of the stack: in view on load (the rest render below the fold)
            const last = FIT_CASES[FIT_CASES.length - 1].name;

            // running app first, then the editor canvas (narrower: the same columns are fewer pixels)
            openPaginationAppInViewer(paginationSelector.items(first));
            cy.get(paginationSelector.items(last)).should('have.length.gte', 5);
            expectFits('viewer');

            cy.openApp('', undefined, undefined, paginationSelector.items(first));
            cy.get(paginationSelector.items(last)).should('have.length.gte', 5);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
            expectFits('editor');
        });

        // ── Pagination-BRW-004 — below the floor ─────────────────────────────
        it('[Pagination-BRW-004] Below the six-item floor the row is clipped at its right end inside the box — no spill on either side, even centred — and > / >> stay usable', () => {
            const narrow = [
                // 5 cols ≈ 160px: just below the 168px floor (D-07)
                { name: 'n5center', width: 5, alignment: 'center' },
                { name: 'n5right', width: 5, alignment: 'right' },
                // 4 cols ≈ 128px: the D-09 report (~120px, centred)
                { name: 'n4center', width: 4, alignment: 'center' },
            ]; // dynamic: sub-floor widths
            addPaginationsViaApi([
                ...narrow.map(({ name, width, alignment }, i) => ({
                    name,
                    layout: { top: 40 + i * 60, left: 8, width, height: 30 }, // dynamic: empty canvas on both sides
                    properties: { numberOfPages: { value: '{{150}}' }, defaultPageIndex: { value: '{{75}}' } }, // dynamic
                    styles: { alignment: { value: alignment } },
                })),
                ...narrow.map(({ name }, i) => currentPageText(`cur${name}`, name, { top: 40 + i * 60, left: 20 })),
            ]);
            moveMouseAway();
            openPaginationAppInViewer(paginationSelector.items('n4center'));

            narrow.forEach(({ name, width }) => {
                // the row is narrower than the box can hold, clipped by the list — not painted past the box
                expectRowInsideBox(name, { context: `${name}`, clipped: true });
                paginationBoxes(name, (b) => {
                    expect(b.box.width, `${name}: below the floor`).to.be.lt(T.sixItemFloor);
                    // D-09: min-width 0 → the row shrinks to the widget, so alignment cannot push it out on the left
                    expect(b.list.left, `${name}: row starts at the box`).to.be.closeTo(b.root.left, 0.5);
                    const first = b.items.find((i) => i.label === OP.first);
                    expect(first.left, `${name}: << at the left edge`).to.be.closeTo(b.list.left, 0.5);
                });
                // the browser hits nothing of the widget just outside its box, on either side
                getPaginationGeometry(name).then((g) => {
                    const y = g.box.top + g.box.height / 2;
                    [g.box.left - 6, g.box.right + 6].forEach((x) =>
                        paginationHitAt(name, null, { clientX: x, clientY: y }).then((h) =>
                            expect(h.inWidget, `${name}: nothing of the row at x=${Math.round(x)}`).to.eq(false)
                        )
                    );
                    // and the clipped part of the row takes no pointer
                    const lastOp = g.items.find((i) => i.label === OP.last);
                    if (lastOp.left >= g.list.right) {
                        paginationHitAt(name, null, { clientX: lastOp.left + lastOp.width / 2, clientY: y }).then((h) =>
                            expect(h.inWidget, `${name}: the fully clipped >> takes no pointer`).to.eq(false)
                        );
                    }
                });
            });

            // just below the floor both forward operators are still reachable — click their visible part
            ['n5center', 'n5right'].forEach((name) => {
                clickPaginationItem(name, OP.next);
                expectCurrentPage(`cur${name}`, name, 76);
                clickPaginationItem(name, OP.last);
                expectCurrentPage(`cur${name}`, name, 150);
                clickPaginationItem(name, OP.first);
                expectCurrentPage(`cur${name}`, name, 1);
            });
            // at ~128px (D-09) > is still the way forward through its visible part; >> is clipped away (D-09)
            clickPaginationItem('n4center', OP.next);
            expectCurrentPage('curn4center', 'n4center', 76);
            clickPaginationItem('n4center', OP.previous);
            expectCurrentPage('curn4center', 'n4center', 75);
        });

        // ── Pagination-BRW-004 — live resize ─────────────────────────────────
        it('[Pagination-BRW-004] Resizing the widget on the canvas re-fits the row: narrower shows fewer pages, below the floor clips, wider again fits', () => {
            addPaginationsViaApi([
                {
                    name: 'pg',
                    layout: { top: 40, left: 2, width: 20, height: 30 }, // dynamic: wide start
                    // dynamic: 3- and 4-digit labels, wider than the 28px minimum the budget falls back to
                    properties: { numberOfPages: { value: '{{1000}}' }, defaultPageIndex: { value: '{{500}}' } },
                },
            ]);
            cy.openApp('', undefined, undefined, paginationSelector.items('pg'));
            cy.get('[data-cy="query-manager-toggle-button"]').click();
            expectRowInsideBox('pg', { context: 'wide' });

            getPaginationGeometry('pg').then((wide) => {
                const pagesWide = wide.items.filter((i) => i.kind === 'page').length;

                // half the width: still fits, the window holds fewer pages
                resizeWidgetBy('pg', -wide.box.width / 2, 0);
                paginationBoxes('pg', (b) => {
                    expect(b.box.width, 'narrower').to.be.lt(wide.box.width * 0.6);
                    expect(b.items.filter((i) => i.kind === 'page').length, 'fewer pages').to.be.lt(pagesWide);
                });
                expectRowInsideBox('pg', { context: 'half width' });

                // below the floor: clipped inside the box
                getPaginationGeometry('pg').then((half) => {
                    resizeWidgetBy('pg', 140 - half.box.width, 0); // dynamic: ≈140px target
                    paginationBoxes('pg', (b) => expect(b.box.width, 'below the floor').to.be.lt(T.sixItemFloor));
                    expectRowInsideBox('pg', { context: 'below the floor', clipped: true });

                    // and wide again: the row fits the restored width again
                    getPaginationGeometry('pg').then((tiny) => {
                        resizeWidgetBy('pg', wide.box.width - tiny.box.width, 0);
                        paginationBoxes('pg', (b) =>
                            expect(b.box.width, 'back to the wide width').to.be.closeTo(wide.box.width, 1)
                        );
                        expectRowInsideBox('pg', { context: 'wide again (editor)' });
                    });
                });
            });
        });

        it('[Pagination-BRW-004] Narrowing and widening the browser window re-fits the row in the running app', () => {
            addPaginationsViaApi([
                {
                    name: 'pg',
                    layout: { top: 40, left: 2, width: 10, height: 30 }, // pagination.js:6-9 default size
                    properties: { numberOfPages: { value: '{{1000}}' }, defaultPageIndex: { value: '{{500}}' } }, // dynamic
                },
            ]);
            const fullWidth = Cypress.config('viewportWidth');
            openPaginationAppInViewer(paginationSelector.items('pg'));
            expectRowInsideBox('pg', { context: `window ${fullWidth}px` });

            // a narrow window squeezes the widget below the floor: the row clips inside the box
            cy.viewport(700, Cypress.config('viewportHeight')); // dynamic: narrow desktop window
            paginationBoxes('pg', (b) => expect(b.box.width, 'below the floor').to.be.lt(T.sixItemFloor));
            expectRowInsideBox('pg', { context: 'window 700px', clipped: true });

            // the full window again: the row fits again
            cy.viewport(fullWidth, Cypress.config('viewportHeight'));
            paginationBoxes('pg', (b) => expect(b.box.width, 'full width again').to.be.gt(T.sixItemFloor * 1.5));
            expectRowInsideBox('pg', { context: `window ${fullWidth}px again` });
        });
    });
});
