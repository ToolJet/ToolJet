/**
 * SPEC — Cascader — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenario from TESTING.md:
 *   Cascader-BRW-004 — the open drilldown menu paints above neighbouring widgets (it receives the pointer where it
 *                      overlaps them) and is not clipped by an enclosing container
 * The menu is a Radix Popover portalled to <body> with zIndex 1040 (Cascader.tsx:389-417). Real stacking is proved
 * with document.elementFromPoint over the overlap, with a control read of the same points while the menu is closed.
 * Seeded apps go through the components API (addCascadersViaApi).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * counterEvent, counterText, expectCounter, visitDropdownApp, moveMouseAway, addCascadersViaApi, openCascaderMenu,
 * pickCascaderPath, expectCascaderDisplay, cascaderState, readCascaderState, hitTest.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { cascaderSelector as S } from "Selectors/appBuilder/components/cascader";
import { cascaderText as T } from "Texts/appBuilder/components/cascader";
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
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { visitDropdownApp } from "Support/utils/appBuilder/components/dropdownV2";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addCascadersViaApi,
    openCascaderMenu,
    pickCascaderPath,
    expectCascaderDisplay,
    cascaderState,
    readCascaderState,
    hitTest,
} from "Support/utils/appBuilder/components/cascader";

const W = T.defaultWidgetName;
const D = T.defaultTree;

const widgetRect = (doc, name) => {
    const el = doc.querySelector(commonWidgetSelector.draggableWidget(name));
    expect(el, `widget ${name}`).to.exist;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
};
const centre = (r) => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });
// rows of the open menu whose centre lies inside `area` (plain rects)
const rowsOver = (s, area) =>
    s.menu.options.filter((o) => {
        const c = centre(o);
        return c.x > area.left && c.x < area.right && c.y > area.top && c.y < area.bottom;
    });

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Cascader — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Cascader-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with its placeholder and default tree', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            verifyWidgetCount(T.widgetPrefix, 1);
            expectCascaderDisplay(W, T.defaultPlaceholder); // no default leaf. source: cascader.js:418-419
            openCascaderMenu(W);
            cascaderState(W, (s) =>
                expect(s.menu.options.map((o) => o.text), 'default root rows').to.deep.eq([D.asia, D.europe, D.africa])); // source: cascader.js:437,467,477
            pickCascaderPath(['asia', 'japan']);
            expectCascaderDisplay(W, `${D.asia}${T.defaultSeparator}${D.japan}`); // source: cascader.js:420,452
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
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${T.widgetPrefix}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'regionpicker'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            // undo re-selects the restored widget; give the canvas keyboard focus back before the redo chord
            cy.forceClickOnCanvas();
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    // ── Cascader-BRW-004 ─────────────────────────────────────────────────────
    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Cascader-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            moveMouseAway();
            cy.apiDeleteApp();
        });

        // Over a sibling: hit-test every menu row that overlaps the Button below the Cascader — the menu row must get
        // the pointer while open, the Button while closed; a click there selects the row and never reaches the Button.
        const expectMenuAboveSibling = (context) => {
            cy.log(`stacking — ${context}`);
            openCascaderMenu('cs');
            moveMouseAway();
            cascaderState('cs', (s) => expect(s.menu.contentZIndex, 'menu z-index').to.eq(T.menuZIndex)); // source: Cascader.tsx:406
            cy.document().then((doc) => {
                const sibling = widgetRect(doc, 'below');
                readCascaderState('cs').then((s) => {
                    expect(s.menu.inWidgetTree, 'menu is portalled out of the widget box').to.eq(false);
                    const over = rowsOver(s, sibling);
                    expect(over.map((o) => o.value), `${context}: menu rows overlapping the Button`).to.include('africa');
                    over.forEach((o) => {
                        const { x, y } = centre(o);
                        hitTest(x, y).then((h) => {
                            expect(h.inMenu, `${context}: ${o.value} row on top of the Button`).to.eq(true);
                            expect(h.option, `${context}: pointer lands on ${o.value}`).to.eq(o.value);
                        });
                    });
                    cy.realPress('Escape');
                    cascaderState('cs', (s2) => expect(s2.menu, 'menu closed').to.eq(null));
                    // control: with the menu closed the same points belong to the Button
                    over.forEach((o) => {
                        const { x, y } = centre(o);
                        hitTest(x, y).then((h) => expect(h.widget, `${context}: closed menu — ${o.value} point is the Button`).to.eq('below'));
                    });
                });
            });
            // a click on the overlapping row selects it and does not click the Button underneath
            openCascaderMenu('cs');
            pickCascaderPath(['africa']); // source: cascader.js:477
            expectCascaderDisplay('cs', D.africa);
            expectCounter('clickcount', 'clicks', 0);
            cy.get(S.clearButton('cs')).click();
            expectCascaderDisplay('cs', T.defaultPlaceholder);
        };

        it('[Cascader-BRW-004] The open menu paints above the widget below it in the editor and the viewer', () => {
            addCascadersViaApi([
                { name: 'cs', layout: { top: 40, left: 2, width: 12, height: 40 } },
                {
                    type: 'Button',
                    name: 'below',
                    layout: { top: 90, left: 2, width: 12, height: 120 }, // directly under the menu's rows
                    events: [counterEvent('onClick', 'clicks')],
                },
                counterText('clickcount', 'clicks', { top: 40, left: 20 }),
            ]);
            cy.openApp('', undefined, undefined, S.control('cs'));
            expectMenuAboveSibling('editor canvas');
            visitDropdownApp(S.control('cs'));
            expectMenuAboveSibling('viewer');
            // the Button itself is still clickable once the menu is gone (the control above was not a dead zone)
            cy.get(`${commonWidgetSelector.draggableWidget('below')} button`).click();
            expectCounter('clickcount', 'clicks', 1);
        });

        // Inside a Container: the container clips its own children (overflow), but the portalled menu must extend past
        // the container's bottom edge and stay on top of the widget under the container.
        it('[Cascader-BRW-004] A Cascader inside a short Container opens a menu that extends past the Container unclipped', () => {
            const containerId = crypto.randomUUID();
            addCascadersViaApi([
                { type: 'Container', id: containerId, name: 'box', layout: { top: 40, left: 2, width: 16, height: 150 } }, // the Container header takes the top of it
                { name: 'cs', parent: containerId, layout: { top: 0, left: 1, width: 40, height: 40 } },
                { type: 'Text', name: 'under', layout: { top: 200, left: 2, width: 16, height: 200 }, properties: { text: { value: fake.firstName } } },
            ]);
            visitDropdownApp(S.control('cs'));
            // the Cascader itself sits wholly inside the Container
            cy.document().then((doc) => {
                const box = widgetRect(doc, 'box');
                const cs = widgetRect(doc, 'cs');
                expect(cs.bottom, 'Cascader inside the Container').to.be.lte(box.bottom);
            });
            // the Container is a clipping context for its children
            cy.get(commonWidgetSelector.draggableWidget('cs')).then(($cs) => {
                const win = $cs[0].ownerDocument.defaultView;
                const box = $cs[0].ownerDocument.querySelector(commonWidgetSelector.draggableWidget('box'));
                let el = $cs[0].parentElement;
                const clippers = [];
                while (el && el !== box.parentElement) {
                    const cs = win.getComputedStyle(el);
                    if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') clippers.push(el);
                    el = el.parentElement;
                }
                expect(clippers.length, 'an ancestor inside the Container clips overflow').to.be.gt(0);
            });
            openCascaderMenu('cs');
            moveMouseAway();
            cy.document().then((doc) => {
                const box = widgetRect(doc, 'box');
                const under = widgetRect(doc, 'under');
                readCascaderState('cs').then((s) => {
                    expect(s.menu.bottom, 'menu extends past the Container').to.be.gt(box.bottom + 20);
                    const outside = s.menu.options.filter((o) => o.top >= box.bottom);
                    expect(outside.length, 'rows wholly below the Container').to.be.gte(1);
                    outside.forEach((o) => {
                        const { x, y } = centre(o);
                        expect(y, `${o.value} over the widget under the Container`).to.be.within(under.top, under.bottom);
                        hitTest(x, y).then((h) => expect(h.option, `${o.value} row receives the pointer outside the Container`).to.eq(o.value));
                    });
                    cy.realPress('Escape');
                    cascaderState('cs', (s2) => expect(s2.menu, 'menu closed').to.eq(null));
                    outside.forEach((o) => {
                        const { x, y } = centre(o);
                        hitTest(x, y).then((h) => expect(h.widget, `closed menu — ${o.value} point is the Text under the Container`).to.eq('under'));
                    });
                    // the last (outside) row is clickable
                    const last = outside[outside.length - 1];
                    openCascaderMenu('cs');
                    cy.get(S.option(last.value)).click({ scrollBehavior: false });
                });
            });
            cascaderState('cs', (s) => expect(s.menu, 'leaf picked outside the Container closes the menu').to.eq(null));
            expectCascaderDisplay('cs', D.africa);
        });
    });
});
