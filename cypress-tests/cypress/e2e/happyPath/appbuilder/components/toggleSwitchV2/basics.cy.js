import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openNode,
    openAndVerifyNode,
    verifyNodes,
    verifyNodeData,
} from "Support/utils/appBuilder/inspector";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Toggle Switch — basics facet', { testIsolation: false }, () => {
    // Runtime name: computeComponentName (appCanvasUtils.js:269-295) sanitizes the
    // widget config `name` ('ToggleSwitch', toggleswitchv2.js:2) — NOT the
    // `component` key ('ToggleSwitchV2') and NOT the config filename.
    const W = 'toggleswitch1';

    // one { key, type:'Function' } per config.actions[].handle
    const functions = [
        { key: "toggle", type: "Function" }, // source: toggleswitchv2.js:179
        { key: "setValue", type: "Function" }, // source: toggleswitchv2.js:183
        { key: "setVisibility", type: "Function" }, // source: toggleswitchv2.js:188
        { key: "setDisable", type: "Function" }, // source: toggleswitchv2.js:193
        { key: "setLoading", type: "Function" }, // source: toggleswitchv2.js:198
    ];

    // one entry per config.exposedVariables key — source: toggleswitchv2.js:169-176
    const exposedValues = [
        { key: "value", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:170
        { key: "label", type: "String", value: '"Label"' }, // source: toggleswitchv2.js:171
        { key: "isMandatory", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:172
        { key: "isVisible", type: "Boolean", value: "true" }, // source: toggleswitchv2.js:173
        { key: "isDisabled", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:174
        { key: "isLoading", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:175
        // exposedVarDrift: isValid is set at mount via setExposedVariables
        // (ToggleV2.jsx:232) but is NOT declared in config.exposedVariables.
        { key: "isValid", type: "Boolean", value: "true" }, // dynamic: exposedVarDrift — ToggleV2.jsx:232
    ];

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3 (displayName)
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify all the exposed values and functions on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode('components');
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });
});
