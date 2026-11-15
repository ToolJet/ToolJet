/**
 * SPEC — Text Editor (RichTextEditor) — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no TESTING.md browser scenario maps to this facet).
 *   device         — Show on desktop / Show on mobile (richtextarea.js:10-13) hide/show the widget per layout
 *   exposed value  — text typed into the editor on the canvas is published as HTML `value` (DraftEditor.jsx:163-167)
 *                    and observable in the inspector tree
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, focusEditor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { richTextEditorSelector } from "Selectors/appBuilder/components/richTextEditor";
import { richTextEditorText } from "Texts/appBuilder/components/richTextEditor";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { focusEditor } from "Support/utils/appBuilder/components/richTextEditor";

const W = richTextEditorText.defaultWidgetName;
const T = richTextEditorText;
const S = richTextEditorSelector;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Text Editor — contexts facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-RichTextEditor-contexts-${Cypress._.uniqueId()}`);
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

    it('exposed-value context — typed text observable as HTML value in the inspector tree', () => {
        const value = `${fake.firstName.replace(/[^a-z]/g, '').slice(0, 8)}x`; // dynamic: fake
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode(W, [
            { key: 'value', type: 'String', value: T.defaultValueInspector }, // default ''. source: richtextarea.js:112
        ], verifyNodeData);

        focusEditor(W);
        cy.realType(value);
        cy.get(S.block(W)).should('have.text', value);
        verifyNodeData('value', 'String', `"<p>${value}</p>"`); // stateToHTML paragraph (DraftEditor.jsx:164)
    });
});
