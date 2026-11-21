/**
 * SPEC — Tabs — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo, plus
 * a child dropped into a tab pane) + the geometry/scroll TESTING.md browser scenarios:
 *   Tabs-BRW-003 — an overflowing header row shows scroll arrows (useTabsNavScrollArrows.js) that scroll it by half a
 *                  row; arrows dim at the ends; a row that fits has none; resizing re-evaluates.
 *   Tabs-BRW-005 — Scroll to top on tab switch (render-only OFF): a scrolled pane is back at the top when its tab is
 *                  re-selected (Tabs.jsx:179-187); without it, the pane keeps its scroll. Per D-03 the toggle is hidden
 *                  in the Inspector while Render only active tab is on (tabs.js:117).
 *   Tabs-BRW-006 — Dynamic height (viewer): the widget grows to the active tab's content, shrinks back to its
 *                  authored height for a short tab, and pushes / pulls the widget below (Tabs.jsx:83, 155-166).
 * Styles (tab width, transition, accent/hover) live in styles.cy.js; keyboard/disabled interaction in userflow.cy.js.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, multiSelectWidgets,
 * verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo, openEditorSidebar,
 * resizeWidgetBy, useMainCanvasForCanvasCommands, selectAllOnMainCanvas, addTabsViaApi, tabsData, openTabsAppInViewer, tabsBoxes, readTabsBoxes, tabsComponentId.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tabsSelector } from "Selectors/appBuilder/components/tabs";
import { tabsText } from "Texts/appBuilder/components/tabs";
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
    multiSelectWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
    openEditorSidebar,
} from "Support/utils/commonWidget";
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";
import {
    addTabsViaApi,
    tabsData,
    openTabsAppInViewer,
    tabsBoxes,
    readTabsBoxes,
    tabsComponentId,
    useMainCanvasForCanvasCommands,
    selectAllOnMainCanvas,
} from "Support/utils/appBuilder/components/tabs";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = tabsText.defaultWidgetName;
const T = tabsText;
const PREFIX = T.widgetPrefix;
const PX = 1;

const openEditor = (waitFor) => {
    cy.openApp('', undefined, undefined, waitFor);
    closeQueryPanel();
};
const rectOf = (selector) =>
    cy.get(selector).first().then(($el) => {
        const r = $el[0].getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
    });

// sub-canvases of the Tabs panes also carry data-cy="real-canvas": point the shared canvas commands at the main one
useMainCanvasForCanvasCommands();

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run); each test re-creates its own app.
describe('Tabs — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Tabs-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 100);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places a Tabs with its three default tabs and the first one active', () => {
            // tabItems t0..t2 "Tab 1..3"; defaultTab '0' is not an id → first visible tab (tabs.js:412-446, Tabs.jsx:121-125)
            tabsBoxes(W, (b) => {
                expect(b.headers.map((h) => h.text)).to.deep.eq(T.defaultTabTitles);
                expect(b.headers.map((h) => h.active)).to.deep.eq([true, false, false]);
                expect(b.panes.map((p) => p.id)).to.deep.eq(T.defaultTabIds);
                expect(b.panes.map((p) => p.wrapper.display)).to.deep.eq(['block', 'none', 'none']);
            });
            verifyWidgetCount(PREFIX, 1);
        });

        it('a widget dropped on the active pane belongs to that tab', () => {
            tabsComponentId(W).then((id) => {
                cy.dragAndDropWidget('Text', 80, 60, 'Text', tabsSelector.paneCanvas(id, T.defaultTabIds[0]));
            });
            cy.get(`${tabsSelector.pane(W, T.defaultTabIds[0])} [data-cy="draggable-widget-text1"]`).should('be.visible');
            // another tab hides it, the original tab shows it again
            cy.get(tabsSelector.headers(W)).eq(1).click();
            cy.get(commonWidgetSelector.draggableWidget('text1')).should('not.be.visible');
            cy.get(tabsSelector.headers(W)).eq(0).click();
            cy.get(commonWidgetSelector.draggableWidget('text1')).should('be.visible');
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 300);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                resizeWidgetBy(W, 160, 90);
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
            cy.dragAndDropWidget(T.displayName, 950, 100);
            closeQueryPanel();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllOnMainCanvas();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'mainnav'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-Tabs-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── Tabs-BRW-003 — nav scroll arrows ─────────────────────────────────
        it('[Tabs-BRW-003] Overflowing headers show scroll arrows that scroll the row and dim at its ends; a row that fits has none', () => {
            const many = Array.from({ length: 12 }, (_, i) => ({ title: `${fake.firstName.slice(0, 5)} ${i + 1}`, id: `o${i}` })); // dynamic: 12 tabs
            const few = [
                { title: 'One', id: 'a' },
                { title: 'Two', id: 'b' },
                { title: 'Three', id: 'c' },
            ];
            addTabsViaApi([
                { name: 'over', layout: { top: 30, left: 2, width: 10, height: 150 }, properties: tabsData(many, 'o0') },
                { name: 'fit', layout: { top: 30, left: 20, width: 20, height: 150 }, properties: tabsData(few, 'a') },
            ]);

            const expectArrows = (name, { left, right }, where) =>
                tabsBoxes(name, (b) => {
                    const tag = `${name} (${where})`;
                    expect(b.arrows, `${tag}: two arrows`).to.have.length(2);
                    const [l, r] = b.arrows;
                    // the row sits between the arrows
                    expect(l.right, `${tag}: left arrow before the row`).to.be.lte(b.nav.left + PX);
                    expect(r.left, `${tag}: right arrow after the row`).to.be.gte(b.nav.right - PX);
                    expect(r.right, `${tag}: right arrow inside the widget`).to.be.lte(b.box.right + PX);
                    expect(b.nav.scrollWidth, `${tag}: headers overflow the row`).to.be.gt(b.nav.clientWidth);
                    expect([l.opacity, l.cursor], `${tag}: left arrow ${left ? 'active' : 'dimmed'}`).to.deep.eq(
                        left ? [1, 'pointer'] : [T.arrowDimOpacity, 'default']
                    );
                    expect([r.opacity, r.cursor], `${tag}: right arrow ${right ? 'active' : 'dimmed'}`).to.deep.eq(
                        right ? [1, 'pointer'] : [T.arrowDimOpacity, 'default']
                    );
                });
            const expectNoArrows = (name, where) =>
                tabsBoxes(name, (b) => {
                    expect(b.arrows, `${name} (${where}): no arrows`).to.have.length(0);
                    expect(b.nav.scrollWidth, `${name} (${where}): row fits`).to.be.lte(b.nav.clientWidth);
                });
            // waits for the smooth scroll to settle and yields the final offset
            const settledScroll = () =>
                readTabsBoxes('over').then((a) => {
                    // eslint-disable-next-line cypress/no-unnecessary-waiting
                    cy.wait(250);
                    return readTabsBoxes('over').then((b) => (b.nav.scrollLeft === a.nav.scrollLeft ? b : settledScroll()));
                });
            const arrow = (i) => cy.get(tabsSelector.arrows('over')).eq(i);

            const run = (where, fitNarrowed) => {
                if (fitNarrowed) {
                    // saved narrow size from the editor: the same headers overflow here too
                    expectArrows('fit', { left: false, right: true }, `${where}, narrowed`);
                } else {
                    expectNoArrows('fit', where);
                }
                expectArrows('over', { left: false, right: true }, `${where}, at start`);
                tabsBoxes('over', (b) => expect(b.nav.scrollLeft, 'starts at the left').to.eq(0));

                // right arrow → scrolls by half the row (useTabsNavScrollArrows.js:27-31)
                arrow(1).realClick({ scrollBehavior: false });
                settledScroll().then((b) => {
                    expect(b.nav.scrollLeft, `${where}: scrolled by half a row`).to.be.closeTo(b.nav.clientWidth / 2, 2);
                });
                expectArrows('over', { left: true, right: true }, `${where}, middle`);

                // keep going to the end: the right arrow dims there
                const toEnd = (n) =>
                    readTabsBoxes('over').then((b) => {
                        if (b.nav.scrollLeft >= b.nav.scrollWidth - b.nav.clientWidth - 1 || n === 0) return;
                        arrow(1).realClick({ scrollBehavior: false });
                        settledScroll().then(() => toEnd(n - 1));
                    });
                toEnd(20);
                settledScroll().then((b) =>
                    expect(b.nav.scrollLeft, `${where}: at the end`).to.be.closeTo(b.nav.scrollWidth - b.nav.clientWidth, 1)
                );
                expectArrows('over', { left: true, right: false }, `${where}, at end`);

                // the last header scrolled into view is a working tab
                cy.get(tabsSelector.headers('over')).last().realClick({ scrollBehavior: false });
                tabsBoxes('over', (b) => {
                    expect(b.headers[b.headers.length - 1].active, `${where}: last tab selectable`).to.eq(true);
                    expect(b.headers[b.headers.length - 1].right, `${where}: last header visible`).to.be.lte(b.nav.right + PX);
                });

                // left arrow scrolls back
                readTabsBoxes('over').then((end) => {
                    arrow(0).realClick({ scrollBehavior: false });
                    settledScroll().then((b) =>
                        expect(b.nav.scrollLeft, `${where}: scrolled back`).to.be.closeTo(end.nav.scrollLeft - b.nav.clientWidth / 2, 2)
                    );
                });
                expectArrows('over', { left: true, right: true }, `${where}, back in the middle`);
            };

            openEditor(tabsSelector.headers('fit'));
            run('editor', false);

            // the arrows follow the row width: narrowing the fitting Tabs makes its headers overflow
            readTabsBoxes('fit').then((b) => {
                resizeWidgetBy('fit', -(b.box.width - 150), 0); // dynamic: about 150px wide
            });
            tabsBoxes('fit', (b) => {
                expect(b.box.width, 'fit narrowed').to.be.lt(200);
                expect(b.arrows, 'narrowed row grows arrows').to.have.length(2);
                expect([b.arrows[1].opacity, b.arrows[1].cursor]).to.deep.eq([1, 'pointer']);
            });

            openTabsAppInViewer(tabsSelector.headers('over'));
            run('viewer', true);
        });

        // ── Tabs-BRW-005 — scroll to top on tab switch ───────────────────────
        it('[Tabs-BRW-005] With Scroll to top on, a scrolled tab is back at the top when re-selected; without it the scroll is kept', () => {
            const TOP_ID = crypto.randomUUID();
            const KEEP_ID = crypto.randomUUID();
            const tabs = [
                { title: fake.firstName.slice(0, 6) || 'first', id: 'a' },
                { title: fake.lastName.slice(0, 6) || 'second', id: 'b' },
            ];
            // each tab 'a' holds content far below the 300px pane, so its canvas scrolls
            const tall = (parentId, key) => [
                { type: 'Text', name: `${key}head`, parent: `${parentId}-a`, layout: { top: 10, left: 2, width: 20, height: 40 } },
                { type: 'Text', name: `${key}foot`, parent: `${parentId}-a`, layout: { top: 700, left: 2, width: 20, height: 40 } }, // dynamic: far below
            ];
            addTabsViaApi([
                {
                    id: TOP_ID,
                    name: 'resettop',
                    layout: { top: 30, left: 2, width: 20, height: 300 },
                    properties: { ...tabsData(tabs, 'a'), scrollToTopOnTabSwitch: { value: '{{true}}' } }, // tabs.js:113-124
                },
                ...tall(TOP_ID, 'r'),
                { id: KEEP_ID, name: 'keepscroll', layout: { top: 30, left: 23, width: 20, height: 300 }, properties: tabsData(tabs, 'a') },
                ...tall(KEEP_ID, 'k'),
            ]);

            const canvasOf = (id) => tabsSelector.paneCanvas(id, 'a');
            const scrollDown = (id, child) => {
                cy.get(commonWidgetSelector.draggableWidget(child)).realMouseWheel({ deltaY: 300, scrollBehavior: false });
                cy.get(canvasOf(id)).should(($c) => expect($c[0].scrollTop, 'pane scrolled down').to.be.gt(100));
                // eslint-disable-next-line cypress/no-unnecessary-waiting
                cy.wait(500); // let the wheel's smooth scroll finish
                return cy.get(canvasOf(id)).then(($c) => $c[0].scrollTop);
            };
            const switchAwayAndBack = (name) => {
                cy.get(tabsSelector.headers(name)).eq(1).realClick({ scrollBehavior: false });
                tabsBoxes(name, (b) => expect(b.headers[1].active).to.eq(true));
                cy.get(tabsSelector.headers(name)).eq(0).realClick({ scrollBehavior: false });
                tabsBoxes(name, (b) => expect(b.headers[0].active).to.eq(true));
            };

            const run = (where) => {
                cy.get('body').realHover({ position: 'topLeft', scrollBehavior: false });
                // the content really is taller than the pane
                cy.get(canvasOf(TOP_ID)).should(($c) => expect($c[0].scrollHeight).to.be.gt($c[0].clientHeight + 300));

                scrollDown(TOP_ID, 'rhead').then((scrolled) => {
                    expect(scrolled, `${where}: resettop scrolled`).to.be.gt(100);
                    switchAwayAndBack('resettop');
                    cy.get(canvasOf(TOP_ID)).should(($c) => expect($c[0].scrollTop, `${where}: resettop back at the top`).to.eq(0));
                    cy.get(commonWidgetSelector.draggableWidget('rhead')).should('be.visible');
                });

                // control: same content and switches, toggle off → the scroll position survives the round trip
                scrollDown(KEEP_ID, 'khead').then((scrolled) => {
                    switchAwayAndBack('keepscroll');
                    // eslint-disable-next-line cypress/no-unnecessary-waiting
                    cy.wait(300); // past the reset frame (Tabs.jsx:181) that must not happen here
                    cy.get(canvasOf(KEEP_ID)).should(($c) =>
                        expect($c[0].scrollTop, `${where}: keepscroll keeps its scroll`).to.be.closeTo(scrolled, 1)
                    );
                });
            };

            openEditor(commonWidgetSelector.draggableWidget('rhead'));
            run('editor');

            // D-03: the toggle is offered only while Render only active tab is off (tabs.js:117)
            openEditorSidebar('keepscroll');
            cy.get(commonWidgetSelector.parameterLabel(T.labelScrollToTop)).should('have.text', T.labelScrollToTop);
            cy.get(commonWidgetSelector.parameterTogglebutton(T.labelRenderOnlyActiveTab)).click();
            cy.get(commonWidgetSelector.parameterLabel(T.labelScrollToTop)).should('not.exist');
            cy.get(commonWidgetSelector.parameterTogglebutton(T.labelRenderOnlyActiveTab)).click();
            cy.get(commonWidgetSelector.parameterLabel(T.labelScrollToTop)).should('have.text', T.labelScrollToTop);
            cy.waitForAutoSave();

            openTabsAppInViewer(commonWidgetSelector.draggableWidget('rhead'));
            run('viewer');
        });

        // ── Tabs-BRW-006 — dynamic height ────────────────────────────────────
        it('[Tabs-BRW-006] Dynamic height fits the Tabs to the active tab content in the viewer and moves the widget below with it', () => {
            const DYN_ID = crypto.randomUUID();
            const FIX_ID = crypto.randomUUID();
            const tabs = [
                { title: 'Tall', id: 't' },
                { title: 'Short', id: 's' },
            ];
            const content = (parentId, key) => [
                { type: 'Text', name: `${key}top`, parent: `${parentId}-t`, layout: { top: 10, left: 2, width: 20, height: 40 } },
                { type: 'Text', name: `${key}bottom`, parent: `${parentId}-t`, layout: { top: 600, left: 2, width: 20, height: 40 } }, // dynamic: tall tab
                { type: 'Text', name: `${key}short`, parent: `${parentId}-s`, layout: { top: 10, left: 2, width: 20, height: 40 } },
            ];
            const AUTHORED = 200; // dynamic: authored height, shorter than the tall tab
            const GAP = 50; // dynamic: authored gap to the widget below
            addTabsViaApi([
                {
                    id: DYN_ID,
                    name: 'dyn',
                    layout: { top: 30, left: 2, width: 20, height: AUTHORED },
                    properties: { ...tabsData(tabs, 't'), dynamicHeight: { value: '{{true}}' } }, // tabs.js:125-133
                },
                ...content(DYN_ID, 'd'),
                { type: 'Text', name: 'belowdyn', layout: { top: 30 + AUTHORED + GAP, left: 2, width: 10, height: 40 } },
                // control: same content, Dynamic height off
                { id: FIX_ID, name: 'fixed', layout: { top: 30, left: 23, width: 20, height: AUTHORED }, properties: tabsData(tabs, 't') },
                ...content(FIX_ID, 'f'),
                { type: 'Text', name: 'belowfixed', layout: { top: 30 + AUTHORED + GAP, left: 23, width: 10, height: 40 } },
            ]);

            const box = (name) => rectOf(tabsSelector.draggableWidget(name));
            const expectFits = (where) => {
                // the widget grew to hold the whole tall tab, with no more than the pane padding to spare
                cy.get(tabsSelector.draggableWidget('dyn')).should(($b) => {
                    const b = $b[0].getBoundingClientRect();
                    const last = $b[0].ownerDocument.querySelector('[data-cy="draggable-widget-dbottom"]').getBoundingClientRect();
                    expect(b.height, `${where}: grew past the authored height`).to.be.gt(AUTHORED + 300);
                    expect(b.bottom, `${where}: content inside the widget`).to.be.gte(last.bottom);
                    expect(b.bottom - last.bottom, `${where}: no extra space below the content`).to.be.lte(40);
                });
                // the last child is really visible (not clipped by the pane)
                cy.get('[data-cy="draggable-widget-dbottom"]').then(($el) => {
                    $el[0].scrollIntoView({ block: 'center' });
                    const r = $el[0].getBoundingClientRect();
                    const hit = $el[0].ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                    expect($el[0].contains(hit), `${where}: tall tab's last child not clipped`).to.eq(true);
                });
                cy.get(tabsSelector.draggableWidget('dyn')).then(($b) => {
                    const b = $b[0].getBoundingClientRect();
                    const below = $b[0].ownerDocument.querySelector('[data-cy="draggable-widget-belowdyn"]').getBoundingClientRect();
                    expect(below.top - b.bottom, `${where}: widget below pushed down, gap kept`).to.be.closeTo(GAP, 3);
                });
            };
            const expectAuthored = (where) =>
                cy.get(tabsSelector.draggableWidget('dyn')).should(($b) => {
                    const b = $b[0].getBoundingClientRect();
                    const below = $b[0].ownerDocument.querySelector('[data-cy="draggable-widget-belowdyn"]').getBoundingClientRect();
                    expect(b.height, `${where}: back to the authored height`).to.be.closeTo(AUTHORED, 2);
                    expect(below.top - b.bottom, `${where}: widget below pulled back up`).to.be.closeTo(GAP, 3);
                });

            openTabsAppInViewer(tabsSelector.headers('dyn'));
            cy.get('[data-cy="draggable-widget-dtop"]', { timeout: 30000 }).should('be.visible');

            // control first: without Dynamic height the Tabs keeps its size and clips the tall tab
            box('fixed').then((f) => {
                expect(f.height, 'fixed keeps its authored height').to.be.closeTo(AUTHORED, 2);
                rectOf('[data-cy="draggable-widget-fbottom"]').then((last) =>
                    expect(last.top, 'fixed: the tall tab content runs past the widget').to.be.gt(f.bottom)
                );
                rectOf(tabsSelector.draggableWidget('belowfixed')).then((below) =>
                    expect(below.top - f.bottom, 'fixed: widget below stays').to.be.closeTo(GAP, 3)
                );
            });

            expectFits('tall tab on load');
            cy.window().then((win) => win.scrollTo(0, 0));
            cy.get(tabsSelector.headers('dyn')).eq(1).realClick({ scrollBehavior: 'center' });
            expectAuthored('short tab');
            cy.get('[data-cy="draggable-widget-dshort"]').should('be.visible');
            cy.get(tabsSelector.headers('dyn')).eq(0).realClick({ scrollBehavior: 'center' });
            expectFits('tall tab again');
        });
    });
});
