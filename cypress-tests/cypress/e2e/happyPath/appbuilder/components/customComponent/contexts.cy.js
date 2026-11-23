/**
 * SPEC — Custom Component — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   CustomComponent-BRW-004 — Show on desktop / Show on mobile select the surfaces the Custom Component appears on,
 *                             for toggle values (inspector, editor layouts) and expression-resolved values (editor +
 *                             running app, desktop + mobile, including an expression that re-resolves at runtime)
 * Device gate: WidgetWrapper reads others.showOnMobile on the mobile layout, showOnDesktop otherwise; the viewer picks
 * mobile when ?layout=mobile or the screen is narrower than 600px. Device-off widgets are not rendered at all.
 * Seeded widgets run self-contained author code that prints their own name, so presence is checked on frame content.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openSubNode,
 * verifyNodeData, openLinkAppInViewer, viewerPath, addCustomComponentsViaApi, inFrame.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { customComponentSelector } from "Selectors/appBuilder/components/customComponent";
import { customComponentText } from "Texts/appBuilder/components/customComponent";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openSubNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer, viewerPath } from "Support/utils/appBuilder/components/link";
import { addCustomComponentsViaApi, inFrame } from "Support/utils/appBuilder/components/customComponent";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = customComponentText;
const S = customComponentSelector;
const W = T.defaultWidgetName;

// self-contained author code (no CDN imports) that renders the widget's own name
const nameCode = (name) => `ReactDOM.render(<p id="cc-who">${name}</p>, document.body);`;

// saved device combinations, every flag an expression (others.showOnDesktop / showOnMobile — customComponent.js:14-17,
// defaults customComponent.js:53-54)
const TRUE_EXPR = { value: '{{[1, 2].length === 2}}' }; // dynamic: resolves to true
const FALSE_EXPR = { value: '{{"tooljet".length < 3}}' }; // dynamic: resolves to false
const DEVICE_CC = [
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
    inFrame('bothdevices', '#cc-who').should('have.text', 'bothdevices');
    Object.entries(EXPECTED[layout]).forEach(([name, shown]) => {
        if (shown) inFrame(name, '#cc-who').should('have.text', name);
        else cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
    });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Custom Component — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CustomComponent-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── CustomComponent-BRW-004 (inspector toggles, editor layouts) ──────
        it('[CustomComponent-BRW-004] Show on desktop / Show on mobile toggles gate the Custom Component on the matching editor layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (customComponent.js:53-54): on the desktop canvas, absent from the mobile canvas
            inFrame(W, 'h1').should('have.text', T.defaultTitle); // source: customComponent.js:58
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('exist');

            // desktop off → gone from desktop
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas (frame renders the author code), still hidden on desktop
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(widget).should('be.visible');
            inFrame(W, 'h1').should('have.text', T.defaultTitle);
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — the resolved Data object is observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openSubNode(W, 'components');
            verifyNodeData('data', 'Object', '{2}'); // customComponent.js:49 — two keys
            cy.get('[data-cy="inspector-data-label"]').click();
            verifyNodeData('title', 'String', `"${T.defaultTitle}"`); // source: customComponent.js:58
            verifyNodeData('buttonText', 'String', `"${T.defaultButtonText}"`); // source: customComponent.js:58
        });
    });

    // ── CustomComponent-BRW-004 (expression-resolved saved values: editor ↔ running app, desktop ↔ mobile) ──
    describe('saved device expressions', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CustomComponent-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        it('[CustomComponent-BRW-004] Expression-resolved device flags select the same surfaces in the editor and the running app on desktop and mobile', () => {
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to flip the bound desktop flag
            addCustomComponentsViaApi([
                ...DEVICE_CC.map(({ name, others }, i) => ({
                    name,
                    others,
                    layout: { top: 40 + i * 90, left: 2, width: 10, height: 70 },
                    properties: { code: { value: nameCode(name) } },
                })),
                // a desktop flag that re-resolves at runtime from another widget's value
                {
                    name: 'bound',
                    others: { showOnDesktop: { value: `{{components.textinput1.value !== "${hideWord}"}}` } },
                    layout: { top: 40, left: 20, width: 10, height: 70 },
                    properties: { code: { value: nameCode('bound') } },
                },
                { type: 'TextInput', name: 'textinput1', layout: { top: 140, left: 20, width: 8, height: 40 } },
            ]);

            // editor canvas
            cy.then(() => cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('bothdevices')));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // running app — desktop
            openLinkAppInViewer(null);
            expectDeviceSet('desktop', 'running app');
            // the bound expression re-resolves: typing the word hides it on desktop, clearing shows it again
            inFrame('bound', '#cc-who').should('have.text', 'bound');
            cy.get(S.textInput('textinput1')).type(hideWord);
            cy.get(commonWidgetSelector.draggableWidget('bound')).should('not.exist');
            cy.get(S.textInput('textinput1')).clear();
            inFrame('bound', '#cc-who').should('have.text', 'bound');

            // running app — the editor's Preview from the mobile layout (?layout=mobile)
            cy.then(() => cy.visit(viewerPath(null, '&layout=mobile')));
            expectDeviceSet('mobile', 'running app (?layout=mobile)');

            // running app on a phone: the viewer reads window.screen.width, so a phone-sized viewport plus a phone
            // screen width selects the mobile layout without the query flag
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
