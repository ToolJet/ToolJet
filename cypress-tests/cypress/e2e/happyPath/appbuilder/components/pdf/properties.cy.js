/**
 * SPEC — PDF — properties facet (browser-only scenarios).
 * FOR AI: TESTING.md browser scenarios (frontend/ee/test/app-builder/widgets/PDF):
 *   PDF-BRW-002 — a real PDF renders from a URL and from a `data:application/pdf;base64,` payload
 *   PDF-BRW-003 — page controls page through the document ("N of M", prev/next disabled at the bounds); the footer
 *                 layout follows the pageControls × showDownloadOption toggles and stays hidden for an empty url
 *   PDF-BRW-005 — a load error hides the page-controls/download footer
 * Real pdfjs rendering needs the worker + a browser, so every case runs the viewer on an API-built app. The PDFs are
 * local fixtures (cypress/fixtures/pdf) served on a fake host through cy.intercept — no external network.
 * Footer gate: PDF.jsx:239 `!error && !pageLoading && (showDownloadOption || pageControls)`.
 * Helpers: stubPdfFixtures, addPdfsViaApi, pdfDataUri, pdfMetrics, setNativeInputValue, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { pdfSelector as SEL } from "Selectors/appBuilder/components/pdf";
import { pdfText } from "Texts/appBuilder/components/pdf";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    stubPdfFixtures,
    addPdfsViaApi,
    pdfDataUri,
    pdfMetrics,
    setNativeInputValue,
} from "Support/utils/appBuilder/components/pdf";

const T = pdfText;
const F = T.fixtures;
const MULTI = F.multiPage;
const OFF = { value: '{{false}}' }; // pdf.js:81-87 toggle values
const PX = 1.5; // sub-pixel tolerance
const COLOR_TOL = 4; // per-channel tolerance for the painted page fill

// every page drawn: one canvas per page, painted in that page's fill colour, its own text in the text layer
const expectFixtureRendered = (name) =>
    pdfMetrics(name, (m) => {
        expect(m.message, `${name}: no placeholder / error message`).to.eq('');
        expect(m.pages.map((p) => p.n), `${name}: every page mounted`).to.deep.eq([1, 2, 3]); // source: fixture multiPage.pdf (3 pages)
        m.pages.forEach((p, i) => {
            expect(p.canvasPxWidth, `${name} page ${p.n}: canvas drawn`).to.be.gt(0);
            expect(p.text, `${name} page ${p.n}: text layer`).to.eq(`${MULTI.label} ${p.n}`);
            expect(p.pixel, `${name} page ${p.n}: painted`).to.not.eq(null);
            p.pixel.forEach((c, k) => expect(c, `${name} page ${p.n}: fill channel ${k}`).to.be.closeTo(MULTI.colors[i][k], COLOR_TOL));
        });
    });

describe('PDF — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        stubPdfFixtures();
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PDF-properties-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── PDF-BRW-002 ──────────────────────────────────────────────────────────
    it('[PDF-BRW-002] A PDF renders from a URL and from a Base64 data URI', () => {
        pdfDataUri(MULTI.path).then((dataUri) =>
            addPdfsViaApi([
                { name: 'pdfurl', layout: { top: 40, left: 2 }, properties: { url: { value: MULTI.url } } },
                { name: 'pdfbase64', layout: { top: 40, left: 22 }, properties: { url: { value: dataUri } } },
            ])
        );
        openLinkAppInViewer(SEL.root('pdfbase64'));

        // URL: fetched from the url and drawn
        cy.wait('@pdfMulti').its('response.statusCode').should('eq', 200);
        expectFixtureRendered('pdfurl');
        // Base64: decoded in the browser and drawn the same — no network request for it
        expectFixtureRendered('pdfbase64');
        cy.get('@pdfMulti.all').should('have.length', 1);

        // both loaded documents open on page 1 of 3 with identical page geometry
        let urlPage;
        pdfMetrics('pdfurl', (a) => {
            expect(a.footer && a.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
            urlPage = a.pages[0].canvas;
        });
        pdfMetrics('pdfbase64', (b) => {
            expect(b.footer && b.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
            expect(b.pages[0].canvas.width, 'same page width').to.be.closeTo(urlPage.width, PX);
            expect(b.pages[0].canvas.height, 'same page height').to.be.closeTo(urlPage.height, PX);
        });
    });

    // ── PDF-BRW-003 (paging) ─────────────────────────────────────────────────
    it('[PDF-BRW-003] Prev/next page through the document, scroll to the page, update "N of M" and disable at the bounds', () => {
        addPdfsViaApi([{ name: 'pdf1' }]);
        openLinkAppInViewer(SEL.root('pdf1'));
        expectFixtureRendered('pdf1');

        const expectAt = (n) =>
            pdfMetrics('pdf1', (m) => {
                expect(m.footer.indicator, 'indicator').to.eq(T.pageIndicator(n, MULTI.pages)); // source: PDF.jsx:258-260
                expect(m.footer.prevDisabled, 'prev disabled only on the first page').to.eq(n === 1);
                expect(m.footer.nextDisabled, 'next disabled only on the last page').to.eq(n === MULTI.pages);
                // the wrapper scrolled to the page's top (PDF.jsx:105-106)
                expect(m.scroller.scrollTop, `scrolled to page ${n}`).to.be.closeTo(m.pages[n - 1].offsetTop, PX);
            });

        expectAt(1);
        cy.get(SEL.nextButton('pdf1')).click();
        expectAt(2);
        // the page now at the top of the wrapper is page 2
        cy.get(SEL.scroller('pdf1')).then(($sc) => {
            const r = $sc[0].getBoundingClientRect();
            const hit = $sc[0].ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + 20);
            expect(hit.closest('.react-pdf__Page').getAttribute('data-page-number')).to.eq('2');
        });
        cy.get(SEL.nextButton('pdf1')).click();
        expectAt(3);
        cy.get(SEL.nextButton('pdf1')).should('be.disabled');
        cy.get(SEL.prevButton('pdf1')).click();
        expectAt(2);
        cy.get(SEL.prevButton('pdf1')).click();
        expectAt(1);
        cy.get(SEL.prevButton('pdf1')).should('be.disabled');
    });

    // ── PDF-BRW-003 (footer layout × toggles, empty url) ─────────────────────
    it('[PDF-BRW-003] The footer layout follows Show page controls × Show download button and stays hidden for an empty url', () => {
        const at = (left, top = 40) => ({ top, left, width: 10, height: 360 }); // dynamic: four side-by-side slots
        addPdfsViaApi([
            { name: 'fboth', layout: at(2) },
            { name: 'fcontrols', layout: at(12), properties: { showDownloadOption: OFF } },
            { name: 'fdownload', layout: at(22), properties: { pageControls: OFF } },
            { name: 'fnone', layout: at(32), properties: { pageControls: OFF, showDownloadOption: OFF } },
            { name: 'fempty', layout: at(2, 440), properties: { url: { value: '' } } },
        ]);
        openLinkAppInViewer(SEL.root('fnone'));
        const PAD = 16; // footer px-3 (1rem)

        // both on: controls left, download right (justify-content-between — PDF.jsx:241-243)
        pdfMetrics('fboth', (m) => {
            expect(m.footer, 'footer shown').to.not.eq(null);
            expect(m.footer.justify).to.eq('space-between');
            expect(m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
            expect(m.footer.downloadText).to.eq(T.downloadLabel);
            expect(m.footer.controls.left - m.footer.rect.left, 'controls at the left edge').to.be.closeTo(PAD, PX);
            expect(m.footer.rect.right - m.footer.download.right, 'download at the right edge').to.be.closeTo(PAD, PX);
            expect(m.footer.controls.right, 'controls before download').to.be.lte(m.footer.download.left);
        });
        // controls only: no download button, controls stay at the left
        pdfMetrics('fcontrols', (m) => {
            expect(m.footer, 'footer shown').to.not.eq(null);
            expect(m.footer.download, 'no download button').to.eq(null);
            expect(m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
            expect(m.footer.controls.left - m.footer.rect.left).to.be.closeTo(PAD, PX);
        });
        // download only: no controls, the button sits at the right (justify-content-end)
        pdfMetrics('fdownload', (m) => {
            expect(m.footer, 'footer shown').to.not.eq(null);
            expect(m.footer.justify).to.eq('flex-end');
            expect(m.footer.controls, 'no page controls').to.eq(null);
            expect(m.footer.downloadText).to.eq(T.downloadLabel);
            expect(m.footer.rect.right - m.footer.download.right).to.be.closeTo(PAD, PX);
            expect(m.footer.download.left, 'right half').to.be.gt(m.footer.rect.left + m.footer.rect.width / 2);
        });
        // both off: the document still renders but no footer row at all
        pdfMetrics('fnone', (m) => {
            expect(m.pages, 'document loaded').to.have.length(MULTI.pages);
            expect(m.footer, 'no footer').to.eq(null);
        });
        // empty url: placeholder, no document, no footer even though both toggles are on (definition defaults)
        pdfMetrics('fempty', (m) => {
            expect(m.message).to.eq(T.noUrlMessage); // source: PDF.jsx:237
            expect(m.pages).to.have.length(0);
            expect(m.footer, 'no footer').to.eq(null);
        });
    });

    // ── PDF-BRW-005 ──────────────────────────────────────────────────────────
    it('[PDF-BRW-005] A document that fails to load shows the load error and no footer; recovering brings the footer back', () => {
        addPdfsViaApi([
            { name: 'errmissing', layout: { top: 40, left: 2, width: 13, height: 300 }, properties: { url: { value: F.missingUrl } } },
            { name: 'errnotpdf', layout: { top: 40, left: 15, width: 13, height: 300 }, properties: { url: { value: F.notPdfUrl } } },
            {
                name: 'pdfswitch',
                layout: { top: 40, left: 28, width: 14, height: 400 },
                properties: { url: { value: '{{components.urlsource.value}}' } },
            },
            {
                type: 'TextInput',
                name: 'urlsource',
                layout: { top: 460, left: 28, width: 14, height: 40 },
                properties: { value: { value: MULTI.url } },
            },
        ]);
        openLinkAppInViewer(SEL.root('pdfswitch'));

        // 404 and a non-PDF body: react-pdf's load-error message, nothing drawn, no footer (both toggles on)
        cy.wait(['@pdfMissing', '@pdfNotPdf']);
        ['errmissing', 'errnotpdf'].forEach((name) =>
            pdfMetrics(name, (m) => {
                expect(m.message, `${name}: load error`).to.eq(T.loadErrorMessage);
                expect(m.pages, `${name}: nothing drawn`).to.have.length(0);
                expect(m.footer, `${name}: footer hidden`).to.eq(null);
            })
        );

        // control: the same widget config with a loadable url shows the footer …
        expectFixtureRendered('pdfswitch');
        pdfMetrics('pdfswitch', (m) => expect(m.footer && m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages)));
        // … and loses it when the url starts failing
        setNativeInputValue(SEL.textInput('urlsource'), F.missingUrl);
        pdfMetrics('pdfswitch', (m) => {
            expect(m.message, 'load error').to.eq(T.loadErrorMessage);
            expect(m.pages).to.have.length(0);
            expect(m.footer, 'footer hidden on error').to.eq(null);
        });
        // a loadable url again: the gate reopens
        setNativeInputValue(SEL.textInput('urlsource'), MULTI.url);
        expectFixtureRendered('pdfswitch');
        pdfMetrics('pdfswitch', (m) => expect(m.footer && m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages)));
    });
});
