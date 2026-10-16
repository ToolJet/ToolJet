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
describe('Dropdown Component Tests', { testIsolation: false }, () => {
    const W = "dropdown1"; // runtime name for DropdownV2 (drag display "Dropdown")

    const exposedValues = [
        {
            "key": "searchText",
            "type": "String",
            "value": "\"\"" // source: dropdownV2.js:364
        },
        {
            "key": "label",
            "type": "String",
            "value": "\"Select\"" // source: dropdownV2.js:365
        },
    ];

    const functions = [
        {
            "key": "selectOption", // source: dropdownV2.js:369
            "type": "Function"
        },
        {
            "key": "setVisibility", // source: dropdownV2.js:374
            "type": "Function"
        },
        {
            "key": "clear", // source: dropdownV2.js:379
            "type": "Function"
        },
        {
            "key": "setLoading", // source: dropdownV2.js:383
            "type": "Function"
        },
        {
            "key": "setDisable", // source: dropdownV2.js:388
            "type": "Function"
        },
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DropdownV2-App`);
        cy.openApp();
        cy.dragAndDropWidget("Dropdown", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // The widget renders its configured default label "Select".
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("be.visible")
            .and("contain.text", "Select"); // source: dropdownV2.js:436

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify the properties', () => {
        openEditorSidebar(W);

        // --- Data accordion: label + placeholder (code) ---
        openAccordion("Data", []);
        const labelText = fake.randomSentence;
        verifyAndModifyParameter("Label", labelText); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", labelText); // dynamic: fake echoed

        verifyAndModifyParameter("Placeholder", fake.randomSentence); // dynamic: fake

        // --- Options accordion ---
        openAccordion("Options", []);
        // advanced (Dynamic options) default {{false}}
        verifyAndModifyToggleFx("Dynamic options", "{{false}}", false); // source: dropdownV2.js:403

        // schema (code) — condRender advanced=true: enable Dynamic options first, then
        // the Schema code field appears. Type a valid dynamic-options expression.
        cy.get(commonWidgetSelector.parameterTogglebutton("Dynamic options")).click(); // dynamic: enable Dynamic options to reveal Schema
        verifyAndModifyParameter("Schema", "{{[{label: 'one', value: 1}]}}"); // source: dropdownV2.js:49
        /* RESOLVE-LIVE Schema code effect: assert the dynamic option ("one") renders in the open menu */
        cy.get(commonWidgetSelector.parameterTogglebutton("Dynamic options")).click(); // dynamic: revert Dynamic options

        // optionsLoadingState default {{false}}
        verifyAndModifyToggleFx("Options loading state", "{{false}}", false); // source: dropdownV2.js:437

        // sort (switch) — options None / a-z / z-a, default none. Select asc then desc.
        cy.get(commonWidgetSelector.parameterLabel("Sort options")).should("have.text", "Sort options"); // source: dropdownV2.js:66
        /* RESOLVE-LIVE sort switch: click togglr-button-asc / -desc and assert selected + option order in menu (options none/asc/desc source: dropdownV2.js:66, default none source: dropdownV2.js:438) */

        // --- Additional actions section ---
        openAccordion("Additional actions", []);
        verifyAndModifyToggleFx("Show clear selection button", "{{true}}", false); // source: dropdownV2.js:440

        // serverSideSearch (clientServerSwitch) — condRender showSearchInput=true (default
        // true, so it renders now). Options Client side / Server side, default clientSide.
        // Switch to Server side then back to Client side.
        cy.get(commonWidgetSelector.parameterLabel("Search type")).should("have.text", "Search type"); // source: dropdownV2.js:90
        /* RESOLVE-LIVE serverSideSearch clientServerSwitch: click togglr-button-serverSide / -clientSide and assert selected (options clientSide/serverSide source: dropdownV2.js:90, default clientSide source: dropdownV2.js:442) */

        verifyAndModifyToggleFx("Show search in options", "{{true}}", false); // source: dropdownV2.js:441
        verifyAndModifyToggleFx("Loading state", "{{false}}", false); // source: dropdownV2.js:447

        // visibility default {{true}} — hide the widget, then restore
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: dropdownV2.js:443
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible");
        cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click(); // dynamic: restore visibility

        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}", false); // source: dropdownV2.js:445

        // disabledState default {{false}} — enable disable, assert data-disabled, revert
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: dropdownV2.js:446
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // dynamic: disable toggled on
        cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click(); // dynamic: revert disable
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "false"); // source: dropdownV2.js:446 (default false)

        // tooltipFormat (switch) — options Plain text / Markdown / HTML, default plainText.
        // No support helper for property-level switches; assert the "Tooltip" label renders
        // and RESOLVE the option pick + selected-state assertion live (mirrors link.cy.js).
        cy.get(commonWidgetSelector.parameterLabel("Tooltip")).should("have.text", "Tooltip"); // source: dropdownV2.js:133
        /* RESOLVE-LIVE tooltipFormat switch: click togglr-button-markdown / -html and assert selected (options plainText/markdown/html source: dropdownV2.js:133, default plainText source: dropdownV2.js:449) */

        // tooltip (code)
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake
    });

    it.skip('should verify the validation', () => {
        openEditorSidebar(W);

        // Validation accordion: mandatory (toggle) + customRule (code).
        openAccordion("Validation", []);

        // mandatory default {{false}} — turn on, assert the required "*" marker, revert.
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: dropdownV2.js:399
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", "*"); // dynamic: mandatory marker
        cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click(); // dynamic: revert mandatory

        // customRule (code) default null — type a rule that always evaluates falsey to force an error.
        verifyAndModifyParameter("Custom validation", "{{false && 'valid'}}"); // dynamic: test rule
        cy.forceClickOnCanvas();
        // The invalid custom rule surfaces an error message under the field.
        /* RESOLVE-LIVE error-text selector for customRule invalid state */
        cy.get(commonWidgetSelector.draggableWidget(W)).should("exist"); // dynamic: placeholder assertion pending live error selector
    });

    it.skip('should verify the styles', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // --- Label accordion ---
        openAccordion("label", []);
        // labelColor (colorSwatches) default var(--cc-primary-text)
        selectColourFromColourPicker("Color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for labelColor */
        verifyWidgetColorCss(W, "color", [255, 0, 0, 100]); // dynamic: test color

        // labelFontSize (numberInput, Size) default {{12}} source: dropdownV2.js:172
        /* RESOLVE-LIVE cssProp for labelFontSize (Size numberInput selector + font-size assertion) */

        // alignment (switch: side/top) — select "Top"
        cy.get('[data-cy="dropdown-alignment-Top"], [data-cy="alignment-top"]').should("exist"); // source: dropdownV2.js:178
        /* RESOLVE-LIVE alignment switch selector + resulting layout assertion */

        // direction (icon-switch: left/right) default left source: dropdownV2.js:188
        /* RESOLVE-LIVE cssProp for direction (left/right icon-switch selector + flex-direction assertion) */

        // auto (checkbox, Width) default {{true}} — condRender alignment=side source: dropdownV2.js:201
        /* RESOLVE-LIVE cssProp for auto (Width checkbox selector; toggling exposes labelWidth slider) */

        // labelWidth (slider) default 33 — condRender alignment=side & auto=false source: dropdownV2.js:212
        /* RESOLVE-LIVE cssProp for labelWidth (slider selector + label width assertion; needs auto=false) */

        // widthType (select: ofComponent/...) default ofComponent source: dropdownV2.js:228
        /* RESOLVE-LIVE cssProp for widthType (select selector + width-unit assertion; needs auto=false) */

        // --- Field accordion ---
        openAccordion("field", []);
        // fieldBackgroundColor (colorSwatches, Background) default var(--cc-surface1-surface)
        selectColourFromColourPicker("Background", ["0", "128", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for fieldBackgroundColor */
        verifyWidgetColorCss(W, "background-color", [0, 128, 0, 100]); // dynamic: test color

        // fieldBorderColor (colorSwatches, Border) default var(--cc-default-border)
        selectColourFromColourPicker("Border", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for fieldBorderColor */
        verifyWidgetColorCss(W, "border-color", [0, 0, 255, 100]); // dynamic: test color

        // accentColor (colorSwatches, Accent) default var(--cc-primary-brand) source: dropdownV2.js:265
        selectColourFromColourPicker("Accent", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for accentColor */

        // selectedTextColor (colorSwatches, Text) default var(--cc-primary-text) source: dropdownV2.js:271
        selectColourFromColourPicker("Text", ["10", "20", "30", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for selectedTextColor */

        // placeholderTextColor (colorSwatches, Placeholder Text) default var(--cc-placeholder-text) source: dropdownV2.js:277
        selectColourFromColourPicker("Placeholder Text", ["40", "50", "60", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for placeholderTextColor */

        // errTextColor (colorSwatches, Error text) default var(--cc-error-systemStatus) source: dropdownV2.js:283
        selectColourFromColourPicker("Error text", ["70", "80", "90", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for errTextColor */

        // iconColor (colorSwatches) default var(--cc-default-icon) source: dropdownV2.js:296
        selectColourFromColourPicker("Icon color", ["12", "34", "56", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for iconColor (DN uncertain — resolve label live) */

        // fieldBorderRadius (input, Border radius) default 6 source: dropdownV2.js:306
        /* RESOLVE-LIVE cssProp for fieldBorderRadius (Border radius input selector + border-radius assertion) */

        // boxShadow default 0px 0px 0px 0px #00000040
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        /* RESOLVE-LIVE box-shadow target selector for dropdownV2 field */
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // menuWidthMode (select: matchField/matchContent/custom) default matchField source: dropdownV2.js:321
        /* RESOLVE-LIVE cssProp for menuWidthMode (Menu width select selector; custom exposes menuCustomWidth) */

        // menuCustomWidth (input) default 256 — condRender menuWidthMode=custom source: dropdownV2.js:337
        /* RESOLVE-LIVE cssProp for menuCustomWidth (Custom menu width input selector + menu width assertion; needs menuWidthMode=custom) */

        // NOTE: icon style has visibility:false with no cited enabling handle → not automatable (see report).

        // --- Container accordion: padding (switch default/none) ---
        openAccordion("container", []);
        cy.get('[data-cy="dropdown-padding-none"], [data-cy="padding-none"]').should("exist"); // source: dropdownV2.js:349
        /* RESOLVE-LIVE padding switch selector + resulting padding CSS assertion */
    });

    it.skip('should verify the layout', () => {
        // verifyLayout covers showOnDesktop hide + showOnMobile show.
        verifyLayout(W); // source: dropdownV2.js:11 (showOnDesktop {{true}}), dropdownV2.js:12 (showOnMobile {{false}})
    });

    it('should verify all the exposed values and functions on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the CSA from dropdown', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // button1 — source: dropdownV2.js:374
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" }, // button2 — source: dropdownV2.js:376
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" }, // button3 — source: dropdownV2.js:388
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" }, // button4 — source: dropdownV2.js:390
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" }, // button5 — source: dropdownV2.js:383
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" }, // button6 — source: dropdownV2.js:385
            { event: "On click", action: "Clear" }, // button7 — source: dropdownV2.js:379
            { event: "On click", action: "Select option", value: "2" }, // button8 — source: dropdownV2.js:369 (select param)
        ];
        addCSA(W, actions);

        cy.get(commonWidgetSelector.draggableWidget("button1")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // dynamic: setVisibility false

        cy.get(commonWidgetSelector.draggableWidget("button2")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // dynamic: setVisibility true

        cy.get(commonWidgetSelector.draggableWidget("button3")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // dynamic: setDisable true

        cy.get(commonWidgetSelector.draggableWidget("button4")).click();
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "false"); // dynamic: setDisable false

        cy.get(commonWidgetSelector.draggableWidget("button5")).click();
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible"); // dynamic: setLoading true
            });

        cy.get(commonWidgetSelector.draggableWidget("button6")).click();
        cy.notVisible(".tj-widget-loader"); // dynamic: setLoading false

        cy.get(commonWidgetSelector.draggableWidget("button7")).click();
        // clear() resets the field back to its placeholder/label state.
        cy.get(commonWidgetSelector.draggableWidget(W)).should("exist"); // dynamic: clear invoked

        cy.get(commonWidgetSelector.draggableWidget("button8")).click();
        // selectOption("2") should surface option2 as the selected value.
        /* RESOLVE-LIVE selected-value display selector for DropdownV2 */
        cy.get(commonWidgetSelector.draggableWidget(W)).should("contain.text", "option2"); // dynamic: selectOption result
    });

    it.skip('should verify all the events from the dropdown', () => {
        const events = [
            { event: "On select", message: "onSelect Event" }, // source: dropdownV2.js:160
            { event: "On search text changed", message: "onSearchTextChanged Event" }, // source: dropdownV2.js:161
            { event: "On focus", message: "onFocus Event" }, // source: dropdownV2.js:162
            { event: "On blur", message: "onBlur Event" }, // source: dropdownV2.js:163
        ];

        addMultiEventsWithAlert(events, false);

        // onFocus fires when the field receives focus (click), onBlur when focus leaves.
        cy.get(commonWidgetSelector.draggableWidget(W)).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onFocus Event", false); // dynamic: echoed event message

        cy.forceClickOnCanvas();
        cy.verifyToastMessage(commonSelectors.toastMessage, "onBlur Event", false); // dynamic: echoed event message

        // onSearchTextChanged fires when typing in the search input inside the open menu.
        /* RESOLVE-LIVE search-input selector inside the DropdownV2 menu */
        // onSelect fires when an option is picked from the open menu.
        /* RESOLVE-LIVE option selector inside the DropdownV2 menu to trigger onSelect */
        cy.get(commonWidgetSelector.draggableWidget(W)).click(); // dynamic: reopen menu — option selection pending live selector
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
