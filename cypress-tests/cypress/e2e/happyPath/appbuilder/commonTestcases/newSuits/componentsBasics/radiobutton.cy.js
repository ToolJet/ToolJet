import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA, verifyCSA } from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
    verifyWidgetColorCss,
    verifyLayout,
    openEditorSidebar,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Radio Button (Legacy) Component Tests', { testIsolation: false }, () => {
    const W = "radiobutton1";

    // config.exposedVariables is `{}` (radiobutton.js:100). The runtime
    // component only ever sets `value` (RadioButton.jsx:36,42) and the
    // selectOption function (RadioButton.jsx:43). So the inspector exposes just
    // one data var plus one function — no isVisible/isDisabled/label vars exist.
    const exposedValues = [
        {
            // default `value` = {{true}} → exposed as Boolean true.
            // source: radiobutton.js:108
            "key": "value",
            "type": "Boolean",
            "value": "true"
        },
    ];
    const functions = [
        {
            // source: radiobutton.js:90 (config.actions[0].handle)
            "key": "selectOption",
            "type": "Function"
        },
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Radiobutton-App`);
        cy.openApp();
        cy.dragAndDropWidget("Radio Button (Legacy)", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Label default text = "Select". source: radiobutton.js:107
        cy.get(`[data-cy="${W}-label"]`).should("have.text", "Select");

        // Option labels default = ["yes","no"]. source: radiobutton.js:110
        cy.get(`[data-cy="${W}-option-label-0"]`).should("have.text", "yes");
        cy.get(`[data-cy="${W}-option-label-1"]`).should("have.text", "no"); // source: radiobutton.js:110

        // Default value = {{true}} → first option (value true) is checked.
        // source: radiobutton.js:108 / values default radiobutton.js:109
        cy.get(`[data-cy="${W}-option-input-0"]`).should("be.checked");
        cy.get(`[data-cy="${W}-option-input-1"]`).should("not.be.checked");

        // Visible + enabled by default. source: radiobutton.js:117 / :118
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible");
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "false"); // source: radiobutton.js:118
    });

    it.skip('should verify the properties of the radio button', () => {
        openEditorSidebar(W);

        // label (code). source_default: radiobutton.js:107
        const labelText = fake.randomSentence;
        verifyAndModifyParameter("Label", labelText); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should("have.text", labelText); // dynamic: fake

        // Option labels (display_values, code). source_default: radiobutton.js:110
        openEditorSidebar(W);
        verifyAndModifyParameter("Option labels", '{{["one","two"]}}'); // dynamic: test options
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-option-label-0"]`).should("have.text", "one"); // dynamic: echoes option label set L82
        cy.get(`[data-cy="${W}-option-label-1"]`).should("have.text", "two"); // dynamic: echoes option label set L82

        // Option values (values, code) + Default value (value, code):
        // set values to ["a","b"] and default value to "b" → second option checked.
        // source_default: radiobutton.js:109 / :108
        openEditorSidebar(W);
        verifyAndModifyParameter("Option values", '{{["a","b"]}}'); // dynamic: test values
        openEditorSidebar(W);
        verifyAndModifyParameter("Default value", "b"); // dynamic: test default
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-option-input-1"]`).should("be.checked");
    });

    it.skip('should verify the styles of the radio button', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // Text color (colorSwatches) → label span `color`. source: radiobutton.js:55
        // RadioButton.jsx:62 applies textColor to the label span's `color`.
        selectColourFromColourPicker("Text color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for textColor: expected label span
           [data-cy="radiobutton1-label"] `color` = rgba(255,0,0,1) */
        verifyWidgetColorCss(`[data-cy="${W}-label"]`, "color", [255, 0, 0, 100], true);

        // Active color (colorSwatches) → checked radio input `background-color`.
        // source: radiobutton.js:63 ; RadioButton.jsx:75 applies activeColor as
        // backgroundColor on the checked option input.
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Active color", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for activeColor: expected checked input
           [data-cy="radiobutton1-option-input-0"] `background-color` = rgba(0,255,0,1) */
        verifyWidgetColorCss(`[data-cy="${W}-option-input-0"]`, "background-color", [0, 255, 0, 100], true);

        // Visibility + Disable toggles. source: radiobutton.js:117 / :118
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: radiobutton.js:118
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "true"); // source: radiobutton.js:118

        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: radiobutton.js:117
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible");
    });

    it.skip('should verify the layout / device toggles', () => {
        // others.showOnDesktop default {{true}}, showOnMobile default {{false}}.
        // source: radiobutton.js:11 / :12
        verifyLayout(W);
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
        // NOTE: config.exposedVariables is empty (radiobutton.js:100). Runtime
        // (RadioButton.jsx) exposes ONLY `value` + `selectOption`. If the
        // inspector reveals additional runtime-only vars, that is drift to log.
    });

    it.skip('should verify all the events from the radio button', () => {
        // events.onSelectionChange → UI label "On select". source: radiobutton.js:52
        const events = [
            { event: "On select", message: "On select Event" }, // dynamic: test-authored alert message
        ];
        addMultiEventsWithAlert(events, false);

        cy.forceClickOnCanvas();
        // Selecting a different option fires onSelectionChange (RadioButton.jsx:82,37).
        cy.get(`[data-cy="${W}-option-input-1"]`).click({ force: true });
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On select Event', false); // dynamic: asserts alert message set L151
    });

    it.skip('should verify the CSA (Select Option) from the radio button', () => {
        // actions[0] selectOption(option). source: radiobutton.js:90
        const actions = [
            // Set option to `false` → second option (value false) becomes checked.
            { event: "On click", action: "Select Option", value: "{{false}}" }, // dynamic: param option
        ];
        addCSA(W, actions);

        cy.get(commonWidgetSelector.draggableWidget("button1")).click();
        cy.get(`[data-cy="${W}-option-input-1"]`).should("be.checked");
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
