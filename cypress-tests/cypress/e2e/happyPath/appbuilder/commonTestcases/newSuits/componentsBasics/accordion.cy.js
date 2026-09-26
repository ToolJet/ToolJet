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
describe('Accordion Component Tests', { testIsolation: false }, () => {
    const W = "accordion1";

    const exposedValues = [
        {
            "key": "isExpanded",
            "type": "Boolean",
            "value": "true" // source: accordion.js:184
        },
        {
            "key": "isVisible",
            "type": "Boolean",
            "value": "true" // source: accordion.js:185
        },
        {
            "key": "isDisabled",
            "type": "Boolean",
            "value": "false" // source: accordion.js:186
        },
        {
            "key": "isLoading",
            "type": "Boolean",
            "value": "false" // source: accordion.js:187
        },
    ];

    const functions = [
        { "key": "expand", "type": "Function" },        // source: accordion.js:191
        { "key": "collapse", "type": "Function" },      // source: accordion.js:195
        { "key": "setVisibility", "type": "Function" }, // source: accordion.js:199
        { "key": "setDisable", "type": "Function" },    // source: accordion.js:203
        { "key": "setLoading", "type": "Function" },    // source: accordion.js:208
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Accordion-App`);
        cy.openApp();
        cy.dragAndDropWidget('Accordion', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Accordion drops visible, enabled and expanded (isExpanded default true),
        // header shown by default.
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: accordion.js:222 (visibility {{true}})

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        // Defaults reuse the exposed-values assertions:
        // isExpanded:true source: accordion.js:184, isVisible:true source: accordion.js:185,
        // isDisabled:false source: accordion.js:186, isLoading:false source: accordion.js:187
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify the properties of the accordion', () => {
        openEditorSidebar(W);

        // showHeader — toggle, default {{true}} — source default: accordion.js:220
        openAccordion("Properties");
        verifyAndModifyToggleFx("Show header", "{{true}}"); // source: accordion.js:58

        // Additional actions accordion holds the remaining toggles + tooltip.
        openAccordion("Additional actions");

        // loadingState — toggle, default {{false}} — source default: accordion.js:221
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: accordion.js:15
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible");
            });
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: accordion.js:15

        // dynamicHeight — toggle, default {{false}} — source default: accordion.js:226
        verifyAndModifyToggleFx("Dynamic height", "{{false}}"); // source: accordion.js:24
        /* RESOLVE-LIVE: DOM effect of Dynamic height on accordion container cannot be derived from config */

        // visibility — toggle, default {{true}} — source default: accordion.js:222
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: accordion.js:33
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible");
        verifyAndModifyToggleFx("Visibility", "{{true}}", true, false); // source: accordion.js:33

        // collapseWhenHidden — toggle, default {{false}} — source default: accordion.js:224
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: accordion.js:43
        /* RESOLVE-LIVE: DOM effect of Collapse when hidden cannot be derived from config */
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: accordion.js:43

        // disabledState — toggle, default {{false}} — source default: accordion.js:225
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: accordion.js:49
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // source: accordion.js:49
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: accordion.js:49

        // tooltipFormat — switch: plainText | markdown | html, default plainText — source default: accordion.js:228
        /* RESOLVE-LIVE: Tooltip format switch option selectors + rendered tooltip markup unknown from config */

        // tooltip — code, default "" — source default: accordion.js:229
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake
    });

    it.skip('should verify the styles of the accordion', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---- Header section ----
        openAccordion("Header");

        // headerBackgroundColor — colorSwatches, default var(--cc-surface1-surface) — source: accordion.js:118
        selectColourFromColourPicker("Background", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for headerBackgroundColor (header element selector + css prop) */
        // verifyWidgetColorCss(<headerSelector>, "background-color", [255, 0, 0, 100], true);

        // chevronIconColor — colorSwatches, default var(--cc-default-icon) — source: accordion.js:137
        selectColourFromColourPicker("Chevron icon", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for chevronIconColor (chevron icon selector + css prop) */

        // headerDividerColor — colorSwatches, default var(--cc-weak-border) — source: accordion.js:146
        selectColourFromColourPicker("Divider", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for headerDividerColor (divider selector + css prop) */

        // ---- Container section ----
        openAccordion("Container");

        // backgroundColor — colorSwatches, default var(--cc-surface1-surface) — source: accordion.js:128
        selectColourFromColourPicker("Background", ["255", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor (container selector + css prop) */
        // verifyWidgetColorCss(W, "background-color", [255, 255, 0, 100]);

        // borderColor — colorSwatches, default var(--cc-weak-border) — source: accordion.js:155
        selectColourFromColourPicker("Border color", ["0", "255", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor (border-color css prop / selector) */

        // borderRadius — numberInput, default 6 — source default: accordion.js:237
        verifyAndModifyParameter("Border radius", "20"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for borderRadius (border-radius css prop / selector) */

        // boxShadow — boxShadow, default 0px 0px 0px 0px #00000040 — source: accordion.js:176
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        /* RESOLVE-LIVE cssProp for boxShadow (container box-shadow target selector) */
        // verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]);
    });

    it.skip('should verify the layout / device toggles', () => {
        // others.showOnDesktop default {{true}}, showOnMobile default {{false}}.
        // source: accordion.js:11 / :12
        verifyLayout(W);
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the CSA from the accordion', () => {
        const actions = [
            { event: "On click", action: "Collapse" },                              // b1  source: accordion.js:195
            { event: "On click", action: "Expand" },                                // b2  source: accordion.js:191
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // b3  source: accordion.js:199
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // b4  source: accordion.js:199
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // b5  source: accordion.js:203
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // b6  source: accordion.js:203
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // b7  source: accordion.js:208
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },    // b8  source: accordion.js:208
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    it.skip('should verify all the events from the accordion', () => {
        const events = [
            { event: "On expand", message: "onExpand Event" },     // source: accordion.js:114
            { event: "On collapse", message: "onCollapse Event" }, // source: accordion.js:115
        ];

        addMultiEventsWithAlert(events, false);

        // Trigger: clicking the accordion header toggles expand/collapse.
        /* RESOLVE-LIVE eventTrigger: exact accordion header selector for onExpand/onCollapse unknown */
        // cy.get(<accordionHeaderSelector>).click(); // collapse -> onCollapse
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onCollapse Event', false);
        // cy.get(<accordionHeaderSelector>).click(); // expand -> onExpand
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onExpand Event', false);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
