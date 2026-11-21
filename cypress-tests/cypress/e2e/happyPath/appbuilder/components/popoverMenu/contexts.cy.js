/**
 * SPEC — Popover Menu — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no BRW scenario of TESTING.md maps here — the dark-theme part of
 * PopoverMenu-BRW-001 lives in styles.cy.js with the rest of that colour scenario).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { popoverMenuText as T } from "Texts/appBuilder/components/popoverMenu";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Popover Menu — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PopoverMenu-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    it('exposed-value context — label, isVisible, isDisabled and isLoading observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'label', type: 'String', value: `"${T.defaultLabel}"` }, // source: popoverMenu.js:320
            { key: 'isVisible', type: 'Boolean', value: 'true' }, // source: popoverMenu.js:293
            { key: 'isDisabled', type: 'Boolean', value: 'false' }, // source: popoverMenu.js:294
            { key: 'isLoading', type: 'Boolean', value: 'false' }, // source: popoverMenu.js:295
        ], verifyNodeData);
    });
});
