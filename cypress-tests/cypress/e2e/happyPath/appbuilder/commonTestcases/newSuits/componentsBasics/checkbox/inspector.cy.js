import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Checkbox Component Tests', { testIsolation: false }, () => {

    // source: checkbox.js:170–175
    const exposedValues = [
        {
            key: "label",
            type: "String",
            value: '"Label"', // source: checkbox.js:171
        },
        {
            key: "isVisible",
            type: "Boolean",
            value: "true", // source: checkbox.js:173
        },
        {
            key: "isDisabled",
            type: "Boolean",
            value: "false", // source: checkbox.js:174
        },
        {
            key: "isMandatory",
            type: "Boolean",
            value: "false", // source: checkbox.js:172
        },
        {
            key: "value",
            type: "Boolean",
            value: "false", // source: checkbox.js:170
        },
        {
            key: "isLoading",
            type: "Boolean",
            value: "false", // source: checkbox.js:175
        },
        {
            key: "isValid",
            type: "Boolean",
            value: "true",
        },
    ];

    // CSA handles from surface csa block — source: checkbox.js:178–202
    const functions = [
        {
            key: "setValue",
            type: "Function", // source: checkbox.js:182
        },
        {
            key: "toggle",
            type: "Function", // source: checkbox.js:178
        },
        // @deprecated — displayName: "Set checked (Deprecated)"; source: checkbox.js:202
        {
            key: "setChecked",
            type: "Function",
        },
        {
            key: "setVisibility",
            type: "Function", // source: checkbox.js:187
        },
        {
            key: "setDisable",
            type: "Function", // source: checkbox.js:192
        },
        {
            key: "setLoading",
            type: "Function", // source: checkbox.js:197
        },
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-App`);
        cy.openApp();
        cy.dragAndDropWidget("Checkbox", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode("checkbox1", exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });
});
