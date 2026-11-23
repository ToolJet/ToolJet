/**
 * SPEC — PDF — userflow facet (browser-only scenarios).
 * FOR AI: TESTING.md browser scenarios (frontend/ee/test/app-builder/widgets/PDF):
 *   PDF-BRW-008 — prev/next page controls expose accessible names and are operable by keyboard
 *   PDF-BRW-009 — a password-protected PDF: cancelling the prompt shows "Password prompt closed" + Retry, and Retry
 *                 reopens the document (prompts again)
 * Password flow: pdfjs calls react-pdf's onPassword → PDF.jsx:126-150 asks with the NATIVE window.prompt (a null answer =
 * cancel). Cypress cannot answer a native prompt, so window.prompt is stubbed before the app loads
 * (cy.visit onBeforeLoad) with scripted answers; the stub records every message the widget asked with.
 * Keyboard: real CDP key presses (cypress-real-events) from a TextInput placed above the widget.
 * Helpers: stubPdfFixtures, addPdfsViaApi, pdfMetrics, viewerPath.
 */
import { fake } from "Fixtures/fake";
import { pdfSelector as SEL } from "Selectors/appBuilder/components/pdf";
import { pdfText } from "Texts/appBuilder/components/pdf";
import { viewerPath } from "Support/utils/appBuilder/components/link";
import { stubPdfFixtures, addPdfsViaApi, pdfMetrics } from "Support/utils/appBuilder/components/pdf";

const T = pdfText;
const MULTI = T.fixtures.multiPage;
const SECRET = T.fixtures.passwordProtected;

// name of the focused element: its aria-label, else its widget's runtime name, else the tag
const focused = () =>
    cy.document().then((doc) => {
        const el = doc.activeElement;
        if (!el || el === doc.body) return 'body';
        if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
        const w = el.closest('[data-cy^="draggable-widget-"]');
        return w ? w.getAttribute('data-cy').replace('draggable-widget-', '') : el.tagName.toLowerCase();
    });

describe('PDF — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        stubPdfFixtures();
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PDF-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── PDF-BRW-008 ──────────────────────────────────────────────────────────
    it('[PDF-BRW-008] Prev/next carry accessible names and page the document from the keyboard', () => {
        addPdfsViaApi([
            { type: 'TextInput', name: 'kbstart', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { value: { value: '' } } },
            { name: 'pdf1', layout: { top: 110, left: 2 } },
        ]);
        cy.then(() => cy.visit(viewerPath()));
        pdfMetrics('pdf1', (m) => expect(m.footer && m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages)));

        // accessible names (PDF.jsx:253,265)
        cy.get(SEL.prevButton('pdf1')).should('have.attr', 'aria-label', T.prevLabel).and('be.disabled');
        cy.get(SEL.nextButton('pdf1')).should('have.attr', 'aria-label', T.nextLabel).and('not.be.disabled');

        // real Tab from the input above reaches Next (Prev is disabled on page 1, so it is skipped)
        cy.get(SEL.textInput('kbstart')).focus();
        const path = [];
        const tabToNext = (n) =>
            focused().then((name) => {
                if (name === T.nextLabel) return;
                expect(n, `Tab reaches "${T.nextLabel}" (path: ${path.join(' → ')})`).to.be.lt(4);
                cy.realPress('Tab');
                focused().then((f) => path.push(f));
                tabToNext(n + 1);
            });
        tabToNext(0);
        cy.then(() => expect(path, 'disabled Prev is not a tab stop').to.not.include(T.prevLabel));

        // Enter and Space activate the focused control
        cy.realPress('Enter');
        pdfMetrics('pdf1', (m) => expect(m.footer.indicator).to.eq(T.pageIndicator(2, MULTI.pages)));
        focused().should('eq', T.nextLabel);
        cy.realPress('Space');
        pdfMetrics('pdf1', (m) => {
            expect(m.footer.indicator).to.eq(T.pageIndicator(3, MULTI.pages));
            expect(m.footer.nextDisabled, 'Next disabled on the last page').to.eq(true);
        });

        // Shift+Tab moves back to Prev, which pages back with Enter
        cy.realPress(['Shift', 'Tab']);
        focused().should('eq', T.prevLabel);
        cy.realPress('Enter');
        pdfMetrics('pdf1', (m) => expect(m.footer.indicator).to.eq(T.pageIndicator(2, MULTI.pages)));
        cy.realPress('Enter');
        pdfMetrics('pdf1', (m) => {
            expect(m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
            expect(m.footer.prevDisabled, 'Prev disabled on the first page').to.eq(true);
            expect(m.scroller.scrollTop, 'back at the top').to.be.closeTo(0, 1);
        });
    });

    // ── PDF-BRW-009 ──────────────────────────────────────────────────────────
    describe('password-protected PDF', () => {
        // scripted answers for window.prompt, in call order (null = the user cancelled)
        const openWithPromptAnswers = (answers) => {
            cy.then(() =>
                cy.visit(viewerPath(), {
                    onBeforeLoad(win) {
                        const stub = cy.stub(win, 'prompt').as('prompt');
                        answers.forEach((a, i) => stub.onCall(i).returns(a));
                    },
                })
            );
        };
        const expectClosed = () =>
            pdfMetrics('pdfsecret', (m) => {
                expect(m.message, 'closed message').to.contain(T.passwordClosedMessage); // source: PDF.jsx:156
                expect(m.retry, 'Retry button').to.eq(true);
                expect(m.pages, 'nothing drawn').to.have.length(0);
                expect(m.footer, 'no footer').to.eq(null);
            });
        const expectUnlocked = () =>
            pdfMetrics('pdfsecret', (m) => {
                expect(m.retry, 'Retry gone').to.eq(false);
                expect(m.pages.map((p) => p.text), 'decrypted pages').to.deep.eq([`${SECRET.label} 1`, `${SECRET.label} 2`]); // source: fixture passwordProtected.pdf
                expect(m.footer && m.footer.indicator).to.eq(T.pageIndicator(1, SECRET.pages));
            });

        beforeEach(() => {
            addPdfsViaApi([{ name: 'pdfsecret', layout: { top: 40, left: 2 }, properties: { url: { value: SECRET.url } } }]);
        });

        it('[PDF-BRW-009] Cancelling the password prompt shows "Password prompt closed" with Retry; Retry prompts again and opens the document', () => {
            openWithPromptAnswers([null, SECRET.password]);
            cy.wait('@pdfPassword');
            expectClosed();
            cy.get('@prompt').should('have.been.calledOnceWith', T.passwordPrompt);
            cy.get(SEL.retryButton('pdfsecret')).should('have.text', T.retryLabel).click(); // source: PDF.jsx:166
            cy.get('@prompt').should('have.been.calledTwice');
            cy.get('@prompt').its('secondCall.args.0').should('eq', T.passwordPrompt);
            expectUnlocked();
        });

        it('[PDF-BRW-009] A wrong password re-prompts as invalid; cancelling then shows Retry, which unlocks with the right password', () => {
            openWithPromptAnswers([fake.firstName.toLowerCase(), null, SECRET.password]);
            cy.wait('@pdfPassword');
            expectClosed();
            cy.get('@prompt').should('have.been.calledTwice');
            cy.get('@prompt').its('firstCall.args.0').should('eq', T.passwordPrompt);
            cy.get('@prompt').its('secondCall.args.0').should('eq', T.invalidPasswordPrompt); // source: PDF.jsx:144
            cy.get(SEL.retryButton('pdfsecret')).click();
            cy.get('@prompt').should('have.been.calledThrice');
            expectUnlocked();
        });
    });
});
