/**
 * SPEC — PDF — events facet (browser-only scenario).
 * FOR AI: TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/PDF):
 *   PDF-BRW-004 — with showDownloadOption on, a "Download PDF" button appears once the document has loaded and
 *                 clicking it downloads the file, named after the component
 * PDF declares no ToolJet events (pdf.js:43 `events: {}`); the user-visible event here is the browser download.
 * downloadFile (PDF.jsx:193-204) re-fetches the url, wraps the bytes in a blob URL and clicks an <a download=name>.
 * The fixture is served late (intercept delay) so the pre-load state is observable, and the saved file is read back
 * from Cypress' downloadsFolder (cypress/downloads) and compared with the fixture bytes. The anchor's `download`
 * name is the bare component name; the browser appends the extension from the blob's MIME type (application/pdf
 * here, from the response content-type), so the saved file is `<name>.pdf`.
 * Helpers: stubPdfFixtures, addPdfsViaApi, pdfMetrics, trackDownloadAnchors, downloadAnchors, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { pdfSelector as SEL } from "Selectors/appBuilder/components/pdf";
import { pdfText } from "Texts/appBuilder/components/pdf";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    stubPdfFixtures,
    addPdfsViaApi,
    pdfMetrics,
    trackDownloadAnchors,
    downloadAnchors,
} from "Support/utils/appBuilder/components/pdf";

const T = pdfText;
const MULTI = T.fixtures.multiPage;
const DOWNLOADS = Cypress.config('downloadsFolder');
const NAME = 'invoicepdf'; // dynamic: component name = downloaded file name (PDF.jsx:277)
const LOAD_DELAY = 2500; // dynamic: ms the fixture body is held back

describe('PDF — events facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.task('deleteFolder', DOWNLOADS);
        stubPdfFixtures({ delayMs: LOAD_DELAY });
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PDF-events-${Cypress._.uniqueId()}`);
        addPdfsViaApi([
            { name: NAME, layout: { top: 40, left: 2 } },
            // control: same document with the toggle off
            { name: 'nodownload', layout: { top: 40, left: 22 }, properties: { showDownloadOption: { value: '{{false}}' } } }, // pdf.js:87 toggle value
        ]);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── PDF-BRW-004 ──────────────────────────────────────────────────────────
    it('[PDF-BRW-004] The Download button appears after load and downloads the file named after the component', () => {
        openLinkAppInViewer(SEL.root(NAME));

        // while the document is still loading there is no footer and no button
        pdfMetrics(NAME, (m) => {
            expect(m.pages, 'still loading').to.have.length(0);
            expect(m.footer, 'no footer before load').to.eq(null);
        });
        cy.wait(['@pdfMulti', '@pdfMulti']); // both widgets loaded the document
        pdfMetrics(NAME, (m) => {
            expect(m.pages, 'loaded').to.have.length(MULTI.pages);
            expect(m.footer && m.footer.downloadText, 'download button after load').to.eq(T.downloadLabel); // source: PDF.jsx:286
        });
        // control: toggle off → loaded, but no download button
        pdfMetrics('nodownload', (m) => {
            expect(m.pages).to.have.length(MULTI.pages);
            expect(m.footer.download, 'no download button').to.eq(null);
        });

        trackDownloadAnchors();
        cy.get(SEL.downloadButton(NAME)).click();
        // the click re-fetches the url …
        cy.wait('@pdfMulti').its('response.statusCode').should('eq', 200);
        cy.get('@pdfMulti.all').should('have.length', 3);
        // … clicks a blob-URL anchor named after the component …
        downloadAnchors().should('deep.equal', [{ download: NAME, scheme: 'blob' }]);
        // … and the browser saves exactly the fixture bytes as <name>.pdf
        cy.readFile(`${DOWNLOADS}/${NAME}.pdf`, null, { timeout: 15000 }).then((saved) =>
            cy.fixture(MULTI.path, null).then((original) => {
                expect(saved.length, 'downloaded size').to.eq(MULTI.bytes); // source: fixture multiPage.pdf
                expect(Cypress.Buffer.compare(Cypress.Buffer.from(saved), Cypress.Buffer.from(original)), 'same bytes').to.eq(0);
            })
        );
        // … a PDF whose page tree and page text are the fixture's. Read from the raw bytes: the fixture's text is
        // uncompressed, and the readPdf task (pdf-parse's bundled pdf.js 1.x) rejects this jsPDF file with "bad XRef
        // entry" although its xref offsets are valid and the widget's own pdf.js renders it.
        cy.readFile(`${DOWNLOADS}/${NAME}.pdf`, 'latin1').then((raw) => {
            expect(raw.startsWith('%PDF-'), 'PDF header').to.eq(true);
            expect(raw, 'page count').to.contain(`/Count ${MULTI.pages}`);
            expect(raw, 'first page text').to.contain(`(${MULTI.label} 1) Tj`);
            expect(raw, 'last page text').to.contain(`(${MULTI.label} ${MULTI.pages}) Tj`);
        });
    });
});
