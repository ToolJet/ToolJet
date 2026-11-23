/**
 * SPEC — Link — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   Link-BRW-002 — Show on desktop / Show on mobile hide or show the Link in the matching canvas layout
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode,
 * openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { linkSelector } from "Selectors/appBuilder/components/link";
import { linkText } from "Texts/appBuilder/components/link";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = linkText.defaultWidgetName;
const T = linkText;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Link — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Link-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Link-BRW-002 ─────────────────────────────────────────────────────────
    // others.showOnDesktop / showOnMobile (link.js:11-12), definition defaults desktop on / mobile off
    // (link.js:227-228). Each flag gates the Link only in its own canvas layout.
    it('[Link-BRW-002] Show on desktop / Show on mobile hide or show the Link in the matching layout', () => {
        const widget = commonWidgetSelector.draggableWidget(W);

        // defaults: on the desktop canvas, absent from the mobile canvas
        cy.get(linkSelector.linkText(W)).should('have.text', T.defaultLinkText);
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
        cy.get(linkSelector.linkText(W)).should('have.text', T.defaultLinkText);
        switchLayout('desktop');
        cy.get(widget).should('not.exist');
    });

    it('exposed-value context — link target, text and state flags observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'linkTarget', type: 'String', value: `"${T.defaultLinkTarget}"` }, // link.js:231, Link.jsx:74-81
            { key: 'linkText', type: 'String', value: `"${T.defaultLinkText}"` }, // link.js:232
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // link.js:234, Link.jsx:83-94
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // link.js:235
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // link.js:240
        ], verifyNodeData);
    });
});
