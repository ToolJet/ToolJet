/**
 * SPEC — Bounded Box — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   BoundedBox-BRW-003 — (device / editor side) Show on desktop / Show on mobile select the surfaces the Bounded Box
 *                        appears on in the editor and the running app; in the editor a hidden collapse-when-hidden
 *                        box keeps its place (collapse is view-mode only, RenderWidget.jsx:302-311) and showing it
 *                        again restores the same annotations. The viewer-side collapse reflow lives in canvas.cy.js.
 * Device gate: the viewer picks the mobile layout with ?layout=mobile (the editor's Preview URL from mobile).
 * Helpers: verifyLayout, switchLayout, stubDefaultImageSource, openIconAppInViewer, addBoundedBoxesViaApi,
 * annotationsProbe, expectAnnotations, readAnnotations, bboxState, waitForImage, drawRectangle, chooseLabel,
 * svgDataUri.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { boundedBoxSelector as S } from "Selectors/appBuilder/components/boundedBox";
import { boundedBoxText as T } from "Texts/appBuilder/components/boundedBox";
import { verifyLayout, switchLayout } from "Support/utils/appBuilder/layout";
import { stubDefaultImageSource } from "Support/utils/appBuilder/components/image";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import {
    addBoundedBoxesViaApi,
    annotationsProbe,
    expectAnnotations,
    readAnnotations,
    bboxState,
    waitForImage,
    drawRectangle,
    chooseLabel,
    svgDataUri,
} from "Support/utils/appBuilder/components/boundedBox";

const W = T.defaultWidgetName;
const PX = 2;
const EMPTY_DEFAULT = { value: '{{[]}}' };

// saved device combinations, every flag an expression (others.showOnDesktop / showOnMobile — boundedBox.js:9-12,
// defaults boundedBox.js:114-115)
const TRUE_EXPR = { value: '{{[1, 2].length === 2}}' }; // dynamic: resolves to true
const FALSE_EXPR = { value: '{{"tooljet".length < 3}}' }; // dynamic: resolves to false
const DEVICE_BOXES = [
    { name: 'desktoponly', others: { showOnDesktop: TRUE_EXPR, showOnMobile: FALSE_EXPR } },
    { name: 'mobileonly', others: { showOnDesktop: FALSE_EXPR, showOnMobile: TRUE_EXPR } },
    { name: 'bothdevices', others: { showOnDesktop: TRUE_EXPR, showOnMobile: TRUE_EXPR } },
    { name: 'nodevice', others: { showOnDesktop: FALSE_EXPR, showOnMobile: FALSE_EXPR } },
];
const EXPECTED = {
    desktop: { desktoponly: true, mobileonly: false, bothdevices: true, nodevice: false },
    mobile: { desktoponly: false, mobileonly: true, bothdevices: true, nodevice: false },
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device gates — ${context} (${layout})`);
    cy.get(S.root('bothdevices'), { timeout: 30000 }).should('exist');
    Object.entries(EXPECTED[layout]).forEach(([name, shown]) => {
        if (shown) waitForImage(name); // rendered with its image loaded and laid out
        else cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
    });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Bounded Box — contexts facet', { testIsolation: false }, () => {
    let labels;

    beforeEach(() => {
        labels = [fake.firstName.slice(0, 8) || 'alpha', fake.lastName.slice(0, 8) || 'beta']; // dynamic label texts
        if (labels[0] === labels[1]) labels[1] = `${labels[1]}2`;
    });

    describe('dropped widget', () => {
        beforeEach(() => {
            stubDefaultImageSource(T.defaultImageUrlGlob);
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-BoundedBox-contexts-${Cypress._.uniqueId()}`);
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
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-BoundedBox-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.get('body').realMouseMove(0, 0, { position: 'topLeft', scrollBehavior: false });
            cy.apiDeleteApp();
        });

        it('exposed-value context — an annotation drawn on the editor canvas is published as annotations', () => {
            addBoundedBoxesViaApi([
                {
                    name: W,
                    properties: {
                        imageUrl: { value: svgDataUri(400, 200) },
                        defaultValue: EMPTY_DEFAULT,
                        labels: { value: `{{${JSON.stringify(labels)}}}` },
                    },
                },
                annotationsProbe('probe', W),
            ]);
            cy.openApp('', undefined, undefined, S.root(W));
            waitForImage(W);
            expectAnnotations('probe', (list) => expect(list, 'empty default').to.deep.eq([]));
            drawRectangle(W, [0.2, 0.2], [0.6, 0.7]);
            chooseLabel(S.editorControl(W), labels[1]);
            expectAnnotations('probe', (list) => {
                expect(list).to.have.length(1);
                expect(list[0]).to.include({ type: T.selectorRectangle, text: labels[1] });
                expect(list[0].x).to.be.closeTo(20, 2);
                expect(list[0].width).to.be.closeTo(40, 2);
            });
        });

        // ── BoundedBox-BRW-003 (device flags) ──────────────────────────────
        it('[BoundedBox-BRW-003] Expression-resolved device flags select the same surfaces in the editor and the running app on desktop and mobile', () => {
            addBoundedBoxesViaApi(
                DEVICE_BOXES.map(({ name, others }, i) => ({
                    name,
                    others,
                    layout: { top: 40 + i * 230, left: 2, width: 10, height: 220 },
                    properties: { imageUrl: { value: svgDataUri(400, 200) }, defaultValue: EMPTY_DEFAULT },
                }))
            );

            cy.openApp('', undefined, undefined, S.root('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            openIconAppInViewer(S.root('bothdevices'));
            expectDeviceSet('desktop', 'running app');
            openIconAppInViewer(S.root('bothdevices'), { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'running app');
        });

        // ── BoundedBox-BRW-003 (editor side of collapse) ───────────────────
        it('[BoundedBox-BRW-003] In the editor a hidden collapse-when-hidden box keeps its place and shows the same annotations again', () => {
            const hideWord = fake.firstName.toLowerCase() || 'hide'; // dynamic: typed to hide the box
            addBoundedBoxesViaApi([
                {
                    name: 'collapsing',
                    layout: { top: 40, left: 2, width: 12, height: 300 },
                    properties: {
                        imageUrl: { value: svgDataUri(400, 200) },
                        defaultValue: EMPTY_DEFAULT,
                        labels: { value: `{{${JSON.stringify(labels)}}}` },
                        collapseWhenHidden: { value: '{{true}}' }, // source: boundedBox.js:50-55
                    },
                    styles: { visibility: { value: `{{components.textinput1.value !== "${hideWord}"}}` } },
                },
                { type: 'Text', name: 'text1', layout: { top: 350, left: 2, width: 12, height: 40 }, properties: { text: { value: 'below' } } },
                { type: 'TextInput', name: 'textinput1', layout: { top: 40, left: 32, width: 8, height: 40 } },
                annotationsProbe('probe', 'collapsing', { top: 100, left: 32, width: 10 }),
            ]);
            cy.openApp('', undefined, undefined, S.root('collapsing'));
            waitForImage('collapsing');
            drawRectangle('collapsing', [0.1, 0.1], [0.4, 0.5]);
            chooseLabel(S.editorControl('collapsing'), labels[0]);
            expectAnnotations('probe', (l) => expect(l).to.have.length(1));

            const gapToText = (doc) => {
                const top = (n) => doc.querySelector(commonWidgetSelector.draggableWidget(n)).getBoundingClientRect().top;
                return top('text1') - top('textinput1');
            };
            readAnnotations('probe').then((before) => {
                cy.document().then((doc) => {
                    const shownGap = gapToText(doc);
                    cy.get('[data-cy="draggable-widget-textinput1"] input').first().type(hideWord);
                    // hidden: the box root is display:none, but the editor keeps the grid slot — text1 does not move
                    cy.get(S.root('collapsing')).should('have.css', 'display', 'none');
                    cy.document().should((d) => expect(gapToText(d), 'text1 stays in the editor').to.be.closeTo(shownGap, PX));
                    cy.get('[data-cy="draggable-widget-textinput1"] input').first().clear();
                    cy.get(S.root('collapsing')).should('have.css', 'display', 'block');
                    cy.document().should((d) => expect(gapToText(d)).to.be.closeTo(shownGap, PX));
                });
                expectAnnotations('probe', (l) => expect(l, 'same annotations after showing').to.deep.eq(before));
                bboxState('collapsing', (s) => {
                    expect(s.highlights).to.have.length(1);
                    expect(s.highlights[0].text).to.eq(labels[0]);
                });
            });
        });
    });
});
