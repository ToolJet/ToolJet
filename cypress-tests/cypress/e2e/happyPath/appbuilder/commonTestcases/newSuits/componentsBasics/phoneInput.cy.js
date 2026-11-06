import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA, verifyCSA } from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
    fillBoxShadowParams,
    verifyBoxShadowCss,
    verifyWidgetColorCss,
    verifyLayout,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Phone Input Component Tests', { testIsolation: false }, () => {
    const W = "phoneinput1";

    const exposedValues = [
        {
            "key": "value",
            "type": "String",
            "value": "\"\"" // source: phoneinput.js:266
        },
        {
            "key": "isMandatory",
            "type": "Boolean",
            "value": "false" // source: phoneinput.js:267
        },
        {
            "key": "isVisible",
            "type": "Boolean",
            "value": "true" // source: phoneinput.js:268
        },
        {
            "key": "isDisabled",
            "type": "Boolean",
            "value": "false" // source: phoneinput.js:269
        },
        {
            "key": "isLoading",
            "type": "Boolean",
            "value": "false" // source: phoneinput.js:270
        },
    ];

    const functions = [
        { "key": "setValue", "type": "Function" }, // source: phoneinput.js:273
        { "key": "setCountryCode", "type": "Function" }, // source: phoneinput.js:281
        { "key": "clear", "type": "Function" }, // source: phoneinput.js:286
        { "key": "setFocus", "type": "Function" }, // source: phoneinput.js:290
        { "key": "setBlur", "type": "Function" }, // source: phoneinput.js:294
        { "key": "setVisibility", "type": "Function" }, // source: phoneinput.js:298
        { "key": "setDisable", "type": "Function" }, // source: phoneinput.js:303
        { "key": "setLoading", "type": "Function" }, // source: phoneinput.js:308
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PhoneInput-App`);
        cy.openApp();
        cy.dragAndDropWidget("Phone Input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // label default renders the config default text
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("exist")
            .and("contain.text", "Label"); // source: phoneinput.js:329

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify the properties', () => {
        openEditorSidebar(W);

        // label (code) — widget shows the typed text
        const labelText = fake.randomSentence;
        verifyAndModifyParameter("Label", labelText); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", labelText); // dynamic: fake

        // placeholder (code)
        verifyAndModifyParameter("Placeholder", fake.randomSentence); // dynamic: fake

        // Default value (code)
        verifyAndModifyParameter("Default value", fake.randomSentence); // dynamic: fake

        // isCountryChangeEnabled (toggle) default {{true}}
        verifyAndModifyToggleFx("Enable country change", "{{true}}"); // source: phoneinput.js:338
        verifyAndModifyToggleFx("Enable country change", "{{true}}"); // source: phoneinput.js:338 (toggle back)

        // showClearBtn (toggle) — additionalActions, default {{false}}
        openAccordion("Additional Actions", []);
        verifyAndModifyToggleFx("Enable clear button", "{{false}}"); // source: phoneinput.js:339

        // loadingState (toggle) default {{false}} → widget loader visible
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: phoneinput.js:335
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .find(".tj-widget-loader")
            .should("be.visible"); // dynamic: loader shown after enabling loading state
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: phoneinput.js:335 (toggle back)

        // disabledState (toggle) default {{false}} → data-disabled
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: phoneinput.js:334
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // dynamic: disabled after enabling
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: phoneinput.js:334 (toggle back)

        // collapseWhenHidden (toggle) default {{false}}
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: phoneinput.js:333
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: phoneinput.js:333 (toggle back)

        // visibility (toggle) default {{true}} → widget hidden when off
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: phoneinput.js:331
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: hidden after disabling visibility
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: phoneinput.js:331 (toggle back)

        // tooltip (code) — additionalActions
        const tooltipText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter("Tooltip", tooltipText); // source: phoneinput.js:91
        /* RESOLVE-LIVE selector+assertion for rendered tooltip (hover widget, assert tooltip text = tooltipText) */ // source: phoneinput.js:91

        // tooltipFormat (switch) plainText/markdown/html default plainText — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for Tooltip format switch (options plainText/markdown/html) */ // source: phoneinput.js:77
    });

    it.skip('should verify the validation', () => {
        openEditorSidebar(W);
        openAccordion("Validation", []);

        // mandatory (toggle) default {{false}} → shows required `*` marker
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: phoneinput.js:316
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", "*"); // dynamic: mandatory marker rendered
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: phoneinput.js:316 (toggle back)

        // regex / minLength / maxLength / customRule (code) — accept input
        verifyAndModifyParameter("Regex", "^[0-9]+$"); // dynamic: test regex
        verifyAndModifyParameter("Min length", "3"); // dynamic: test min length
        verifyAndModifyParameter("Max length", "10"); // dynamic: test max length
        verifyAndModifyParameter("Custom validation", "{{false}}"); // dynamic: test custom rule
    });

    it.skip('should verify the styles', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---- Label accordion ----
        openAccordion("Label", []);
        // color (colorSwatches) → label text color
        selectColourFromColourPicker("Text", ['255', '0', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for label color */ "color", [255, 0, 0, 100]); // dynamic: test color

        // labelFontSize (numberInput) default {{12}} — input selector + CSS target unknown (empty cache)
        verifyAndModifyParameter("Size", "16"); // source: phoneinput.js:124
        /* RESOLVE-LIVE cssProp for labelFontSize (font-size assertion on label) */ // source: phoneinput.js:124

        // alignment (switch) side/top — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for alignment switch (options side/top) */ // source: phoneinput.js:130

        // direction (icon switch) left/right — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for direction icon switch (options left/right) */ // source: phoneinput.js:140

        // auto (checkbox) Width default {{true}}, condRender alignment=side — selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for Width auto checkbox */ // source: phoneinput.js:153

        // width (slider) default {{33}}, condRender alignment=side & auto=false — selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for width slider */ // source: phoneinput.js:164

        // widthType (select) default ofComponent, condRender alignment=side & auto=false — selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for widthType select */ // source: phoneinput.js:180

        // ---- Field accordion ----
        openAccordion("Field", []);
        // backgroundColor (colorSwatches)
        selectColourFromColourPicker("Background", ['255', '0', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for backgroundColor */ "background-color", [255, 0, 0, 100]); // dynamic: test color

        // borderColor (colorSwatches)
        selectColourFromColourPicker("Border", ['0', '255', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for borderColor */ "border-color", [0, 255, 0, 100]); // dynamic: test color

        // accentColor (colorSwatches)
        selectColourFromColourPicker("Accent", ['0', '0', '255', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for accentColor */ "accent-color", [0, 0, 255, 100]); // dynamic: test color

        // textColor (colorSwatches)
        selectColourFromColourPicker("Text", ['0', '0', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for textColor */ "color", [0, 0, 0, 100]); // dynamic: test color

        // errTextColor (Error text, colorSwatches, field). default var(--cc-error-systemStatus). source: phoneinput.js:229
        selectColourFromColourPicker("Error text", ['128', '0', '0', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for errTextColor: applies to invalid-feedback color when field invalid — source: phoneinput.js:229 */

        // borderRadius (numberInput) default {{6}} — input selector + CSS target unknown (empty cache)
        /* RESOLVE-LIVE selector for borderRadius numberInput + border-radius assertion on field */ // dynamic: test radius

        // boxShadow
        fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], ['0', '0', '10', '0']); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // ---- Container accordion ----
        openAccordion("Container", []);
        // padding (switch) default/none — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for padding switch (options default/none) */ // source: phoneinput.js:355
    });

    it.skip('should verify the layout', () => {
        // showOnDesktop default {{true}}, showOnMobile default {{false}}
        verifyLayout(W); // source: phoneinput.js:11 (showOnDesktop) / phoneinput.js:12 (showOnMobile)
    });

    it('should verify all the exposed values and functions on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the phone input', () => {
        const events = [
            { event: "On focus", message: "onFocus Event" }, // source: phoneinput.js:114
            { event: "On blur", message: "onBlur Event" }, // source: phoneinput.js:115
            { event: "On change", message: "onChange Event" }, // source: phoneinput.js:112
            { event: "On enter pressed", message: "onEnterPressed Event" }, // source: phoneinput.js:113
        ];

        addMultiEventsWithAlert(events, false);
        const selector = `[data-cy="draggable-widget-${W}"] input`;

        cy.get(selector).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onFocus Event', false); // dynamic: echoed message

        cy.get(selector).type('9');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onChange Event', false); // dynamic: echoed message

        cy.get(selector).type('{enter}');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onEnterPressed Event', false); // dynamic: echoed message

        cy.forceClickOnCanvas();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onBlur Event', false); // dynamic: echoed message
    });

    it.skip('should verify all the CSA from the phone input', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // source: phoneinput.js:298
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" }, // source: phoneinput.js:298
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" }, // source: phoneinput.js:303
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" }, // source: phoneinput.js:303
            { event: "On click", action: "Set Value", value: "9199999999" }, // source: phoneinput.js:273
            { event: "On click", action: "Set country code", value: "US" }, // source: phoneinput.js:281
            { event: "On click", action: "Clear" }, // source: phoneinput.js:286
            { event: "On click", action: "Set focus" }, // source: phoneinput.js:290
            { event: "On click", action: "Set blur" }, // source: phoneinput.js:294
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" }, // source: phoneinput.js:308
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
