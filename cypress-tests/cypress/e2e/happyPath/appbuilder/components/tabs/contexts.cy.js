import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

// Contexts facet — the Tabs component across device + data-binding contexts.
// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Tabs — contexts facet', { testIsolation: false }, () => {
    const W = 'tabs1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-Contexts`);
        cy.openApp();
        cy.dragAndDropWidget('Tabs', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Device-visibility context: others.showOnDesktop / showOnMobile
    // source: tabs.js:11-12 (defaults "{{true}}" / "{{false}}")
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: components.tabs1.currentTab is observable in the
    // component tree. On mount the widget activates the first tab (id: 't0',
    // title: 'Tab 1') since defaultTab '0' matches no tabItem id — runtime
    // falls back to the first visible tab. Both values depend on tabItems config.
    // source: tabs.js:394, tabs.js:412
    it('exposed-value context — currentTab observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'currentTab', type: 'String', value: '"t0"' }, // source: tabs.js:394; tabs.js:412 (first tabItem id)
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
