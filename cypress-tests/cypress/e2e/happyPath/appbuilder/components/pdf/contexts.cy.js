/**
 * SPEC — PDF — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   PDF-BRW-007 — the widget renders the same in the app editor and the viewer (PDF.jsx has no currentMode branch)
 * PDF exposes no variables (pdf.js:68 `exposedVariables: {}`, TESTING.md D-09); RenderWidget still exposes the
 * component id. The PDFs are local fixtures served through cy.intercept (the default url too).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * stubPdfFixtures, addPdfsViaApi, pdfMetrics, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { pdfSelector as SEL } from "Selectors/appBuilder/components/pdf";
import { pdfText } from "Texts/appBuilder/components/pdf";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { stubPdfFixtures, addPdfsViaApi, pdfMetrics } from "Support/utils/appBuilder/components/pdf";

const T = pdfText;
const MULTI = T.fixtures.multiPage;
const W = T.defaultWidgetName;
const PX = 1.5;

// what a viewer sees of one widget, independent of where the canvas sits on screen
const snapshot = (name, out) =>
    pdfMetrics(name, (m) => {
        expect(m.pages, `${name}: rendered`).to.have.length(MULTI.pages);
        m.pages.forEach((p) => expect(p.text, `${name}: page ${p.n} text`).to.eq(`${MULTI.label} ${p.n}`));
    }).then(($root) => {
        const doc = $root[0].ownerDocument;
        const r = (el) => el && el.getBoundingClientRect();
        const card = doc.querySelector(SEL.card(name));
        const cs = doc.defaultView.getComputedStyle(card);
        const footer = doc.querySelector(SEL.footer(name));
        const root = r($root[0]);
        const page1 = r(doc.querySelector(`${SEL.page(name, 1)} canvas`));
        // the grid column width differs between the editor canvas and the viewer, so widths are compared through the
        // fit rule (PDF.jsx:184-185) and the centring, not as raw pixels; heights are authored in px and must match
        const scaled = name !== 'pdfstyled';
        out[name] = {
            rootHeight: root.height,
            pages: doc.querySelectorAll(SEL.page(name)).length,
            fitResidual: scaled
                ? page1.width - (root.width + T.rootWidthInset - T.scaleWidthInset)
                : page1.height - root.height,
            pageHeight: scaled ? page1.height / page1.width : page1.height,
            centreOffset: page1.left + page1.width / 2 - (root.left + root.width / 2),
            card: { radius: cs.borderTopLeftRadius, border: cs.borderTopColor, shadow: cs.boxShadow },
            footer: footer && {
                text: footer.textContent.trim(),
                justify: doc.defaultView.getComputedStyle(footer).justifyContent,
                height: r(footer).height,
            },
        };
    });

describe('PDF — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            stubPdfFixtures();
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-PDF-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — Show on desktop / Show on mobile gate the widget on the matching editor layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (pdf.js:72-73): on the desktop canvas, absent from the mobile canvas
            pdfMetrics(W, (m) => expect(m.pages).to.have.length(MULTI.pages));
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('exist');

            // desktop off → gone from desktop; mobile on → rendered on the mobile canvas only
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(widget).should('be.visible');
            pdfMetrics(W, (m) => expect(m.pages, 'document rendered on mobile').to.have.length(MULTI.pages));
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — only the universal id is exposed in the inspector tree', () => {
            // pdf.js:68 exposedVariables {} — RenderWidget still exposes the component id
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [], () => {});
            cy.get('[data-cy="inspector-id-label"]').should('have.text', 'id');
            cy.get('[data-cy="inspector-id-value"]').invoke('text').should('match', /^"[0-9a-f-]{36}"$/);
        });
    });

    // ── PDF-BRW-007 ──────────────────────────────────────────────────────────
    describe('editor and viewer', () => {
        beforeEach(() => {
            stubPdfFixtures();
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-PDF-contexts-${Cypress._.uniqueId()}`);
            addPdfsViaApi([
                // defaults: fit to width, controls + download
                { name: 'pdf1', layout: { top: 40, left: 2 } },
                // fit to height, download only, custom card styles
                {
                    name: 'pdfstyled',
                    layout: { top: 40, left: 24, width: 14, height: 420 },
                    properties: { scale: { value: '{{false}}' }, pageControls: { value: '{{false}}' } }, // pdf.js:81,84 toggle values
                    styles: { borderRadius: { value: 14 }, borderColor: { value: '#d0342c' } }, // dynamic: non-default card styles
                },
            ]);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[PDF-BRW-007] The same saved widgets render identically in the editor canvas and the viewer', () => {
            const editor = {};
            const viewer = {};
            cy.openApp('', undefined, undefined, SEL.root('pdfstyled'));
            snapshot('pdf1', editor);
            snapshot('pdfstyled', editor);
            openLinkAppInViewer(SEL.root('pdfstyled'));
            snapshot('pdf1', viewer);
            snapshot('pdfstyled', viewer);

            cy.then(() => {
                ['pdf1', 'pdfstyled'].forEach((name) => {
                    const e = editor[name];
                    const v = viewer[name];
                    expect(v.pages, `${name}: page count`).to.eq(e.pages);
                    expect(v.card, `${name}: card styles`).to.deep.eq(e.card);
                    expect(v.footer && v.footer.text, `${name}: footer content`).to.eq(e.footer && e.footer.text);
                    expect(v.footer && v.footer.justify, `${name}: footer layout`).to.eq(e.footer && e.footer.justify);
                    expect(v.rootHeight, `${name}: widget height`).to.be.closeTo(e.rootHeight, PX);
                    expect(e.fitResidual, `${name}: editor page follows the scale rule`).to.be.closeTo(0, PX);
                    expect(v.fitResidual, `${name}: viewer page follows the scale rule`).to.be.closeTo(0, PX);
                    // fit to width: same page aspect; fit to height: same page height in px
                    expect(v.pageHeight, `${name}: page size`).to.be.closeTo(e.pageHeight, name === 'pdfstyled' ? PX : 0.01);
                    expect(v.centreOffset, `${name}: page centring`).to.be.closeTo(e.centreOffset, PX);
                });
                // sanity on what was compared: the styled card really carries the custom styles, and the footers differ
                expect(viewer.pdfstyled.card.radius).to.eq('14px');
                expect(viewer.pdfstyled.card.border).to.eq('rgb(208, 52, 44)');
                expect(viewer.pdf1.footer.text).to.eq(`‹${T.pageIndicator(1, MULTI.pages)}›${T.downloadLabel}`);
                expect(viewer.pdfstyled.footer.text).to.eq(T.downloadLabel);
            });
        });
    });
});
