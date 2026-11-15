/**
 * SPEC — Button — contexts facet.
 * FOR AI: the always-on device + exposed-value contexts. No Button TESTING.md browser scenario is a context
 * scenario (device / editor-vs-viewer / theme / saved-app) — the 9 Button-BRW scenarios live in styles.cy.js
 * and userflow.cy.js.
 * Helpers: verifyLayout, openNode, openSubNode, verifyNodes, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/appBuilder/components/button";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openSubNode, verifyNodes, verifyNodeData } from "Support/utils/appBuilder/inspector";

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Button — contexts facet', { testIsolation: false }, () => {
    const W = buttonText.defaultWidgetName;

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Button-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(buttonText.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // Device-visibility context matrix: Show on Desktop / Show on Mobile.
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: components.button1.* is observable in the app's component tree. The tree subnode is
    // opened directly: openAndVerifyNode's hover → `<name>-inspect-button` path does not open the node for a Button
    // (the real hover lands on the <button>, whose config-handle inspect click is not reached).
    it('exposed-value context — exposed values observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openSubNode(W);
        verifyNodes([
            { key: 'buttonText', type: 'String', value: `"${buttonText.definition.properties.text.value}"` }, // source: button.js:247
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // source: button.js:248
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // source: button.js:249
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // source: button.js:250
        ], verifyNodeData);
    });
});
