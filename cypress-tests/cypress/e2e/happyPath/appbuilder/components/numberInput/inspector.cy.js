import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/appBuilder/inspector";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Number Input — inspector facet', { testIsolation: false }, () => {
    const W = 'numberinput1';

    // source: numberinput.js exposedVariables (value:0, isMandatory, isVisible, isDisabled, isLoading)
    const exposedValues = [
        { key: "value", type: "Number", value: "0" },
        { key: "isMandatory", type: "Boolean", value: "false" },
        { key: "isVisible", type: "Boolean", value: "true" },
        { key: "isDisabled", type: "Boolean", value: "false" },
        { key: "isLoading", type: "Boolean", value: "false" },
    ];

    // CSA handles — source: numberinput.js actions
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
        cy.apiCreateApp(`${fake.companyName}-NumberInput-App`);
        cy.openApp();
        cy.dragAndDropWidget("Number Input", 500, 100);
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
