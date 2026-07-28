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
    selectFromSidebarDropdown,
    openEditorSidebar,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Button Component Tests', { testIsolation: false }, () => {
    const W = "button1";
    const widget = commonWidgetSelector.draggableWidget(W);

    // config.exposedVariables — one entry per exposed key
    const exposedValues = [
        { key: "buttonText", type: "String", value: "\"Button\"" }, // source: button.js:247
        { key: "isVisible", type: "Boolean", value: "true" },       // source: button.js:248
        { key: "isDisabled", type: "Boolean", value: "false" },     // source: button.js:249
        { key: "isLoading", type: "Boolean", value: "false" },      // source: button.js:250
    ];

    // config.actions handles. disable/visibility/loading are DEPRECATED.
    const functions = [
        { key: "click", type: "Function" },         // source: button.js:253
        { key: "setText", type: "Function" },       // source: button.js:257
        { key: "setVisibility", type: "Function" }, // source: button.js:262
        { key: "setDisable", type: "Function" },    // source: button.js:267
        { key: "setLoading", type: "Function" },    // source: button.js:272
        // @deprecated (displayName contains "deprecated") — excluded from pass-required
        { key: "disable", type: "Function" },       // source: button.js:277
        { key: "visibility", type: "Function" },    // source: button.js:282
        { key: "loading", type: "Function" },       // source: button.js:287
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Button-App`);
        cy.openApp();
        cy.dragAndDropWidget("Button", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // label default = definition.properties.text.value "Button"
        cy.get(widget).should("have.text", "Button"); // source: button.js:299
        // visible + enabled by default; not loading
        cy.get(widget).should("be.visible"); // source: button.js:300
        cy.get(widget).parent().should("not.have.attr", "disabled"); // source: button.js:302
        cy.get(widget).parent().within(() => {
            cy.get(".tj-widget-loader").should("not.exist"); // source: button.js:303
        });

        // confirm defaults via inspector
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify the properties of the button', () => {
        openEditorSidebar(W);

        // text (code) → Label
        const label = fake.randomSentence;
        verifyAndModifyParameter("Label", label); // dynamic: fake
        cy.forceClickOnCanvas();
        cy.get(widget).should("have.text", label); // dynamic: fake

        openEditorSidebar(W);
        // visibility (toggle) default {{true}}
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: button.js:300
        cy.get(widget).should("not.be.visible");
        verifyAndModifyToggleFx("Visibility", "{{true}}", true, false); // source: button.js:300
        cy.get(widget).should("be.visible");

        // disabledState (toggle) default {{false}}
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: button.js:302
        cy.get(widget).parent().should("have.attr", "disabled"); // source: button.js:302
        verifyAndModifyToggleFx("Disable", "{{false}}", true, false); // source: button.js:302
        cy.get(widget).parent().should("not.have.attr", "disabled"); // source: button.js:302

        // loadingState (toggle) default {{false}}
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: button.js:303
        cy.get(widget).parent().within(() => {
            cy.get(".tj-widget-loader").should("be.visible");
        });
        verifyAndModifyToggleFx("Loading state", "{{false}}", true, false); // source: button.js:303

        // collapseWhenHidden (toggle) default {{false}}
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}", false); // source: button.js:301

        // tooltipFormat (switch: plainText | markdown | html) default plainText — additionalActions
        // source default: button.js:305
        cy.get('[data-cy="togglr-button-markdown"]').click(); // source: button.js:46
        /* RESOLVE-LIVE cssProp: rendered tooltip markup selector for markdown format unknown from config */
        cy.get('[data-cy="togglr-button-plaintext"]').click(); // source: button.js:46

        // tooltip (code) default "" — additionalActions
        const tooltipText = fake.randomSentence;
        verifyAndModifyParameter("Tooltip", tooltipText); // dynamic: fake; source: button.js:60
        /* RESOLVE-LIVE cssProp: tooltip-content selector to assert rendered tooltip text unknown from config */
    });

    it.skip('should verify the styles of the button', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // type (switch: primary | outline) default primary — accordian: button
        // source default: button.js:326
        cy.get('[data-cy="togglr-button-outline"]').click(); // source: button.js:74
        /* RESOLVE-LIVE cssProp: outline vs primary variant DOM difference (border/background) unknown from config */
        cy.get('[data-cy="togglr-button-primary"]').click(); // source: button.js:74

        // backgroundColor (colorSwatches) — Background (only when type=primary). cssProp unknown (cache empty).
        selectColourFromColourPicker("Background", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor */
        verifyWidgetColorCss(W, "background-color", [255, 0, 0, 100]); // source: button.js:317

        // hoverBackgroundMode (switch: auto | manual) default auto — accordian: container
        // source default: button.js:318
        cy.get('[data-cy="togglr-button-manual"]').click(); // source: button.js:97
        /* RESOLVE-LIVE cssProp: hover-background mode DOM effect unknown from config */

        // hoverBackgroundColor (colorSwatches) — only when type=primary & mode=manual
        selectColourFromColourPicker("Hover background", ["0", "255", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for hoverBackgroundColor (hover state color assertion) */ // source: button.js:112
        cy.get('[data-cy="togglr-button-auto"]').click(); // source: button.js:97

        // textColor (colorSwatches) — Text color. cssProp unknown (cache empty).
        selectColourFromColourPicker("Text color", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for textColor */
        verifyWidgetColorCss(W, "color", [0, 255, 0, 100]); // source: button.js:312

        // textSize (numberInput) — Font size, default {{14}} — accordian: button
        // source default: button.js:309
        verifyAndModifyParameter("Font size", "20"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for textSize (font-size css prop / selector) */ // source: button.js:141

        // fontWeight (select: normal | medium | bold | lighter | bolder) default normal — accordian: button
        // source default: button.js:310
        selectFromSidebarDropdown("Font Weight", "bold"); // source: button.js:150
        /* RESOLVE-LIVE cssProp for fontWeight (font-weight css prop / selector) */

        // borderColor (colorSwatches) — Border color. cssProp unknown (cache empty).
        selectColourFromColourPicker("Border color", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor */
        verifyWidgetColorCss(W, "border-color", [0, 0, 255, 100]); // source: button.js:313

        // loaderColor (colorSwatches) — Loader color — accordian: button
        selectColourFromColourPicker("Loader color", ["255", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for loaderColor (--loader-color / loader selector) */ // source: button.js:171

        // contentAlignment (alignButtons) default center — accordian: button
        // source default: button.js:315
        cy.get('[data-cy="togglr-button-right"]').click(); // source: button.js:180
        /* RESOLVE-LIVE cssProp for contentAlignment (flex/text alignment css prop / selector) */
        cy.get('[data-cy="togglr-button-center"]').click(); // source: button.js:180

        // borderRadius (numberInput) default {{6}} — accordian: button
        // source default: button.js:316
        verifyAndModifyParameter("Border radius", "20"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for borderRadius (border-radius css prop / selector) */ // source: button.js:218

        // boxShadow (boxShadow) — Box shadow (rendered only when type=primary, the default)
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        /* RESOLVE-LIVE cssProp/color for boxShadow */
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // source: button.js:323

        // padding (switch: default | none) default default — accordian: container
        // source default: button.js:322
        cy.get('[data-cy="togglr-button-none"]').click(); // source: button.js:235
        /* RESOLVE-LIVE cssProp for padding (padding css prop / selector) */
        cy.get('[data-cy="togglr-button-default"]').click(); // source: button.js:235
    });

    it.skip('should verify layout/device toggles', () => {
        // others.showOnDesktop default {{true}}, showOnMobile default {{false}}.
        // source: button.js:11 / :12
        verifyLayout(W);
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);// duplication
        verifyNodes(functions, verifyNodeData);
        // id is pending
    });

    it.skip('should verify all the events from the button', () => {
        const events = [
            { event: "On hover", message: "On hover Event" }, // source: button.js:71
            { event: "On click", message: "On Click Event" }, // source: button.js:70
        ];

        // `add-event-handler` lives in the right-sidebar Inspector
        // (EventManager.jsx), only shown when the Properties panel is open. Open
        // it via the config handle's "Properties & Styles" button
        // (ConfigHandle.jsx:277-288 → setRightSidebarOpen(true) + CONFIGURATION).
        cy.get(widget).realHover();
        cy.get(`[data-cy="${W}-properties-styles-button"]`).click();

        addMultiEventsWithAlert(events);

        cy.get(widget).realHover();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On hover Event', false); // source: button.js:71

        cy.get(widget).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Click Event', false); // source: button.js:70
    });

    it.skip('should verify all the CSA from button', () => {
        addMultiEventsWithAlert([
            { event: "On hover", message: "On hover Event" }, // source: button.js:71
            { event: "On click", message: "On Click Event" }, // source: button.js:70
        ]);
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" },      // b2
            { event: "On click", action: "Visibility(deprecated)", valueToggle: "{{true}}" }, // @deprecated b3
            { event: "On click", action: "Disable(deprecated)", valueToggle: "{{true}}" },    // @deprecated b4
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },          // b5
            { event: "On click", action: "Set text", value: "New Button Text" },             // b6 // dynamic: test text
            { event: "On click", action: "Click" },                                          // b7
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },           // b8
            { event: "On click", action: "Loading(deprecated)", valueToggle: "{{false}}" },  // @deprecated b9
        ];
        addCSA(W, actions);

        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(widget).should("not.be.visible");

        // @deprecated visibility(deprecated) — not pass-required
        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        cy.get(widget).should("be.visible");

        // @deprecated disable(deprecated) — not pass-required
        cy.get(commonWidgetSelector.draggableWidget("button4")).click();
        cy.get(widget).parent().should("have.attr", "disabled"); // source: button.js:302

        cy.get(commonWidgetSelector.draggableWidget("button5")).click();
        cy.get(widget).parent().should("not.have.attr", "disabled"); // source: button.js:302

        cy.get(commonWidgetSelector.draggableWidget("button6")).click();
        cy.get(widget).should("have.text", "New Button Text"); // dynamic: test text (set via CSA)

        cy.get(commonWidgetSelector.draggableWidget("button7")).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'On Click Event', false); // source: button.js:70

        cy.get(commonWidgetSelector.draggableWidget("button8")).click();
        cy.get(widget).parent().within(() => {
            cy.get(".tj-widget-loader").should("be.visible");
        });

        // @deprecated loading(deprecated) — not pass-required
        cy.get(commonWidgetSelector.draggableWidget("button9")).click();
        cy.notVisible(".tj-widget-loader");
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
