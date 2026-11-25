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
describe('Currency Input Component Tests', { testIsolation: false }, () => {
    const W = "currencyinput1";

    const functions = [
        { key: "setValue", type: "Function" },   // source: currencyinput.js:296
        { key: "clear", type: "Function" },       // source: currencyinput.js:304
        { key: "setFocus", type: "Function" },    // source: currencyinput.js:308
        { key: "setBlur", type: "Function" },     // source: currencyinput.js:312
        { key: "setVisibility", type: "Function" }, // source: currencyinput.js:316
        { key: "setDisable", type: "Function" },  // source: currencyinput.js:321
        { key: "setLoading", type: "Function" },  // source: currencyinput.js:326
    ];

    const exposedValues = [
        { key: "value", type: "String", value: "\"\"" },      // source: currencyinput.js:289
        { key: "isMandatory", type: "Boolean", value: "false" }, // source: currencyinput.js:290
        { key: "isVisible", type: "Boolean", value: "true" },    // source: currencyinput.js:291
        { key: "isDisabled", type: "Boolean", value: "false" },  // source: currencyinput.js:292
        { key: "isLoading", type: "Boolean", value: "false" },   // source: currencyinput.js:293
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CurrencyInput-App`);
        cy.openApp();
        cy.dragAndDropWidget("Currency Input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Label default renders as "Label"
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .should("contain.text", "Label"); // source: currencyinput.js:347
        // visible + enabled by default
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: currencyinput.js:349
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.have.attr", "data-disabled", "true"); // source: currencyinput.js:352
    });

    it.skip('should verify the properties', () => {
        openEditorSidebar(W);

        // label (code) — widget shows the typed text
        const labelText = fake.randomSentence;
        verifyAndModifyParameter("Label", labelText); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", labelText); // dynamic: fake

        // placeholder (code)
        verifyAndModifyParameter("Placeholder", fake.randomSentence); // dynamic: fake

        // Default value (code) default "0"
        verifyAndModifyParameter("Default value", "100"); // dynamic: test value

        // Decimal places (code) default "2"
        verifyAndModifyParameter("Decimal places", "3"); // dynamic: test value

        // isCountryChangeEnabled (toggle) default {{true}}
        verifyAndModifyToggleFx("Enable currency change", "{{true}}"); // source: currencyinput.js:356
        verifyAndModifyToggleFx("Enable currency change", "{{true}}"); // source: currencyinput.js:356 (toggle back)

        // showFlag (toggle) default {{true}}
        verifyAndModifyToggleFx("Show currency flag", "{{true}}"); // source: currencyinput.js:357
        verifyAndModifyToggleFx("Show currency flag", "{{true}}"); // source: currencyinput.js:357 (toggle back)

        // showClearBtn (toggle) — additionalActions, default {{false}}
        openAccordion("Additional Actions", []);
        verifyAndModifyToggleFx("Enable clear button", "{{false}}"); // source: currencyinput.js:360
        verifyAndModifyToggleFx("Enable clear button", "{{false}}"); // source: currencyinput.js:360 (toggle back)

        // loadingState (toggle) default {{false}} → widget loader visible
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: currencyinput.js:353
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .find(".tj-widget-loader")
            .should("be.visible"); // dynamic: loader shown after enabling loading state
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: currencyinput.js:353 (toggle back)

        // disabledState (toggle) default {{false}} → data-disabled
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: currencyinput.js:352
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // dynamic: disabled after enabling
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: currencyinput.js:352 (toggle back)

        // collapseWhenHidden (toggle) default {{false}}
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: currencyinput.js:351
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: currencyinput.js:351 (toggle back)

        // visibility (toggle) default {{true}} → widget hidden when off
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: currencyinput.js:349
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: hidden after disabling visibility
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: currencyinput.js:349 (toggle back)

        // tooltip (code) — additionalActions
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake

        // tooltipFormat (switch) plainText/markdown/html default plainText — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for Tooltip format switch (options plainText/markdown/html) */ // source: currencyinput.js:85
    });

    it.skip('should verify the validation', () => {
        openEditorSidebar(W);
        openAccordion("Validation", []);

        // mandatory (toggle) default {{false}} → shows required `*` marker
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: currencyinput.js:334
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", "*"); // dynamic: mandatory marker rendered
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: currencyinput.js:334 (toggle back)

        // regex / minValue / maxValue / customRule (code) — accept input
        verifyAndModifyParameter("Regex", "^[0-9]+$"); // dynamic: test regex
        verifyAndModifyParameter("Min value", "1"); // dynamic: test min value
        verifyAndModifyParameter("Max value", "100"); // dynamic: test max value
        verifyAndModifyParameter("Custom validation", "{{false}}"); // dynamic: test custom rule
    });

    it.skip('should verify styles', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---- Label accordion ----
        openAccordion("Label", []);
        // color (colorSwatches) → label text color. default var(--cc-primary-text) source: currencyinput.js:375
        selectColourFromColourPicker("Text", ['255', '0', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for label color */ "color", [255, 0, 0, 100]); // dynamic: test color

        // labelFontSize (numberInput) default {{12}} — input selector + CSS target unknown (empty cache)
        /* RESOLVE-LIVE selector for labelFontSize numberInput + font-size assertion */ // source: currencyinput.js:365

        // alignment (switch) side/top — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for alignment switch (options side/top) */ // source: currencyinput.js:374

        // direction (icon switch) left/right — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for direction icon switch (options left/right) */ // source: currencyinput.js:148

        // auto (checkbox) Width default {{true}}, condRender alignment=side — selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for Width auto checkbox */ // source: currencyinput.js:161

        // width (slider) default {{33}}, condRender alignment=side & auto=false — selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for width slider */ // source: currencyinput.js:172

        // widthType (select) default ofComponent, condRender alignment=side & auto=false — selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for widthType select */ // source: currencyinput.js:188

        // ---- Field accordion ----
        openAccordion("Field", []);
        // backgroundColor (colorSwatches) default var(--cc-surface1-surface) source: currencyinput.js:370
        selectColourFromColourPicker("Background", ['255', '0', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for backgroundColor */ "background-color", [255, 0, 0, 100]); // dynamic: test color

        // borderColor (colorSwatches) default var(--cc-default-border) source: currencyinput.js:366
        selectColourFromColourPicker("Border", ['0', '255', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for borderColor */ "border-color", [0, 255, 0, 100]); // dynamic: test color

        // accentColor (colorSwatches) default var(--cc-primary-brand) source: currencyinput.js:367
        selectColourFromColourPicker("Accent", ['0', '0', '255', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for accentColor */ "accent-color", [0, 0, 255, 100]); // dynamic: test color

        // textColor (colorSwatches) default var(--cc-primary-text) source: currencyinput.js:364
        selectColourFromColourPicker("Text", ['10', '20', '30', '100']); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for textColor */ "color", [10, 20, 30, 100]); // dynamic: test color

        // errTextColor (colorSwatches) default var(--cc-error-systemStatus) — swatch selector/CSS target unknown (empty cache)
        selectColourFromColourPicker("Error text", ['40', '50', '60', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp/selector for errTextColor (error-state text) */ // source: currencyinput.js:368

        // borderRadius (numberInput) default {{6}} — input selector + CSS target unknown (empty cache)
        /* RESOLVE-LIVE selector for borderRadius numberInput + border-radius assertion on field */ // source: currencyinput.js:369

        // boxShadow default 0px 0px 0px 0px #00000040 source: currencyinput.js:378
        fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], ['0', '0', '10', '0']); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // ---- Container accordion ----
        openAccordion("Container", []);
        // padding (switch) default/none — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for padding switch (options default/none) */ // source: currencyinput.js:377
    });

    it.skip('should verify layout (show on desktop/mobile)', () => {
        // showOnDesktop default {{true}} / showOnMobile default {{false}}
        // source: currencyinput.js:11 / currencyinput.js:12
        verifyLayout(W);
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the currency input', () => {
        const events = [
            { event: "On focus", message: "onFocus Event" },   // source: currencyinput.js:122
            { event: "On blur", message: "onBlur Event" },     // source: currencyinput.js:123
            { event: "On change", message: "onChange Event" }, // source: currencyinput.js:120
            { event: "On enter pressed", message: "onEnterPressed Event" }, // source: currencyinput.js:121
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

    it.skip('should verify all the CSA from currency input', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // source: currencyinput.js:316
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // source: currencyinput.js:316
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // source: currencyinput.js:321
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // source: currencyinput.js:321
            { event: "On click", action: "Set Value", value: "1199999" },              // source: currencyinput.js:296
            { event: "On click", action: "Clear" },                                    // source: currencyinput.js:304
            { event: "On click", action: "Set focus" },                                // source: currencyinput.js:308
            { event: "On click", action: "Set blur" },                                 // source: currencyinput.js:312
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // source: currencyinput.js:326
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });
});
