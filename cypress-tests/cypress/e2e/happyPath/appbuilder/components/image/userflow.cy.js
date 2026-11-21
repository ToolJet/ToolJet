/**
 * SPEC — Image — userflow facet.
 * FOR AI: real-pointer zoom flows from TESTING.md (react-zoom-pan-pinch needs real geometry):
 *   Image-BRW-003   — click-to-zoom-in up to max scale, then click-to-zoom-out back to 1; real drag pans the
 *                     zoomed image (Image.jsx:275-306)
 *   Image-STATE-009 — (folded into BRW-003) the zoom click handler is not gated on disabledState, while the
 *                     plain onClick event is (Image.jsx:227 vs :292-306)
 * Real two-finger pinch is not reproducible with Cypress (single CDP pointer) — covered by click/drag only.
 * Helpers: importAppFixture, openAppInViewer, expectZoom, readSettledZoom, clickZoomSurface, clickZoomUntil,
 * dragZoomSurface.
 */
import { fake } from "Fixtures/fake";
import { imageSelector } from "Selectors/appBuilder/components/image";
import { imageText } from "Texts/appBuilder/components/image";
import { importAppFixture } from "Support/utils/appBuilder/components/baseInput";
import { openAppInViewer } from "Support/utils/appBuilder/components/textArea";
import {
    expectZoom,
    readSettledZoom,
    clickZoomSurface,
    clickZoomUntil,
    dragZoomSurface,
} from "Support/utils/appBuilder/components/image";

const T = imageText;
const Z = imageText.zoom;
const clickedText = '[data-cy="draggable-widget-text1"]';

describe('Image — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        importAppFixture(T.zoomFixture, `${fake.companyName}-Image-userflow-${Cypress._.uniqueId()}`);
        openAppInViewer(imageSelector.img('image1'));
        cy.get(imageSelector.img('image2')).should('be.visible');
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Image-BRW-003 ───────────────────────────────────────────────────────
    it('[Image-BRW-003] Click zooms in step by step to max scale, then clicks zoom back out to 1', () => {
        const W = 'image1';
        expectZoom(W, (z) => expect(z.scale, 'starts unzoomed').to.eq(1));
        cy.get(imageSelector.zoomSurface(W)).realHover({ scrollBehavior: false });
        cy.get(imageSelector.zoomSurface(W)).should('have.css', 'cursor', 'zoom-in'); // Image.jsx:320

        // zoom in: every click raises the scale until it pins at max (react-zoom-pan-pinch maxScale 8)
        clickZoomUntil(W, (z) => z.scale === Z.maxScale,
            (prev, z) => expect(z.scale, `zoom-in click from ${prev.scale}`).to.be.gt(prev.scale + 0.5));
        // at max the next click flips the mode to zoom-out (handleZoomMode, Image.jsx:287-290)
        clickZoomSurface(W);
        cy.get(imageSelector.zoomSurface(W)).should('have.css', 'cursor', 'zoom-out');

        // zoom out: every click lowers the scale until it is back at 1
        clickZoomUntil(W, (z) => z.scale === 1,
            (prev, z) => expect(z.scale, `zoom-out click from ${prev.scale}`).to.be.lt(prev.scale));
        // at 1 the next click flips back to zoom-in without zooming
        clickZoomSurface(W);
        cy.get(imageSelector.zoomSurface(W)).should('have.css', 'cursor', 'zoom-in');
        readSettledZoom(W).then((z) => expect(z.scale, 'still unzoomed').to.eq(1));
        // and zooming in works again
        clickZoomSurface(W);
        expectZoom(W, (z) => expect(z.scale, 'zooms in again').to.be.gt(1.5));
    });

    it('[Image-BRW-003] A real drag pans the zoomed image without changing its scale', () => {
        const W = 'image1';
        clickZoomUntil(W, (z) => z.scale > 3, () => {});

        readSettledZoom(W).then((before) => {
            dragZoomSurface(W, 60, 40);
            expectZoom(W, (z) => {
                expect(z.scale, 'drag does not zoom (handleClick skips while dragging)').to.eq(before.scale);
                expect(z.x - before.x, 'panned right').to.be.gt(30);
                expect(z.y - before.y, 'panned down').to.be.gt(20);
            });
        });
        readSettledZoom(W).then((before) => {
            dragZoomSurface(W, -80, -50);
            expectZoom(W, (z) => {
                expect(z.scale).to.eq(before.scale);
                expect(z.x - before.x, 'panned left').to.be.lt(-30);
                expect(z.y - before.y, 'panned up').to.be.lt(-20);
            });
        });
    });

    // ── Image-STATE-009 (folded into Image-BRW-003) ─────────────────────────
    it('[Image-BRW-003][Image-STATE-009] Disabled: click-to-zoom still works while onClick does not fire', () => {
        cy.get(imageSelector.wrapper('image2')).should('have.attr', 'data-disabled', 'true'); // source: imageZoom.json image2 disabledState
        cy.get(clickedText).should('have.text', Z.clickedNone);

        clickZoomSurface('image2');
        // zoom handler has no isDisabled gate (Image.jsx:292-306) → it zooms
        expectZoom('image2', (z) => expect(z.scale, 'disabled image still zooms').to.be.gt(1.5));
        // the plain onClick IS gated (Image.jsx:227) → variables.imageClicked never set
        cy.get(clickedText).should('have.text', Z.clickedNone);

        // contrast — the enabled image fires onClick on the same gesture
        clickZoomSurface('image1');
        cy.get(clickedText).should('have.text', Z.clickedImage1);
        expectZoom('image1', (z) => expect(z.scale).to.be.gt(1.5));
    });
});
