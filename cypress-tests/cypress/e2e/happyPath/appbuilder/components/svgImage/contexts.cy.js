/**
 * SPEC — Svg Image — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   SvgImage-BRW-002 — Show on desktop / Show on mobile select the surfaces the Svg Image appears on, for toggle
 *                      values and expression-resolved values, in the editor layouts and the running app
 * Device gate: WidgetWrapper.jsx:125-128 reads others.showOnMobile on the mobile layout, showOnDesktop otherwise;
 * the viewer picks mobile when ?layout=mobile or the screen is narrower than 600px (Viewer.jsx:88,140-143).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * addSvgImagesViaApi, expectSvgDrawn, openLinkAppInViewer, viewerPath.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { svgImageSelector } from "Selectors/appBuilder/components/svgImage";
import { svgImageText } from "Texts/appBuilder/components/svgImage";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer, viewerPath } from "Support/utils/appBuilder/components/link";
import { addSvgImagesViaApi, expectSvgDrawn } from "Support/utils/appBuilder/components/svgImage";

const W = svgImageText.defaultWidgetName;
const T = svgImageText;

// saved device combinations, every flag an expression (others.showOnDesktop / showOnMobile — svgImage.js:27-30,
// defaults svgImage.js:53-54). `bound` resolves its desktop flag from another widget at runtime.
const TRUE_EXPR = { value: '{{[1, 2].length === 2}}' }; // dynamic: resolves to true
const FALSE_EXPR = { value: '{{"tooljet".length < 3}}' }; // dynamic: resolves to false
const DEVICE_SVGS = [
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
    // wait on a widget that must be there, then check every combination
    expectSvgDrawn('bothdevices');
    Object.entries(EXPECTED[layout]).forEach(([name, shown]) => {
        if (shown) expectSvgDrawn(name);
        else cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
    });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Svg Image — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-SvgImage-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── SvgImage-BRW-002 (inspector toggles + fx, editor layouts) ────────
        it('[SvgImage-BRW-002] Show on desktop / Show on mobile toggles gate the Svg Image on the matching editor layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (svgImage.js:53-54): on the desktop canvas, absent from the mobile canvas
            cy.get(svgImageSelector.svg(W)).should('be.visible');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('exist');

            // desktop off → gone from desktop
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas, still hidden on desktop (the flags are independent)
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(svgImageSelector.svg(W)).should('be.visible');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — only the universal id is exposed in the inspector tree', () => {
            // svgImage.js:43 exposedVariables {} — RenderWidget.jsx:291 still exposes the component id
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [], () => {});
            cy.get('[data-cy="inspector-id-label"]').should('have.text', 'id');
            cy.get('[data-cy="inspector-id-value"]').invoke('text').should('match', /^"[0-9a-f-]{36}"$/);
        });
    });

    // ── SvgImage-BRW-002 (expression-resolved saved values: editor ↔ running app, desktop ↔ mobile) ─
    describe('saved device expressions', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-SvgImage-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        it('[SvgImage-BRW-002] Expression-resolved device flags select the same surfaces in the editor and the running app on desktop and mobile', () => {
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to flip the bound desktop flag
            addSvgImagesViaApi([
                ...DEVICE_SVGS.map(({ name, others }, i) => ({ name, others, layout: { top: 40 + i * 70, left: 4, height: 50 } })),
                // a desktop flag that re-resolves at runtime from another widget's value
                {
                    name: 'bound',
                    others: { showOnDesktop: { value: `{{components.textinput1.value !== "${hideWord}"}}` } },
                    layout: { top: 40, left: 20, height: 50 },
                },
                { type: 'TextInput', name: 'textinput1', layout: { top: 120, left: 20, width: 8, height: 40 } },
            ]);

            // editor canvas
            cy.then(() =>
                cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), commonWidgetSelector.draggableWidget('bothdevices'))
            );
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // running app — desktop
            openLinkAppInViewer(null);
            expectDeviceSet('desktop', 'running app');
            // the bound expression re-resolves: typing the word hides it on desktop, clearing shows it again
            expectSvgDrawn('bound');
            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).type(hideWord);
            cy.get(commonWidgetSelector.draggableWidget('bound')).should('not.exist');
            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).clear();
            expectSvgDrawn('bound');

            // running app — the editor's Preview from the mobile layout (?layout=mobile)
            cy.then(() => cy.visit(viewerPath(null, '&layout=mobile')));
            expectDeviceSet('mobile', 'running app (?layout=mobile)');

            // running app on a phone: the viewer reads window.screen.width (Viewer.jsx:88,142), so a phone-sized
            // viewport plus a phone screen width selects the mobile layout without the query flag
            cy.viewport(390, 844); // dynamic: phone viewport
            cy.then(() =>
                cy.visit(viewerPath(), {
                    onBeforeLoad(win) {
                        Object.defineProperty(win.screen, 'width', { configurable: true, get: () => 390 }); // dynamic: phone
                    },
                })
            );
            expectDeviceSet('mobile', 'running app (phone)');
        });
    });
});
