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
describe('Text Component Tests', { testIsolation: false }, () => {
    let data = {};
    const W = "text1";
    const widget = commonWidgetSelector.draggableWidget(W);
    // The `text` property field is keyed off its unique (non-user-facing)
    // displayName "TextComponentTextInput" → data-cy `textcomponenttextinput-*`
    // (text.js:25). showLabel:false, so no visible parameter label renders.
    const textInputField = '[data-cy="textcomponenttextinput-input-field"]';

    const exposedValues = [
        {
            "key": "text",
            "type": "String",
            "value": "\"Hello, there!\"" // source: text.js:269
        },
    ];
    const functions = [
        { "key": "setText", "type": "Function" },       // source: text.js:273
        { "key": "setVisibility", "type": "Function" }, // source: text.js:278
        { "key": "clear", "type": "Function" },         // source: text.js:283
        { "key": "setLoading", "type": "Function" },    // source: text.js:287
        { "key": "setDisable", "type": "Function" },    // source: text.js:292
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Text-App`);
        cy.openApp();
        cy.dragAndDropWidget('Text', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Widget renders and is visible/enabled by default.
        cy.get(widget).should("be.visible"); // source: text.js:308 (visibility {{true}})
        cy.get(widget).should("not.have.attr", "data-disabled", "true"); // source: text.js:307 (disabledState {{false}})

        // Default text value carries a handlebars expr
        // `Hello {{globals.currentUser.firstName}}👋` (text.js:305) → the RENDERED
        // string depends on the logged-in user's first name at runtime, so the
        // exact literal is not deterministic here.
        /* RESOLVE-LIVE renderedDefaultText for text (default value at text.js:305 resolves globals.currentUser.firstName) */
        cy.get(widget)
            .invoke("text")
            .should("include", "Hello"); // dynamic: default text.js:305 resolves user firstName at runtime

        // Exposed default value on inspector
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify properties', () => {
        openEditorSidebar(W);

        // --- text (code) ---
        // The `text` field uses displayName "TextComponentTextInput" (text.js:25)
        // with showLabel:false, so verifyAndModifyParameter's label assertion
        // ("have.text","TextComponentTextInput") cannot resolve — type directly
        // into the code field instead.
        /* RESOLVE-LIVE parameterLabel for text — displayName TextComponentTextInput is hidden (showLabel:false, text.js:30); verifyAndModifyParameter label assert not usable */
        data = {};
        data.text = fake.randomSentence;
        cy.get(textInputField).clearAndTypeOnCodeMirror(data.text); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(widget).verifyVisibleElement("have.text", data.text); // dynamic: fake typed text

        // --- textFormat (switch: plainText / markdown / html) ---
        openEditorSidebar(W);
        // options from text.js:15-17
        cy.get('[data-cy="text-format-switch-plain-text"], [data-cy*="plain-text"]')
            .first()
            .click({ force: true }); // source: text.js:15 (Plain text)
        /* RESOLVE-LIVE optionSelector for textFormat switch (options Plain text/Markdown/HTML, text.js:14-18) */

        // --- tooltipFormat (switch) + tooltip (code) : Additional Actions ---
        openAccordion("Additional actions");
        // tooltip code field (showLabel:false, text.js:98) → type directly
        data.tooltip = fake.randomSentence;
        cy.get('[data-cy="tooltip-input-field"]').clearAndTypeOnCodeMirror(data.tooltip); // dynamic: fake
        /* RESOLVE-LIVE tooltipVerification for tooltip (hover widget, assert tooltip text) */

        // --- toggles (Additional Actions) ---
        // dynamicHeight default {{false}} (text.js:304)
        verifyAndModifyToggleFx("Dynamic height", "{{false}}"); // source: text.js:304
        // loadingState default {{false}} (text.js:306) → asserts loader appears
        verifyAndModifyToggleFx("Show loading state", "{{false}}"); // source: text.js:306
        cy.get(widget).parent().find(".tj-widget-loader").should("be.visible"); // source: text.js:306
        verifyAndModifyToggleFx("Show loading state", "{{false}}"); // source: text.js:306 (toggle back)
        // collapseWhenHidden default {{false}} (text.js:310)
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: text.js:310
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: text.js:310 (toggle back)
        // disabledState default {{false}} (text.js:307)
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: text.js:307
        cy.get(widget).should("have.attr", "data-disabled", "true"); // source: text.js:307
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: text.js:307 (toggle back)
        // visibility default {{true}} (text.js:308)
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: text.js:308
        cy.get(widget).should("not.be.visible"); // source: text.js:308
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: text.js:308 (toggle back)
    });

    it.skip('should verify styles', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ================= Text accordion =================
        openAccordion("Text");

        // textColor (colorSwatches, default var(--cc-primary-text) text.js:317)
        data = {};
        data.textColor = ["255", "0", "0", "100"];
        selectColourFromColourPicker("Color", data.textColor); // dynamic: test color
        /* RESOLVE-LIVE cssProp for textColor (colorSwatches Color, text.js:141) */
        verifyWidgetColorCss(W, "color", [255, 0, 0, 100]); // dynamic: test color

        // textSize (numberInput, default {{14}} text.js:318)
        cy.get('[data-cy="text-size-input-field"], [data-cy*="size"] input')
            .first()
            .clear({ force: true })
            .type("25", { force: true }); // source: text.js:318 (default 14) — set to 25
        /* RESOLVE-LIVE cssProp for textSize (numberInput Size, text.js:110) */

        // fontWeight (select, options normal/bold/lighter/bolder text.js:122-127)
        /* RESOLVE-LIVE optionSelector+cssProp for fontWeight (select Weight, text.js:119) */

        // fontStyle (switch icon: normal/oblique/italic text.js:133-137)
        /* RESOLVE-LIVE optionSelector+cssProp for fontStyle (switch Style, text.js:130) */

        // isScrollRequired (switch: enabled/disabled text.js:152-155, default enabled text.js:334)
        /* RESOLVE-LIVE optionSelector+cssProp for isScrollRequired (switch Scroll, text.js:149) */

        // lineHeight (numberInput default {{1.5}} text.js:324)
        cy.get('[data-cy="line-height-input-field"], [data-cy*="line-height"] input')
            .first()
            .clear({ force: true })
            .type("3", { force: true }); // source: text.js:324 (default 1.5) — set to 3
        /* RESOLVE-LIVE cssProp for lineHeight (numberInput Line height, text.js:158) */

        // textIndent (numberInput default {{0}} text.js:325)
        cy.get('[data-cy="text-indent-input-field"], [data-cy*="text-indent"] input')
            .first()
            .clear({ force: true })
            .type("2", { force: true }); // source: text.js:325 (default 0) — set to 2
        /* RESOLVE-LIVE cssProp for textIndent (numberInput Text indent, text.js:159) */

        // textAlign (alignButtons default left text.js:319)
        /* RESOLVE-LIVE optionSelector+cssProp for textAlign (alignButtons Alignment, text.js:160) */

        // verticalAlignment (switch icon top/center/bottom, default center text.js:329)
        /* RESOLVE-LIVE optionSelector+cssProp for verticalAlignment (switch icon, text.js:169) */

        // decoration (switch icon none/underline/overline/line-through, default none text.js:321)
        /* RESOLVE-LIVE optionSelector+cssProp for decoration (switch Decoration, text.js:183) */

        // transformation (switch icon none/uppercase/lowercase/capitalize, default none text.js:322)
        /* RESOLVE-LIVE optionSelector+cssProp for transformation (switch Transformation, text.js:195) */

        // letterSpacing (numberInput default {{0}} text.js:326)
        cy.get('[data-cy="letter-spacing-input-field"], [data-cy*="letter-spacing"] input')
            .first()
            .clear({ force: true })
            .type("2", { force: true }); // source: text.js:326 (default 0) — set to 2
        /* RESOLVE-LIVE cssProp for letterSpacing (numberInput Letter spacing, text.js:207) */

        // wordSpacing (numberInput default {{0}} text.js:327)
        cy.get('[data-cy="word-spacing-input-field"], [data-cy*="word-spacing"] input')
            .first()
            .clear({ force: true })
            .type("2", { force: true }); // source: text.js:327 (default 0) — set to 2
        /* RESOLVE-LIVE cssProp for wordSpacing (numberInput Word spacing, text.js:208) */

        // fontVariant (select normal/small-caps/initial/inherit text.js:212-216)
        /* RESOLVE-LIVE optionSelector+cssProp for fontVariant (select Font variant, text.js:209) */

        // ================= Container accordion =================
        openAccordion("Container");

        // backgroundColor (colorSwatches, default #fff00000 text.js:316)
        data.backgroundColor = ["0", "255", "0", "100"];
        selectColourFromColourPicker("Background", data.backgroundColor); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor (colorSwatches Background, text.js:221) */
        verifyWidgetColorCss(W, "background-color", [0, 255, 0, 100]); // dynamic: test color

        // borderColor (colorSwatches, default #ffffff00 text.js:332)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion("Container");
        data.borderColor = ["0", "0", "255", "100"];
        selectColourFromColourPicker("Border", data.borderColor); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor (colorSwatches Border, text.js:231) */
        verifyWidgetColorCss(W, "border-color", [0, 0, 255, 100]); // dynamic: test color

        // borderRadius (numberInput default {{6}} text.js:333)
        cy.get('[data-cy="border-radius-input-field"], [data-cy*="border-radius"] input')
            .first()
            .clear({ force: true })
            .type("12", { force: true }); // source: text.js:333 (default 6) — set to 12
        /* RESOLVE-LIVE cssProp for borderRadius (numberInput Border radius, text.js:241) */

        // boxShadow (default 0px 0px 0px 0px #00000040 text.js:331)
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // padding (switch default/none, default default text.js:330)
        /* RESOLVE-LIVE optionSelector+cssProp for padding (switch Padding, text.js:256) */
    });

    it.skip('should verify the layout', () => {
        // showOnDesktop {{true}} (text.js:299) + showOnMobile {{false}} (text.js:300)
        verifyLayout(W); // source: text.js:299, text.js:300
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the Text', () => {
        const events = [
            { event: "On click", message: "onClick Event" },  // source: text.js:106
            { event: "On hover", message: "onHover Event" },   // source: text.js:107
        ];
        addMultiEventsWithAlert(events, false);

        // onClick
        cy.get(widget).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onClick Event", false); // dynamic: echoed event message

        // onHover
        cy.get(widget).realHover();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onHover Event", false); // dynamic: echoed event message
    });

    it.skip('should verify all the CSA from Text', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // b1 source: text.js:280
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // b2 source: text.js:280
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // b3 source: text.js:294
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // b4 source: text.js:294
            { event: "On click", action: "Set text", value: "New text" },              // b5 source: text.js:275
            { event: "On click", action: "Clear" },                                    // b6 source: text.js:284
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // b7 source: text.js:289
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },    // b8 source: text.js:289
        ];
        addCSA(W, actions);

        cy.get(commonWidgetSelector.draggableWidget("button1")).click();
        cy.get(widget).should("not.be.visible"); // source: text.js:280 (setVisibility {{false}})

        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(widget).should("be.visible"); // source: text.js:280 (setVisibility {{true}})

        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        cy.get(widget).should("have.attr", "data-disabled", "true"); // source: text.js:294 (setDisable {{true}})

        cy.get(commonWidgetSelector.draggableWidget("button4")).click();
        cy.get(widget).should("have.attr", "data-disabled", "false"); // source: text.js:294 (setDisable {{false}})

        cy.get(commonWidgetSelector.draggableWidget("button5")).click();
        cy.get(widget).verifyVisibleElement("have.text", "New text"); // source: text.js:275 (setText param default)

        cy.get(commonWidgetSelector.draggableWidget("button6")).click();
        cy.get(widget).should("have.text", ""); // source: text.js:284 (clear)

        cy.get(commonWidgetSelector.draggableWidget("button7")).click();
        cy.get(widget).parent().within(() => {
            cy.get(".tj-widget-loader").should("be.visible"); // source: text.js:289 (setLoading {{true}})
        });

        cy.get(commonWidgetSelector.draggableWidget("button8")).click();
        cy.notVisible(".tj-widget-loader"); // source: text.js:289 (setLoading {{false}})
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
