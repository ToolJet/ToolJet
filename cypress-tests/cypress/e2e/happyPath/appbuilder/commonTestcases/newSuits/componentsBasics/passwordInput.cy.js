import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA, verifyCSA } from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyToggleFx,
    verifyAndModifyParameter,
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
describe('Password Input Component Tests', { testIsolation: false }, () => {
    const W = "passwordinput1";

    const exposedValues = [
        {
            "key": "value",
            "type": "String",
            "value": "\"\"" // source: passwordinput.js:278
        },
        {
            "key": "isMandatory",
            "type": "Boolean",
            "value": "false" // source: passwordinput.js:279
        },
        {
            "key": "isVisible",
            "type": "Boolean",
            "value": "true" // source: passwordinput.js:280
        },
        {
            "key": "isDisabled",
            "type": "Boolean",
            "value": "false" // source: passwordinput.js:281
        },
        {
            "key": "isLoading",
            "type": "Boolean",
            "value": "false" // source: passwordinput.js:282
        },
    ];

    const functions = [
        { "key": "setText", "type": "Function" },       // source: passwordinput.js:285
        { "key": "clear", "type": "Function" },          // source: passwordinput.js:290
        { "key": "setFocus", "type": "Function" },       // source: passwordinput.js:294
        { "key": "setBlur", "type": "Function" },        // source: passwordinput.js:298
        { "key": "setVisibility", "type": "Function" },  // source: passwordinput.js:302
        { "key": "setDisable", "type": "Function" },     // source: passwordinput.js:307
        { "key": "setLoading", "type": "Function" },     // source: passwordinput.js:312
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Passwordinput-App`);
        cy.openApp();
        cy.dragAndDropWidget('Password Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Password Input drops visible, enabled, with the default label and an
        // empty (masked) value. The value is a password field so the visible DOM
        // masks it — assert the default via the exposed `value` in the inspector.
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: passwordinput.js:325 (visibility {{true}})

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        // Defaults reuse the exposed-values assertions:
        // value:"" source: passwordinput.js:278, isMandatory:false source: passwordinput.js:279,
        // isVisible:true source: passwordinput.js:280, isDisabled:false source: passwordinput.js:281,
        // isLoading:false source: passwordinput.js:282
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify the properties of the password input', () => {
        openEditorSidebar(W);
        openAccordion("Properties");

        // label — code, default "Label" — source default: passwordinput.js:332
        verifyAndModifyParameter("Label", fake.randomSentence); // dynamic: fake

        // placeholder — code, default "Password" — source default: passwordinput.js:324
        verifyAndModifyParameter("Placeholder", fake.randomSentence); // dynamic: fake

        // value — code, default "" — source default: passwordinput.js:333
        // Password field masks the typed value in the DOM; effect is asserted via
        // the exposed `value` in the CSA/exposed-values facets, not visible text.
        verifyAndModifyParameter("Default value", fake.randomSentence); // dynamic: fake
        /* RESOLVE-LIVE: default value renders masked in DOM; verify via exposed `value` node */

        // Additional actions accordion holds the remaining toggles + tooltip.
        openAccordion("Additional actions");

        // loadingState — toggle, default {{false}} — source default: passwordinput.js:329
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: passwordinput.js:329
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // dynamic: loader shown after enabling loading state
            });
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: passwordinput.js:329

        // visibility — toggle, default {{true}} — source default: passwordinput.js:325
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: passwordinput.js:325
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: hidden after disabling visibility
        verifyAndModifyToggleFx("Visibility", "{{true}}", true, false); // source: passwordinput.js:325

        // collapseWhenHidden — toggle, default {{false}} — source default: passwordinput.js:327
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: passwordinput.js:327
        /* RESOLVE-LIVE: DOM effect of Collapse when hidden cannot be derived from config */
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: passwordinput.js:327

        // disabledState — toggle, default {{false}} — source default: passwordinput.js:328
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: passwordinput.js:328
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // source: passwordinput.js:328
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: passwordinput.js:328

        // tooltipFormat — switch: plainText | markdown | html, default plainText — source default: passwordinput.js:331
        /* RESOLVE-LIVE: Tooltip format switch option selectors + rendered tooltip markup unknown from config */

        // tooltip — code, default "" — source default: passwordinput.js:330
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake
    });

    it.skip('should verify the validation of the password input', () => {
        openEditorSidebar(W);
        openAccordion("Validation");

        // mandatory — toggle, default false — source default: passwordinput.js:336
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: passwordinput.js:336
        /* RESOLVE-LIVE: mandatory `*` marker selector for password input unknown from config */
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: passwordinput.js:336

        // regex — code, default "" — source default: passwordinput.js:337
        verifyAndModifyParameter("Regex", fake.randomSentence); // dynamic: fake

        // minLength — code, default "" — source default: passwordinput.js:338
        verifyAndModifyParameter("Min length", "3"); // dynamic: test value

        // maxLength — code, default "" — source default: passwordinput.js:339
        verifyAndModifyParameter("Max length", "10"); // dynamic: test value

        // customRule — code, default "" — source default: passwordinput.js:340
        verifyAndModifyParameter("Custom validation", fake.randomSentence); // dynamic: fake
    });

    it.skip('should verify the styles of the password input', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---- Label section ----
        openAccordion("Label");

        // color — colorSwatches, default var(--cc-primary-text) — source: passwordinput.js:108
        selectColourFromColourPicker("Text", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for color (label text color css prop / selector) */
        // verifyWidgetColorCss(W, "color", [255, 0, 0, 100]);

        // labelFontSize — numberInput, default 12 — source default: passwordinput.js:350
        verifyAndModifyParameter("Size", "16"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for labelFontSize (font-size css prop / label selector) */

        // alignment — switch: side | top, default side — source default: passwordinput.js:355
        /* RESOLVE-LIVE: alignment switch option selectors + resulting layout css unknown from config */

        // direction — switch(icon): left | right, default left — source default: passwordinput.js:353
        /* RESOLVE-LIVE: label direction icon-switch option selectors + resulting css unknown from config */

        // auto / width / widthType are conditional on alignment=side & auto=false — source: passwordinput.js:143/:154/:170
        /* RESOLVE-LIVE: label width controls appear only when auto is unchecked; selectors + css unknown from config */

        // ---- Field section ----
        openAccordion("Field");

        // backgroundColor — colorSwatches, default var(--cc-surface1-surface) — source: passwordinput.js:195
        selectColourFromColourPicker("Background", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor (field background-color css prop / selector) */
        // verifyWidgetColorCss(W, "background-color", [0, 255, 0, 100]);

        // borderColor — colorSwatches, default var(--cc-default-border) — source: passwordinput.js:201
        selectColourFromColourPicker("Border", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor (border-color css prop / selector) */

        // accentColor — colorSwatches, default var(--cc-primary-brand) — source: passwordinput.js:207
        selectColourFromColourPicker("Accent", ["255", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for accentColor (accent css prop / selector) */

        // textColor — colorSwatches, default var(--cc-primary-text) — source: passwordinput.js:213
        selectColourFromColourPicker("Text", ["0", "255", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for textColor (input text color css prop / selector) */

        // placeholderTextColor — colorSwatches, default var(--cc-placeholder-text) — source: passwordinput.js:219
        selectColourFromColourPicker("Placeholder Text", ["255", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for placeholderTextColor (placeholder color css prop / selector) */

        // errTextColor — colorSwatches, default var(--cc-error-systemStatus) — source: passwordinput.js:225
        selectColourFromColourPicker("Error text", ["128", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for errTextColor (error text color css prop / selector) */

        // icon — icon, default IconLock, visibility:false — source: passwordinput.js:231
        /* RESOLVE-LIVE: `Icon` picker is gated by visibility:false with no cited enabling handle — not reachable from config */

        // iconColor — colorSwatches, default var(--cc-default-icon), visibility:false — source: passwordinput.js:238
        /* RESOLVE-LIVE: `Icon color` swatch is gated by visibility:false with no cited enabling handle — not reachable from config */

        // borderRadius — numberInput, default 6 — source default: passwordinput.js:344
        verifyAndModifyParameter("Border radius", "20"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for borderRadius (border-radius css prop / selector) */

        // boxShadow — boxShadow, default 0px 0px 0px 0px #00000040 — source: passwordinput.js:252
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        /* RESOLVE-LIVE cssProp for boxShadow (field box-shadow target selector) */
        // verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]);

        // ---- Container section ----
        openAccordion("Container");

        // padding — switch: default | none, default default — source default: passwordinput.js:358
        /* RESOLVE-LIVE: padding switch option selectors + resulting padding css unknown from config */
    });

    it.skip('should verify the layout / device toggles', () => {
        // others.showOnDesktop default {{true}}, showOnMobile default {{false}}.
        // source: passwordinput.js:11 / :12
        verifyLayout(W);
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the password input', () => {
        const events = [
            { event: "On Focus", message: "onFocus Event" },        // source: passwordinput.js:103
            { event: "On Blur", message: "onBlur Event" },          // source: passwordinput.js:104
            { event: "On Change", message: "onChange Event" },      // source: passwordinput.js:102
            { event: "On Enter", message: "onEnterPressed Event" }, // source: passwordinput.js:105
        ];

        addMultiEventsWithAlert(events, false);
        const inputSelector = commonWidgetSelector.draggableWidget(W);

        cy.get(inputSelector).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onFocus Event', false); // dynamic: echoed event message

        cy.get(inputSelector).type('secret');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onChange Event', false); // dynamic: echoed event message

        cy.get(inputSelector).type('{enter}');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onEnterPressed Event', false); // dynamic: echoed event message

        cy.forceClickOnCanvas();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onBlur Event', false); // dynamic: echoed event message
    });

    it.skip('should verify all the CSA from the password input', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // b1  source: passwordinput.js:302
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // b2  source: passwordinput.js:302
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // b3  source: passwordinput.js:307
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // b4  source: passwordinput.js:307
            { event: "On click", action: "Set text", value: "New Text" },              // b5  source: passwordinput.js:285
            { event: "On click", action: "Clear" },                                    // b6  source: passwordinput.js:290
            { event: "On click", action: "Set focus" },                                // b7  source: passwordinput.js:294
            { event: "On click", action: "Set blur" },                                 // b8  source: passwordinput.js:298
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // b9  source: passwordinput.js:312
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
