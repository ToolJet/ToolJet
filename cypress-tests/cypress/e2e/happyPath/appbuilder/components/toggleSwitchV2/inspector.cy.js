import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    openNode,
    openAndVerifyNode,
    verifyNodes,
    verifyNodeData,
} from "Support/utils/appBuilder/inspector";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { getWidgetRect } from "Support/utils/appBuilder/canvas";

// Inspector facet — MERGED: default property values (config.definition) +
// default functions (config.actions) + exposed values (config.exposedVariables).
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Toggle Switch — inspector facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'

    // source: toggleswitchv2.js:169-176
    const exposedValues = [
        { key: "value", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:170
        { key: "label", type: "String", value: '"Label"' }, // source: toggleswitchv2.js:171
        { key: "isMandatory", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:172
        { key: "isVisible", type: "Boolean", value: "true" }, // source: toggleswitchv2.js:173
        { key: "isDisabled", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:174
        { key: "isLoading", type: "Boolean", value: "false" }, // source: toggleswitchv2.js:175
        { key: "isValid", type: "Boolean", value: "true" }, // dynamic: exposedVarDrift — ToggleV2.jsx:232
    ];

    // source: toggleswitchv2.js:177-202
    const functions = [
        { key: "toggle", type: "Function" }, // source: toggleswitchv2.js:179
        { key: "setValue", type: "Function" }, // source: toggleswitchv2.js:183
        { key: "setVisibility", type: "Function" }, // source: toggleswitchv2.js:188
        { key: "setDisable", type: "Function" }, // source: toggleswitchv2.js:193
        { key: "setLoading", type: "Function" }, // source: toggleswitchv2.js:198
    ];

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-Inspector-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('exposed values + functions render with their config defaults', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click();
        cy.hideTooltip();

        openNode('components');
        openAndVerifyNode(W, exposedValues, verifyNodeData);
        verifyNodes(functions, verifyNodeData);
    });

    // config.definition defaults rendered on the widget itself — the values a
    // freshly dropped Toggle Switch must start from.
    it('definition defaults render on a freshly dropped widget', () => {
        const INNER = `[data-cy="${W}"]`;

        // properties.label default 'Label' — source: toggleswitchv2.js:213
        cy.get(`${INNER} label`).scrollIntoView().should('have.text', 'Label');
        // properties.defaultValue default '{{false}}' — source: toggleswitchv2.js:214
        cy.get(`${INNER} input.form-check-input`).should('not.be.checked');
        // properties.visibility default '{{true}}' — source: toggleswitchv2.js:215
        cy.get(INNER).should('be.visible');
        // properties.disabledState default '{{false}}' — source: toggleswitchv2.js:218
        cy.get(INNER).should('have.attr', 'data-disabled', 'false');
        cy.get(`${INNER} input.form-check-input`).should('not.be.disabled');
        // properties.loadingState default '{{false}}' — source: toggleswitchv2.js:219
        cy.get(`${INNER} .tj-widget-loader`).should('not.exist');
        // validation.mandatory default '{{false}}' — source: toggleswitchv2.js:209
        cy.get(`${INNER} div:has(> label)`).should('not.contain.text', '*'); // OverflowTooltip renders an unclassed div (OverflowTooltip.jsx:72-74)
        // styles.alignment default 'right' → flex-row-reverse — source: toggleswitchv2.js:230 / ToggleV2.jsx:253
        cy.get(INNER).should('have.class', 'flex-row-reverse');
        // styles.padding default 'default' → BOX_PADDING 2px — source: toggleswitchv2.js:232 / RenderWidget.jsx:320
        cy.get(commonWidgetSelector.draggableWidget(W)).should('have.css', 'padding-top', '2px');
    });

    // The two defaults whose effect is the ABSENCE of a node — asserted on a
    // freshly dropped widget so a regression that starts rendering them fails here.
    it('empty definition defaults render no tooltip and no validation feedback', () => {
        const INNER = `[data-cy="${W}"]`;

        // properties.tooltip default '' — source: toggleswitchv2.js:220. RenderWidget
        // gates the tooltip node on hasUserTooltip (RenderWidget.jsx:297-301), so an
        // empty default must render no tooltip at all on hover.
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W)).scrollIntoView().realHover();
        cy.wait(1000);
        cy.get('[data-cy="widget-tooltip"]').should('not.exist');

        // validation.customRule default null — source: toggleswitchv2.js:210. Resolves
        // to a non-string, so validate() stays valid (_helpers/utils.js:458-461) and the
        // feedback node must not appear even once userInteracted is armed.
        cy.get(`${INNER} > div > div.d-flex`).scrollIntoView().click({ force: true });
        cy.get(`${INNER} input.form-check-input`).should('be.checked');
        cy.get(commonWidgetSelector.validationFeedbackMessage(W)).should('not.exist');
    });

    // config.defaultSize + the two `code` fields' placeholders — declared config
    // surface that renders only in the untouched/default state.
    it('defaultSize and the code-field placeholders render from the config', () => {
        // defaultSize seeds the dropped layout (appCanvasUtils.js:47-48):
        // height is used verbatim in px; width is in grid units of NO_OF_GRIDS.
        getWidgetRect(W).then((r) => {
            expect(r.h, 'defaultSize.height').to.be.closeTo(30, 2); // source: toggleswitchv2.js:8
            cy.get(commonSelectors.canvas).then(($c) => {
                // source: toggleswitchv2.js:7 / appCanvasConstants.js:1 (NO_OF_GRIDS = 43)
                const expected = ($c[0].getBoundingClientRect().width * 6) / 43;
                expect(r.w, 'defaultSize.width in grid units').to.be.closeTo(expected, 8); // dynamic: 8px grid-snap tolerance
            });
        });

        openEditorSidebar(W);
        openAccordion('Additional Actions');
        // tooltip's definition default is '' (toggleswitchv2.js:220), so CodeMirror
        // shows the config placeholder instead — source: toggleswitchv2.js:90
        cy.get(commonWidgetSelector.parameterInputField('Tooltip'))
            .find('.cm-placeholder')
            .should('have.text', 'Enter tooltip text'); // source: toggleswitchv2.js:90

        openAccordion('Validation');
        // customRule's definition default is null (toggleswitchv2.js:210) → also empty
        // source: toggleswitchv2.js:20
        cy.get(commonWidgetSelector.parameterInputField('Custom validation'))
            .find('.cm-placeholder')
            .should('have.text', "{{components.text2.text=='yes'&&'valid'}}"); // source: toggleswitchv2.js:20
    });

    // config.definition style defaults, read back as the design-token labels the
    // style pickers show before any user edit.
    it('style pickers show the config design-token defaults', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

        openAccordion('label', []);
        // textColor default var(--cc-primary-text) → 'Text/Primary'
        // source: toggleswitchv2.js:225 / ColorSwatches.jsx:36-46
        cy.get(commonWidgetSelector.stylePickerValue('Text color')).should('have.text', 'Text/Primary');

        openAccordion('switch', []);
        // source: toggleswitchv2.js:228 (var(--cc-default-border))
        cy.get(commonWidgetSelector.stylePickerValue('Border color')).should('have.text', 'Border/Default');
        // source: toggleswitchv2.js:226 (var(--cc-primary-brand))
        cy.get(commonWidgetSelector.stylePickerValue('Checked color')).should('have.text', 'Brand/Primary');
        // source: toggleswitchv2.js:227 (var(--cc-surface3-surface))
        cy.get(commonWidgetSelector.stylePickerValue('Unchecked color')).should('have.text', 'Surface/Surface3');
        // source: toggleswitchv2.js:229 (var(--cc-surface1-surface))
        cy.get(commonWidgetSelector.stylePickerValue('Handle color')).should('have.text', 'Surface/Surface1');
    });
});
