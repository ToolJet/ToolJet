/**
 * SPEC — Audio Recorder — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo).
 * Audio Recorder has no geometry scenario in TESTING.md (frontend/ee/test/app-builder/widgets/AudioRecorder) — its
 * four browser scenarios (AudioRecorder-BRW-001..004) live in userflow.cy.js.
 * The widget's root is one big record button (AudioRecorder.jsx:304-320) that asks for the microphone on click, so the
 * canvas pointer work below runs with the in-page fake microphone installed: a stray click can never reach a real
 * device or a permission prompt.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * installFakeMic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { audioRecorderSelector as SEL } from "Selectors/appBuilder/components/audioRecorder";
import { audioRecorderText } from "Texts/appBuilder/components/audioRecorder";
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
import { installFakeMic } from "Support/utils/appBuilder/components/mediaCommon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = audioRecorderText;
const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const PX = 2; // layout tolerance (px)

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Audio Recorder — canvas facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-AudioRecorder-canvas-${Cypress._.uniqueId()}`);
        cy.openApp();
        installFakeMic();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
        // definition defaults render: the idle record button + the label. source: audioRecorder.js:160, AudioRecorder.jsx:288
        cy.get(SEL.recorderButton(W)).should('have.attr', 'aria-label', T.aria.idle).and('not.be.disabled');
        cy.get(SEL.label(W)).should('have.text', T.defaultLabel);
        cy.get(SEL.saveButton(W)).should('not.exist');
        cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
            expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: audioRecorder.js:8
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
        closeQueryPanel();

        multiSelectWidgets([W, `${PREFIX}2`]);
        verifySelectedWidgetCount(2);

        selectAllWidgets();
        verifySelectedWidgetCount(2);
        cy.get('.moveable-area').should('exist');
    });

    it('rename via ⋮ menu', () => {
        renameWidgetFromMenu(W, 'voicememo'); // asserts new name internally
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
