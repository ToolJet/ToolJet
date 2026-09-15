import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    openAccordion,
    selectColourFromColourPicker,
    verifyWidgetColorCss,
    verifyAndModifySwitch,
    fillBoxShadowParams,
    verifyBoxShadowCss,
} from "Support/utils/commonWidget";

// ── DOM map (ToggleV2.jsx) ───────────────────────────────────────────────────
// The five colour swatches each target a DIFFERENT element:
//   textColor          → the label wrapper div `color`           (ToggleV2.jsx:270-277)
//   borderColor        → the slider span `outline`               (ToggleV2.jsx:48, 90)
//   toggleSwitchColor  → the slider span `background-color` when ON  (ToggleV2.jsx:45)
//   uncheckedColor     → the slider span `background-color` when OFF (ToggleV2.jsx:45)
//   handleColor        → the circle span `background-color`      (ToggleV2.jsx:58, 91)
const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'
const INNER = `[data-cy="${W}"]`; // ToggleV2.jsx:264
const SWITCH = `${INNER} > div > div.d-flex`; // ToggleV2.jsx:66 (Switch wrapper > clickable row)
const SLIDER = `${SWITCH} > span`; // ToggleV2.jsx:90
const HANDLE = `${SWITCH} > span > span`; // ToggleV2.jsx:91
const LABEL_WRAP = `${INNER} div:has(> label)`; // ToggleV2.jsx:270-283 — OverflowTooltip renders an UNCLASSED div (its `className` goes to the ToolTip wrapper, OverflowTooltip.jsx:64/72-74), so pin it by the <label> it contains

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Toggle Switch — styles facet', { testIsolation: false }, () => {

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-Styles-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── label accordion ───────────────────────────────────────────────────────
    // accordian='label': textColor (colorSwatches), alignment (switch)
    it('label accordian — textColor (colorSwatches) colours the label', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label');

        // textColor default var(--cc-primary-text) — source: toggleswitchv2.js:98 (default :225)
        selectColourFromColourPicker('Text color', ['255', '0', '0', '100']); // dynamic: test color
        // written inline on the OverflowTooltip wrapper (ToggleV2.jsx:274); the
        // inner <label> inherits it.
        verifyWidgetColorCss(LABEL_WRAP, 'color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('label accordian — alignment (switch) flips the flex direction', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label');

        // alignment default 'right' → flex-row-reverse — source: toggleswitchv2.js:138 (default :230)
        cy.get(INNER).should('have.class', 'flex-row-reverse');

        // 'Left' → flex-row (ToggleV2.jsx:253) — source: toggleswitchv2.js:143
        verifyAndModifySwitch('Alignment', 'Left');
        cy.get(INNER).should('have.class', 'flex-row').and('not.have.class', 'flex-row-reverse');

        // and back to 'Right' — source: toggleswitchv2.js:144
        verifyAndModifySwitch('Alignment', 'Right');
        cy.get(INNER).should('have.class', 'flex-row-reverse');
    });

    // ── switch accordion ──────────────────────────────────────────────────────
    // accordian='switch': borderColor, toggleSwitchColor, uncheckedColor,
    // handleColor (colorSwatches), boxShadow (boxShadow), padding (switch)
    it('switch accordian — borderColor (colorSwatches) outlines the slider', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // borderColor default var(--cc-default-border) — source: toggleswitchv2.js:106 (default :228)
        selectColourFromColourPicker('Border color', ['255', '0', '0', '100']); // dynamic: test color
        // written as the `outline` shorthand (ToggleV2.jsx:48), so read the
        // `outline-color` longhand the shorthand expands into.
        verifyWidgetColorCss(SLIDER, 'outline-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — toggleSwitchColor (Checked color) fills the ON slider', () => {
        openEditorSidebar(W);
        // the checked colour is only painted while `on` is true (ToggleV2.jsx:45)
        verifyAndModifySwitch('Default state', 'On'); // source: toggleswitchv2.js:38
        cy.get(`${INNER} input.form-check-input`).should('be.checked');

        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // toggleSwitchColor default var(--cc-primary-brand) — source: toggleswitchv2.js:114 (default :226)
        selectColourFromColourPicker('Checked color', ['255', '0', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(SLIDER, 'background-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — uncheckedColor fills the OFF slider', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // uncheckedColor default var(--cc-surface3-surface); the widget starts
        // OFF (defaultValue '{{false}}', toggleswitchv2.js:214) so this is the
        // painted colour — source: toggleswitchv2.js:122 (default :227)
        selectColourFromColourPicker('Unchecked color', ['0', '128', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(SLIDER, 'background-color', ['0', '128', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — handleColor fills the slider knob', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // handleColor default var(--cc-surface1-surface) — source: toggleswitchv2.js:130 (default :229)
        selectColourFromColourPicker('Handle color', ['255', '0', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(HANDLE, 'background-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — boxShadow renders on the widget wrapper', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // boxShadow default '0px 0px 0px 0px #00000090' — source: toggleswitchv2.js:148 (default :231)
        // Open the box-shadow popover before the X/Y/Blur/Spread inputs exist.
        cy.get(commonWidgetSelector.stylePicker('Box shadow')).click();
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, [2, 4, 6, 0]); // dynamic: test shadow params
        // Alpha < 100 on purpose: alpha 100 collapses to `rgb(...)` in the
        // computed style whereas verifyBoxShadowCss builds an `rgba(...)` string.
        selectColourFromColourPicker('Box shadow Color', ['255', '0', '0', '90'], 0); // dynamic: test color
        // boxShadow is written inline on the INNER flex wrapper (ToggleV2.jsx:256)
        verifyBoxShadowCss(INNER, [255, 0, 0, 90], [2, 4, 6, 0], 'element'); // dynamic: test shadow params
    });

    it('switch accordian — padding (switch) toggles the widget box padding', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // padding default 'default' → BOX_PADDING (2px) on the widget box
        // (RenderWidget.jsx:320, appCanvasConstants.js:57)
        // source: toggleswitchv2.js:154 (default :232)
        cy.get(commonWidgetSelector.draggableWidget(W)).should('have.css', 'padding-top', '2px');

        // 'None' → 0px — source: toggleswitchv2.js:164
        verifyAndModifySwitch('Padding', 'None');
        cy.get(commonWidgetSelector.draggableWidget(W)).should('have.css', 'padding-top', '0px');

        // back to 'Default' — source: toggleswitchv2.js:163
        verifyAndModifySwitch('Padding', 'Default');
        cy.get(commonWidgetSelector.draggableWidget(W)).should('have.css', 'padding-top', '2px');
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
