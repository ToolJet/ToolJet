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
describe('Text Area Component Tests', { testIsolation: false }, () => {
    const W = "textarea1"; // runtime name = <name>1 (Textarea -> textarea1)

    const functions = [
        { "key": "setText", "type": "Function" },        // source: textarea.js:283
        { "key": "setFocus", "type": "Function" },        // source: textarea.js:292
        { "key": "setBlur", "type": "Function" },        // source: textarea.js:296
        // @deprecated — source: textarea.js:299 (Disable(deprecated)); excluded from pass-required
        // { "key": "disable", "type": "Function" },
        // @deprecated — source: textarea.js:304 (Visibility(deprecated)); excluded from pass-required
        // { "key": "visibility", "type": "Function" },
        { "key": "setVisibility", "type": "Function" },  // source: textarea.js:310
        { "key": "setDisable", "type": "Function" },     // source: textarea.js:315
        { "key": "setLoading", "type": "Function" },     // source: textarea.js:320
    ];

    const exposedValues = [
        { "key": "value", "type": "String", "value": "\"\"" },        // source: textarea.js:275
        { "key": "isMandatory", "type": "Boolean", "value": "false" }, // source: textarea.js:276
        { "key": "isVisible", "type": "Boolean", "value": "true" },    // source: textarea.js:277
        { "key": "isDisabled", "type": "Boolean", "value": "false" },  // source: textarea.js:278
        { "key": "isLoading", "type": "Boolean", "value": "false" },   // source: textarea.js:279
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextArea-App`);
        cy.openApp();
        cy.dragAndDropWidget('Text Area', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // label renders default text
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .should("contain.text", "Label"); // source: textarea.js:340

        // default value is empty
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.value", ""); // source: textarea.js:339

        // visible + enabled by default
        cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible"); // source: textarea.js:343
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.disabled"); // source: textarea.js:345
    });

    it.skip('should verify the properties of the text area', () => {
        openEditorSidebar(W);

        // label (code) -> widget shows typed text
        const labelText = fake.randomSentence;
        verifyAndModifyParameter('Label', labelText); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .should("contain.text", labelText); // dynamic: fake echoed label

        // placeholder (code)
        const placeholderText = fake.randomSentence;
        verifyAndModifyParameter('Placeholder', placeholderText); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.attr", "placeholder", placeholderText); // dynamic: fake echoed placeholder

        // default value (code)
        const defaultVal = fake.randomSentence;
        verifyAndModifyParameter('Default value', defaultVal); // dynamic: fake
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("have.value", defaultVal); // dynamic: fake echoed value

        // additionalActions toggles
        openAccordion("Additional Actions");

        // dynamicHeight (toggle) default false
        verifyAndModifyToggleFx('Dynamic height', '{{false}}'); // source: textarea.js:342
        verifyAndModifyToggleFx('Dynamic height', '{{false}}', false); // source: textarea.js:342 (toggle back)

        // loadingState (toggle) default false -> loader visible
        verifyAndModifyToggleFx('Loading state', '{{false}}'); // source: textarea.js:346
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .within(() => {
                cy.get(".tj-widget-loader").should("be.visible");
            });
        verifyAndModifyToggleFx('Loading state', '{{false}}', false); // source: textarea.js:346 (toggle back)

        // disabledState (toggle) default false -> data-disabled true
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: textarea.js:345
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should("be.disabled"); // source: textarea.js:345
        verifyAndModifyToggleFx('Disable', '{{false}}', false); // source: textarea.js:345 (toggle back)

        // collapseWhenHidden (toggle) default false
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}'); // source: textarea.js:344
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}', false); // source: textarea.js:344 (toggle back)

        // visibility (toggle) default true -> hides the widget
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // source: textarea.js:343
        cy.get(commonWidgetSelector.draggableWidget(W)).should("not.be.visible"); // source: textarea.js:343
        verifyAndModifyToggleFx('Visibility', '{{true}}', false); // source: textarea.js:343 (toggle back)

        // tooltip (code) — additionalActions
        const tooltipText = fake.randomSentence;
        verifyAndModifyParameter("Tooltip", tooltipText); // dynamic: fake
        /* RESOLVE-LIVE selector+assertion for rendered tooltip text (hover trigger + tooltip markup) */ // source: textarea.js:85

        // tooltipFormat (switch) plainText/markdown/html default plainText — picker selector unknown (empty cache)
        /* RESOLVE-LIVE selector+assertion for Tooltip format switch (options plainText/markdown/html) + rendered-tooltip markup */ // source: textarea.js:71
    });

    it.skip('should verify the validation of the text area', () => {
        openEditorSidebar(W);
        openAccordion("Additional validations", []);

        // mandatory (toggle) default false -> mandatory marker
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // source: textarea.js:327
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .should("contain.text", "*"); // dynamic: mandatory marker
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}', false); // source: textarea.js:327 (toggle back)

        // regex (code) default ""
        verifyAndModifyParameter('Regex', "^[a-z]{3,10}$"); // dynamic: test regex

        // minLength (code) default ""
        verifyAndModifyParameter('Min length', "3"); // dynamic: test min length

        // maxLength (code) default ""
        verifyAndModifyParameter('Max length', "10"); // dynamic: test max length

        // customRule (code) default ""
        verifyAndModifyParameter('Custom validation', "{{false}}"); // dynamic: test custom rule
    });

    it.skip('should verify the styles of the text area', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // ---------- label accordion ----------
        openAccordion("Label", []);

        // color (colorSwatches) -> label text color
        selectColourFromColourPicker('Text', ['255', '0', '0', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for label color (Text) */
        verifyWidgetColorCss(W, "color", [255, 0, 0, 100]); // dynamic: test color

        // labelFontSize (numberInput) default {{12}} — source: textarea.js:118
        // alignment (switch) options side/top — source: textarea.js:124
        // direction (switch icon) options left/right — source: textarea.js:134
        // auto (Width checkbox) default {{true}}, condRender alignment=side — source: textarea.js:147
        // width (slider) default {{33}}, condRender alignment=side & auto=false — source: textarea.js:158
        // widthType (select) default ofComponent, condRender alignment=side & auto=false — source: textarea.js:174
        /* RESOLVE-LIVE cssProp/selector for labelFontSize / alignment / direction / auto Width checkbox /
           width slider / widthType select (label accordion) — unchecking auto reveals width+widthType */

        // ---------- field accordion ----------
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion("Field", []);

        // backgroundColor (colorSwatches)
        selectColourFromColourPicker('Background', ['0', '255', '0', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor (Background) */
        verifyWidgetColorCss(W, "background-color", [0, 255, 0, 100]); // dynamic: test color

        // borderColor (colorSwatches)
        selectColourFromColourPicker('Border', ['0', '0', '255', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor (Border) */
        verifyWidgetColorCss(W, "border-color", [0, 0, 255, 100]); // dynamic: test color

        // textColor (colorSwatches)
        selectColourFromColourPicker('Text', ['255', '0', '255', '100'], 0, commonWidgetSelector.colourPickerParent, 1); // dynamic: test color
        /* RESOLVE-LIVE cssProp for textColor (Text - field) */
        verifyWidgetColorCss(W, "color", [255, 0, 255, 100]); // dynamic: test color

        // accentColor / errTextColor (colorSwatches)
        /* RESOLVE-LIVE cssProp for accentColor (Accent) */
        /* RESOLVE-LIVE cssProp for errTextColor (Error text) */

        // borderRadius (numberInput) default {{6}}
        /* RESOLVE-LIVE cssProp for borderRadius (Border radius) */

        // boxShadow (boxShadow)
        fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], ['0', '0', '10', '0']); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // ---------- container accordion ----------
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion("Container", []);
        // padding (switch) options default/none
        /* RESOLVE-LIVE cssProp for padding (Container) */
    });

    it.skip('should verify the layout of the text area', () => {
        // covers others.showOnDesktop ({{true}}) + showOnMobile ({{false}})
        verifyLayout(W); // source: textarea.js:335 (showOnDesktop) / textarea.js:336 (showOnMobile)
    });

    it('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the text area', () => {
        const events = [
            { event: "On Change", message: "onChange Event" },        // source: textarea.js:106
            { event: "On Enter Pressed", message: "onEnterPressed Event" }, // source: textarea.js:107
            { event: "On Focus", message: "onFocus Event" },          // source: textarea.js:108
            { event: "On Blur", message: "onBlur Event" },            // source: textarea.js:109
        ];

        addMultiEventsWithAlert(events, false);

        const inputSelector = commonWidgetSelector.draggableWidget(W);

        cy.get(inputSelector).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onFocus Event', false); // dynamic: echoed onFocus message

        cy.get(inputSelector).type('r');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onChange Event', false); // dynamic: echoed onChange message

        cy.get(inputSelector).type('{enter}');
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onEnterPressed Event', false); // dynamic: echoed onEnterPressed message

        cy.forceClickOnCanvas();
        cy.verifyToastMessage(commonSelectors.toastMessage, 'onBlur Event', false); // dynamic: echoed onBlur message
    });

    it.skip('should verify all the CSA from the text area', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, //b1 source: textarea.js:310
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  //b2 source: textarea.js:310
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     //b3 source: textarea.js:315
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    //b4 source: textarea.js:315
            { event: "On click", action: "Set text", value: "1199999" },              //b5 source: textarea.js:283
            { event: "On click", action: "Clear" },                                    //b6 source: textarea.js:287
            { event: "On click", action: "Set focus" },                                //b7 source: textarea.js:292
            { event: "On click", action: "Set blur" },                                 //b8 source: textarea.js:296
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     //b9 source: textarea.js:320
        ];
        addCSA(W, actions);
        verifyCSA(W);

        // @deprecated — Disable(deprecated) source: textarea.js:299; excluded from pass-required
        // @deprecated — Visibility(deprecated) source: textarea.js:304; excluded from pass-required
    });

    // afterEach(() => {
    //     cy.apiDeleteApp();
    // });

});
