/**
 * SPEC — Camera — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo).
 * Camera has no geometry scenario in TESTING.md (frontend/ee/test/app-builder/widgets/Camera) — its browser
 * scenarios (Camera-BRW-001/003/004) live in userflow.cy.js.
 * The widget requests the camera as soon as it mounts (Camera.jsx:379-456), so every test installs the in-page fake
 * camera before the drop: no canvas operation can reach a real device or an OS permission prompt, and each mounted
 * copy shows a live preview.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * installFakeCamera, expectLivePreview.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { cameraSelector as SEL } from "Selectors/appBuilder/components/camera";
import { cameraText } from "Texts/appBuilder/components/camera";
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
import { installFakeCamera, expectLivePreview, FAKE_DEVICES } from "Support/utils/appBuilder/components/camera";

const T = cameraText;
const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const PX = 2; // layout tolerance (px)

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Camera — canvas facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Camera-canvas-${Cypress._.uniqueId()}`);
        cy.openApp();
        installFakeCamera();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
        // definition defaults render: image mode (camera.js:145) → Capture photo, live preview from the first camera
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', T.aria.capturePhoto).and('not.be.disabled');
        cy.get(SEL.microphoneSelect(W)).should('not.exist'); // image mode has no mic select (Footer.jsx:73)
        expectLivePreview(W, FAKE_DEVICES.desktopCameras[0]);
        cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
            expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: camera.js:8
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
        renameWidgetFromMenu(W, 'snapshot'); // asserts new name internally
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
