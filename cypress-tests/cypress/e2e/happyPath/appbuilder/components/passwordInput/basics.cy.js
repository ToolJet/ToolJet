/**
 * SPEC — Password Input Component Tests (basics facet).
 * FOR AI: 1 case — should verify all the exposed values + functions on inspector.
 * CI-reliable smoke: drop widget + assert default exposed values & functions in the inspector tree.
 * (Comprehensive properties/validation/styles/events/csa coverage lives in the dedicated facets.)
 * Helpers: openAndVerifyNode, openNode, verifyNodes, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/appBuilder/inspector";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Password Input Component Tests', { testIsolation: false }, () => {
    const functions = [
        { "key": "setText", "type": "Function" },
        { "key": "clear", "type": "Function" },
        { "key": "setFocus", "type": "Function" },
        { "key": "setBlur", "type": "Function" },
        { "key": "setVisibility", "type": "Function" },
        { "key": "setDisable", "type": "Function" },
        { "key": "setLoading", "type": "Function" },
    ];
    const exposedValues = [
        { "key": "value", "type": "String", "value": "\"\"" }, // default '' (empty). source: passwordinput.js:341
        { "key": "isMandatory", "type": "Boolean", "value": "false" },
        { "key": "isVisible", "type": "Boolean", "value": "true" },
        { "key": "isDisabled", "type": "Boolean", "value": "false" },
        { "key": "isLoading", "type": "Boolean", "value": "false" },
        { "key": "label", "type": "String", "value": "\"Label\"" },
        { "key": "isValid", "type": "Boolean", "value": "true" },
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Passwordinput-App`);
        cy.openApp();
        cy.dragAndDropWidget("Password Input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode("passwordinput1", exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });
});
