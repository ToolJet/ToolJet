import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA } from "Support/utils/editor/textInput";
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
describe('Icon Component Tests', { testIsolation: false }, () => {
    const W = "icon1";

    // exposedVariables is empty in icon.js (config :123 → exposedVariables: {}).
    // The Icon component exposes no user-facing values via config; only the CSA
    // handles below are surfaced as functions on the inspector node.
    const exposedValues = [];

    const functions = [
        { key: "click", type: "Function" },        // source: icon.js:126
        { key: "setVisibility", type: "Function" }, // source: icon.js:131
        { key: "setLoading", type: "Function" },    // source: icon.js:135
        { key: "setDisable", type: "Function" },     // source: icon.js:140
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Icon-App`);
        cy.openApp();
        cy.dragAndDropWidget("Icon", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Widget renders, visible + enabled by config defaults.
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: icon.js:154 (visibility {{true}})
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "false"); // source: icon.js:153 (disabledState {{false}})
        // No loading state by default → no widget loader present.
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("not.exist"); // source: icon.js:152 (loadingState {{false}})
            });
    });

    it.skip('should verify the properties', () => {
        openEditorSidebar(W);

        // icon (iconPicker) — default IconHome2. No support helper exists for the
        // iconPicker popover; assert the field renders its default and RESOLVE the
        // pick + rendered-icon assertion live.
        cy.get(commonWidgetSelector.parameterLabel("Icon")).should("have.text", "Icon"); // source: icon.js:17
        /* RESOLVE-LIVE iconPicker selection + rendered <svg> class assertion for icon (default IconHome2, source: icon.js:151) */

        // Additional Actions section.
        openAccordion("Additional actions", []);

        // tooltipFormat (switch) options: Plain text / Markdown / HTML.
        cy.get(commonWidgetSelector.parameterLabel("Tooltip")).should("have.text", "Tooltip"); // source: icon.js:27
        /* RESOLVE-LIVE tooltipFormat switch: click togglr-button-markdown / -html and assert selected (options plainText/markdown/html, source: icon.js:29-32; default plainText source: icon.js:156) */

        // tooltip (code) — type a value, then verify it surfaces on hover.
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake

        // loadingState (toggle) default {{false}}.
        verifyAndModifyToggleFx("Show loading state", "{{false}}"); // source: icon.js:152
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // dynamic: loadingState toggled on
            });
        verifyAndModifyToggleFx("Show loading state", "{{false}}"); // source: icon.js:152 (toggle back)

        // disabledState (toggle) default {{false}}.
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: icon.js:153
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // dynamic: disable toggled on
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: icon.js:153 (toggle back)

        // visibility (toggle) default {{true}} — assert via layout hide/show below,
        // here confirm the fx default reads true.
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: icon.js:154
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: visibility toggled off
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: icon.js:154 (toggle back)
    });

    it.skip('should verify the styles', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion("Icon", []);

        // iconColor (colorSwatches) default #000.
        selectColourFromColourPicker("Color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for iconColor (default #000, source: icon.js:160) */
        verifyWidgetColorCss(W, "color", [255, 0, 0, 100]); // dynamic: test color

        // iconAlign (alignButtons) default center — no support helper; RESOLVE live.
        cy.get(commonWidgetSelector.parameterLabel("Alignment")).should("have.text", "Alignment"); // source: icon.js:91
        /* RESOLVE-LIVE alignButtons selector + resulting CSS for iconAlign (default center, source: icon.js:161) */

        // padding (switch) options Default / None — toggle "None" and assert padding.
        cy.get('[data-cy="togglr-button-none"]').click(); // source: icon.js:109 (options None value none)
        /* RESOLVE-LIVE cssProp for padding None on Icon widget (default default, source: icon.js:162) */
        cy.get('[data-cy="togglr-button-default"]').click(); // source: icon.js:108 (options Default value default)

        // boxShadow default "0px 0px 0px 0px #00000040".
        cy.get(commonWidgetSelector.stylePicker("Box shadow")).click();
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        selectColourFromColourPicker("Box shadow Color", ["0", "0", "0", "100"]); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow
    });

    it.skip('should verify the layout', () => {
        // verifyLayout covers showOnDesktop {{true}} hide + showOnMobile {{false}} show.
        verifyLayout(W); // source: icon.js:11-12 (others), defaults icon.js:147-148
    });

    it('should verify exposed values and functions on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        // exposedValues is empty (icon.js:123 exposedVariables: {}); assert none by
        // passing an empty array — only the node itself + its functions are checked.
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify the events', () => {
        const events = [
            { event: "On click", message: "onClick Event" },  // source: icon.js:77
            { event: "On hover", message: "onHover Event" },  // source: icon.js:78
        ];

        addMultiEventsWithAlert(events, false);

        // Trigger onHover then onClick by interacting with the widget.
        cy.get(commonWidgetSelector.draggableWidget(W)).realHover();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onHover Event", false); // dynamic: echoed event message

        cy.get(commonWidgetSelector.draggableWidget(W)).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onClick Event", false); // dynamic: echoed event message
    });

    it.skip('should verify the CSA from Icon', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // button1  source: icon.js:131
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // button2  source: icon.js:131
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // button3  source: icon.js:140
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // button4  source: icon.js:140
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // button5  source: icon.js:135
            { event: "On click", action: "Click" },                                    // button6  source: icon.js:126
        ];
        addCSA(W, actions);

        cy.get(commonWidgetSelector.draggableWidget("button1")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // source: icon.js:131 (setVisibility {{false}})

        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: icon.js:131 (setVisibility {{true}})

        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // source: icon.js:140 (setDisable {{true}})

        cy.get(commonWidgetSelector.draggableWidget("button4")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "false"); // source: icon.js:140 (setDisable {{false}})

        cy.get(commonWidgetSelector.draggableWidget("button5")).click();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // source: icon.js:135 (setLoading {{true}})
            });

        // Click CSA — no exposed value/DOM change; assert the handle invokes without
        // error (widget still present after invoking click()).
        cy.get(commonWidgetSelector.draggableWidget("button6")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("exist"); // source: icon.js:126 (click handle)
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
