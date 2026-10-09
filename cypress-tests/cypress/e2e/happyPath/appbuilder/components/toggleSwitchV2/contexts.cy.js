import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

// Contexts facet — the Toggle Switch across device + observability contexts.
// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Toggle Switch — contexts facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-Contexts-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 400, 200); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Device-visibility context: others.showOnDesktop / showOnMobile
    // source: toggleswitchv2.js:11-12 (defaults toggleswitchv2.js:205-206)
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: components.toggleswitch1.value is observable in the
    // component tree (Default state Off → false).
    it('exposed-value context — value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'value', type: 'Boolean', value: 'false' }, // source: toggleswitchv2.js:170
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
