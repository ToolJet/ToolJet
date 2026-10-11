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
describe('Multi Select Component Tests', { testIsolation: false }, () => {
    const W = "multiselect1"; // runtime name: config.name 'Multiselect' -> <name>1

    const functions = [
        { key: "selectOptions", type: "Function" }, // source: multiselectV2.js:23
        { key: "deselectOptions", type: "Function" }, // source: multiselectV2.js:33
        { key: "clear", type: "Function" }, // source: multiselectV2.js:43
        { key: "setVisibility", type: "Function" }, // source: multiselectV2.js:47
        { key: "setLoading", type: "Function" }, // source: multiselectV2.js:52
        { key: "setDisable", type: "Function" }, // source: multiselectV2.js:57
    ];

    const exposedValues = [
        { key: "searchText", type: "String", value: "\"\"" }, // source: multiselectV2.js:410
        { key: "label", type: "String", value: "\"Select\"" }, // source: multiselectV2.js:423
        { key: "isVisible", type: "Boolean", value: "true" }, // source: multiselectV2.js:435
        { key: "isDisabled", type: "Boolean", value: "false" }, // source: multiselectV2.js:438
        { key: "isMandatory", type: "Boolean", value: "false" }, // source: multiselectV2.js:419
        { key: "isLoading", type: "Boolean", value: "false" }, // source: multiselectV2.js:439
        { key: "isValid", type: "Boolean", value: "true" }, // dynamic: runtime validity, valid by default
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-MultiSelect-App`);
        cy.openApp();
        cy.dragAndDropWidget("Multi Select", 500, 100); // displayName source: multiselectV2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // label default renders on the widget
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("be.visible")
            .and("contain.text", "Select"); // source: multiselectV2.js:423
        // enabled + visible by default
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("not.have.attr", "data-disabled", "true"); // source: multiselectV2.js:438
    });

    it.skip('should verify the properties of Multi Select', () => {
        openEditorSidebar(W);

        // --- Data accordion ---
        openAccordion("Data");
        // label (code) — assert typed text shows on widget
        verifyAndModifyParameter("Label", fake.randomSentence); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("contain.text", fake.randomSentence); // dynamic: fake echoed
        // placeholder (code)
        verifyAndModifyParameter("Placeholder", fake.randomSentence); // dynamic: fake

        // --- Options accordion ---
        openAccordion("Options");
        // advanced (toggle) default {{false}}
        verifyAndModifyToggleFx("Dynamic options", "{{false}}"); // source: multiselectV2.js:425
        verifyAndModifyToggleFx("Dynamic options", "{{false}}"); // source: multiselectV2.js:425
        // showAllOption (toggle) default {{false}}
        verifyAndModifyToggleFx("Enable select all option", "{{false}}"); // source: multiselectV2.js:426
        verifyAndModifyToggleFx("Enable select all option", "{{false}}"); // source: multiselectV2.js:426
        // showAllSelectedLabel (toggle) default {{true}}
        verifyAndModifyToggleFx('Show "All items are selected"', "{{true}}"); // source: multiselectV2.js:431
        verifyAndModifyToggleFx('Show "All items are selected"', "{{true}}"); // source: multiselectV2.js:431
        // optionsLoadingState (toggle) default {{false}}
        verifyAndModifyToggleFx("Options loading state", "{{false}}"); // source: multiselectV2.js:428
        verifyAndModifyToggleFx("Options loading state", "{{false}}"); // source: multiselectV2.js:428
        // maxLimit (code)
        verifyAndModifyParameter("Max selection limit", "2"); // dynamic: test limit

        // schema (code) — condRender advanced=true, so enable "Dynamic options" first.
        verifyAndModifyToggleFx("Dynamic options", "{{false}}"); // source: multiselectV2.js:425
        verifyAndModifyParameter("Schema", "{{[{label:'A',value:'a'}]}}"); // dynamic: test schema
        /* RESOLVE-LIVE dom effect for schema — after supplying a dynamic-options schema the
           widget should render the schema-derived option 'A'. Option-row selector inside the
           dropdown menu is uncertain; resolve live then assert the 'A' option appears. */
        // source: multiselectV2.js:106
        // restore advanced toggle back to default
        verifyAndModifyToggleFx("Dynamic options", "{{false}}"); // source: multiselectV2.js:425

        // sort (switch) options None/a-z/z-a — default none
        // options: none/asc/desc source: multiselectV2.js:148
        cy.contains('[data-cy="sort-options-switch"] label, .field label, label', "a-z").click(); // dynamic: switch to asc
        /* RESOLVE-LIVE selector + dom effect for sort — the "Sort options" switch (None/a-z/z-a)
           reorders the rendered option list. Switch selector + ordered option-row selector are
           uncertain; resolve live then click "z-a" and assert descending order. */
        // source: multiselectV2.js:148

        // --- additionalActions section ---
        // showClearBtn (toggle) default {{true}}
        verifyAndModifyToggleFx("Show clear selection button", "{{true}}"); // source: multiselectV2.js:432
        verifyAndModifyToggleFx("Show clear selection button", "{{true}}"); // source: multiselectV2.js:432
        // showSearchInput (toggle) default {{true}}
        verifyAndModifyToggleFx("Show search in options", "{{true}}"); // source: multiselectV2.js:433
        verifyAndModifyToggleFx("Show search in options", "{{true}}"); // source: multiselectV2.js:433
        // serverSideSearch (clientServerSwitch) options Client side/Server side — default {{false}} (clientSide)
        // condRender showSearchInput=true (kept true above); options: clientSide/serverSide source: multiselectV2.js:172
        cy.contains('[data-cy="search-type-switch"] label, .field label, label', "Server side").click(); // dynamic: switch to serverSide
        /* RESOLVE-LIVE selector + dom effect for serverSideSearch — the "Search type"
           client/server switch toggles whether searching hits a server-side query vs local
           filtering. Switch selector + observable effect are uncertain; resolve live then
           assert the server-side mode is active (and restore to "Client side"). */
        // source: multiselectV2.js:172
        // loadingState (toggle) default {{false}}
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: multiselectV2.js:439
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // source: multiselectV2.js:439
            });
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: multiselectV2.js:439
        // disabledState (toggle) default {{false}}
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: multiselectV2.js:438
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "data-disabled", "true"); // source: multiselectV2.js:438
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: multiselectV2.js:438
        // collapseWhenHidden (toggle) default {{false}}
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: multiselectV2.js:437
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: multiselectV2.js:437
        // visibility (toggle) default {{true}}
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: multiselectV2.js:435
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // source: multiselectV2.js:435
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: multiselectV2.js:435

        // tooltipFormat (switch) options Plain text/Markdown/HTML — default plainText
        // options: plainText/markdown/html source: multiselectV2.js:214
        cy.contains('[data-cy="tooltip-switch"] label, .field label, label', "Markdown").click(); // dynamic: switch to markdown
        /* RESOLVE-LIVE selector + dom effect for tooltipFormat — the "Tooltip" format switch
           (Plain text/Markdown/HTML) controls how the tooltip text is rendered. Switch selector
           and the rendered-tooltip effect are uncertain; resolve live then also click "HTML" and
           restore to "Plain text". */
        // source: multiselectV2.js:214

        // tooltip (code param, showLabel:false — shares the "Tooltip" label above)
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake
        /* RESOLVE-LIVE dom effect for tooltip — hovering the field should surface the typed
           tooltip text. Tooltip trigger/popover selector is uncertain; resolve live then hover
           draggableWidget(W) and assert the tooltip text appears. */
        // source: multiselectV2.js:228
    });

    it.skip('should verify validation of Multi Select', () => {
        openEditorSidebar(W);
        // mandatory (toggle) default false -> assert '*' marker on the widget label
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: multiselectV2.js:419
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("contain.text", "*"); // source: multiselectV2.js:419
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: multiselectV2.js:419

        // customRule (code) default null
        verifyAndModifyParameter("Custom validation", "{{false&&'valid'}}"); // dynamic: test rule
    });

    it.skip('should verify the styles of Multi Select', () => {
        openEditorSidebar(W);
        cy.get('[data-cy="styles-tab"]').click();

        // --- label accordion ---
        openAccordion("label");
        // labelColor (colorSwatches) default var(--cc-primary-text)
        selectColourFromColourPicker("Color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for labelColor */
        // verifyWidgetColorCss(W, "<cssProp>", [255, 0, 0, 100]);

        // labelFontSize (numberInput) default {{12}} — RESOLVE-LIVE input selector + css
        /* RESOLVE-LIVE cssProp for labelFontSize */

        // alignment (switch) options side/top — default side
        // options: side/top source: multiselectV2.js:261-264
        /* RESOLVE-LIVE cssProp for alignment (side/top layout) */

        // direction (icon switch) options left/right — default left
        // isIcon switch; options left/right source: multiselectV2.js:267
        // interaction: click the icon-switch option (alignleftinspector/alignrightinspector);
        // selector for the icon toggle within the label accordion is unresolved.
        /* RESOLVE-LIVE selector + cssProp for direction (left/right label icon placement) */

        // auto (checkbox 'Width') default {{true}} — condRender alignment=side
        // interaction: uncheck the "Width" checkbox to switch to a fixed label width.
        // checkbox selector within the label accordion is unresolved.
        /* RESOLVE-LIVE selector + cssProp for auto (Width checkbox, default true) */ // source: multiselectV2.js:280

        // labelWidth (slider) default 33 — condRender alignment=side & auto=false
        // interaction: drag/set the label-width slider (requires auto unchecked first).
        // slider selector within the label accordion is unresolved.
        /* RESOLVE-LIVE selector + cssProp for labelWidth (label width slider, default 33) */ // source: multiselectV2.js:291

        // widthType (select) options ofComponent/ofField — default ofComponent
        // condRender alignment=side & auto=false
        // interaction: open the width-type select and choose an option (requires auto unchecked first).
        // options: ofComponent/ofField source: multiselectV2.js:307
        /* RESOLVE-LIVE selector + cssProp for widthType (label width reference select) */

        // --- field accordion ---
        openAccordion("field");
        // fieldBackgroundColor (colorSwatches) default var(--cc-surface1-surface)
        selectColourFromColourPicker("Background", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for fieldBackgroundColor */
        // verifyWidgetColorCss(W, "<cssProp>", [255, 0, 0, 100]);

        // fieldBorderColor (colorSwatches) default var(--cc-default-border)
        selectColourFromColourPicker("Border", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for fieldBorderColor */
        // verifyWidgetColorCss(W, "<cssProp>", [0, 255, 0, 100]);

        // accentColor (colorSwatches) default var(--cc-primary-brand)
        selectColourFromColourPicker("Accent", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for accentColor */

        // selectedTextColor (colorSwatches) default var(--cc-primary-text)
        selectColourFromColourPicker("Text", ["10", "20", "30", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for selectedTextColor */

        // errTextColor (colorSwatches) default var(--cc-error-systemStatus)
        selectColourFromColourPicker("Error Text", ["40", "50", "60", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for errTextColor */

        // iconColor (colorSwatches) default var(--cc-default-icon)
        selectColourFromColourPicker("Icon color", ["70", "80", "90", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for iconColor */

        // fieldBorderRadius (input) default 6 — RESOLVE-LIVE css (border-radius) + selector
        /* RESOLVE-LIVE cssProp for fieldBorderRadius */

        // boxShadow (boxShadow) default 0px 0px 0px 0px #00000040
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // --- container accordion ---
        openAccordion("container");
        // padding (switch) options default/none — default 'default'
        // options: default/none source: multiselectV2.js:402-405
        /* RESOLVE-LIVE cssProp for padding (default/none) */
    });

    it.skip('should verify the layout of Multi Select', () => {
        // showOnDesktop {{true}} + showOnMobile {{false}}
        verifyLayout(W); // source: multiselectV2.js:11 & multiselectV2.js:12
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the Multi Select', () => {
        const events = [
            { event: "On select", message: "onSelect Event" }, // source: multiselectV2.js:238
            { event: "On search text changed", message: "onSearchTextChanged Event" }, // source: multiselectV2.js:239
            { event: "On focus", message: "onFocus Event" }, // source: multiselectV2.js:240
            { event: "On blur", message: "onBlur Event" }, // source: multiselectV2.js:241
        ];

        addMultiEventsWithAlert(events, false);

        // onFocus fires on opening the field (click).
        cy.get(commonWidgetSelector.draggableWidget(W)).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onFocus Event", false); // source: multiselectV2.js:240

        /* RESOLVE-LIVE trigger for onSelect — needs opening the menu + clicking an option row.
           Option-row selector inside the dropdown menu is uncertain; resolve live then assert:
           cy.verifyToastMessage(commonSelectors.toastMessage, "onSelect Event", false); // source: multiselectV2.js:238 */

        /* RESOLVE-LIVE trigger for onSearchTextChanged — needs typing into the in-menu search input.
           cy.verifyToastMessage(commonSelectors.toastMessage, "onSearchTextChanged Event", false); // source: multiselectV2.js:239 */

        // onBlur fires on clicking away from the field.
        cy.forceClickOnCanvas();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onBlur Event", false); // source: multiselectV2.js:241
    });

    it.skip('should verify all the CSA from Multi Select', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // b1 source: multiselectV2.js:47
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // b2 source: multiselectV2.js:47
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // b3 source: multiselectV2.js:57
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // b4 source: multiselectV2.js:57
            { event: "On click", action: "Clear" },                                    // b5 source: multiselectV2.js:43
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // b6 source: multiselectV2.js:52
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },    // b7 source: multiselectV2.js:52
        ];
        addCSA(W, actions);

        cy.get(commonWidgetSelector.draggableWidget("button1")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // source: multiselectV2.js:47

        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: multiselectV2.js:47

        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // source: multiselectV2.js:57

        cy.get(commonWidgetSelector.draggableWidget("button4")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "false"); // source: multiselectV2.js:57

        // b5 Clear — clears the current selection.
        cy.get(commonWidgetSelector.draggableWidget("button5")).click();

        cy.get(commonWidgetSelector.draggableWidget("button6")).click();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // source: multiselectV2.js:52
            });

        cy.get(commonWidgetSelector.draggableWidget("button7")).click();
        cy.notVisible(".tj-widget-loader"); // source: multiselectV2.js:52

        /* RESOLVE-LIVE selectOptions/deselectOptions CSA assertion — these take an {option} param
           (source: multiselectV2.js:23 & :33). The option value comes from the widget's options
           schema (default values '1','2','3', source: multiselectV2.js:444-470). After resolving the
           in-widget selected-tag/label selector, add:
             addCSA(W, [{ event: "On click", action: "Select Options", value: "1" }]);
             // assert selected chip for '1' appears on draggableWidget(W)
             addCSA(W, [{ event: "On click", action: "Deselect Options", value: "1" }]);
             // assert selected chip for '1' removed */
    });
});
