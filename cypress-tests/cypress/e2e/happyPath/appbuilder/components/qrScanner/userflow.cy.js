/**
 * SPEC — QR Scanner — userflow facet (camera-error UX).
 * FOR AI: TESTING.md browser scenario:
 *   QrScanner-BRW-002 — when the camera is unavailable or permission is denied, the real error UX (ErrorModal
 *                       dialog + close) behaves and is accessible
 * The camera answer is the in-page fake from components/qrScanner.js: getUserMedia rejects with the DOMException a
 * browser raises — NotAllowedError (permission denied) / NotFoundError (no camera). react-qr-reader passes it to
 * onError (lib/index.js:196-198) → QrScanner.jsx:6-9 swaps the scanner for ErrorModal.jsx — an INLINE dialog (no
 * portal, no backdrop) inside the widget box with a header × (aria-label "Close") and a footer "Close" button.
 * The real OS/browser permission prompt itself is browser chrome and cannot be driven from Cypress.
 * Helpers: addIconsViaApi, counterEvent, counterText, expectCounter, installFakeCamera, expectFakeCamera,
 * expectScannerVideo, qrScannerItem, hitTest, openQrAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { qrScannerSelector as SEL } from "Selectors/appBuilder/components/qrScanner";
import { qrScannerText } from "Texts/appBuilder/components/qrScanner";
import { addIconsViaApi, counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    installFakeCamera,
    expectFakeCamera,
    expectScannerVideo,
    qrScannerItem,
    hitTest,
    openQrAppInViewer,
} from "Support/utils/appBuilder/components/qrScanner";

const T = qrScannerText;
const W = T.defaultWidgetName;

const seedErrorApp = (deny) => {
    installFakeCamera({ deny });
    addIconsViaApi([
        qrScannerItem(W, { events: [counterEvent(T.eventOnDetect, 'detects')] }), // qrscanner.js:16
        counterText('detectcount', 'detects', { top: 420 }),
    ]);
    openQrAppInViewer(SEL.errorDialog(W));
};

// the inline error dialog replaced the scanner, with its title, body and both close controls
const expectErrorDialog = () => {
    expectFakeCamera((s) => expect(s.calls, 'the widget asked for the camera once').to.have.length(1));
    expectScannerVideo(W, (v) => expect(v.count, 'no camera preview').to.eq(0));
    cy.get(SEL.errorTitle(W)).should('have.text', T.errorTitle); // ErrorModal.jsx:15
    cy.get(SEL.errorBody(W)).should(($b) => expect($b.text().replace(/\s+/g, ' ').trim()).to.eq(T.errorBody)); // ErrorModal.jsx:25-26
    cy.get(SEL.errorCloseX(W)).should('have.attr', 'aria-label', T.closeAriaLabel).and('have.attr', 'type', 'button'); // ErrorModal.jsx:17-20
    cy.get(SEL.errorCloseButton(W)).should('have.text', T.closeButtonText).and('have.attr', 'type', 'button'); // ErrorModal.jsx:30
    // both controls sit inside the default 300px-high widget box and a real pointer lands on them
    [SEL.errorCloseX(W), SEL.errorCloseButton(W)].forEach((sel) =>
        hitTest(sel).then(({ hitsSelf, rect }) => {
            expect(rect.w * rect.h, `${sel} has a box`).to.be.gt(0);
            expect(hitsSelf, `${sel} is reachable by a real pointer`).to.eq(true);
        }));
    // no scan path is left: nothing detected
    expectCounter('detectcount', 'detects', 0);
};

describe('QR Scanner — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-QrScanner-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── QrScanner-BRW-002 (permission denied, pointer) ───────────────────────
    it('[QrScanner-BRW-002] Camera permission denied shows the error dialog; the footer Close button dismisses it', () => {
        seedErrorApp('NotAllowedError');
        expectErrorDialog();

        cy.get(SEL.errorCloseButton(W)).realClick({ scrollBehavior: false });
        cy.get(SEL.errorDialog(W)).should('not.exist');
        // dismissing does not retry the camera: the widget stays empty
        expectScannerVideo(W, (v) => expect(v.count, 'no camera preview after close').to.eq(0));
        expectFakeCamera((s) => expect(s.calls, 'no second camera request').to.have.length(1));
        cy.get(SEL.root(W)).should(($r) => expect($r.text().trim(), 'widget left empty').to.eq(''));
    });

    // ── QrScanner-BRW-002 (no camera, header ×) ──────────────────────────────
    it('[QrScanner-BRW-002] No camera available shows the same error dialog; the header × dismisses it', () => {
        seedErrorApp('NotFoundError');
        expectErrorDialog();

        cy.get(SEL.errorCloseX(W)).realClick({ scrollBehavior: false });
        cy.get(SEL.errorDialog(W)).should('not.exist');
        expectFakeCamera((s) => expect(s.calls, 'no second camera request').to.have.length(1));
    });

    // ── QrScanner-BRW-002 (keyboard) ─────────────────────────────────────────
    it('[QrScanner-BRW-002] The error dialog close controls are keyboard operable (Tab / Shift+Tab, Enter)', () => {
        seedErrorApp('NotAllowedError');
        cy.get(SEL.errorTitle(W)).should('have.text', T.errorTitle);

        // focus enters on the header × (first control); real Tab skips the non-focusable body to the footer Close
        cy.get(SEL.errorCloseX(W)).focus();
        cy.focused().should('match', SEL.errorCloseX(W)).and('have.attr', 'aria-label', T.closeAriaLabel);
        cy.realPress('Tab');
        cy.focused().should('match', SEL.errorCloseButton(W)).and('have.text', T.closeButtonText);
        cy.realPress(['Shift', 'Tab']);
        cy.focused().should('match', SEL.errorCloseX(W));
        cy.realPress('Tab');
        cy.focused().should('match', SEL.errorCloseButton(W));
        cy.realPress('Enter');
        cy.get(SEL.errorDialog(W)).should('not.exist');
    });
});
