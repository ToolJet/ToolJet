/**
 * SPEC — PDF — styles facet (browser-only scenario).
 * FOR AI: TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/PDF):
 *   PDF-BRW-010 — hovering the Download button paints the theme hover token (var(--cc-surface3-surface)) in BOTH app
 *                 modes, never the old hard-coded #e6e6e6 that put dark-mode light text on light gray (D-15)
 * The idle background is inline var(--cc-surface1-surface) (PDF.jsx:114-120); the hover rule is the stylesheet's
 * `.download-icon-outer-wrapper:hover { background-color: var(--cc-surface3-surface) !important }` (theme.scss), so
 * only a real pointer hover (CDP) in the viewer can show it. App mode: globalSettings.appMode → `.dark-theme`.
 * Oracle: the painted hover colour equals the token resolved in that mode, differs from the idle colour, and the
 * label keeps a readable contrast on it.
 * Helpers: stubPdfFixtures, addPdfsViaApi, pdfMetrics, contrastRatio, resolveCssVarColor, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { pdfSelector as SEL } from "Selectors/appBuilder/components/pdf";
import { pdfText } from "Texts/appBuilder/components/pdf";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { stubPdfFixtures, addPdfsViaApi, pdfMetrics, contrastRatio } from "Support/utils/appBuilder/components/pdf";

const T = pdfText;
const W = 'pdf1';

const paint = () =>
    cy.get(SEL.downloadButton(W)).then(($btn) => {
        const win = $btn[0].ownerDocument.defaultView;
        return {
            background: win.getComputedStyle($btn[0]).backgroundColor,
            text: win.getComputedStyle($btn[0].querySelector('span')).color,
        };
    });
const moveMouseAway = () => cy.get(SEL.page(W, 1)).realHover({ position: 'center', scrollBehavior: false });

describe('PDF — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        stubPdfFixtures();
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PDF-styles-${Cypress._.uniqueId()}`);
        addPdfsViaApi([{ name: W, layout: { top: 40, left: 2 } }]);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const expectHoverToken = (mode) => {
        if (mode === 'dark') cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        openLinkAppInViewer(SEL.root(W));
        cy.get('.dark-theme').should(mode === 'dark' ? 'exist' : 'not.exist');
        pdfMetrics(W, (m) => expect(m.footer && m.footer.downloadText).to.eq(T.downloadLabel));
        moveMouseAway();

        resolveCssVarColor(T.idleToken, SEL.root(W)).as('idle');
        resolveCssVarColor(T.hoverToken, SEL.root(W)).as('hover');
        cy.get('@idle').then((idle) =>
            cy.get('@hover').then((hover) => {
                expect(hover, `${mode}: the two tokens differ, so hover is observable`).to.not.eq(idle);
                // idle: the inline surface token
                paint().its('background').should('eq', idle);
                // real pointer hover: the theme hover token, with readable text on it
                cy.get(SEL.downloadButton(W)).realHover({ scrollBehavior: false });
                paint().should((p) => {
                    expect(p.background, `${mode}: hover background`).to.eq(hover);
                    expect(p.background, `${mode}: not the legacy light gray`).to.not.eq(T.legacyHoverGray);
                    expect(contrastRatio(p.text, p.background), `${mode}: label contrast on hover`).to.be.gte(T.contrastFloor);
                });
                // leaving restores the idle surface
                moveMouseAway();
                paint().its('background').should('eq', idle);
            })
        );
    };

    // ── PDF-BRW-010 ──────────────────────────────────────────────────────────
    it('[PDF-BRW-010] Light mode: hovering Download paints the theme hover token with readable text', () => {
        expectHoverToken('light');
    });

    it('[PDF-BRW-010] Dark mode: hovering Download paints the dark hover token, not light gray, with readable text', () => {
        expectHoverToken('dark');
    });
});
