/**
 * SPEC — Horizontal Divider — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo). No Divider BRW scenario maps to canvas: the constrained-width layout of Divider-BRW-002
 * (wrap / ellipsis / line min-width / clipping) is driven entirely by style inputs, so it lives in styles.cy.js.
 * Helpers: dividerBoxes, getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dividerText } from "Texts/appBuilder/components/divider";
import { dividerBoxes } from "Support/utils/appBuilder/components/divider";
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

const W = dividerText.defaultWidgetName;
const T = dividerText;
const PREFIX = T.widgetPrefix;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Horizontal Divider — canvas facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Divider-canvas-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('drag-and-drop places the widget as one full-width line with no label', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        // default label '' (divider.js:147) → label-less branch: a single 1px line (Divider.jsx:55-67)
        dividerBoxes(W, (b) => {
            expect(b.label, 'no label').to.eq(null);
            expect(b.lines, 'one line').to.have.length(1);
            expect(b.lines[0].height, 'hairline').to.eq(1);
            expect(b.lines[0].width, 'spans the root').to.be.closeTo(b.root.width, 0.6);
        });
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
        cy.dragAndDropWidget(T.displayName, 650, 300);
        closeQueryPanel();

        multiSelectWidgets([W, `${PREFIX}2`]);
        verifySelectedWidgetCount(2);

        selectAllWidgets();
        verifySelectedWidgetCount(2);
        cy.get('.moveable-area').should('exist');
    });

    it('rename via ⋮ menu', () => {
        renameWidgetFromMenu(W, 'sectionbreak'); // asserts new name internally
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
