import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/inspector";

// Contexts facet — the checkbox across device + data-binding contexts.
// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Checkbox — contexts facet', { testIsolation: false }, () => {
    const W = 'checkbox1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-Contexts`);
        cy.openApp();
        cy.dragAndDropWidget('Checkbox', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Device-visibility context matrix: Show on Desktop / Show on Mobile.
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: components.checkbox1.value is observable in the
    // app's component tree (default state Off → false). Uses the same
    // inspector-tree navigation proven green in inspector.cy.js.
    it('exposed-value context — value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click(); // open the left inspector
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('checkbox1', [
            { key: 'value', type: 'Boolean', value: 'false' }, // source: checkbox.js:170
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
