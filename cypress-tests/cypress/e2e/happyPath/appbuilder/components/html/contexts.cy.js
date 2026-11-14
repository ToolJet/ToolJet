/**
 * SPEC — HTML Viewer — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   Html-BRW-003 — Show on desktop / Show on mobile select the surfaces the HTML Viewer appears on, for toggle
 *                  values (inspector, editor layouts) and expression-resolved values (editor + running app,
 *                  desktop + mobile, including an expression that re-resolves at runtime)
 * Device gate: WidgetWrapper reads others.showOnMobile on the mobile layout, showOnDesktop otherwise; the viewer
 * picks mobile when ?layout=mobile or the screen is narrower than 600px.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, openLinkAppInViewer, viewerPath, addHtmlWidgetsViaApi.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { htmlSelector } from "Selectors/appBuilder/components/html";
import { htmlText } from "Texts/appBuilder/components/html";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer, viewerPath } from "Support/utils/appBuilder/components/link";
import { addHtmlWidgetsViaApi } from "Support/utils/appBuilder/components/html";

const W = htmlText.defaultWidgetName;
const T = htmlText;

// saved device combinations, every flag an expression (others.showOnDesktop / showOnMobile — html.js:75-77,
// defaults html.js:127-128). Each widget renders its own name, so presence is checked on authored content.
const TRUE_EXPR = { value: '{{[1, 2].length === 2}}' }; // dynamic: resolves to true
const FALSE_EXPR = { value: '{{"tooljet".length < 3}}' }; // dynamic: resolves to false
const DEVICE_HTML = [
    { name: 'desktoponly', others: { showOnDesktop: TRUE_EXPR, showOnMobile: FALSE_EXPR } },
    { name: 'mobileonly', others: { showOnDesktop: FALSE_EXPR, showOnMobile: TRUE_EXPR } },
    { name: 'bothdevices', others: { showOnDesktop: TRUE_EXPR, showOnMobile: TRUE_EXPR } },
    { name: 'nodevice', others: { showOnDesktop: FALSE_EXPR, showOnMobile: FALSE_EXPR } },
];
const EXPECTED = {
    desktop: { desktoponly: true, mobileonly: false, bothdevices: true, nodevice: false },
    mobile: { desktoponly: false, mobileonly: true, bothdevices: true, nodevice: false },
};
const authoredId = (name) => `authored-${name}`;
const expectDeviceSet = (layout, context) => {
    cy.log(`device gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(htmlSelector.authored('bothdevices', authoredId('bothdevices')), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, shown]) => {
        if (shown) cy.get(htmlSelector.authored(name, authoredId(name))).should('be.visible').and('have.text', name);
        else cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
    });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('HTML Viewer — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Html-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Html-BRW-003 (inspector toggles, editor layouts) ─────────────────
        it('[Html-BRW-003] Show on desktop / Show on mobile toggles gate the HTML Viewer on the matching editor layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (html.js:127-128): on the desktop canvas, absent from the mobile canvas
            cy.get(htmlSelector.content(W)).should('contain.text', T.heroText);
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('exist');

            // desktop off → gone from desktop
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas, still hidden on desktop
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(widget).should('be.visible');
            cy.get(htmlSelector.content(W)).should('contain.text', T.heroText);
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — state flags observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'isVisible', type: 'Boolean', value: 'true' }, // html.js:136, Html.jsx:168
                { key: 'isLoading', type: 'Boolean', value: 'false' }, // html.js:139, Html.jsx:169
                { key: 'isDisabled', type: 'Boolean', value: 'false' }, // html.js:138, Html.jsx:170
            ], verifyNodeData);
        });
    });

    // ── Html-BRW-003 (expression-resolved saved values: editor ↔ running app, desktop ↔ mobile) ──
    describe('saved device expressions', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Html-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        it('[Html-BRW-003] Expression-resolved device flags select the same surfaces in the editor and the running app on desktop and mobile', () => {
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to flip the bound desktop flag
            addHtmlWidgetsViaApi([
                ...DEVICE_HTML.map(({ name, others }, i) => ({
                    name,
                    others,
                    layout: { top: 40 + i * 70, left: 2, width: 8, height: 50 },
                    properties: { rawHtml: { value: `<p id="${authoredId(name)}">${name}</p>` } },
                })),
                // a desktop flag that re-resolves at runtime from another widget's value
                {
                    name: 'bound',
                    others: { showOnDesktop: { value: `{{components.textinput1.value !== "${hideWord}"}}` } },
                    layout: { top: 40, left: 20, width: 8, height: 50 },
                    properties: { rawHtml: { value: `<p id="${authoredId('bound')}">bound</p>` } },
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
            cy.get(htmlSelector.authored('bound', authoredId('bound'))).should('be.visible');
            cy.get(htmlSelector.textInput('textinput1')).type(hideWord);
            cy.get(commonWidgetSelector.draggableWidget('bound')).should('not.exist');
            cy.get(htmlSelector.textInput('textinput1')).clear();
            cy.get(htmlSelector.authored('bound', authoredId('bound'))).should('be.visible');

            // running app — the editor's Preview from the mobile layout (?layout=mobile)
            cy.then(() => cy.visit(viewerPath(null, '&layout=mobile')));
            expectDeviceSet('mobile', 'running app (?layout=mobile)');

            // running app on a phone: the viewer reads window.screen.width (Viewer.jsx:88,142), so a phone-sized viewport plus a
            // phone screen width selects the mobile layout without the query flag
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
