/**
 * SPEC — Number Input — contexts facet.
 * FOR AI: 2 cases — device context — show on desktop / mobile toggles visibility; exposed-value context — value observable in the inspector….
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

// Contexts facet — the checkbox across device + data-binding contexts.
// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Number Input — contexts facet', { testIsolation: false }, () => {
    const W = 'numberinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NumberInput-Contexts`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Device-visibility context matrix: Show on Desktop / Show on Mobile.
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: components.numberinput1.value is observable in the
    // app's component tree (default state Off → false). Uses the same
    // inspector-tree navigation proven green in inspector.cy.js.
    it('exposed-value context — value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click(); // open the left inspector
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('numberinput1', [
            { key: 'value', type: 'Number', value: '0' }, // default 0
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
