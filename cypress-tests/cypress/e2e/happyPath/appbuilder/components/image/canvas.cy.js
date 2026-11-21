/**
 * SPEC — Image — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   Image-BRW-001 — a top-level image below the fold is a placeholder until the canvas first scrolls (#1705 offset,
 *                   by design), then mounts and loads
 *   Image-BRW-002 — dynamicHeight reflows the widget to the image's natural aspect-ratio height (viewer side;
 *                   the editor-side mode gate lives in contexts.cy.js)
 * BRW-001/002 import fixture apps with SVG data-URI images (no network) and measure them in the viewer.
 * Image.jsx:353 repeats the `draggable-widget-<name>` data-cy inside the grid wrapper, so count/move/multi-select
 * use the Image variants that target `.canvas-component` only.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * importAppFixture, openAppInViewer, expectLayout, stubDefaultImageSource, verifyImageWidgetCount,
 * moveImageWidget, multiSelectImageWidgets, wheelCanvasUntil.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { imageSelector } from "Selectors/appBuilder/components/image";
import { imageText } from "Texts/appBuilder/components/image";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    duplicateWidgetByKeyboard,
    duplicateWidgetFromMenu,
    copyPasteWidget,
    cutWidget,
    pasteWidget,
    nudgeWidget,
    selectAllWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import { importAppFixture } from "Support/utils/appBuilder/components/baseInput";
import { openAppInViewer, expectLayout } from "Support/utils/appBuilder/components/textArea";
import {
    stubDefaultImageSource,
    verifyImageWidgetCount,
    moveImageWidget,
    multiSelectImageWidgets,
    wheelCanvasUntil,
} from "Support/utils/appBuilder/components/image";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = imageText;
const D = imageText.dynamic;
const PX = 2; // layout tolerance (sub-pixel rounding of grid offsets)

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app.
describe('Image — canvas facet', { testIsolation: false }, () => {
    describe('canvas operations', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            stubDefaultImageSource(T.defaultSource);
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Image-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            // the default source (image.js:283) renders as a real <img>, not the broken-image fallback
            cy.get(imageSelector.img(W)).should('have.attr', 'src', T.defaultSource);
            cy.get(imageSelector.img(W)).should(($img) => expect($img[0].naturalWidth, 'image loaded').to.be.gt(0));
            verifyImageWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                moveImageWidget(W, 650, 450);
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
            verifyImageWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyImageWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyImageWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 500);
            closeQueryPanel();

            multiSelectImageWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'logo'); // asserts new name internally
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

    // ── Image-BRW-001 ───────────────────────────────────────────────────────
    // Top-level image (parentId null) renders inside react-lazyload with scrollContainer '.canvas-content'
    // (Image.jsx:363-373): a placeholder until the viewer's canvas scroller brings it near the viewport.
    describe('running app — lazy loading', () => {
        const W = 'image1';
        // distance of the image's top below the bottom of the visible canvas
        const belowFold = (doc) => {
            const sc = doc.querySelector(imageSelector.canvasScroller).getBoundingClientRect();
            return doc.querySelector(imageSelector.draggableWidget(W)).getBoundingClientRect().top - sc.bottom;
        };

        beforeEach(() => {
            cy.apiLogin();
            importAppFixture(T.lazyLoadFixture, `${fake.companyName}-Image-lazy-${Cypress._.uniqueId()}`);
            openAppInViewer('[data-cy="draggable-widget-text1"]');
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // BY DESIGN (triage B-03): computeOffset() (Image.jsx:182-189) hands LazyLoad an `offset` equal to the
        // image's own distance below the fold at mount — a deliberate workaround for #1705 "Image isn't showing if
        // it's below the default viewport" (1d233ee468, #1739). So the image is a placeholder until the canvas
        // first scrolls, and the first scroll of any size mounts and loads it, even while still far below the fold.
        it('[Image-BRW-001] Far below the fold the image is a placeholder on load and the first small scroll mounts it', () => {
            // source: imageLazyLoad.json image1 top 3000 (canvas viewport ~900px)
            cy.document().should((doc) => expect(belowFold(doc), 'image starts far below the fold').to.be.gt(1500));
            cy.get(imageSelector.placeholder(W)).should('exist');
            cy.get(imageSelector.img(W)).should('not.exist');
            // no scroll yet: it stays lazy past the LazyLoad debounce (500ms, Image.jsx:369) — not mounted eagerly
            cy.wait(1200); // proving a negative needs the debounce window to pass
            cy.get(imageSelector.img(W)).should('not.exist');
            cy.get(imageSelector.placeholder(W)).should('exist');

            // a small real wheel scroll — the image is still ~2000px below the fold, yet the #1705 offset mounts it
            wheelCanvasUntil((sc) => sc.scrollTop > 0, 40);
            cy.document().should((doc) => expect(belowFold(doc), 'still far below the fold').to.be.gt(1500));
            cy.get(imageSelector.placeholder(W)).should('not.exist');
            cy.get(imageSelector.img(W)).should('exist')
                .and(($img) => expect($img[0].naturalWidth, 'loaded at natural size').to.eq(T.lazy.naturalWidth)); // source: imageLazyLoad.json 200x200 SVG
        });

        it('[Image-BRW-001] Scrolled into view, the image mounts and loads', () => {
            cy.get(imageSelector.img(W)).should('not.exist');
            // real wheel steps until the image is inside the canvas view
            wheelCanvasUntil((sc, doc) => belowFold(doc) < 0, 400);
            cy.get(imageSelector.placeholder(W)).should('not.exist');
            cy.get(imageSelector.img(W)).should('be.visible')
                .and(($img) => expect($img[0].naturalWidth, 'loaded at natural size').to.eq(T.lazy.naturalWidth)); // source: imageLazyLoad.json 200x200 SVG
        });
    });

    // ── Image-BRW-002 (viewer side) ─────────────────────────────────────────
    describe('running app — dynamic height', () => {
        // rendered <img> aspect minus its 1px border (Image.jsx:216 `border: '1px solid'`)
        const imgRatio = (doc, name) => {
            const r = doc.querySelector(imageSelector.img(name)).getBoundingClientRect();
            return (r.height - 2) / (r.width - 2);
        };
        const imgBox = (doc, name) => doc.querySelector(imageSelector.img(name)).getBoundingClientRect();

        beforeEach(() => {
            cy.apiLogin();
            importAppFixture(T.dynamicHeightFixture, `${fake.companyName}-Image-dyn-${Cypress._.uniqueId()}`);
            openAppInViewer(imageSelector.img('image1'));
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[Image-BRW-002] Viewer: the widget takes the natural aspect-ratio height and reflows the widget below', () => {
            let grownAtWide;
            cy.document().should((doc) => {
                // the image renders at its natural 1:2 ratio for the widget's width (source: imageDynamicHeight.json 200x400 SVG)
                expect(imgRatio(doc, 'image1'), 'natural aspect ratio').to.be.closeTo(D.naturalRatio, 0.02);
                // and the grid box wraps it (wrapper padding only) instead of the authored 240
                const img = imgBox(doc, 'image1');
                const w = doc.querySelector(imageSelector.draggableWidget('image1')).getBoundingClientRect();
                expect(w.height - img.height, 'widget wraps the image').to.be.closeTo(w.width - img.width, PX);
            });
            expectLayout((box) => {
                grownAtWide = box('image1').height;
                expect(grownAtWide, 'grew past the authored height').to.be.gt(D.authoredHeight + 200);
                // sibling reflowed: authored 20px gap kept below the grown image. source: imageDynamicHeight.json text1 top 290
                expect(box('text1').top - box('image1').bottom, 'text1 gap').to.be.closeTo(D.siblingGap, PX);
                // control — dynamic height off keeps the fixed box and its sibling where authored
                expect(box('image2').height, 'image2 fixed').to.be.closeTo(D.authoredHeight, PX);
                expect(box('text2').top - box('image2').bottom, 'text2 gap').to.be.closeTo(D.siblingGap, PX);
            });

            // narrower real width → the widget shrinks with the image, keeping the ratio and the gap
            cy.viewport(1000, 960);
            expectLayout((box) => {
                expect(box('image1').height, 'shrank with the narrower width').to.be.lt(grownAtWide - 100);
                expect(box('image1').height, 'still taller than the fixed box').to.be.gt(D.authoredHeight + 100);
                expect(box('text1').top - box('image1').bottom, 'text1 gap').to.be.closeTo(D.siblingGap, PX);
                expect(box('image2').height, 'image2 fixed').to.be.closeTo(D.authoredHeight, PX);
            });
            cy.document().should((doc) => expect(imgRatio(doc, 'image1')).to.be.closeTo(D.naturalRatio, 0.02));
        });
    });
});
