/**
 * SPEC — QR Scanner — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo).
 * QR Scanner has no geometry scenario in TESTING.md (frontend/ee/test/app-builder/widgets/QrScanner) — its browser
 * scenarios are in events.cy.js (BRW-001), userflow.cy.js (BRW-002) and contexts.cy.js (BRW-003).
 * The widget opens the camera the moment it mounts (react-qr-reader componentDidMount), so every test installs the
 * in-page fake camera before the editor loads: no real device or permission prompt is ever touched, and the
 * camera-specific canvas effects are observable — a dropped/duplicated scanner plays its own stream, a deleted
 * one stops its camera track (react-qr-reader componentWillUnmount → stopCamera).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * installFakeCamera, expectFakeCamera, expectScannerVideo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { qrScannerText } from "Texts/appBuilder/components/qrScanner";
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
import { installFakeCamera, expectFakeCamera, expectScannerVideo } from "Support/utils/appBuilder/components/qrScanner";

const T = qrScannerText;
const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const PX = 2; // layout tolerance (px)

const liveTracks = (s) => s.streams.filter((st) => st.tracks.some((t) => t.readyState === 'live')).length;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('QR Scanner — canvas facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-QrScanner-canvas-${Cypress._.uniqueId()}`);
        installFakeCamera();
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('drag-and-drop places the widget with a live camera preview', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
        cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
            expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: qrscanner.js:8
        expectFakeCamera((s) => expect(s.calls, 'camera requested once on mount').to.have.length(1));
        expectScannerVideo(W, (v) => {
            expect(v.fromFakeCamera, 'preview shows the camera stream').to.eq(true);
            expect(v.playing, 'preview is playing').to.eq(true);
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

    it('duplicate via keyboard (Cmd/Ctrl+D) — the copy opens its own camera stream', () => {
        duplicateWidgetByKeyboard(W);
        verifyWidgetCount(PREFIX, 2);
        expectScannerVideo(`${PREFIX}2`, (v) => expect(v.playing, 'duplicate preview is playing').to.eq(true));
        expectFakeCamera((s) => expect(liveTracks(s), 'live camera streams').to.eq(2));
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
        renameWidgetFromMenu(W, 'badgescanner'); // asserts new name internally
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
    });

    it('delete via ⋮ menu stops the camera; undo restores, redo removes', () => {
        expectFakeCamera((s) => expect(liveTracks(s), 'live camera streams').to.eq(1));
        deleteWidgetFromMenu(W);
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        // the deleted scanner released the camera (no live track left)
        expectFakeCamera((s) => expect(liveTracks(s), 'live camera streams after delete').to.eq(0));
        undo();
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        expectScannerVideo(W, (v) => expect(v.playing, 'restored scanner reopened the camera').to.eq(true));
        redo();
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
    });
});
