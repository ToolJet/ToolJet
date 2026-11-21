/**
 * SPEC — QR Scanner — events facet (the end-to-end camera scan).
 * FOR AI: TESTING.md browser scenario:
 *   QrScanner-BRW-001 — with a camera and a real QR code, the scanner detects it and fires onDetect with
 *                       lastDetectedValue set (the end-to-end camera path)
 * The camera is the in-page fake from components/qrScanner.js: getUserMedia resolves with a canvas.captureStream()
 * video stream painting a QR fixture, so react-qr-reader's real <video>, frame crop and jsQR web worker decode a
 * real QR image — only the lens is synthetic (a real device cannot be attached to Cypress). Dispatches are
 * counted through a set-custom-variable handler; the exposed value is read through a Text binding.
 * The lib re-scans every 500 ms (react-qr-reader delay) while a code stays in view, and QrScanner.jsx:11-16 fires
 * onDetect on every truthy decode — so counts are asserted as "grows while in view / frozen while out of view".
 * Helpers: addIconsViaApi, counterEvent, counterText, expectCounter, installFakeCamera, loadQrFixture,
 * showQrToCamera, expectScannerVideo, expectFakeCamera, qrScannerItem, valueText, expectValueText, seenEvent,
 * seenText, openQrAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { qrScannerSelector as SEL } from "Selectors/appBuilder/components/qrScanner";
import { qrScannerText } from "Texts/appBuilder/components/qrScanner";
import { addIconsViaApi, counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    installFakeCamera,
    loadQrFixture,
    showQrToCamera,
    expectScannerVideo,
    expectFakeCamera,
    qrScannerItem,
    valueText,
    expectValueText,
    seenEvent,
    seenText,
    openQrAppInViewer,
} from "Support/utils/appBuilder/components/qrScanner";

const T = qrScannerText;
const W = T.defaultWidgetName;
const SETTLE = T.scanDelayMs * 4; // dynamic: several scan cycles — long enough for a (wrong) detection to land

// read the counter Text's current number (one-shot)
const counterValue = (name, key) =>
    cy.get(`[data-cy="draggable-widget-${name}"]`).invoke('text').then((t) => Number(t.trim().replace(`${key}:`, '')));

describe('QR Scanner — events facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-QrScanner-events-${Cypress._.uniqueId()}`);
        loadQrFixture('alpha').as('qrAlpha');
        loadQrFixture('beta').as('qrBeta');
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── QrScanner-BRW-001 ────────────────────────────────────────────────────
    it('[QrScanner-BRW-001] A QR code in front of the camera fires onDetect and exposes lastDetectedValue', () => {
        installFakeCamera(); // camera granted, nothing in view yet
        addIconsViaApi([
            qrScannerItem(W, { events: [counterEvent(T.eventOnDetect, 'detects')] }), // qrscanner.js:16
            valueText('valuetext', W, { top: 360 }),
            counterText('detectcount', 'detects', { top: 420 }),
        ]);
        openQrAppInViewer(SEL.video(W));

        // the widget opened the (fake) camera with a video-only request and plays its live stream
        expectFakeCamera((s) => {
            expect(s.calls, 'getUserMedia calls').to.have.length(1);
            expect(s.calls[0], 'video-only request').to.have.all.keys('video');
            expect(s.calls[0].video.facingMode, 'rear camera preferred').to.deep.eq({ ideal: T.facingMode }); // lib/index.js:186
        });
        expectScannerVideo(W, (v) => {
            expect(v.count, 'one preview <video>').to.eq(1);
            expect(v.fromFakeCamera, 'preview shows the camera stream').to.eq(true);
            expect(v.playing, 'preview is playing').to.eq(true);
        });

        // nothing in view: no detection (the seeded '' binding is checked in its own test below — known bug)
        cy.wait(SETTLE);
        expectCounter('detectcount', 'detects', 0);

        // hold QR "alpha" up: onDetect fires and the binding shows its payload
        cy.get('@qrAlpha').then((uri) => showQrToCamera(uri));
        expectValueText('valuetext', T.qr.alpha.payload);
        cy.get('[data-cy="draggable-widget-detectcount"]').should(($el) =>
            expect(Number($el.text().trim().replace('detects:', '')), 'onDetect dispatches').to.be.gte(1));

        // take it away: no further onDetect; the value keeps the last scanned payload (docs: "last QR code scanned")
        showQrToCamera(null);
        cy.wait(T.scanDelayMs * 2); // dynamic: let a scan that was in flight land
        counterValue('detectcount', 'detects').then((frozen) => {
            cy.wait(SETTLE);
            expectCounter('detectcount', 'detects', frozen);
        });
        expectValueText('valuetext', T.qr.alpha.payload);

        // a different code replaces the value
        cy.get('@qrBeta').then((uri) => showQrToCamera(uri));
        expectValueText('valuetext', T.qr.beta.payload);
    });

    it('[QrScanner-BRW-001] The onDetect handler reads the newly detected value from lastDetectedValue', () => {
        installFakeCamera();
        addIconsViaApi([
            qrScannerItem(W, { events: [seenEvent(T.eventOnDetect, 'seen', W)] }),
            valueText('valuetext', W, { top: 360 }),
            seenText('seentext', 'seen', { top: 420 }),
        ]);
        openQrAppInViewer(SEL.video(W));
        expectScannerVideo(W, (v) => expect(v.playing, 'preview is playing').to.eq(true));
        cy.get('[data-cy="draggable-widget-seentext"]').should('have.text', 'first:none');

        cy.get('@qrAlpha').then((uri) => showQrToCamera(uri));
        expectValueText('valuetext', T.qr.alpha.payload);
        // what the FIRST onDetect handler saw in components.qrscanner1.lastDetectedValue: it must be the code that
        // was just detected — a handler that runs a query with the scanned value must not get the previous one
        cy.get('[data-cy="draggable-widget-seentext"]').should(($el) =>
            expect($el.text().trim(), 'lastDetectedValue inside the first onDetect').to.eq(`first:${JSON.stringify(T.qr.alpha.payload)}`));
    });

    // Known product bug (same as the Timeline finding): a binding that reads ONLY a widget that never publishes an
    // exposed value itself renders blank on load — QrScanner publishes lastDetectedValue only on a scan
    // (QrScanner.jsx:11-16), so `"value:" + lastDetectedValue` renders '' instead of 'value:' until the first scan.
    it('a binding to lastDetectedValue renders the seeded "" before the first scan', () => {
        installFakeCamera();
        addIconsViaApi([qrScannerItem(W), valueText('valuetext', W, { top: 360 })]);
        openQrAppInViewer(SEL.video(W));
        expectScannerVideo(W, (v) => expect(v.playing, 'preview is playing').to.eq(true));
        expectValueText('valuetext', ''); // seeded '' (qrscanner.js:37)
    });
});
