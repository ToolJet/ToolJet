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
describe('File Input Component Tests', { testIsolation: false }, () => {
    const W = "fileinput1";
    const widget = `[data-cy="draggable-widget-${W}"]`;

    // Exposed set is file-specific — assert these exact keys, NOT a text `value`.
    const exposedValues = [
        { key: "files", type: "Array", value: "[]" },          // source: fileinput.js:425
        { key: "id", type: "String", value: "\"\"" },          // source: fileinput.js:426
        { key: "isParsing", type: "Boolean", value: "false" }, // source: fileinput.js:427
        { key: "isValid", type: "Boolean", value: "true" },    // source: fileinput.js:428
        { key: "fileSize", type: "Number", value: "0" },       // source: fileinput.js:429
        { key: "isMandatory", type: "Boolean", value: "false" }, // source: fileinput.js:430
        { key: "isLoading", type: "Boolean", value: "false" }, // source: fileinput.js:431
        { key: "isVisible", type: "Boolean", value: "true" },  // source: fileinput.js:432
        { key: "isDisabled", type: "Boolean", value: "false" }, // source: fileinput.js:433
    ];

    const functions = [
        { key: "clear", type: "Function" },         // source: fileinput.js:437
        { key: "setFocus", type: "Function" },      // source: fileinput.js:441
        { key: "setBlur", type: "Function" },       // source: fileinput.js:445
        { key: "setVisibility", type: "Function" }, // source: fileinput.js:449
        { key: "setDisable", type: "Function" },    // source: fileinput.js:461
        { key: "setLoading", type: "Function" },    // source: fileinput.js:473
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-FileInput-App`);
        cy.openApp();
        cy.dragAndDropWidget("File input", 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // Label default text rendered by the widget.
        cy.get(widget)
            .should("be.visible")
            .and("contain.text", "Label"); // source: fileinput.js:491
        // Placeholder / instruction text default.
        cy.get(widget).should("contain.text", "Click to select file"); // source: fileinput.js:492
    });

    it.skip('should verify the properties of the file input', () => {
        openEditorSidebar(W);
        openAccordion("Data");

        // label (code) — assert typed text renders on the widget.
        const labelText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter("Label", labelText);
        cy.forceClickOnCanvas();
        cy.get(widget).should("contain.text", labelText); // dynamic: fake

        openEditorSidebar(W);
        openAccordion("Data");

        // instructionText (code) — Placeholder text.
        const placeholder = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter("Placeholder", placeholder);
        cy.forceClickOnCanvas();
        cy.get(widget).should("contain.text", placeholder); // dynamic: fake

        openEditorSidebar(W);
        openAccordion("Data");

        // enableMultiple (toggle) default {{true}}
        verifyAndModifyToggleFx("Allow uploading multiple files", "{{true}}"); // source: fileinput.js:493
        verifyAndModifyToggleFx("Allow uploading multiple files", "{{true}}", false); // source: fileinput.js:493

        // enableClearSelection (toggle) default {{false}}
        verifyAndModifyToggleFx("Enable clear selection", "{{false}}"); // source: fileinput.js:495
        verifyAndModifyToggleFx("Enable clear selection", "{{false}}", false); // source: fileinput.js:495

        // parseContent (toggle) default {{false}}
        verifyAndModifyToggleFx("Enable parsing", "{{false}}"); // source: fileinput.js:494

        // parseFileType (select) — conditionally rendered when parseContent=true (just enabled above).
        // Options: auto-detect, csv, xls, xlsx, json.
        cy.get(commonWidgetSelector.parameterLabel("File type")).should("have.text", "File type"); // source: fileinput.js:496
        /* RESOLVE-LIVE select-option selector for parseFileType (File type) — pick "csv" and assert selection */

        // reset parseContent back
        verifyAndModifyToggleFx("Enable parsing", "{{false}}", false); // source: fileinput.js:494

        // --- additionalActions section ---
        // loadingState (toggle) default {{false}}
        verifyAndModifyToggleFx("Loading", "{{false}}"); // source: fileinput.js:497
        cy.get(widget).parent().find('.tj-widget-loader').should('be.visible');
        verifyAndModifyToggleFx("Loading", "{{false}}", false); // source: fileinput.js:497

        // disabledState (toggle) default {{false}}
        verifyAndModifyToggleFx("Disable", "{{false}}"); // source: fileinput.js:499
        cy.get(widget).should('have.attr', 'data-disabled', 'true'); // source: fileinput.js:499
        verifyAndModifyToggleFx("Disable", "{{false}}", false); // source: fileinput.js:499

        // tooltipFormat (switch) options: plainText, markdown, html — default plainText
        openEditorSidebar(W);
        openAccordion("Data");
        /* RESOLVE-LIVE switch selector for tooltipFormat (plainText/markdown/html) +
           rendered-tooltip markup assertion (markdown/html rendered vs plain) */ // source: fileinput.js:124

        // tooltip (code) — hover shows the rendered tooltip text
        const tooltipText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter("Tooltip", tooltipText); // dynamic: fake
        /* RESOLVE-LIVE rendered-tooltip text assertion — hover the widget and assert the
           tooltip element contains tooltipText */ // source: fileinput.js:138

        // visibility (toggle) default {{true}} — hides widget when off.
        openEditorSidebar(W);
        openAccordion("Data");
        verifyLayout(W); // source: fileinput.js:498
    });

    it.skip('should verify the validation properties of the file input', () => {
        openEditorSidebar(W);
        openAccordion("Data");

        // enableValidation (Mark as mandatory) default {{false}}
        verifyAndModifyToggleFx("Mark as mandatory", "{{false}}"); // source: fileinput.js:525
        cy.forceClickOnCanvas();
        // mandatory marker (*) appears on the label
        cy.get(widget).should("contain.text", "*"); // source: fileinput.js:525

        openEditorSidebar(W);
        openAccordion("Data");
        verifyAndModifyToggleFx("Mark as mandatory", "{{false}}", false); // source: fileinput.js:525

        // fileType (code) default "*/*"
        cy.get(commonWidgetSelector.parameterLabel("File Type")).should("have.text", "File Type"); // source: fileinput.js:526
        verifyAndModifyParameter("File Type", ".png"); // dynamic: fake test value

        // minSize (code) default {{50}}
        cy.get(commonWidgetSelector.parameterLabel("Min size (Bytes)")).should("have.text", "Min size (Bytes)"); // source: fileinput.js:527
        verifyAndModifyParameter("Min size (Bytes)", "{{10}}"); // dynamic: test value

        // maxSize (code) default {{51200000}}
        cy.get(commonWidgetSelector.parameterLabel("Max size (Bytes)")).should("have.text", "Max size (Bytes)"); // source: fileinput.js:528
        verifyAndModifyParameter("Max size (Bytes)", "{{1000000}}"); // dynamic: test value

        // minFileCount / maxFileCount — conditionally rendered when enableMultiple=true (default true).
        cy.get(commonWidgetSelector.parameterLabel("Min files")).should("have.text", "Min files"); // source: fileinput.js:529
        verifyAndModifyParameter("Min files", "{{1}}"); // dynamic: test value

        cy.get(commonWidgetSelector.parameterLabel("Max files")).should("have.text", "Max files"); // source: fileinput.js:530
        verifyAndModifyParameter("Max files", "{{5}}"); // dynamic: test value
    });

    it.skip('should verify the styles of the file input', () => {
        openEditorSidebar(W);
        cy.get('[data-cy="styles-tab"]').click({ force: true });

        // --- label accordion ---
        openAccordion("Label");
        // labelColor (colorSwatches) default var(--cc-primary-text)
        selectColourFromColourPicker("Color", ["255", "0", "0", "100"]); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for labelColor */ "color", [255, 0, 0, 100]);

        // labelFontSize (numberInput) default {{12}}
        /* RESOLVE-LIVE input selector + font-size cssProp for labelFontSize (Size) */

        // alignment (switch) options: side, top — default top
        /* RESOLVE-LIVE switch selectors + resulting CSS for alignment (side/top) */ // source: fileinput.js:510

        // direction (switch icon) options: left, right — default left
        /* RESOLVE-LIVE switch selectors + resulting CSS for direction (left/right) */ // source: fileinput.js:509

        // auto (Width checkbox) default {{true}}, condRender alignment=side — source: fileinput.js:269
        // labelWidth (slider) default "33", condRender alignment=side & auto=false — source: fileinput.js:280
        // widthType (select) default ofComponent, condRender alignment=side & auto=false — source: fileinput.js:296
        /* RESOLVE-LIVE selector for auto Width checkbox (:269) — unchecking it reveals the
           labelWidth slider (:280) + widthType select (:296); resolve live the checkbox/slider/select
           data-cy and assert the label width changes */

        // --- field accordion ---
        openAccordion("Field");
        // iconColor (colorSwatches) default var(--cc-default-icon). icon is visibility:false so the
        // field icon may not render — resolve live whether the swatch is reachable / assertable.
        /* RESOLVE-LIVE selector+assertion for iconColor (Icon color) — source: fileinput.js:327 */
        // backgroundColor (colorSwatches) default var(--cc-surface1-surface)
        selectColourFromColourPicker("Background", ["0", "255", "0", "100"]); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for backgroundColor */ "background-color", [0, 255, 0, 100]);

        // borderColor (colorSwatches) default var(--cc-default-border)
        selectColourFromColourPicker("Border", ["0", "0", "255", "100"]); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for borderColor */ "border-color", [0, 0, 255, 100]);

        // accentColor (colorSwatches) default var(--cc-primary-brand)
        selectColourFromColourPicker("Accent", ["255", "255", "0", "100"]); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for accentColor */ "accent-color", [255, 255, 0, 100]);

        // textColor (colorSwatches) default var(--cc-primary-text)
        selectColourFromColourPicker("Text", ["10", "20", "30", "100"]); // dynamic: test color
        verifyWidgetColorCss(W, /* RESOLVE-LIVE cssProp for textColor */ "color", [10, 20, 30, 100]);

        // errTextColor (colorSwatches) default var(--cc-error-systemStatus)
        selectColourFromColourPicker("Error text", ["200", "10", "10", "100"]); // dynamic: test color
        /* RESOLVE-LIVE cssProp + selector for errTextColor (shown only when validation fails) */

        // borderRadius (numberInput) default {{6}}
        /* RESOLVE-LIVE input selector + border-radius cssProp for borderRadius (Border radius) */

        // boxShadow (boxShadow) default 0px 0px 0px 0px #00000040
        fillBoxShadowParams(["X", "Y", "Blur", "Spread"], ["0", "0", "10", "0"]); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // --- container accordion ---
        openAccordion("Container");
        // padding (switch) options: default, none — default default
        /* RESOLVE-LIVE switch selectors + resulting padding CSS for padding (default/none) */ // source: fileinput.js:521
    });

    it.skip('should verify the layout of the file input', () => {
        // Covers showOnDesktop ({{true}}) hide + showOnMobile ({{false}}) show.
        verifyLayout(W); // source: fileinput.js:11 / fileinput.js:12
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the file input', () => {
        const events = [
            { event: "On File Selected", message: "onFileSelected Event" }, // source: fileinput.js:230
            { event: "On File Loaded", message: "onFileLoaded Event" },     // source: fileinput.js:231
        ];

        addMultiEventsWithAlert(events, false);

        // File-picker trigger: selecting a file has no text value. The onFileSelected /
        // onFileLoaded events fire off a real file selection through the hidden file input.
        // RESOLVE-LIVE file-selection trigger — the onFileSelected/onFileLoaded events only fire
        // after a real file selection through the hidden file input. Trigger + toast asserts are
        // stubbed until the input[type=file] selector + a fixture are confirmed live:
        //   cy.get(`${widget} input[type=file]`).selectFile("cypress/fixtures/...", { force: true });
        //   cy.verifyToastMessage(commonSelectors.toastMessage, "onFileSelected Event", false); // source: fileinput.js:230
        //   cy.verifyToastMessage(commonSelectors.toastMessage, "onFileLoaded Event", false);   // source: fileinput.js:231
    });

    it.skip('should verify all the CSA from file input', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // source: fileinput.js:449
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // source: fileinput.js:449
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // source: fileinput.js:461
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // source: fileinput.js:461
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // source: fileinput.js:473
            { event: "On click", action: "Set focus" },  // source: fileinput.js:441
            { event: "On click", action: "Set blur" },   // source: fileinput.js:445
            { event: "On click", action: "Clear" },       // source: fileinput.js:437
        ];
        addCSA(W, actions);
        verifyCSA(W);
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });
});
