/**
 * SPEC — Text Area — contexts facet.
 * FOR AI: always-on device + exposed-value contexts. No TESTING.md browser scenario maps here
 * (TextArea-BRW-001..004 live in canvas/userflow), so this is the default smoke set only.
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { textAreaSelector } from "Selectors/appBuilder/components/textArea";
import { textAreaText } from "Texts/appBuilder/components/textArea";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = textAreaText.defaultWidgetName;
const T = textAreaText;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Text Area — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextArea-contexts-${Cypress._.uniqueId()}`);
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

    it('exposed-value context — typed value observable in the inspector tree', () => {
        const value = fake.firstName; // dynamic: fake
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'value', type: 'String', value: T.defaultValueInspector }, // default ''. source: textarea.js:347
        ], verifyNodeData);

        cy.get(textAreaSelector.input(W)).type(value);
        cy.get(textAreaSelector.input(W)).should('have.value', value);
        verifyNodeData('value', 'String', `"${value}"`);
    });
});
