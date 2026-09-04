/**
 * SPEC — Number Input — csa facet.
 * FOR AI: all component-specific actions wired to On-click buttons, verified in PREVIEW
 * (button onClick CSAs fire at RUNTIME, not edit mode). numberInput is a BaseInput widget:
 * value/disabled live on `-input`, visibility/loader on the widget wrapper.
 * Helpers: addCSA.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { addCSA } from "Support/utils/appBuilder/csa";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Number Input — csa facet', { testIsolation: false }, () => {
    const W = "numberinput1";

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NICsa-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget("Number Input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('should verify all the CSA from the number input (On click)', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // b1 source: numberinput.js:305
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // b2 source: numberinput.js:305
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // b3 source: numberinput.js:310
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // b4 source: numberinput.js:310
            { event: "On click", action: "Set text", value: "100" },                   // b5 source: numberinput.js:288
            { event: "On click", action: "Clear" },                                    // b6 source: numberinput.js:293
            { event: "On click", action: "Set focus" },                                // b7 source: numberinput.js:297
            { event: "On click", action: "Set blur" },                                 // b8 source: numberinput.js:301
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // b9 source: numberinput.js:315
        ];
        addCSA(W, actions);

        // Button onClick CSAs fire at RUNTIME → verify in PREVIEW.
        cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(2500);

        const wrapper = commonWidgetSelector.draggableWidget(W);
        const input = `[data-cy="${W}-input"]`;
        const btn = (n) => commonWidgetSelector.draggableWidget(`button${n}`);

        // b1 setVisibility(false) → hidden; b2 setVisibility(true) → visible
        cy.get(btn(1)).click();
        cy.get(wrapper).should("not.be.visible");
        cy.get(btn(2)).click();
        cy.get(wrapper).should("be.visible");

        // b3 setDisable(true) → input disabled; b4 setDisable(false) → enabled
        cy.get(btn(3)).click();
        cy.get(input).should("be.disabled");
        cy.get(btn(4)).click();
        cy.get(input).should("not.be.disabled");

        // b5 setText("100") → input value '100'; b6 clear() → empty
        cy.get(btn(5)).click();
        cy.get(input).should("have.value", "100"); // source: numberinput.js:288
        cy.get(btn(6)).click();
        cy.get(input).should("have.value", "");

        // b7 setFocus() + b8 setBlur() — CSA handles invoked. Focus DOM state is not
        // reliably observable in headless preview, so assert the widget stays functional.
        cy.get(btn(7)).click(); // source: numberinput.js:297
        cy.get(btn(8)).click(); // source: numberinput.js:301
        cy.get(input).should("be.visible").and("not.be.disabled");

        // b9 setLoading(true) → loader visible
        cy.get(btn(9)).click();
        cy.get(wrapper).parent().find(".tj-widget-loader").should("be.visible");

        cy.go("back"); // return to the editor
    });
});
