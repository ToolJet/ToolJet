/**
 * SPEC — Image — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus the editor side of TESTING.md:
 *   Image-BRW-002 — dynamicHeight only takes effect in view mode (Image.jsx:73 `currentMode === 'view'`):
 *                   the same imported app keeps the authored fixed box in the editor canvas
 *                   (the viewer-side reflow lives in canvas.cy.js).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, importAppFixture, openAppInViewer,
 * expectLayout, stubDefaultImageSource.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { imageSelector } from "Selectors/appBuilder/components/image";
import { imageText } from "Texts/appBuilder/components/image";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { importAppFixture } from "Support/utils/appBuilder/components/baseInput";
import { openAppInViewer, expectLayout } from "Support/utils/appBuilder/components/textArea";
import { stubDefaultImageSource } from "Support/utils/appBuilder/components/image";

const W = imageText.defaultWidgetName;
const T = imageText;
const D = imageText.dynamic;
const PX = 2;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Image — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            stubDefaultImageSource(T.defaultSource);
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Image-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — show on desktop / mobile toggles visibility', () => {
            verifyLayout(W);
        });

        it('exposed-value context — imageURL observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'imageURL', type: 'String', value: `"${T.defaultSource}"` }, // source: image.js:36 + Image.jsx:100
            ], verifyNodeData);
        });
    });

    // ── Image-BRW-002 (editor side: the view-mode gate) ─────────────────────
    describe('imported app — dynamic height in the editor', () => {
        beforeEach(() => {
            cy.apiLogin();
            importAppFixture(T.dynamicHeightFixture, `${fake.companyName}-Image-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[Image-BRW-002] Editor canvas keeps the authored height; the viewer of the same app reflows', () => {
            cy.then(() => cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), imageSelector.img('image1')));
            cy.get(imageSelector.img('image1')).should(($img) => expect($img[0].naturalHeight, 'image loaded').to.be.gt(0));
            // edit mode: dynamicHeight on (source: imageDynamicHeight.json image1) but the box stays authored —
            // same as image2, whose dynamicHeight is off
            expectLayout((box) => {
                expect(box('image1').height, 'image1 authored height in the editor').to.be.closeTo(D.authoredHeight, PX);
                expect(box('image2').height, 'image2 authored height').to.be.closeTo(D.authoredHeight, PX);
                expect(box('text1').top - box('image1').bottom, 'text1 at its authored gap').to.be.closeTo(D.siblingGap, PX);
            });
            // the <img> keeps the fixed height (Image.jsx:214), so it is NOT drawn at the natural 1:2 ratio
            cy.get(imageSelector.img('image1')).should(($img) => {
                const r = $img[0].getBoundingClientRect();
                expect((r.height - 2) / (r.width - 2), 'fixed box, not natural ratio').to.be.lt(D.naturalRatio - 0.5);
            });

            // the same saved app in the viewer: the gate opens and the widget grows
            openAppInViewer(imageSelector.img('image1'));
            expectLayout((box) => {
                expect(box('image1').height, 'viewer grows past authored').to.be.gt(D.authoredHeight + 200);
                expect(box('image2').height, 'image2 still fixed').to.be.closeTo(D.authoredHeight, PX);
            });
        });
    });
});
