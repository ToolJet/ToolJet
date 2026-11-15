/**
 * SPEC — File Input — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo).
 * File Input has no geometry scenario in TESTING.md (frontend/ee/test/app-builder/widgets/FileInput) — its only
 * browser scenario (FileInput-BRW-001, the native file picker) lives in userflow.cy.js.
 * The Browse root delegates every click to a hidden <input type="file"> (react-dropzone, FileInput.jsx:211,276), so
 * the canvas pointer work below runs with CDP file-chooser interception on: no native dialog can open mid-test.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * interceptFileChooser.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector as SEL } from "Selectors/appBuilder/components/fileInput";
import { fileInputText } from "Texts/appBuilder/components/fileInput";
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
import { interceptFileChooser } from "Support/utils/appBuilder/components/fileInput";

const T = fileInputText;
const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const PX = 2; // layout tolerance (px)

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('File Input — canvas facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-FileInput-canvas-${Cypress._.uniqueId()}`);
        interceptFileChooser();
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
        // definition defaults render: label, placeholder, Browse. source: fileinput.js:491-492, FileInput.jsx:323
        cy.get(SEL.label(W)).should('contain.text', T.defaultLabel);
        cy.get(SEL.summary(W)).should('have.text', T.defaultPlaceholder);
        cy.get(SEL.button(W)).should('contain.text', T.browseText).and('not.be.disabled');
        cy.get(SEL.inputField(W)).should('have.attr', 'type', 'file');
        cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
            expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: fileinput.js:8
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
        cy.dragAndDropWidget(T.displayName, 900, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();

        multiSelectWidgets([W, `${PREFIX}2`]);
        verifySelectedWidgetCount(2);

        selectAllWidgets();
        verifySelectedWidgetCount(2);
        cy.get('.moveable-area').should('exist');
    });

    it('rename via ⋮ menu', () => {
        renameWidgetFromMenu(W, 'resumeupload'); // asserts new name internally
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
