/**
 * SPEC — Number Input — inspector facet.
 * FOR AI: 2 cases —
 *   1. static  — verify exposed values + functions + id-tooltip on the inspector tree.
 *   2. dynamic — exposed variables reflect the typed value + property toggles.
 * Helpers: openAndVerifyNode, openNode, verifyNodes, verifyNodeData, openStateFromComponent,
 *          openEditorSidebar, openAccordion.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector, inspectorSelectors } from "Selectors/common";
import {
    openAndVerifyNode,
    openNode,
    verifyNodes,
    verifyNodeData,
    openStateFromComponent,
} from "Support/utils/appBuilder/inspector";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Number Input — inspector facet', { testIsolation: false }, () => {
    const W = 'numberinput1';

    // source: numberinput.js exposedVariables (+ label/isValid surfaced by BaseInput at runtime)
    const exposedValues = [
        { key: "value", type: "Number", value: "0" },
        { key: "isMandatory", type: "Boolean", value: "false" },
        { key: "isVisible", type: "Boolean", value: "true" },
        { key: "isDisabled", type: "Boolean", value: "false" },
        { key: "isLoading", type: "Boolean", value: "false" },
        { key: "label", type: "String", value: "\"Label\"" },
        { key: "isValid", type: "Boolean", value: "true" },
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

    // Toggle a config property (label check → click toggle → autosave).
    const toggleProperty = (label) => {
        cy.get(commonWidgetSelector.parameterLabel(label)).should('have.text', label);
        cy.get(commonWidgetSelector.parameterTogglebutton(label)).click();
        cy.waitForAutoSave();
    };

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIInspector-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget("Number Input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('should verify exposed values + functions on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);

        // id — a dynamic UUID, so instead of asserting a fixed value we verify the
        // node is present and that hovering its overflow-truncated value reveals the
        // full-id tooltip. (inspector-id-value is wrapped in an OverflowTooltip → a
        // `.tooltip-inner` [role="tooltip"] appears on hover.)
        cy.get(inspectorSelectors.inspectorNodeLabel("id"))
            .should("be.visible")
            .and("have.text", "id");
        cy.get(inspectorSelectors.inspectorNodeValue("id"))
            .invoke("text")
            .then((idText) => {
                cy.get(inspectorSelectors.inspectorNodeValue("id")).realHover();
                cy.get(".tooltip-inner")
                    .should("be.visible")
                    .and("have.text", idText.trim()); // full id surfaced in the tooltip
            });
    });

    // Dynamic: the exposed variables track the live widget state — the typed value
    // and each config toggle are reflected in the component-state tree.
    it('exposed variables reflect the typed value + property toggles', () => {
        // type a value → components.numberinput1.value reflects it
        cy.get(`[data-cy="${W}-input"]`).clear().type('42').blur();

        // open the component-state panel and confirm the live value + defaults
        openStateFromComponent(W);
        verifyNodeData('value', 'Number', '42');            // reflects the typed input
        verifyNodeData('isMandatory', 'Boolean', 'false');
        verifyNodeData('isVisible', 'Boolean', 'true');
        verifyNodeData('isDisabled', 'Boolean', 'false');
        verifyNodeData('isLoading', 'Boolean', 'false');

        // toggling a config property updates the matching exposed variable
        const stateToggles = [
            { accordion: 'Additional Actions', label: 'Loading state', exposedVar: 'isLoading', expected: 'true' }, // source: numberinput.js:54
            { accordion: 'Additional Actions', label: 'Disable', exposedVar: 'isDisabled', expected: 'true' },      // source: numberinput.js:73
            { accordion: 'Validation', label: 'Make this field mandatory', exposedVar: 'isMandatory', expected: 'true' }, // source: numberinput.js:327
        ];
        stateToggles.forEach(({ accordion, label, exposedVar, expected }) => {
            openEditorSidebar(W);
            openAccordion(accordion);
            toggleProperty(label);
            openStateFromComponent(W);
            verifyNodeData(exposedVar, 'Boolean', expected);
        });
    });
});
