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
describe('Tags Input Component Tests', { testIsolation: false }, () => {
    const W = "tagsinput1";

    // TagsInput exposes ARRAY keys (values/tags/newTagsAdded/selectedTags), NOT
    // the standard value/isVisible set. All default to [] (empty array).
    const exposedValues = [
        {
            "key": "values",
            "type": "Array",
            "value": "[]" // source: TagsInput.js:404
        },
        {
            "key": "tags",
            "type": "Array",
            "value": "[]" // source: TagsInput.js:405
        },
        {
            "key": "newTagsAdded",
            "type": "Array",
            "value": "[]" // source: TagsInput.js:406
        },
        {
            "key": "selectedTags",
            "type": "Array",
            "value": "[]" // source: TagsInput.js:407
        },
    ];

    const functions = [
        { "key": "selectTags", "type": "Function" },    // source: TagsInput.js:23
        { "key": "deselectTags", "type": "Function" },  // source: TagsInput.js:33
        { "key": "clear", "type": "Function" },         // source: TagsInput.js:43
        { "key": "setVisibility", "type": "Function" }, // source: TagsInput.js:47
        { "key": "setLoading", "type": "Function" },    // source: TagsInput.js:52
        { "key": "setDisable", "type": "Function" },    // source: TagsInput.js:57
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TagsInput-App`);
        cy.openApp();
        cy.dragAndDropWidget('Tags Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // TagsInput drops visible & enabled with the default label "Tags".
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: TagsInput.js:430 (visibility {{true}})

        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        // Defaults reuse the exposed-values assertions (all arrays default []):
        // values source: TagsInput.js:404, tags source: TagsInput.js:405,
        // newTagsAdded source: TagsInput.js:406, selectedTags source: TagsInput.js:407
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify the properties of the tags input', () => {
        openEditorSidebar(W);
        openAccordion("Properties");

        // ---- Data accordion ----
        openAccordion("Data");

        // label — code, default "Tags" — source default: TagsInput.js:420
        verifyAndModifyParameter("Label", fake.randomSentence); // dynamic: fake

        // placeholder — code, default "Add or select a tag" — source default: TagsInput.js:426
        verifyAndModifyParameter("Placeholder", fake.randomSentence); // dynamic: fake

        // ---- Tags accordion ----
        openAccordion("Tags");

        // advanced — toggle, default {{false}} — source default: TagsInput.js:422
        verifyAndModifyToggleFx("Dynamic tags", "{{false}}"); // source: TagsInput.js:82
        /* RESOLVE-LIVE: turning Dynamic tags on swaps Default value -> Schema field; DOM effect not derivable from config */
        verifyAndModifyToggleFx("Dynamic tags", "{{false}}"); // source: TagsInput.js:82

        // sort — switch: none | asc | desc, default none — source default: TagsInput.js:424
        /* RESOLVE-LIVE: Sort tags switch option selectors (none/asc/desc) + resulting tag order unknown from config */

        // allowNewTags — toggle, default {{true}} — source default: TagsInput.js:423
        verifyAndModifyToggleFx("Allow new tags", "{{true}}"); // source: TagsInput.js:127
        /* RESOLVE-LIVE: Allow new tags DOM effect (blocking type+Enter of a new tag) unknown from config */
        verifyAndModifyToggleFx("Allow new tags", "{{true}}"); // source: TagsInput.js:127

        // optionsLoadingState — toggle, default {{false}} — source default: TagsInput.js:425
        verifyAndModifyToggleFx("Tags loading state", "{{false}}"); // source: TagsInput.js:136
        /* RESOLVE-LIVE: Tags loading state DOM effect (options dropdown loader) unknown from config */
        verifyAndModifyToggleFx("Tags loading state", "{{false}}"); // source: TagsInput.js:136

        // enableSearch — toggle, default {{true}} — source default: TagsInput.js:428
        verifyAndModifyToggleFx("Turn on search", "{{true}}"); // source: TagsInput.js:154
        /* RESOLVE-LIVE: Turn on search DOM effect + Search type (clientSide/serverSide) conditional switch unknown from config */
        verifyAndModifyToggleFx("Turn on search", "{{true}}"); // source: TagsInput.js:154

        // ---- Additional actions section ----
        openAccordion("Additional actions");

        // dynamicHeight — toggle, default {{true}} — source default: TagsInput.js:427
        verifyAndModifyToggleFx("Dynamic height", "{{true}}"); // source: TagsInput.js:145
        /* RESOLVE-LIVE: Dynamic height DOM effect on the field container unknown from config */
        verifyAndModifyToggleFx("Dynamic height", "{{true}}"); // source: TagsInput.js:145

        // loadingState — toggle, default {{false}} — source default: TagsInput.js:434
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: TagsInput.js:177
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible");
            });
        verifyAndModifyToggleFx("Loading state", "{{false}}"); // source: TagsInput.js:177

        // visibility — toggle, default {{true}} — source default: TagsInput.js:430
        verifyAndModifyToggleFx("Visibility", "{{true}}"); // source: TagsInput.js:183
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible");
        verifyAndModifyToggleFx("Visibility", "{{true}}", true, false); // source: TagsInput.js:183

        // collapseWhenHidden — toggle, default {{false}} — source default: TagsInput.js:432
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: TagsInput.js:190
        /* RESOLVE-LIVE: Collapse when hidden DOM effect unknown from config */
        verifyAndModifyToggleFx("Collapse when hidden", "{{false}}"); // source: TagsInput.js:190

        // disabledState — toggle, default {{false}} — source default: TagsInput.js:433
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: TagsInput.js:196
        cy.get(commonWidgetSelector.draggableWidget(W)).should("have.attr", "data-disabled", "true"); // source: TagsInput.js:196
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: TagsInput.js:196

        // tooltipFormat — switch: plainText | markdown | html, default plainText — source default: TagsInput.js:462
        /* RESOLVE-LIVE: Tooltip format switch option selectors + rendered tooltip markup unknown from config */

        // tooltip — code, default "" — source default: TagsInput.js:461
        verifyAndModifyParameter("Tooltip", fake.randomSentence); // dynamic: fake
    });

    it.skip('should verify the validation of the tags input', () => {
        openEditorSidebar(W);
        openAccordion("Properties");

        // mandatory — toggle, default false — source default: TagsInput.js:416
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: TagsInput.js:15
        /* RESOLVE-LIVE: mandatory field renders a required '*' marker; exact marker selector unknown from config */
        verifyAndModifyToggleFx("Make this field mandatory", "{{false}}"); // source: TagsInput.js:15

        // customRule — code, default null — source default: TagsInput.js:417
        verifyAndModifyParameter("Custom validation", fake.randomSentence); // dynamic: fake
        /* RESOLVE-LIVE: custom validation error message surface selector unknown from config */
    });

    it.skip('should verify the styles of the tags input', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---- Label section ----
        openAccordion("Label");

        // labelColor — colorSwatches, default var(--cc-primary-text) — source: TagsInput.js:236
        selectColourFromColourPicker("Color", ["255", "0", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for labelColor (label element selector + color prop) */
        // verifyWidgetColorCss(<labelSelector>, "color", [255, 0, 0, 100], true);

        // labelFontSize — numberInput, default {{12}} — source default: TagsInput.js:467
        verifyAndModifyParameter("Size", "16"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for labelFontSize (label font-size prop / selector) */

        // alignment — switch: side | top, default side — source default: TagsInput.js:478
        /* RESOLVE-LIVE: Alignment switch option selectors (side/top) + resulting layout css unknown from config */

        // direction — switch(icon): left | right, default left — source default: TagsInput.js:477
        /* RESOLVE-LIVE: Direction icon-switch option selectors (left/right) + resulting flex-direction unknown from config */

        // auto (Width) — checkbox, default {{true}}, condRender alignment=side — source default: TagsInput.js:469
        /* RESOLVE-LIVE: Width auto checkbox selector + effect; labelWidth slider + widthType select only render when auto=false */

        // ---- Field section ----
        openAccordion("Field");

        // fieldBackgroundColor — colorSwatches, default var(--cc-surface1-surface) — source: TagsInput.js:322
        selectColourFromColourPicker("Background", ["0", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for fieldBackgroundColor (field selector + background-color prop) */
        // verifyWidgetColorCss(<fieldSelector>, "background-color", [0, 255, 0, 100], true);

        // fieldBorderColor — colorSwatches, default var(--cc-default-border) — source: TagsInput.js:328
        selectColourFromColourPicker("Border", ["0", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for fieldBorderColor (field border-color prop / selector) */

        // accentColor — colorSwatches, default var(--cc-primary-brand) — source: TagsInput.js:334
        selectColourFromColourPicker("Accent", ["255", "255", "0", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for accentColor (accent target selector + css prop) */

        // autoPickChipColor — checkbox, default {{true}} — source default: TagsInput.js:475
        /* RESOLVE-LIVE: Auto pick chip color checkbox selector; Chip color + Text color swatches only render when it is false */
        // tagBackgroundColor — colorSwatches, default var(--cc-surface3-surface), condRender autoPickChipColor=false — source: TagsInput.js:348
        // selectedTextColor — colorSwatches, default var(--cc-primary-text), condRender autoPickChipColor=false — source: TagsInput.js:358

        // errTextColor — colorSwatches, default var(--cc-error-systemStatus) — source: TagsInput.js:368
        selectColourFromColourPicker("Error text", ["255", "0", "255", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp for errTextColor (validation error text selector + color prop) */

        // fieldBorderRadius — input, default 6 — source default: TagsInput.js:470
        verifyAndModifyParameter("Border radius", "20"); // dynamic: test value
        /* RESOLVE-LIVE cssProp for fieldBorderRadius (field border-radius prop / selector) */

        // boxShadow — boxShadow, default 0px 0px 0px 0px #00000040 — source: TagsInput.js:380
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        /* RESOLVE-LIVE cssProp for boxShadow (field box-shadow target selector) */
        // verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]);

        // ---- Container section ----
        openAccordion("Container");

        // padding — switch: default | none, default default — source default: TagsInput.js:479
        /* RESOLVE-LIVE: Padding switch option selectors (default/none) + resulting padding css unknown from config */
    });

    it.skip('should verify the layout / device toggles', () => {
        // others.showOnDesktop default {{true}}, showOnMobile default {{false}}.
        // source: TagsInput.js:11 / :12
        verifyLayout(W);
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the tags input', () => {
        const events = [
            { event: "On tag added", message: "onTagAdded Event" },     // source: TagsInput.js:229
            { event: "On tag deleted", message: "onTagDeleted Event" }, // source: TagsInput.js:230
            { event: "On focus", message: "onFocus Event" },            // source: TagsInput.js:231
            { event: "On blur", message: "onBlur Event" },              // source: TagsInput.js:232
        ];

        addMultiEventsWithAlert(events, false);

        // onFocus/onBlur can fire on field click + canvas click, but onTagAdded /
        // onTagDeleted need the real tag input interaction (type a tag + Enter to
        // add, click a chip's remove icon to delete). A generic body click on the
        // widget will NOT fire the tag events, and the exact input / chip-remove
        // selectors are not derivable from config.
        /* RESOLVE-LIVE eventTrigger: TagsInput tag-input field selector + chip remove-icon selector */
        // onFocus:
        // cy.get(<tagsInputFieldSelector>).click();
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onFocus Event', false); // source: TagsInput.js:231
        // onTagAdded (type a tag + Enter):
        // cy.get(<tagsInputFieldSelector>).type(`${fake.randomSentence}{enter}`);
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onTagAdded Event', false); // source: TagsInput.js:229
        // onTagDeleted (click the chip's remove icon):
        // cy.get(<chipRemoveIconSelector>).click();
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onTagDeleted Event', false); // source: TagsInput.js:230
        // onBlur (click away):
        // cy.forceClickOnCanvas();
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onBlur Event', false); // source: TagsInput.js:232
    });

    it.skip('should verify all the CSA from the tags input', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // b1  source: TagsInput.js:47
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // b2  source: TagsInput.js:47
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // b3  source: TagsInput.js:57
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // b4  source: TagsInput.js:57
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // b5  source: TagsInput.js:52
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },    // b6  source: TagsInput.js:52
            { event: "On click", action: "Clear" },                                    // b7  source: TagsInput.js:43
            { event: "On click", action: "Select Tags", value: "{{['tag1']}}" },       // b8  source: TagsInput.js:23
            { event: "On click", action: "Deselect Tags", value: "{{['tag1']}}" },     // b9  source: TagsInput.js:33
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
