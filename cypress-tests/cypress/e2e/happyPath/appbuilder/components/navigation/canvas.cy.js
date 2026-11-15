/**
 * SPEC — Navigation — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + TESTING.md browser scenario:
 *   Navigation-BRW-001 — horizontal overflow bucketing places items into the visible row vs the "More" popover
 *                        based on real measured width; here: an editor resize that narrows and widens the widget,
 *                        and saved widgets with short / long / stretched (equal width) / group items in the running
 *                        app, re-bucketed as the viewport narrows.
 * Bucketing: hooks/useCalculateOverflow.js:16-86 — avail = clientWidth − 2·padding, each item's width read from the
 * hidden measurement copy (Navigation.jsx:802-830), 6px gaps, 80px+gap reserved for "More" once anything overflows;
 * recomputed by a ResizeObserver on the root (useCalculateOverflow.js:88-114).
 * Caption tooltip in styles.cy.js; device / exposed-value contexts in contexts.cy.js; Inspector drag in userflow.cy.js.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * resizeWidgetBy, addNavigationsViaApi, openNavigationAppInViewer, readNavRow, navRowBoxes, expectOverflowBucketing,
 * expectMoreMenu, growingLabels.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { navigationSelector } from "Selectors/appBuilder/components/navigation";
import { navigationText } from "Texts/appBuilder/components/navigation";
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
    addNavigationsViaApi,
    openNavigationAppInViewer,
    readNavRow,
    navRowBoxes,
    expectOverflowBucketing,
    expectMoreMenu,
    expectTopLevelRow,
    growingLabels,
} from "Support/utils/appBuilder/components/navigation";

const T = navigationText;
const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const AUTO = { navItemSize: { value: T.navItemSizeAuto } };
const ids = (n, p = 'i') => Array.from({ length: n }, (_, i) => `${p}${i + 1}`); // dynamic: item ids

// a horizontal Navigation whose labels grow item by item (each label a prefix of the next → each item measured
// at least as wide as the one before, so what overflows is always a trailing run)
const growingMenu = (labels, idList) => labels.map((label, i) => T.menuItem(idList[i], label));

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run); each test re-creates its own app.
describe('Navigation — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Navigation-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the default menu (two items and a group) in one horizontal row', () => {
            cy.get(navigationSelector.root(W)).should('be.visible');
            // definition defaults: item1, item2, group1[item3, item4], horizontal (navigation.js:241-290, :307)
            expectTopLevelRow(W, T.defaultTopLevelIds, 'after drop');
            expectOverflowBucketing(W, T.defaultTopLevelIds, { context: 'dropped' });
            verifyWidgetCount(PREFIX, 1);
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
            cy.dragAndDropWidget(T.displayName, 650, 350);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'mainmenu'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-Navigation-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── Navigation-BRW-001 — editor resize ───────────────────────────────
        it('[Navigation-BRW-001] Narrowing the widget in the editor moves trailing items into "More" by their real measured width, and widening brings them back', () => {
            const order = ids(6);
            addNavigationsViaApi([
                {
                    name: 'navflow',
                    layout: { top: 40, left: 1, width: 30, height: 50 }, // dynamic: wide enough for all six
                    styles: AUTO,
                    properties: { menuItems: { value: growingMenu(growingLabels(fake.firstName, 6), order) } },
                },
            ]);
            cy.openApp('', undefined, undefined, navigationSelector.root('navflow'));
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            // wide: everything fits, no "More"
            expectOverflowBucketing('navflow', order, { context: 'wide' }).then((wide) => {
                expect(wide.overflow, 'wide: nothing overflows').to.deep.eq([]);
                expectMoreMenu('navflow', []);

                readNavRow('navflow').then((r0) => {
                    // narrower: about half the width — the trailing (widest) items move into "More"
                    resizeWidgetBy('navflow', -r0.root.width * 0.45, 0); // dynamic: ~55% of the width
                    expectOverflowBucketing('navflow', order, { context: 'half width' }).then((half) => {
                        expect(half.avail, 'the row really got narrower').to.be.lt(wide.avail * 0.7);
                        expect(half.overflow.length, 'half width: something overflows').to.be.gt(0);
                        expectMoreMenu('navflow', half.overflow);

                        // narrower still: more items move into "More", never fewer
                        readNavRow('navflow').then((r1) => {
                            resizeWidgetBy('navflow', -r1.root.width * 0.45, 0); // dynamic: ~30% of the original
                            expectOverflowBucketing('navflow', order, { context: 'narrow' }).then((narrow) => {
                                expect(narrow.avail, 'narrower again').to.be.lt(half.avail);
                                expect(narrow.overflow.length, 'narrow: more items overflow').to.be.gt(half.overflow.length);
                                expectMoreMenu('navflow', narrow.overflow);

                                // and back to the original width: the row is whole again (no stale overflow)
                                readNavRow('navflow').then((r2) => {
                                    resizeWidgetBy('navflow', r0.root.width - r2.root.width, 0);
                                    expectOverflowBucketing('navflow', order, { context: 'wide again' }).then((again) =>
                                        expect(again.overflow, 'wide again: nothing overflows').to.deep.eq([])
                                    );
                                    expectMoreMenu('navflow', []);
                                });
                            });
                        });
                    });
                });
            });

            // the saved (narrowed, then restored) width buckets the same way in the running app
            openNavigationAppInViewer(navigationSelector.root('navflow'));
            expectOverflowBucketing('navflow', order, { context: 'viewer' }).then((v) =>
                expect(v.overflow, 'viewer: nothing overflows').to.deep.eq([])
            );
        });

        // ── Navigation-BRW-001 — measured widths, running app ────────────────
        it('[Navigation-BRW-001] In the running app the overflow follows each item\'s real measured width — longer labels overflow sooner, stretched items bucket like auto ones, groups overflow too — and re-buckets as the viewport narrows', () => {
            const seed = fake.firstName;
            const order = ids(6);
            const shortLabels = growingLabels(seed, 6, { start: 3, step: 1 });
            const longLabels = growingLabels(`${seed}${fake.lastName}`, 6, { start: 10, step: 2 });
            const groupOrder = [...ids(4), 'grp'];
            const navs = [
                // same width for all four; stacked rows
                { name: 'shortlabels', menu: growingMenu(shortLabels, order), styles: AUTO, order },
                { name: 'longlabels', menu: growingMenu(longLabels, order), styles: AUTO, order },
                // equal width stretches the rendered buttons; bucketing still uses the measured (natural) widths
                { name: 'stretched', menu: growingMenu(shortLabels, order), styles: {}, order },
                {
                    name: 'withgroup',
                    menu: [
                        ...growingMenu(growingLabels(seed, 4, { start: 3, step: 1 }), ids(4)),
                        T.menuGroup('grp', growingLabels(seed, 6, { start: 3, step: 2 })[5], [
                            T.menuItem('grpchild', fake.firstName.slice(0, 8) || 'child'),
                        ]),
                    ],
                    styles: AUTO,
                    order: groupOrder,
                },
            ];
            addNavigationsViaApi(
                navs.map((n, i) => ({
                    name: n.name,
                    layout: { top: 40 + i * 70, left: 1, width: 14, height: 50 }, // dynamic: stacked, same width
                    styles: n.styles,
                    properties: { menuItems: { value: n.menu } },
                }))
            );

            const bucketAll = (context) => {
                const out = {};
                navs.forEach((n) =>
                    expectOverflowBucketing(n.name, n.order, { context }).then((res) => {
                        out[n.name] = res;
                    })
                );
                return cy.then(() => out);
            };

            openNavigationAppInViewer(navigationSelector.root('withgroup'));
            bucketAll('viewer 1440px').then((wide) => {
                // the test must exercise overflow: at this width the long labels do not all fit
                expect(wide.longlabels.overflow.length, 'long labels overflow').to.be.gt(0);
                // same width, longer measured labels → fewer items in the row
                expect(wide.longlabels.visible.length, 'long labels fit fewer items than short ones').to.be.lt(
                    wide.shortlabels.visible.length
                );
                // the stretched row is bucketed from the same measured widths as the auto one
                expect(wide.stretched.visible, 'equal width buckets like auto').to.deep.eq(wide.shortlabels.visible);
                expectMoreMenu('longlabels', wide.longlabels.overflow);

                // a narrower viewport narrows the canvas: every row re-buckets, none keeps a stale wider split
                cy.viewport(1000, 900); // dynamic: narrower desktop viewport
                // wait for the canvas to re-lay out at the new width before reading the split
                navRowBoxes('shortlabels', (b) => expect(b.avail, 'canvas narrowed').to.be.lt(wide.shortlabels.avail - 50));
                bucketAll('viewer 1000px').then((narrow) => {
                    navs.forEach((n) => {
                        expect(narrow[n.name].avail, `${n.name}: narrower row`).to.be.lt(wide[n.name].avail);
                        expect(narrow[n.name].visible.length, `${n.name}: never more items in a narrower row`).to.be.lte(
                            wide[n.name].visible.length
                        );
                    });
                    expect(narrow.withgroup.overflow, 'the group overflows into More').to.include('grp');
                    expectMoreMenu('withgroup', narrow.withgroup.overflow);
                    expectMoreMenu('stretched', narrow.stretched.overflow);

                    // and back: the original split returns
                    cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
                    navRowBoxes('shortlabels', (b) => expect(b.avail, 'canvas widened').to.be.closeTo(wide.shortlabels.avail, 1));
                    bucketAll('viewer back to 1440px').then((again) =>
                        navs.forEach((n) =>
                            expect(again[n.name].visible, `${n.name}: same split as before`).to.deep.eq(wide[n.name].visible)
                        )
                    );
                });
            });
        });
    });
});
