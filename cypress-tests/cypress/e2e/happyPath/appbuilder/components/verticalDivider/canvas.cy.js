/**
 * SPEC — Vertical Divider — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo), plus the geometry half of TESTING.md browser scenario:
 *   VerticalDivider-BRW-002 — at the narrow registered width (one grid column, verticalDivider.js:7) the widget
 *                             paints one full-height 1px line centred in its root; resizing keeps it centred and
 *                             full-height. (Colour / dash / shadow halves of BRW-002 live in styles.cy.js.)
 * Geometry: VerticalDivider.jsx:10-21 (flex root width/height 100%, justify-content center, line height 100% /
 * width 1px); RenderWidget.jsx:339-346 (inner box padding BOX_PADDING); grid = canvas width / NO_OF_GRIDS.
 * Helpers: dividerBoxes, expectCenteredLine, getWidgetRect, verifyWidgetMoved, verifyWidgetResized,
 * verifyWidgetCount, duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget,
 * nudgeWidget, selectAllWidgets, multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu,
 * deleteWidgetFromMenu, undo, redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verticalDividerText } from "Texts/appBuilder/components/verticalDivider";
import { dividerBoxes } from "Support/utils/appBuilder/components/divider";
import { expectCenteredLine } from "Support/utils/appBuilder/components/verticalDivider";
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

const W = verticalDividerText.defaultWidgetName;
const T = verticalDividerText;
const PREFIX = T.widgetPrefix;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Vertical Divider — canvas facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-VerticalDivider-canvas-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[VerticalDivider-BRW-002] Drag-and-drop places a one-grid-column widget painting one centred full-height 1px line', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        verifyWidgetCount(PREFIX, 1);
        cy.get('#real-canvas').then(($c) => {
            const column = $c[0].getBoundingClientRect().width / T.gridColumns;
            dividerBoxes(W, (b) => {
                // one grid column wide (verticalDivider.js:7) — the narrow registered width
                expect(b.box.width, 'box is one grid column wide').to.be.closeTo(column * T.defaultGridWidth, 1.5);
                expect(b.box.height, 'box keeps the registered height').to.be.closeTo(T.defaultHeight, 1.5);
                expectCenteredLine(b, 'dropped');
            });
        });
    });

    it('move repositions the widget', () => {
        getWidgetRect(W).as('r0');
        cy.get('@r0').then((before) => {
            cy.moveComponent(W, 650, 450);
            verifyWidgetMoved(W, before);
        });
        dividerBoxes(W, (b) => expectCenteredLine(b, 'moved'));
    });

    it('[VerticalDivider-BRW-002] Resize changes the widget dimensions and the line stays centred and full-height', () => {
        getWidgetRect(W).as('r0');
        cy.get('@r0').then((before) => {
            cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
            verifyWidgetResized(W, before);
            dividerBoxes(W, (b) => {
                expect(b.box.width, 'wider than one column').to.be.gt(before.w + 40);
                expect(b.box.height, 'taller').to.be.gt(before.h + 40);
                expectCenteredLine(b, 'resized');
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
        dividerBoxes(`${PREFIX}2`, (b) => expectCenteredLine(b, 'duplicate'));
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
        dividerBoxes(W, (b) => expectCenteredLine(b, 'pasted'));
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
        renameWidgetFromMenu(W, 'columnbreak'); // asserts new name internally
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
