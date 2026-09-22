import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyStylePickerFx,
    verifyAndModifySwitch,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Checkbox — stylesFx facet', { testIsolation: false }, () => {
    const W = 'checkbox1'; // runtimeCandidate from checkbox-surface.yaml

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-StylesFx-App`);
        cy.openApp();
        cy.dragAndDropWidget('Checkbox', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── label accordion group ──────────────────────────────────────────────────
    it('label group — textColor fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);

        // textColor (colorSwatches) fx default var(--cc-primary-text) → exercise fx code input
        // source: checkbox.js:97 (default checkbox.js:227)
        verifyAndModifyStylePickerFx(
            'Text color',
            'Text/Primary', // swatch shows the design-token name (source: checkbox.js:227)
            '#111111', // fx test literal (CodeMirror echoes verbatim)
            0,
            '',
            false,
            '#1B1F24' // fx editor shows the RESOLVED hex of var(--cc-primary-text) (probe)
        );
    });

    it('label group — alignment (switch, fxCapable:true) — switch UI, fx-not-applicable', () => {
        // Alignment is a switch config; the styles switch UI has no stylePickerFx
        // code-editor path (verifyAndModifyStylePickerFx targets stylePicker/
        // parameterFxButton rows for color/boxShadow only). Exercise the switch
        // option selection instead; fx-not-applicable for this switch surface.
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);

        // alignment default 'right'; select 'Left' option
        // source: checkbox.js:144 (default 'right' checkbox.js:232)
        verifyAndModifySwitch('Alignment', 'Left'); // source: checkbox.js:144
    });

    // ── switch accordion group ──────────────────────────────────────────────────
    it('switch group — borderColor fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // borderColor (colorSwatches) fx default var(--cc-default-border)
        // source: checkbox.js:105 (default checkbox.js:230)
        verifyAndModifyStylePickerFx(
            'Border color',
            'Border/Default', // swatch token name (source: checkbox.js:230)
            '#222222', // fx test literal
            0,
            '',
            false,
            '#CCD1D5' // resolved hex of var(--cc-default-border) (probe)
        );
    });

    it('switch group — checkboxColor (Checked color) fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // checkboxColor (colorSwatches) fx default var(--cc-primary-brand)
        // source: checkbox.js:113 (default checkbox.js:228)
        verifyAndModifyStylePickerFx(
            'Checked color',
            'Brand/Primary', // swatch token name (source: checkbox.js:228)
            '#333333', // fx test literal
            0,
            '',
            false,
            '#4368E3' // resolved hex of var(--cc-primary-brand) (probe)
        );
    });

    it('switch group — uncheckedColor (Unchecked color) fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // uncheckedColor (colorSwatches) fx default var(--cc-surface1-surface)
        // source: checkbox.js:121 (default checkbox.js:229)
        verifyAndModifyStylePickerFx(
            'Unchecked color',
            'Surface/Surface1', // swatch token name (source: checkbox.js:229)
            '#444444', // fx test literal
            0,
            '',
            false,
            '#FFFFFF' // resolved hex of var(--cc-surface1-surface) (probe)
        );
    });

    it('switch group — handleColor (Handle color) fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // handleColor (colorSwatches) fx default var(--cc-surface1-surface)
        // source: checkbox.js:129 (default checkbox.js:231)
        // NOTE: rendered css prop is an SVG stroke attr (surface-cache caveat);
        // this FX facet exercises the fx INPUT path, not the rendered color.
        verifyAndModifyStylePickerFx(
            'Handle color',
            'Surface/Surface1', // swatch token name (source: checkbox.js:231)
            '#555555', // fx test literal
            0,
            '',
            false,
            '#FFFFFF' // resolved hex of var(--cc-surface1-surface) (probe)
        );
    });

    it('switch group — boxShadow fx-code path (boxShadow, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // boxShadow fx default 0px 0px 0px 0px #00000090
        // source: checkbox.js:137 (default checkbox.js:233)
        // boxShadow prefix param carries the "0px 0px 0px 0px " leading segment.
        verifyAndModifyStylePickerFx(
            'Box shadow',
            '#00000090', // source: checkbox.js:233 (trailing color; prefix passed separately)
            '2px 4px 6px 0px #ff0000', // dynamic: fake fx value (# required before hex)
            0,
            '0px 0px 0px 0px ' // source: checkbox.js:233 (leading offset segment)
        );
    });

    // ── NEGATIVE case — padding (switch, fxCapable:false) ───────────────────────
    it('switch group — padding has NO fx toggle (fxCapable:false negative case)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // padding fxCapable:false → its style row must not expose an fx button
        // source: checkbox.js:154 (fxCapable:false)
        cy.get(commonWidgetSelector.parameterLabel('Padding')).should('exist');
        cy.get(commonWidgetSelector.parameterFxButton('Padding')).should('not.exist'); // source: checkbox.js:154
    });
});
