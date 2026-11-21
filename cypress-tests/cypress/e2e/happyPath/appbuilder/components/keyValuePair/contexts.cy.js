/**
 * SPEC — Key Value Pair — contexts facet.
 * FOR AI: always-on device + exposed-value contexts only — no browser scenario of TESTING.md maps to this facet
 * (KeyValuePair-BRW-005's viewer-only dynamic height lives in canvas.cy.js with the other geometry scenarios).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { keyValuePairText as T } from "Texts/appBuilder/components/keyValuePair";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Key Value Pair — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-KeyValuePair-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — show on desktop / mobile toggles visibility', () => {
        // defaults showOnDesktop {{true}} / showOnMobile {{false}}. source: keyValuePair.js:315-316
        verifyLayout(W);
    });

    it('exposed-value context — isValid and the state flags observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'isValid', type: 'Boolean', value: 'true' }, // source: keyValuePair.js:285, KeyValuePair.jsx:193-195
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // source: keyValuePair.js:489 (useExposeState)
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // source: keyValuePair.js:488
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // source: keyValuePair.js:492
        ], verifyNodeData);
    });
});
