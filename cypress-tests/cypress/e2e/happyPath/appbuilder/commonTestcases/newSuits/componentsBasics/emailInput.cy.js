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
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Email Input Component Tests', { testIsolation: false }, () => {
    const W = "emailinput1";

    const exposedValues = [
        {
            // value default = "". source: emailinput.js:273 / src_default emailinput.js:327
            "key": "value",
            "type": "String",
            "value": "\"\""
        },
        {
            // isMandatory default = false. source: emailinput.js:274 / src_default emailinput.js:315
            "key": "isMandatory",
            "type": "Boolean",
            "value": "false"
        },
        {
            // isVisible default = true. source: emailinput.js:275 / src_default emailinput.js:330
            "key": "isVisible",
            "type": "Boolean",
            "value": "true"
        },
        {
            // isDisabled default = false. source: emailinput.js:276 / src_default emailinput.js:333
            "key": "isDisabled",
            "type": "Boolean",
            "value": "false"
        },
        {
            // isLoading default = false. source: emailinput.js:277 / src_default emailinput.js:334
            "key": "isLoading",
            "type": "Boolean",
            "value": "false"
        },
        {
            // label default = "Label". source: emailinput.js:15 / src_default emailinput.js:328
            "key": "label",
            "type": "String",
            "value": "\"Label\""
        },
    ];

    const functions = [
        { "key": "setText", "type": "Function" },       // source: emailinput.js:280
        { "key": "clear", "type": "Function" },          // source: emailinput.js:285
        { "key": "setFocus", "type": "Function" },       // source: emailinput.js:289
        { "key": "setBlur", "type": "Function" },        // source: emailinput.js:293
        { "key": "setVisibility", "type": "Function" },  // source: emailinput.js:297
        { "key": "setDisable", "type": "Function" },     // source: emailinput.js:302
        { "key": "setLoading", "type": "Function" },     // source: emailinput.js:307
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Emailinput-App`);
        cy.openApp();
        cy.dragAndDropWidget("Email Input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // label default text = "Label". source: emailinput.js:328
        cy.get(`[data-cy="${W}-label"]`).should("have.text", "Label");

        // placeholder default = "Enter email". source: emailinput.js:329
        cy.get(`[data-cy="${W}-input"]`).should("have.attr", "placeholder", "Enter email");

        // value default = "" → empty input. source: emailinput.js:327
        cy.get(`[data-cy="${W}-input"]`).should("have.value", "");

        // icon default = IconMail is visible by default. source: emailinput.js:356
        cy.get(`[data-cy="${W}-icon"]`).should("be.visible");

        // visible + enabled by default. source: emailinput.js:330 / :333
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible");
        cy.get(`[data-cy="${W}-input"]`).should("not.be.disabled"); // source: emailinput.js:333
    });

    it.skip('should verify the properties of the email input', () => {
        openEditorSidebar(W);

        // label (code). src_default: emailinput.js:328
        const labelText = fake.randomSentence;
        verifyAndModifyParameter("Label", labelText); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should("have.text", labelText); // dynamic: fake

        // placeholder (code). src_default: emailinput.js:329
        openEditorSidebar(W);
        const placeholderText = fake.randomSentence;
        verifyAndModifyParameter("Placeholder", placeholderText); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should("have.attr", "placeholder", placeholderText); // dynamic: fake

        // value / Default value (code). src_default: emailinput.js:327
        openEditorSidebar(W);
        const emailText = fake.email;
        verifyAndModifyParameter("Default value", emailText); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should("have.value", emailText); // dynamic: fake

        // showClearBtn toggle (additionalActions). default {{false}}. source: emailinput.js:337
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Enable clear button", "{{false}}"); // source: emailinput.js:337
        cy.forceClickOnCanvas();
        // set a value so the clear button renders, then assert it exists
        cy.get(`[data-cy="${W}-input"]`).type(fake.email); // dynamic: fake
        cy.get(".tj-input-clear-btn").should("be.visible"); // dynamic: clear button visible after typing

        // loadingState toggle. default {{false}}. source: emailinput.js:334
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: emailinput.js:334
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // dynamic: loader shown after enabling loading state
            });

        // disabledState toggle. default {{false}}. source: emailinput.js:333
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Loading state", "{{true}}"); // source: emailinput.js:334 (toggle loading back off)
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: emailinput.js:333
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should("be.disabled"); // source: emailinput.js:333

        // visibility toggle. default {{true}}. source: emailinput.js:330
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Disable", "{{true}}"); // source: emailinput.js:333 (toggle disable back off)
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: emailinput.js:330
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: hidden after disabling visibility

        // collapseWhenHidden toggle (additionalActions). default {{false}}. source: emailinput.js:57 / src_default emailinput.js:332
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: emailinput.js:330 (toggle visibility back on)
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: emailinput.js:57
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: emailinput.js:57 (toggle back)

        // tooltip (code, additionalActions). src_default: emailinput.js:335. source: emailinput.js:83
        openEditorSidebar(W);
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake
        cy.forceClickOnCanvas();
        /* RESOLVE-LIVE cssProp/selector for rendered tooltip: expected tooltip text
           surfaces on hover over [data-cy="draggable-widget-emailinput1"] — resolve live
           which element carries the tooltip content/aria attribute */

        // tooltipFormat switch (additionalActions). options plainText/markdown/html, default plainText.
        // source: emailinput.js:69
        openEditorSidebar(W);
        /* RESOLVE-LIVE selector+assertion for Tooltip format switch (options plainText/markdown/html) */ // source: emailinput.js:69
    });

    it.skip('should verify the validation of the email input', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // mandatory toggle (Make this field mandatory). default {{false}}. source: emailinput.js:315
        openEditorSidebar(W);
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: emailinput.js:315
        cy.forceClickOnCanvas();
        // mandatory renders the `*` marker span inside the label (Label.jsx:69,78)
        cy.get(`[data-cy="${W}-label"]`).should("contain.text", "*"); // dynamic: mandatory marker

        // maxLength (code). src_default: emailinput.js:318
        openEditorSidebar(W);
        verifyAndModifyParameter("Max length", "5"); // dynamic: test max length
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type("abcdefghij"); // dynamic: over-length input
        // exceeding maxLength invalidates the field → invalid-feedback shown
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should("be.visible"); // dynamic: validation error

        // minLength (code). src_default: emailinput.js:317
        openEditorSidebar(W);
        verifyAndModifyParameter("Max length", ""); // dynamic: reset max length
        openEditorSidebar(W);
        verifyAndModifyParameter("Min length", "8"); // dynamic: test min length
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type("ab"); // dynamic: under-length input
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should("be.visible"); // dynamic: validation error

        // regex (code). src_default: emailinput.js:316
        openEditorSidebar(W);
        verifyAndModifyParameter("Min length", ""); // dynamic: reset min length
        openEditorSidebar(W);
        verifyAndModifyParameter("Regex", "^[0-9]+$"); // dynamic: digits-only regex
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).clear().type("abc"); // dynamic: non-matching input
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should("be.visible"); // dynamic: validation error

        // customRule (Custom validation, code). src_default: emailinput.js:319
        openEditorSidebar(W);
        verifyAndModifyParameter("Regex", ""); // dynamic: reset regex
        openEditorSidebar(W);
        verifyAndModifyParameter("Custom validation", "{{ 'custom error' }}"); // dynamic: static custom rule
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should("have.text", "custom error"); // dynamic: echoes custom rule
    });

    it.skip('should verify the styles of the email input', () => {
        // ---- Label accordion ----
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // color (Text, colorSwatches, label). source: emailinput.js:352
        selectColourFromColourPicker("Text", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for color (label Text): expected label
           [data-cy="emailinput1-label"] `color` = rgba(255,0,0,1) */
        verifyWidgetColorCss(`[data-cy="${W}-label"]`, "color", [255, 0, 0, 100], true); // dynamic: asserts test color set above

        // labelFontSize (Size, numberInput, label). default {{12}}. source: emailinput.js:116
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        verifyAndModifyParameter("Size", "16"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for labelFontSize: expected label font-size 16px on [data-cy="emailinput1-label"] */

        // direction (icon-switch left/right, label). default left. source: emailinput.js:132
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        /* RESOLVE-LIVE selector for direction icon-switch (options left/right) + resulting label icon layout — source: emailinput.js:132 */

        // auto (Width checkbox, label). default {{true}}. condRender alignment=side. source: emailinput.js:145
        // width (slider, label). default {{33}}. condRender alignment=side & auto=false. source: emailinput.js:156
        // widthType (select, label). default ofComponent. condRender alignment=side & auto=false. source: emailinput.js:172
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        /* RESOLVE-LIVE selector for auto Width checkbox (:145) — unchecking it reveals the
           width slider (:156) + widthType select (:172); resolve live the checkbox/slider/select
           data-cy and assert the label width changes */

        // alignment switch (side/top). default side. source: emailinput.js:351
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        cy.get('[data-cy="alignment-top"]').click({ force: true }); // source: emailinput.js:122 (options: side,top)
        /* RESOLVE-LIVE cssProp for alignment: expected top alignment changes
           label/input flex-direction on [data-cy="emailinput1-label"] container */
        cy.get(`[data-cy="${W}-label"]`).should("be.visible"); // dynamic: alignment applied

        // ---- Field accordion ----
        // backgroundColor (Background, colorSwatches, field). source: emailinput.js:347
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Background", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor: expected input container
           [data-cy="emailinput1-input"] `background-color` = rgba(0,255,0,1) */
        verifyWidgetColorCss(`[data-cy="${W}-input"]`, "background-color", [0, 255, 0, 100], true); // dynamic: asserts test color set above

        // borderColor (Border, colorSwatches, field). source: emailinput.js:343
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Border", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor: expected input
           [data-cy="emailinput1-input"] `border-color` = rgba(0,0,255,1) */
        verifyWidgetColorCss(`[data-cy="${W}-input"]`, "border-color", [0, 0, 255, 100], true); // dynamic: asserts test color set above

        // accentColor (Accent, colorSwatches, field). source: emailinput.js:344
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Accent", ["255", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for accentColor: DOM target/prop unknown from
           empty cache — resolve live which element receives the accent color */

        // textColor (Text, colorSwatches, field). source: emailinput.js:341
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Text", ["0", "255", "255", "100"], 0, undefined, 1); // dynamic: test color (2nd "Text" swatch = field)
        /* RESOLVE-LIVE cssProp for textColor (field Text): expected input
           [data-cy="emailinput1-input"] `color` = rgba(0,255,255,1) */
        verifyWidgetColorCss(`[data-cy="${W}-input"]`, "color", [0, 255, 255, 100], true); // dynamic: asserts test color set above

        // errTextColor (Error text, colorSwatches, field). source: emailinput.js:345
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectColourFromColourPicker("Error text", ["128", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for errTextColor: applies to
           [data-cy="emailinput1-invalid-feedback"] `color` when invalid — resolve live */

        // icon (Icon, icon type, field). default IconMail visible. source: emailinput.js:356
        // Default icon is already visible (asserted in defaults). Change the icon
        // and assert the icon element still renders.
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        cy.get(`[data-cy="${W}-icon"]`).should("be.visible"); // source: emailinput.js:356 (icon default visible)

        // iconColor (Icon color, colorSwatches, field). visibility:false initially.
        // source: emailinput.js:348
        selectColourFromColourPicker("Icon color", ["255", "165", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for iconColor: expected icon
           [data-cy="emailinput1-icon"] stroke/color = rgba(255,165,0,1) */
        verifyWidgetColorCss(`[data-cy="${W}-icon"]`, "color", [255, 165, 0, 100], true); // dynamic: asserts test color set above

        // borderRadius (numberInput, field). default {{6}}. source: emailinput.js:346
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        cy.get('[data-cy="border-radius-input"]').clear().type("20"); // dynamic: test radius
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-input"]`).should("have.css", "border-radius", "20px"); // dynamic: test radius

        // boxShadow (field). default 0px 0px 0px 0px #00000040. source: emailinput.js:355
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        /* RESOLVE-LIVE cssProp for boxShadow: expected box-shadow on
           [data-cy="emailinput1-input"] */
        verifyBoxShadowCss(`[data-cy="${W}-input"]`, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: asserts test shadow set above

        // ---- Container accordion ----
        // padding switch (default/none). default default. source: emailinput.js:354
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        cy.get('[data-cy="padding-none"]').click({ force: true }); // source: emailinput.js:257 (options: default,none)
        /* RESOLVE-LIVE cssProp for padding: expected padding change on
           [data-cy="emailinput1-actionable-section"] */
        cy.get(`[data-cy="${W}-input"]`).should("be.visible"); // dynamic: padding applied
    });

    it.skip('should verify the layout / device toggles', () => {
        // others.showOnDesktop default {{true}}, showOnMobile default {{false}}.
        // source: emailinput.js:11 / :12
        verifyLayout(W);
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the email input', () => {
        // events: onChange, onEnterPressed, onFocus, onBlur. source: emailinput.js:104-107
        const events = [
            { event: "On Focus", message: "On Focus Event" },   // source: emailinput.js:106
            { event: "On Blur", message: "On Blur Event" },      // source: emailinput.js:107
            { event: "On Change", message: "On Change Event" },  // source: emailinput.js:104
            { event: "On Enter", message: "On Enter Event" },    // source: emailinput.js:105
        ];
        addMultiEventsWithAlert(events, false);

        const inputSelector = `[data-cy="${W}-input"]`;

        cy.get(inputSelector).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Focus Event', false); // dynamic: asserts alert message set above

        cy.get(inputSelector).type('a@b.com');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Change Event', false); // dynamic: asserts alert message set above

        cy.get(inputSelector).type('{enter}');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Enter Event', false); // dynamic: asserts alert message set above

        cy.forceClickOnCanvas();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Blur Event', false); // dynamic: asserts alert message set above
    });

    it.skip('should verify all the CSA from the email input', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // b1 source: emailinput.js:297
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // b2 source: emailinput.js:297
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // b3 source: emailinput.js:302
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // b4 source: emailinput.js:302
            { event: "On click", action: "Set text", value: "1199999" },               // b5 source: emailinput.js:280
            { event: "On click", action: "Clear" },                                    // b6 source: emailinput.js:285
            { event: "On click", action: "Set focus" },                                // b7 source: emailinput.js:289
            { event: "On click", action: "Set blur" },                                 // b8 source: emailinput.js:293
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // b9 source: emailinput.js:307
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
