/**
 * SPEC — QR Scanner — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   QrScanner-BRW-003 — the scanner only functions over localhost/https (browser camera APIs), and on iOS the
 *                       camera is restricted to Safari
 * Secure-context half: on this localhost origin the page is a secure context and the widget gets a live camera;
 * on an insecure origin browsers do not expose navigator.mediaDevices at all — reproduced in-page with the fake
 * camera's `noMediaDevices` (a second, plain-http LAN origin cannot be visited from this Cypress session).
 * The iOS-Safari half needs a real iOS device and is NOT automatable here.
 * The camera is the in-page fake from components/qrScanner.js (canvas.captureStream() painting a QR fixture).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, addIconsViaApi, installFakeCamera, loadQrFixture, showQrToCamera, expectScannerVideo,
 * expectFakeCamera, qrScannerItem, openQrAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { qrScannerSelector as SEL } from "Selectors/appBuilder/components/qrScanner";
import { qrScannerText } from "Texts/appBuilder/components/qrScanner";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { addIconsViaApi } from "Support/utils/appBuilder/components/icon";
import {
    installFakeCamera,
    loadQrFixture,
    showQrToCamera,
    expectScannerVideo,
    expectFakeCamera,
    qrScannerItem,
    openQrAppInViewer,
} from "Support/utils/appBuilder/components/qrScanner";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = qrScannerText;
const W = T.defaultWidgetName;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('QR Scanner — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-QrScanner-contexts-${Cypress._.uniqueId()}`);
            loadQrFixture('alpha').as('qrAlpha');
            installFakeCamera(); // the scanner asks for the camera as soon as it mounts on the canvas
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — Show on desktop / Show on mobile gate the widget on the matching editor layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (qrscanner.js:41-42): shown on both the desktop and the mobile canvas
            expectScannerVideo(W, (v) => expect(v.playing, 'desktop canvas scanner live').to.eq(true));
            switchLayout('mobile');
            cy.get(widget).should('be.visible');
            expectScannerVideo(W, (v) => expect(v.playing, 'mobile canvas scanner live').to.eq(true));
            switchLayout('desktop');

            // mobile off → still on desktop, gone from mobile; desktop off → gone from desktop too
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelTrue);
            cy.waitForAutoSave();
            cy.get(widget).should('be.visible');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — lastDetectedValue is "" on the canvas, and a scan in the editor updates it', () => {
            expectScannerVideo(W, (v) => expect(v.playing, 'scanner live in the editor').to.eq(true));
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: T.exposedLastDetectedValue, type: 'String', value: '""' }, // qrscanner.js:37
            ], verifyNodeData);

            // no currentMode branch (QrScanner.jsx): the editor canvas scans like the viewer
            cy.get('@qrAlpha').then((uri) => showQrToCamera(uri));
            cy.get(`[data-cy="inspector-${T.exposedLastDetectedValue.toLowerCase()}-value"]`)
                .should('have.text', `"${T.qr.alpha.payload}"`);
        });
    });

    describe('browser environment', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-QrScanner-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── QrScanner-BRW-003 (localhost = secure context) ───────────────────
        it('[QrScanner-BRW-003] On localhost (a secure context) the scanner gets a live camera and scans', () => {
            loadQrFixture('alpha').then((uri) => installFakeCamera({ qr: uri }));
            addIconsViaApi([
                qrScannerItem(W),
                {
                    type: 'Text',
                    name: 'valuetext',
                    layout: { top: 360, left: 2, width: 20, height: 40 },
                    properties: { text: { value: `{{"value:" + components.${W}.lastDetectedValue}}` } },
                },
            ]);
            openQrAppInViewer(SEL.video(W));
            cy.location('hostname').should('be.oneOf', ['localhost', '127.0.0.1']);
            cy.window().its('isSecureContext').should('eq', true);
            cy.window().its('navigator.mediaDevices').should('exist');
            expectFakeCamera((s) => expect(s.calls, 'camera requested on mount').to.have.length(1));
            expectScannerVideo(W, (v) => expect(v.playing, 'live preview').to.eq(true));
            cy.get(commonWidgetSelector.draggableWidget('valuetext')).should('have.text', `value:${T.qr.alpha.payload}`);
        });

        // ── QrScanner-BRW-003 (insecure origin: no navigator.mediaDevices) ───
        it('[QrScanner-BRW-003] Without the camera API (insecure http origin) the scanner shows the error dialog', () => {
            installFakeCamera({ noMediaDevices: true });
            addIconsViaApi([qrScannerItem(W)]);
            openQrAppInViewer(SEL.root(W));
            cy.window().its('navigator.mediaDevices').should('be.undefined');
            cy.get(SEL.errorTitle(W)).should('have.text', T.errorTitle); // ErrorModal.jsx:15
            expectScannerVideo(W, (v) => expect(v.count, 'no camera preview').to.eq(0));
        });
    });
});
