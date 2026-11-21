/**
 * SPEC — PDF — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + browser-only geometry scenarios from TESTING.md (frontend/ee/test/app-builder/widgets/PDF):
 *   PDF-BRW-001 — Scale page to width: on → the page fits the widget width; off → it fits the widget height (and a
 *                 fit-to-height page wider than the widget stays reachable by horizontal scrolling)
 *   PDF-BRW-006 — wheel-scrolling a multi-page PDF moves "N of M" to the most-visible page of THAT instance
 * Geometry: PDF.jsx:184-185 `width={scale ? width - 12 : undefined} height={scale ? undefined : height}`; the root is
 * `width - 3` x `height` (PDF.jsx:215). Every fixture page is 3:4 portrait, so the expected page box follows from the
 * root box alone. The default url (pdf.js:78) is intercepted with the local multi-page fixture.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openEditorSidebar, verifyAndModifyToggleFx, stubPdfFixtures, addPdfsViaApi, pdfMetrics, wheelPdfUntil,
 * openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { pdfSelector as SEL } from "Selectors/appBuilder/components/pdf";
import { pdfText } from "Texts/appBuilder/components/pdf";
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
    openEditorSidebar,
    verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { stubPdfFixtures, addPdfsViaApi, pdfMetrics, wheelPdfUntil } from "Support/utils/appBuilder/components/pdf";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = pdfText;
const F = T.fixtures;
const MULTI = F.multiPage;
const W = T.defaultWidgetName;
const PX = 2; // layout tolerance (sub-pixel rounding of the page canvas)

// the page box each scale mode must produce for a root box
const fitToWidth = (root) => {
    const width = root.width + T.rootWidthInset - T.scaleWidthInset; // PDF.jsx:184 + :215
    return { width, height: width * F.pageRatio };
};
const fitToHeight = (root) => ({ width: root.height / F.pageRatio, height: root.height }); // PDF.jsx:185
const expectPageBox = (name, fit, label) =>
    pdfMetrics(name, (m) => {
        expect(m.pages, `${name}: rendered`).to.have.length(MULTI.pages);
        const want = fit(m.root);
        m.pages.forEach((p) => {
            expect(p.canvas.width, `${name} page ${p.n} width (${label})`).to.be.closeTo(want.width, PX);
            expect(p.canvas.height, `${name} page ${p.n} height (${label})`).to.be.closeTo(want.height, PX);
        });
    });

// the page with the most visible height inside the wrapper (lower page wins a tie) — PDF.jsx:78-87
const mostVisiblePage = (m) => {
    const top = m.scroller.rect.top;
    const bottom = top + m.scroller.clientHeight;
    let best = null;
    let bestH = 0;
    m.pages.forEach((p) => {
        const h = Math.max(0, Math.min(bottom, p.rect.bottom) - Math.max(top, p.rect.top));
        if (h > bestH + 0.5) {
            best = p.n;
            bestH = h;
        }
    });
    return best;
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app.
describe('PDF — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            stubPdfFixtures();
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-PDF-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            // the definition url (pdf.js:78) is fetched and drawn, page 1 of 3 in the footer
            cy.wait('@pdfDefault');
            pdfMetrics(W, (m) => {
                expect(m.pages.map((p) => p.text)).to.deep.eq([1, 2, 3].map((n) => `${MULTI.label} ${n}`));
                expect(m.footer && m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
            });
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: pdf.js:39
            verifyWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 300);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h - 200);
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
            pdfMetrics(W, (m) => expect(m.pages, 'pasted widget renders the document').to.have.length(MULTI.pages));
        });

        it('multi-select then select-all', () => {
            // a second PDF (640px tall, 20 columns wide) has no free drop slot beside the first one on this canvas,
            // so it is created by duplication (covered above) instead of a second palette drop
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
            cy.forceClickOnCanvas();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'contractpdf'); // asserts new name internally
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

    // ── PDF-BRW-001 ──────────────────────────────────────────────────────────
    describe('scale page to width', () => {
        const OFF = { value: '{{false}}' }; // pdf.js:81 toggle value
        // same height, different widths; 400px high so fit-to-height (≈297 wide) differs from fit-to-width (≈372)
        const slot = (left, width) => ({ top: 40, left, width, height: 400 }); // dynamic: side-by-side slots

        beforeEach(() => {
            stubPdfFixtures();
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-PDF-canvas-${Cypress._.uniqueId()}`);
            addPdfsViaApi([
                { name: 'pdfwidth', layout: slot(2, 12) },
                { name: 'pdfheight', layout: slot(15, 12), properties: { scale: OFF } },
                { name: 'pdfnarrow', layout: slot(28, 6), properties: { scale: OFF } },
            ]);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[PDF-BRW-001] On, pages fit the widget width; off, pages fit the widget height', () => {
            openLinkAppInViewer(SEL.root('pdfnarrow'));
            expectPageBox('pdfwidth', fitToWidth, 'fit to width');
            expectPageBox('pdfheight', fitToHeight, 'fit to height');
            // the two modes really differ for these boxes (the oracle can tell them apart)
            pdfMetrics('pdfwidth', (m) => {
                expect(Math.abs(fitToWidth(m.root).width - fitToHeight(m.root).width), 'modes distinguishable').to.be.gt(40);
                // fit to width: three pages taller than the widget → vertical scrolling
                expect(m.scroller.scrollHeight).to.be.gt(m.scroller.clientHeight);
            });
            pdfMetrics('pdfheight', (m) => {
                // fit to height: the page is narrower than the widget and centred in it
                expect(m.pages[0].canvas.width).to.be.lt(m.root.width - 40);
                expect(m.scroller.scrollWidth).to.be.lte(m.scroller.clientWidth);
            });

            // flipping the property in the editor switches the same widget between the two geometries
            cy.openApp('', undefined, undefined, SEL.root('pdfwidth'));
            expectPageBox('pdfwidth', fitToWidth, 'editor, on');
            openEditorSidebar('pdfwidth');
            verifyAndModifyToggleFx(T.scaleLabel, commonWidgetText.codeMirrorLabelTrue); // source: pdf.js:17,81
            expectPageBox('pdfwidth', fitToHeight, 'editor, off');
        });

        // PRODUCT BUG (kept red): the fitted page is `width - 12` wide (PDF.jsx:184): 3px root inset + 2px card border
        // leave only ~7px for the wrapper's vertical scrollbar. With a classic 15px scrollbar (Windows/Linux, Cypress
        // Electron) the page is 7px wider than the visible wrapper, and since the wrapper is overflow-x:auto
        // (PDF.jsx:235) a horizontal scrollbar appears in fit-to-width mode and the page's right edge is cut off.
        // Measured: root 381, card 381, page 371, visible 364, scrollbar 15. Overlay scrollbars (0px) hide it.
        it('[PDF-BRW-001] On, the fitted page is fully visible: no horizontal overflow beside the vertical scrollbar', () => {
            openLinkAppInViewer(SEL.root('pdfwidth'));
            expectPageBox('pdfwidth', fitToWidth, 'fit to width');
            cy.get(SEL.scroller('pdfwidth')).should(($sc) => {
                const sc = $sc[0];
                const page = sc.querySelector('canvas').getBoundingClientRect();
                const card = sc.parentElement.getBoundingClientRect();
                const root = sc.closest('[data-cy="pdfwidth"]').getBoundingClientRect();
                const geometry = {
                    rootWidth: Math.round(root.width),
                    cardWidth: Math.round(card.width),
                    pageWidth: Math.round(page.width),
                    visibleWidth: sc.clientWidth,
                    scrollbar: sc.offsetWidth - sc.clientWidth,
                };
                expect(
                    { pageFitsVisibleWidth: page.width <= sc.clientWidth + 0.5, horizontalOverflow: sc.scrollWidth > sc.clientWidth },
                    `fit-to-width geometry ${JSON.stringify(geometry)}`
                ).to.deep.eq({ pageFitsVisibleWidth: true, horizontalOverflow: false });
            });
        });

        it('[PDF-BRW-001] Off, a page wider than the widget is reachable by horizontal scrolling', () => {
            openLinkAppInViewer(SEL.root('pdfnarrow'));
            expectPageBox('pdfnarrow', fitToHeight, 'fit to height');
            pdfMetrics('pdfnarrow', (m) => {
                expect(m.pages[0].canvas.width, 'page wider than the wrapper').to.be.gt(m.scroller.clientWidth + 40);
                expect(m.scroller.scrollWidth, 'horizontal overflow').to.be.gt(m.scroller.clientWidth + 40);
                expect(m.scroller.overflowX, 'wrapper scrolls horizontally (PDF.jsx:235)').to.eq('auto');
                expect(m.scroller.scrollLeft).to.eq(0);
            });
            // a real horizontal wheel brings the page's right edge into the wrapper
            cy.get(SEL.scroller('pdfnarrow')).realMouseWheel({ deltaX: 400, scrollBehavior: false });
            pdfMetrics('pdfnarrow', (m) => {
                expect(m.scroller.scrollLeft, 'scrolled right').to.be.gt(40);
                const right = m.scroller.rect.left + m.scroller.clientWidth;
                expect(m.pages[0].canvas.right, 'page right edge visible').to.be.closeTo(right, PX + 1);
            });
        });
    });

    // ── PDF-BRW-006 ──────────────────────────────────────────────────────────
    describe('scroll paging', () => {
        beforeEach(() => {
            stubPdfFixtures();
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-PDF-canvas-${Cypress._.uniqueId()}`);
            addPdfsViaApi([
                { name: 'pdfscroll', layout: { top: 40, left: 2 } },
                { name: 'pdfother', layout: { top: 40, left: 22 } },
            ]);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        const atBottom = (sc) => sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
        const expectIndicator = (name, n) =>
            pdfMetrics(name, (m) => expect(m.footer && m.footer.indicator, `${name} counter`).to.eq(T.pageIndicator(n, MULTI.pages)));
        const openBoth = () => {
            openLinkAppInViewer(SEL.root('pdfother'));
            ['pdfscroll', 'pdfother'].forEach((name) =>
                pdfMetrics(name, (m) => {
                    expect(m.pages).to.have.length(MULTI.pages);
                    expect(m.footer && m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
                })
            );
        };

        it('[PDF-BRW-006] Wheel scrolling page by page moves "N of M" through every page and back, for that instance only', () => {
            openBoth();
            // each page in turn fills the wrapper (every fixture page is taller than the wrapper)
            pdfMetrics('pdfscroll', (m) => expect(m.pages[1].rect.height, 'page taller than the wrapper').to.be.gt(m.scroller.clientHeight));
            [2, 3].forEach((n) => {
                wheelPdfUntil('pdfscroll', (sc) => sc.scrollTop >= sc.querySelector(`.react-pdf__Page[data-page-number="${n}"]`).offsetTop || atBottom(sc), 300);
                expectIndicator('pdfscroll', n);
            });
            wheelPdfUntil('pdfscroll', (sc) => sc.scrollTop <= 0, -400);
            expectIndicator('pdfscroll', 1);

            // the other instance never moved: own scroll position and counter untouched
            pdfMetrics('pdfother', (m) => {
                expect(m.scroller.scrollTop).to.eq(0);
                expect(m.footer.indicator).to.eq(T.pageIndicator(1, MULTI.pages));
            });
            // and scrolling it drives only its own counter
            wheelPdfUntil('pdfother', atBottom, 400);
            expectIndicator('pdfother', 3);
            expectIndicator('pdfscroll', 1);
        });

        // PRODUCT BUG (kept red): the observer callback drops every entry until the first scroll event opens the
        // `hasScrollRef` gate (PDF.jsx:72), so the visible heights recorded at mount are lost. A page's height is only
        // recorded again when it crosses one of the 0.1-step thresholds (PDF.jsx:92); page 1 (836px, ~68% visible at
        // the top) does not cross one in the first ~300px of scrolling, while page 2 crosses 0 as soon as it peeks in —
        // so the counter jumps to page 2 when page 2 shows ~30px and page 1 still fills the wrapper.
        it('[PDF-BRW-006] After every wheel step the counter names the page that fills most of the wrapper', () => {
            openBoth();
            const seen = [];
            const expectCounterFollows = () =>
                pdfMetrics('pdfscroll', (m) => {
                    const want = mostVisiblePage(m);
                    const top = m.scroller.rect.top;
                    const visible = m.pages.map((p) => Math.round(Math.max(0, Math.min(top + m.scroller.clientHeight, p.rect.bottom) - Math.max(top, p.rect.top))));
                    expect(m.footer.indicator, `counter at scrollTop ${Math.round(m.scroller.scrollTop)} (visible px per page ${visible.join('/')})`)
                        .to.eq(T.pageIndicator(want, MULTI.pages));
                }).then(() => {
                    seen.push(Cypress.$(SEL.pageIndicator('pdfscroll')).text());
                });
            const scrollStep = (deltaY, doneFn, n = 0) => {
                expect(n, 'wheel steps').to.be.lt(20);
                cy.get(SEL.scroller('pdfscroll')).realMouseWheel({ deltaY, scrollBehavior: false });
                cy.wait(250); // the wheel's smooth scroll lands
                expectCounterFollows().then(() => {
                    const sc = Cypress.$(SEL.scroller('pdfscroll'))[0];
                    if (!doneFn(sc)) scrollStep(deltaY, doneFn, n + 1);
                });
            };
            // down to the bottom, then back to the top, checking the counter at every landing
            scrollStep(300, atBottom);
            cy.then(() => expect(Cypress._.uniq(seen), 'every page became current on the way down').to.include.members(
                [1, 2, 3].map((n) => T.pageIndicator(n, MULTI.pages))));
            scrollStep(-300, (sc) => sc.scrollTop <= 0);
            expectIndicator('pdfscroll', 1);
        });
    });
});
