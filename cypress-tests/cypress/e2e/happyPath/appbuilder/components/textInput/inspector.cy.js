/**
 * SPEC — Text Input — inspector facet.
 * FOR AI: 1 case — should verify exposed values + functions on inspector.
 * Helpers: openAndVerifyNode, openNode, verifyNodes, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/appBuilder/inspector";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Text Input — inspector facet', { testIsolation: false }, () => {
    const W = 'textinput1';

    // source: textinput.js exposedVariables (value:'', isMandatory, isVisible, isDisabled, isLoading)
    const exposedValues = [
        { key: "value", type: "String", value: "\"\"" },
        { key: "isMandatory", type: "Boolean", value: "false" },
        { key: "isVisible", type: "Boolean", value: "true" },
        { key: "isDisabled", type: "Boolean", value: "false" },
        { key: "isLoading", type: "Boolean", value: "false" },
    ];

    // CSA handles — source: textinput.js actions
    const functions = [
        { key: "setText", type: "Function" },
        { key: "clear", type: "Function" },
        { key: "setFocus", type: "Function" },
        { key: "setBlur", type: "Function" },
        { key: "setVisibility", type: "Function" },
        { key: "setDisable", type: "Function" },
        { key: "setLoading", type: "Function" },
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextInput-App`);
        cy.openApp();
        cy.dragAndDropWidget("Text Input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify exposed values + functions on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });
});
