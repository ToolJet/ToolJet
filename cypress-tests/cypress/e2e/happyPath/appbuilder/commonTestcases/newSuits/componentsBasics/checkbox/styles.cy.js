import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    openAccordion,
    selectColourFromColourPicker,
    verifyWidgetColorCss,
    verifyAndModifySwitch,
    fillBoxShadowParams,
    verifyBoxShadowCss,
} from "Support/utils/commonWidget";

// The visual checkbox box (Checkbox.jsx:296-309) carries border + background
// colors; it's an anonymous div — the only [data-cy=checkbox1] child holding the
// hidden .form-check-input. :has() pins it (probe: resolves to exactly 1).
const BOX = '[data-cy="checkbox1"] > div:has(.form-check-input)';

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Checkbox — styles facet', { testIsolation: false }, () => {
    const W = 'checkbox1'; // runtimeCandidate from checkbox-surface.yaml

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-Styles-App`);
        cy.openApp();
        cy.dragAndDropWidget('Checkbox', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── Label accordion ────────────────────────────────────────────────────────
    // Styles under accordian=label: textColor (colorSwatches), alignment (switch)
    it('label accordian — textColor (colorSwatches) + alignment (switch)', () => {
        openEditorSidebar(W);
        // Open the Styles inspector tab (#inspector .nav-link:eq(1))
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label');

        // textColor (colorSwatches) default var(--cc-primary-text)
        // source: checkbox.js:97 / source_default: checkbox.js:227
        selectColourFromColourPicker('Text color', ['255', '0', '0', '100']); // dynamic: test color
        // RESOLVED-LIVE: textColor → `color` set on the .form-check-label wrapper
        // (Checkbox.jsx:256); the inner <label> inherits it. Assert computed color
        // on the label (no inline color there → verifyWidgetColorCss falls back to
        // the inherited computed value).
        verifyWidgetColorCss('[data-cy="checkbox1"] label', 'color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    // ── Switch accordion ───────────────────────────────────────────────────────
    // Styles under accordian=switch: borderColor, checkboxColor, uncheckedColor,
    // handleColor (colorSwatches), boxShadow (boxShadow), padding (switch)
    it('switch accordian — borderColor (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // borderColor (colorSwatches) default var(--cc-default-border)
        // source: checkbox.js:105 / source_default: checkbox.js:230
        selectColourFromColourPicker('Border color', ['255', '0', '0', '100']); // dynamic: test color
        // RESOLVED-LIVE: borderColor → box `border-color` (Checkbox.jsx:300/308);
        // inline value is rgb (probe-confirmed).
        verifyWidgetColorCss(BOX, 'border-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — checkboxColor / checked color (colorSwatches)', () => {
        openEditorSidebar(W);
        // checkboxColor is the box background ONLY when checked (Checkbox.jsx:301)
        // — flip Default state On (Properties tab) before styling.
        verifyAndModifySwitch('Default state', 'On'); // source: checkbox.js:22
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // checkboxColor (colorSwatches) default var(--cc-primary-brand)
        // source: checkbox.js:113 / source_default: checkbox.js:228
        selectColourFromColourPicker('Checked color', ['255', '0', '0', '100']); // dynamic: test color
        // RESOLVED-LIVE: checkboxColor → box `background-color` when checked.
        verifyWidgetColorCss(BOX, 'background-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — uncheckedColor (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // uncheckedColor (colorSwatches) default var(--cc-surface1-surface)
        // source: checkbox.js:121 / source_default: checkbox.js:229
        selectColourFromColourPicker('Unchecked color', ['255', '0', '0', '100']); // dynamic: test color
        // RESOLVED-LIVE: uncheckedColor → box `background-color` when unchecked
        // (default state; Checkbox.jsx:301).
        verifyWidgetColorCss(BOX, 'background-color', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — handleColor (colorSwatches)', () => {
        openEditorSidebar(W);
        // handleColor is the checkmark SVG stroke, rendered ONLY when checked
        // (Checkbox.jsx:232-240) — flip Default state On first.
        verifyAndModifySwitch('Default state', 'On'); // source: checkbox.js:22
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // handleColor (colorSwatches) default var(--cc-surface1-surface)
        // source: checkbox.js:129 / source_default: checkbox.js:231
        selectColourFromColourPicker('Handle color', ['255', '0', '0', '100']); // dynamic: test color
        // RESOLVED-LIVE: handleColor → checkmark svg `stroke` (set as attribute;
        // verifyWidgetColorCss falls back to computed stroke).
        verifyWidgetColorCss('[data-cy="checkbox1"] svg', 'stroke', ['255', '0', '0', '100'], true); // dynamic: test color
    });

    it('switch accordian — boxShadow (boxShadow)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // boxShadow (boxShadow) default 0px 0px 0px 0px #00000090
        // source: checkbox.js:137 / source_default: checkbox.js:233
        // Open the box-shadow picker popover before the X/Y/Blur/Spread inputs
        // exist (mirrors verifyStylesGeneralAccordion). Param labels are the
        // lowercase constants boxShadowDefaultParam=["x","y","blur","spread"].
        cy.get(commonWidgetSelector.stylePicker('Box shadow')).click();
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, [2, 4, 6, 0]); // dynamic: test shadow params
        // Set an explicit shadow colour so the assertion is deterministic. Alpha
        // is <100 on purpose: a 100 alpha collapses to `rgb(...)` in the computed
        // style, whereas verifyBoxShadowCss builds an `rgba(...)` string.
        selectColourFromColourPicker('Box shadow Color', ['255', '0', '0', '90'], 0); // dynamic: test color
        // RESOLVED-LIVE (DOM probe): the box-shadow renders on the inner
        // `div.flex-row` (data-cy="checkbox1"), NOT the widget root
        // (draggable-widget-checkbox1). Pass it as a raw selector, type="element".
        verifyBoxShadowCss('[data-cy="checkbox1"].flex-row', [255, 0, 0, 90], [2, 4, 6, 0], 'element'); // dynamic: test shadow params
    });

    it('switch accordian — padding (switch)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch');

        // padding (switch) default default — type=switch, no helper in type-helper-index
        /* RESOLVE-LIVE: no helper for type=switch */
        // source: checkbox.js:154 / source_default: checkbox.js:234 — default: default
        // When resolved: interact with the padding switch (Default | None) and
        // scrollIntoView the widget before asserting the padding CSS changes.
        cy.get(commonWidgetSelector.draggableWidget(W)).scrollIntoView();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
