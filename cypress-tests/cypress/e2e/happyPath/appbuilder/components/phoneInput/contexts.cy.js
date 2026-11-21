/**
 * SPEC — Phone Input — contexts facet.
 * FOR AI: always-on device + exposed-value contexts. No TESTING.md browser scenario maps here
 * (PhoneInput-BRW-001..005 live in userflow / canvas / styles).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { phoneInputText } from "Texts/appBuilder/components/phoneInput";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = phoneInputText.defaultWidgetName;
const T = phoneInputText;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Phone Input — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PhoneInput-contexts-${Cypress._.uniqueId()}`);
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

    it('exposed-value context — value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'value', type: 'String', value: '""' }, // default ''. source: phoneinput.js:337
            { key: 'domesticNumber', type: 'String', value: '""' }, // source: phoneinput.js:274
        ], verifyNodeData);
    });
});
