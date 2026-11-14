/**
 * SPEC — Currency Input — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no TESTING.md browser scenario maps here).
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { currencyInputText } from "Texts/appBuilder/components/currencyInput";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

const W = currencyInputText.defaultWidgetName;
const T = currencyInputText;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Currency Input — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CurrencyInput-contexts-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    it('exposed-value context — value, country and formatted value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'value', type: 'Number', value: '0' }, // default '0' published as a number. source: currencyinput.js:363
            { key: 'country', type: 'String', value: `"${T.usd.code}"` }, // default country US. source: CurrencyInput.jsx:69
            { key: 'formattedValue', type: 'String', value: `"${T.usd.prefix} ${T.defaultDisplay}"` }, // CurrencyInput.jsx:231
        ], verifyNodeData);
    });
});
