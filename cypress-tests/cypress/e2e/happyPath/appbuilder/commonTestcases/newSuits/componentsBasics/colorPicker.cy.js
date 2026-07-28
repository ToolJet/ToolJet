import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addCSA, verifyCSA } from "Support/utils/editor/textInput";
import { addMultiEventsWithAlert } from "Support/utils/events";
import { openAndVerifyNode, openNode, verifyNodes, verifyNodeData } from "Support/utils/inspector";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
    selectFromSidebarDropdown,
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
describe('Color Picker Component Tests', { testIsolation: false }, () => {
    const W = "colorpicker1";
    const data = {};

    const functions = [
        { key: "setColor", type: "Function" },      // source: colorPicker.js:117
        { key: "setDisable", type: "Function" },     // source: colorPicker.js:121
        { key: "setLoading", type: "Function" },     // source: colorPicker.js:126
        { key: "setVisibility", type: "Function" },  // source: colorPicker.js:131
    ];

    const exposedValues = [
        { key: "selectedColorHex", type: "String", value: '"#000000"' },        // source: colorPicker.js:277
        { key: "selectedColorRGB", type: "String", value: '"rgb(0,0,0)"' },     // source: colorPicker.js:278
        { key: "selectedColorRGBA", type: "String", value: '"rgba(0, 0, 0, 1)"' }, // source: colorPicker.js:279
        { key: "isVisible", type: "Boolean", value: "true" },                   // source: colorPicker.js:280
        { key: "isDisabled", type: "Boolean", value: "false" },                 // source: colorPicker.js:281
        { key: "isLoading", type: "Boolean", value: "false" },                  // source: colorPicker.js:282
        { key: "colorFormat", type: "String", value: '"hex"' },                 // source: colorPicker.js:283
        { key: "allowOpacity", type: "Boolean", value: "false" },               // source: colorPicker.js:284
        { key: "isValid", type: "Boolean", value: "true" },                     // source: colorPicker.js:285
    ];

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-ColorPicker-App`);
        cy.openApp();
        cy.dragAndDropWidget('Color Picker', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it.skip('should verify default values on drop', () => {
        // defaults facet — assert config defaults render before any edit.
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
    });

    it.skip('should verify the properties of the color picker', () => {
        openEditorSidebar(W);

        // label (code) — type a random string; the widget shows the typed label.
        data.label = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Label', data.label); // dynamic: fake
        /* RESOLVE-LIVE labelDomSelector for colorPicker — colorPicker has no
           `label` exposedVariable, so the typed label must be asserted on the
           rendered widget DOM; the label element selector under
           draggableWidget(W) is not in the surface cache. */

        // placeholder (code)
        data.placeholder = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Placeholder', data.placeholder); // dynamic: fake

        // defaultColor (code) — default "#4368E3"
        verifyAndModifyParameter('Default value', '#000000'); // dynamic: test color

        // format (select) — options HEX/RGB, default hex
        selectFromSidebarDropdown('Color format', 'RGB'); // source: colorPicker.js:36
        selectFromSidebarDropdown('Color format', 'HEX'); // source: colorPicker.js:35

        // showAlpha (toggle) — default {{false}}
        verifyAndModifyToggleFx('Show alpha', '{{false}}'); // source: colorPicker.js:301
        verifyAndModifyToggleFx('Show alpha', '{{true}}');  // source: colorPicker.js:301 (toggle back)

        // showClearBtn (toggle) — default {{false}}
        verifyAndModifyToggleFx('Show clear button', '{{false}}'); // source: colorPicker.js:302
        verifyAndModifyToggleFx('Show clear button', '{{true}}');  // source: colorPicker.js:302 (toggle back)

        // additionalActions section toggles
        openAccordion('Additional actions', []);

        // loadingState (toggle) — default {{false}}
        verifyAndModifyToggleFx('Loading state', '{{false}}'); // source: colorPicker.js:303
        cy.get(commonWidgetSelector.draggableWidget(W))
            .parent()
            .find('.tj-widget-loader')
            .should('be.visible'); // dynamic: loading toggled on shows loader
        verifyAndModifyToggleFx('Loading state', '{{true}}');  // source: colorPicker.js:303 (toggle back)

        // disabledState (toggle) — default {{false}}
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: colorPicker.js:307
        cy.get(commonWidgetSelector.draggableWidget(W))
            .should('have.attr', 'data-disabled', 'true'); // source: colorPicker.js:307 (disabled effect)
        verifyAndModifyToggleFx('Disable', '{{true}}');  // source: colorPicker.js:307 (toggle back)

        // collapseWhenHidden (toggle) — default {{false}}
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}'); // source: colorPicker.js:306
        verifyAndModifyToggleFx('Collapse when hidden', '{{true}}');  // source: colorPicker.js:306 (toggle back)

        // tooltipFormat (switch) — options Plain text/Markdown/HTML, default plainText
        cy.contains('[data-cy*="-button"]', 'Markdown').click(); // source: colorPicker.js:92
        cy.contains('[data-cy*="-button"]', 'Plain text').click(); // source: colorPicker.js:91

        // tooltip (code) — default ""
        data.tooltip = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Tooltip', data.tooltip); // dynamic: fake
    });

    it.skip('should verify the validation of the color picker', () => {
        openEditorSidebar(W);

        // mandatory (toggle) — default {{false}}; toggling on shows the required marker.
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // source: colorPicker.js:293
        verifyAndModifyToggleFx('Make this field mandatory', '{{true}}');  // source: colorPicker.js:293 (toggle back)

        // customRule (code) — default null; a false rule flips isValid.
        verifyAndModifyParameter('Custom validation', "{{false}}"); // dynamic: test rule
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, [
            { key: "isValid", type: "Boolean", value: "false" }, // dynamic: false custom rule makes field invalid
        ], verifyNodeData);
    });

    it.skip('should verify the styles of the color picker', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        // --- Label accordion ---
        openAccordion('Label', []);

        // color (colorSwatches) — Text, default var(--cc-primary-text)
        selectColourFromColourPicker('Text', ['255', '0', '0', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for color (label Text) — cssProperty + sub-selector
           for the label text color under W not present in surface cache. */
        verifyWidgetColorCss(W, 'color', [255, 0, 0, 100]); // dynamic: test color

        // labelFontSize (numberInput) — default {{12}}
        cy.get(commonWidgetSelector.stylePicker('Size')).clear().type('20'); // dynamic: test size
        /* RESOLVE-LIVE cssProp for labelFontSize — font-size selector under W
           label not present in surface cache. */

        // alignment (switch) — options Side/Top, default side
        cy.contains('[data-cy*="-button"]', 'Top').click(); // source: colorPicker.js:172
        cy.contains('[data-cy*="-button"]', 'Side').click(); // source: colorPicker.js:171
        /* RESOLVE-LIVE cssProp for alignment — flex-direction/layout effect not in cache. */

        // direction (icon switch) — options left/right, default left
        /* RESOLVE-LIVE cssProp for direction — icon-toggle selectors
           (alignleftinspector/alignrightinspector) + resulting order not in cache. */

        // auto (checkbox, Width) — default {{true}}; unchecking reveals the width slider.
        /* RESOLVE-LIVE selector for auto (Width checkbox) + width slider — the
           label-width checkbox/slider DOM selectors are not in the surface cache. */

        // --- Field accordion ---
        openAccordion('Field', []);

        // backgroundColor (colorSwatches) — Background, default var(--cc-surface1-surface)
        selectColourFromColourPicker('Background', ['255', '0', '0', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for backgroundColor — bg color selector under W not in cache. */
        verifyWidgetColorCss(W, 'background-color', [255, 0, 0, 100]); // dynamic: test color

        // borderColor (colorSwatches) — Border, default var(--cc-default-border)
        selectColourFromColourPicker('Border', ['0', '255', '0', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for borderColor — border color selector under W not in cache. */
        verifyWidgetColorCss(W, 'border-color', [0, 255, 0, 100]); // dynamic: test color

        // accentColor (colorSwatches) — Accent, default var(--cc-primary-brand)
        selectColourFromColourPicker('Accent', ['0', '0', '255', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for accentColor — accent color selector under W not in cache. */

        // textColor (colorSwatches) — Text, default var(--cc-primary-text)
        selectColourFromColourPicker('Text', ['10', '20', '30', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for textColor — field text color selector under W not in cache. */

        // errTextColor (colorSwatches) — Error text, default var(--cc-error-systemStatus)
        selectColourFromColourPicker('Error text', ['40', '50', '60', '100']); // dynamic: test color
        /* RESOLVE-LIVE cssProp for errTextColor — error text color only renders in
           invalid state; selector under W not in cache. */

        // borderRadius (numberInput) — default {{6}}
        cy.get(commonWidgetSelector.stylePicker('Border radius')).clear().type('15'); // dynamic: test radius
        /* RESOLVE-LIVE cssProp for borderRadius — border-radius selector under W not in cache. */

        // boxShadow (boxShadow) — default 0px 0px 0px 0px #00000040
        fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], ['0', '0', '10', '0']); // dynamic: test shadow
        verifyBoxShadowCss(W, [0, 0, 0, 100], [0, 0, 10, 0]); // dynamic: test shadow

        // --- Container accordion ---
        openAccordion('Container', []);

        // padding (switch) — options Default/None, default default
        cy.contains('[data-cy*="-button"]', 'None').click(); // source: colorPicker.js:271
        cy.contains('[data-cy*="-button"]', 'Default').click(); // source: colorPicker.js:270
        /* RESOLVE-LIVE cssProp for padding — padding value under W not in cache. */
    });

    it.skip('should verify the layout of the color picker', () => {
        // others: showOnDesktop {{true}} (source: colorPicker.js:289),
        //         showOnMobile {{false}} (source: colorPicker.js:290)
        verifyLayout(W);
    });

    it.skip('should verify all the exposed values on inspector', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();
        openNode("components");
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    it.skip('should verify all the events from the color picker', () => {
        const events = [
            { event: "On change", message: "onChange Event" }, // source: colorPicker.js:149
            { event: "On focus", message: "onFocus Event" },   // source: colorPicker.js:150
            { event: "On blur", message: "onBlur Event" },     // source: colorPicker.js:151
        ];
        addMultiEventsWithAlert(events, false);

        /* RESOLVE-LIVE eventTrigger for colorPicker — opening the swatch popover
           and picking a color (onChange), and the focus/blur sequence, are
           component-specific interactions. The trigger DOM (popover open button +
           swatch/hex-input inside the react-color picker) is not in the surface
           cache; resolve the click/type sequence + which event each fires. */
        // Expected once resolved:
        // cy.get(commonWidgetSelector.draggableWidget(W)).click();
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onFocus Event', false);  // source: colorPicker.js:150
        // ...pick a color...
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onChange Event', false);  // source: colorPicker.js:149
        // cy.forceClickOnCanvas();
        // cy.verifyToastMessage(commonSelectors.toastMessage, 'onBlur Event', false);   // source: colorPicker.js:151
    });

    it.skip('should verify all the CSA from color picker', () => {
        const actions = [
            { event: "On click", action: "Set visibility", valueToggle: "{{false}}" }, // source: colorPicker.js:133
            { event: "On click", action: "Set visibility", valueToggle: "{{true}}" },  // source: colorPicker.js:133
            { event: "On click", action: "Set disable", valueToggle: "{{true}}" },     // source: colorPicker.js:123
            { event: "On click", action: "Set disable", valueToggle: "{{false}}" },    // source: colorPicker.js:123
            { event: "On click", action: "Set loading", valueToggle: "{{true}}" },     // source: colorPicker.js:128
            { event: "On click", action: "Set loading", valueToggle: "{{false}}" },    // source: colorPicker.js:128
            { event: "On click", action: "Set Color", value: "#ffffff" },              // source: colorPicker.js:118
        ];
        addCSA(W, actions);
        /* RESOLVE-LIVE setColor assertion for colorPicker — verifyCSA covers the
           generic visibility/disable/loading buttons; asserting setColor changed
           the rendered swatch/selectedColorHex needs the color-swatch DOM selector
           which is not in the surface cache. */
        verifyCSA(W);
    });
});
