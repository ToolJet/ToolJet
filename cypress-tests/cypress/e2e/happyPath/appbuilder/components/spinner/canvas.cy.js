/**
 * SPEC — Spinner — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo), plus TESTING.md browser scenario:
 *   Spinner-BRW-002 — `lg` renders a visibly larger ring than `sm` and the ring stays inside the authored widget box
 * Geometry: Spinner.jsx:14 renders `.spinner-border.spinner-border-<size>`; tabler.scss:6156-6158 sizes `-sm` at
 * 1rem and there is no `-lg` rule, so `lg` falls back to the base `.spinner-border` 1.5rem (tabler.scss:6129-6132).
 * The ring rotates, so geometry is read un-rotated (spinnerBoxes: centre from the rect, side from offsetWidth).
 * Size is a style (spinner.js:33-43); it lives here because the scenario is about geometry, not colour/visuals.
 * Helpers: spinnerBoxes, getSpinnerGeometry, expectSpinnerInsideBox, addSpinnersViaApi, openSpinnerAppInViewer, openEditorSidebar,
 * selectFromSidebarDropdown, getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount,
 * duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget,
 * selectAllWidgets, multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu,
 * undo, redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { spinnerSelector } from "Selectors/appBuilder/components/spinner";
import { spinnerText } from "Texts/appBuilder/components/spinner";
import {
    spinnerBoxes,
    getSpinnerGeometry,
    expectSpinnerInsideBox,
    addSpinnersViaApi,
    openSpinnerAppInViewer,
} from "Support/utils/appBuilder/components/spinner";
import { selectFromSidebarDropdown } from "Support/utils/appBuilder/properties";
import {
    openEditorSidebar,
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

const W = spinnerText.defaultWidgetName;
const T = spinnerText;
const PREFIX = T.widgetPrefix;

const expectSize = (name, size) => {
    const side = size === T.sizeLarge ? T.lgDiameter : T.smDiameter;
    spinnerBoxes(name, (b) => expect(b.ring.className, `${name}: size class`).to.contain(`${T.sizeClassPrefix}${size}`));
    expectSpinnerInsideBox(name, side);
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Spinner — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Spinner-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places one spinning status ring inside the widget box', () => {
            cy.get(spinnerSelector.ring(W)).should('be.visible').and('have.attr', 'role', 'status'); // Spinner.jsx:14
            // default size sm (spinner.js:56)
            expectSize(W, T.sizeSmall);
            verifyWidgetCount(PREFIX, 1);
        });

        // ── Spinner-BRW-002 (inspector Size select, editor canvas) ──────────
        it('[Spinner-BRW-002] Switching Size small → large → small in the inspector resizes the ring and keeps it inside the widget box', () => {
            expectSize(W, T.sizeSmall);
            getSpinnerGeometry(W).then((g) => cy.wrap(g.ring.side).as('smSide'));

            openEditorSidebar(W);
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click(); // Size lives in the Styles tab
            selectFromSidebarDropdown(T.parameterSize, T.sizeLargeLabel);
            expectSize(W, T.sizeLarge);
            cy.get('@smSide').then((smSide) =>
                spinnerBoxes(W, (b) => expect(b.ring.side, 'lg ring larger than sm ring').to.be.gt(smSide))
            );

            // the choice is saved: still large after a reload
            cy.waitForAutoSave();
            cy.reload();
            cy.get(spinnerSelector.ring(W), { timeout: 30000 }).should('be.visible');
            expectSize(W, T.sizeLarge);

            openEditorSidebar(W);
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
            selectFromSidebarDropdown(T.parameterSize, T.sizeSmallLabel);
            expectSize(W, T.sizeSmall);
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
            // the ring keeps its class-driven size and stays inside the larger box
            expectSize(W, T.sizeSmall);
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
            renameWidgetFromMenu(W, 'loader'); // asserts new name internally
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

    // ── Spinner-BRW-002 (saved sizes: editor ↔ viewer, default and large boxes) ──────
    describe('saved sizes', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Spinner-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[Spinner-BRW-002] Saved sm, lg and expression-resolved lg spinners keep distinct ring sizes inside their boxes in the editor and the running app', () => {
            // default authored box = spinner.js:6-9 defaultSize (4 columns × 30px)
            const DEFAULT_BOX = { width: 4, height: 30 };
            addSpinnersViaApi([
                { name: 'smallring', layout: { top: 40, left: 2, ...DEFAULT_BOX } },
                { name: 'largering', layout: { top: 100, left: 2, ...DEFAULT_BOX }, styles: { size: { value: T.sizeLarge } } },
                // expression-resolved size value
                { name: 'exprring', layout: { top: 160, left: 2, ...DEFAULT_BOX }, styles: { size: { value: '{{"l" + "g"}}' } } },
                // a much larger box does not stretch the ring: size is class-driven and centred
                { name: 'tallring', layout: { top: 220, left: 2, width: 12, height: 120 }, styles: { size: { value: T.sizeLarge } } },
            ]);

            const verifyAll = (context) => {
                cy.log(`saved sizes — ${context}`);
                cy.get(spinnerSelector.ring('largering'), { timeout: 30000 }).should('be.visible');
                expectSize('smallring', T.sizeSmall);
                expectSize('largering', T.sizeLarge);
                expectSize('exprring', T.sizeLarge);
                expectSize('tallring', T.sizeLarge);
                // lg is visibly larger than sm at the same authored box
                getSpinnerGeometry('smallring').then((g) => cy.wrap(g.ring).as('sm'));
                cy.get('@sm').then((sm) =>
                    spinnerBoxes('largering', (l) => {
                        expect(l.ring.side, 'lg ring diameter > sm ring diameter').to.be.gt(sm.side);
                        expect(l.ring.side * l.ring.side, 'lg ring area > sm ring area').to.be.gt(sm.side * sm.side);
                    })
                );
                // ring centred in the container (flex centre — theme.scss .spinner-container)
                spinnerBoxes('tallring', (b) => {
                    const ringCx = (b.ring.left + b.ring.right) / 2;
                    const ringCy = (b.ring.top + b.ring.bottom) / 2;
                    expect(ringCx, 'ring centred horizontally').to.be.closeTo((b.container.left + b.container.right) / 2, 1);
                    expect(ringCy, 'ring centred vertically').to.be.closeTo((b.container.top + b.container.bottom) / 2, 1);
                    expect(b.ring.side, 'ring not stretched to the box').to.be.lt(b.container.height);
                });
            };

            cy.openApp('', undefined, undefined, spinnerSelector.ring('largering'));
            verifyAll('editor canvas');
            openSpinnerAppInViewer(spinnerSelector.ring('largering'));
            verifyAll('running app');
        });
    });
});
