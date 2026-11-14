/**
 * SPEC — Svg Image — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   SvgImage-BRW-001 — collapse when hidden reclaims the Svg Image's space in the running app; showing restores it
 *   SvgImage-BRW-003 — an oversized vector is clipped by the container's hidden overflow, not drawn over its
 *                      neighbours, and the clip follows the widget when it is resized
 * Collapse-when-hidden only runs in view mode (RenderWidget.jsx:303-313), so those apps are seeded through the
 * components API (addSvgImagesViaApi) and opened in the viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addSvgImagesViaApi, svgBoxes, expectSvgDrawn, resizeWidgetBy, openLinkAppInViewer.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { svgImageSelector } from "Selectors/appBuilder/components/svgImage";
import { svgImageText } from "Texts/appBuilder/components/svgImage";
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
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { addSvgImagesViaApi, svgBoxes, expectSvgDrawn, resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";

const W = svgImageText.defaultWidgetName;
const T = svgImageText;
const PX = 2; // layout tolerance (px)

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
const insideWidget = (el, name) => !!el && !!el.closest(commonWidgetSelector.draggableWidget(name));
const isSvgPaint = (el) => !!el && !!el.closest('svg');

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app.
describe('Svg Image — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-SvgImage-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            // the default vector (svgImage.js:59) is drawn
            cy.get(`${svgImageSelector.svg(W)} rect`).first()
                .should('have.attr', 'x', T.defaultRect.x)
                .and('have.attr', 'width', T.defaultRect.width);
            cy.get(svgImageSelector.svg(W)).should('be.visible');
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
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 300);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'logovector'); // asserts new name internally
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

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-SvgImage-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        // ── SvgImage-BRW-001 ─────────────────────────────────────────────────
        // styles.visibility (svgImage.js:33-40) hides the widget (SvgImage.jsx:8 display:none); with
        // properties.collapseWhenHidden (svgImage.js:16-21) on, RenderWidget.jsx:303-313 schedules a reflow and
        // gridSlice.js:373-382 takes the hidden widget out of flow. Lane A collapses, lane B (collapse off) is the control.
        it('[SvgImage-BRW-001] Collapse when hidden reclaims the space in the running app; showing restores it', () => {
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to hide both Svg Images
            const visibility = { value: `{{components.textinput1.value !== "${hideWord}"}}` };
            const H = 100; // dynamic: authored Svg Image height (px)
            const GAP = 20; // dynamic: authored gap between each Svg Image and the Text below it
            addSvgImagesViaApi([
                { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 32, width: 8, height: 40 } },
                {
                    name: 'svgimage1',
                    layout: { top: 100, left: 2, width: 8, height: H },
                    properties: { collapseWhenHidden: { value: '{{true}}' } },
                    styles: { visibility },
                },
                { type: 'Text', name: 'text1', layout: { top: 100 + H + GAP, left: 2, width: 8, height: 40 }, properties: { text: { value: 'A' } } },
                {
                    name: 'svgimage2',
                    layout: { top: 100, left: 20, width: 8, height: H },
                    styles: { visibility }, // collapseWhenHidden stays {{false}} (svgImage.js:61)
                },
                { type: 'Text', name: 'text2', layout: { top: 100 + H + GAP, left: 20, width: 8, height: 40 }, properties: { text: { value: 'B' } } },
            ]);
            openLinkAppInViewer(commonWidgetSelector.draggableWidget('text1'));
            expectSvgDrawn('svgimage1');
            expectSvgDrawn('svgimage2');

            let before;
            cy.document().should(() => {
                before = { text1: box('text1').top, text2: box('text2').top, svgTop: box('svgimage1').top };
                expect(box('svgimage1').height, 'authored height').to.be.closeTo(H, PX);
                expect(before.text1 - box('svgimage1').bottom, 'text1 gap').to.be.closeTo(GAP, PX);
                expect(before.text2 - box('svgimage2').bottom, 'text2 gap').to.be.closeTo(GAP, PX);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).type(hideWord);
            cy.get(svgImageSelector.container('svgimage1')).should('have.css', 'display', 'none');
            cy.get(svgImageSelector.container('svgimage2')).should('have.css', 'display', 'none');
            cy.document().should(() => {
                // lane A: text1 moved up into the reclaimed space (by the Svg Image's height)
                expect(before.text1 - box('text1').top, 'text1 moved up').to.be.gte(H - PX);
                expect(box('text1').top, 'text1 not above the Svg Image\'s old top').to.be.gte(before.svgTop - PX);
                // lane B: no collapse → text2 keeps its place
                expect(box('text2').top, 'text2 unchanged').to.be.closeTo(before.text2, PX);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).clear();
            cy.get(svgImageSelector.container('svgimage1')).should('not.have.css', 'display', 'none');
            expectSvgDrawn('svgimage1');
            cy.document().should(() => {
                expect(box('svgimage1').height, 'height restored').to.be.closeTo(H, PX);
                expect(box('text1').top, 'text1 restored').to.be.closeTo(before.text1, PX);
                // no overlap: the Text sits below the restored Svg Image at the authored gap
                expect(box('text1').top - box('svgimage1').bottom, 'gap restored').to.be.closeTo(GAP, PX);
                expect(box('text2').top, 'text2 unchanged').to.be.closeTo(before.text2, PX);
            });
        });

        // ── SvgImage-BRW-003 ─────────────────────────────────────────────────
        // SvgImage.jsx:8 — the container is `overflow: hidden` and `height` = widgetHeight - 4 (RenderWidget.jsx:356).
        // A 600x600 vector in a ~100px box must be cut at the container edge: points of the vector's extent that
        // lie outside the box hit the canvas / the neighbouring widgets, never the vector.
        it('[SvgImage-BRW-003] An oversized vector is clipped to the widget box in the viewer and re-clipped after a resize', () => {
            const H = 100; // dynamic: authored Svg Image height (px)
            const S = T.oversizedSize;
            addSvgImagesViaApi([
                {
                    name: 'svgimage1',
                    layout: { top: 40, left: 2, width: 6, height: H },
                    properties: { data: { value: T.oversizedSvg } },
                },
                // neighbours inside the vector's 600x600 extent: one to the right, one below
                { type: 'Text', name: 'text1', layout: { top: 40, left: 12, width: 6, height: 40 }, properties: { text: { value: 'R' } } },
                { type: 'Text', name: 'text2', layout: { top: 320, left: 2, width: 6, height: 40 }, properties: { text: { value: 'B' } } },
            ]);

            // clipped: the container keeps the widget box, its content is larger, and outside points miss the vector
            const expectClipped = (context, expectedHeight) => {
                svgBoxes('svgimage1', (b) => {
                    expect(b.overflow, `${context}: container overflow`).to.eq('hidden');
                    // vertically the vector keeps its own 600px; horizontally the flex row shrinks the <svg> box to
                    // the container (SvgImage.jsx:12) — either way nothing may be drawn beyond the widget box
                    expect(b.svg.height, `${context}: vector keeps its own height`).to.be.closeTo(S, PX);
                    expect(b.svg.right, `${context}: vector box not wider than the container`).to.be.lte(b.container.right + 0.5);
                    expect(b.container.height, `${context}: container = widget height - 4`).to.be.closeTo(
                        b.widget.height - T.containerInset, PX
                    );
                    if (expectedHeight) expect(b.widget.height, `${context}: widget height`).to.be.closeTo(expectedHeight, PX);
                    expect(b.container.bottom, `${context}: container inside the widget box`).to.be.lte(b.widget.bottom + 0.5);
                    expect(b.container.right, `${context}: container inside the widget box`).to.be.lte(b.widget.right + 0.5);
                    expect(b.scrollHeight, `${context}: content taller than the box`).to.be.gt(b.clientHeight + 100);
                });
                svgBoxes('svgimage1', (b) => {
                    const doc = b.el.ownerDocument;
                    const hit = (x, y) => doc.elementFromPoint(x, y);
                    // inside the box the vector is painted
                    expect(isSvgPaint(hit(b.container.left + 10, b.container.top + 10)), `${context}: vector painted inside`).to.be.true;
                    // below the box (empty canvas, still inside the vector's extent): not painted
                    const below = hit(b.container.left + 10, b.container.bottom + 30);
                    expect(isSvgPaint(below), `${context}: nothing painted below the box`).to.be.false;
                    expect(insideWidget(below, 'svgimage1'), `${context}: below the box is outside the widget`).to.be.false;
                    // the neighbours inside the vector's extent are hit, not covered by the vector
                    const t1 = box('text1');
                    const t2 = box('text2');
                    expect(t1.left, 'text1 lies inside the vector\'s 600px extent').to.be.lt(b.container.left + S);
                    expect(t2.top, 'text2 lies inside the vector\'s 600px extent').to.be.lt(b.svg.bottom);
                    expect(insideWidget(hit(t1.left + t1.width / 2, t1.top + t1.height / 2), 'text1'), `${context}: text1 not covered`).to.be.true;
                    expect(insideWidget(hit(t2.left + t2.width / 2, t2.top + t2.height / 2), 'text2'), `${context}: text2 not covered`).to.be.true;
                });
            };

            openLinkAppInViewer(commonWidgetSelector.draggableWidget('text2'));
            expectSvgDrawn('svgimage1');
            expectClipped('viewer', H);

            // control: the probe is discriminating — without the hidden overflow the vector WOULD paint below the box
            svgBoxes('svgimage1', (b) => expect(b.overflow).to.eq('hidden')).then(($c) => {
                const c = $c[0];
                c.style.overflow = 'visible';
                const r = c.getBoundingClientRect();
                const el = c.ownerDocument.elementFromPoint(r.left + 10, r.bottom + 30);
                expect(isSvgPaint(el), 'control: unclipped vector paints below the box').to.be.true;
                c.style.overflow = 'hidden';
            });

            // narrower real viewport → the grid box narrows (width is a % of the canvas) and the clip follows it
            let wideWidth;
            svgBoxes('svgimage1', (b) => { wideWidth = b.container.width; });
            cy.viewport(900, 800); // dynamic: narrower desktop viewport
            svgBoxes('svgimage1', (b) => expect(b.container.width, 'narrower box').to.be.lt(wideWidth - 10));
            expectClipped('viewer, narrower viewport');
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));

            // resize the widget in the editor (taller and wider), then the saved app re-clips at the new box
            cy.then(() =>
                cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), commonWidgetSelector.draggableWidget('svgimage1'))
            );
            cy.get('[data-cy="query-manager-toggle-button"]').click();
            getWidgetRect('svgimage1').then((before) => {
                resizeWidgetBy('svgimage1', 40, 80);
                verifyWidgetResized('svgimage1', before);
                getWidgetRect('svgimage1').then((after) => {
                    expect(after.h, 'resized taller').to.be.gt(before.h + 40);
                    expectClipped('editor, resized', after.h);

                    openLinkAppInViewer(commonWidgetSelector.draggableWidget('text2'));
                    expectSvgDrawn('svgimage1');
                    expectClipped('viewer, resized', after.h);
                    svgBoxes('svgimage1', (b) => expect(b.container.height, 'container grew with the box').to.be.gt(H + 30));
                });
            });
        });
    });
});
