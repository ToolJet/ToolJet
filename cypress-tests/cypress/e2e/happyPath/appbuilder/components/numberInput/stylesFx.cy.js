/**
 * SPEC — Number Input — stylesFx facet.
 * FOR AI: fx/code path for every fx-capable STYLE picker.
 *   colorSwatches (color/backgroundColor/borderColor/accentColor/textColor/
 *   placeholderTextColor/errTextColor) + boxShadow → verifyAndModifyStylePickerFx,
 *   passing the RESOLVED hex of each design token (probed from the app theme bundle;
 *   4 cross-verified against the green checkbox stylesFx reference).
 *   Numeric pickers (labelFontSize 'Size', borderRadius 'Border radius') render a plain
 *   `<label>-input`, NOT a `<label>-picker`, so they use verifyAndModifyStyleNumberFx.
 *   The two 'Text' pickers (label color + field textColor) share a displayName — the
 *   sibling accordion is closed so only the target row is mounted.
 *   NEGATIVE: container padding (fxCapable:false) exposes no fx button.
 * Token→hex (light theme, source: frontend token bundle text.colors/border.colors/
 *   systemStatus.colors/surface.colors/brand.colors):
 *   --cc-primary-text #1B1F24 · --cc-surface1-surface #FFFFFF · --cc-default-border #CCD1D5
 *   --cc-primary-brand #4368E3 · --cc-placeholder-text #6A727C · --cc-error-systemStatus #D72D39
 * Helpers: verifyAndModifyStylePickerFx, verifyAndModifyStyleNumberFx, openEditorSidebar, openAccordion.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyStylePickerFx,
    verifyAndModifyStyleNumberFx,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Number Input — stylesFx facet', { testIsolation: false }, () => {
    const W = 'numberinput1'; // runtimeCandidate from numberInput-surface.yaml

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIStylesFx-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── label accordion group ──────────────────────────────────────────────────
    it('label group — labelFontSize (Size) fx-code path (numeric)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);
        // numeric style: [data-cy="size-input"] shows 12 → click size-fx-button → type binding.
        // source: numberinput.js:124 (default {{12}} numberinput.js:376)
        verifyAndModifyStyleNumberFx('Size', '12', '{{20}}');
    });

    it('label group — color (Text) fx-code path (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);
        // color colorSwatches fx default var(--cc-primary-text) → resolved hex #1B1F24.
        // Two 'Text' rows exist (label color + field textColor), both mounted; this is
        // the FIRST in DOM order (label group), so hasIndex=0.
        // source: numberinput.js:118 (default numberinput.js:378)
        verifyAndModifyStylePickerFx(
            'Text',
            'Text/Primary', // swatch design-token name (source: numberinput.js:121)
            '#111111', // fx test literal (CodeMirror echoes verbatim)
            0,
            '',
            0, // hasIndex: label-group 'Text' (color) is the 1st of the two 'Text' rows
            '#1B1F24' // resolved hex of var(--cc-primary-text) — verified live in the fx editor
        );
    });

    // ── field accordion group ──────────────────────────────────────────────────
    it('field group — borderRadius (Border radius) fx-code path (numeric)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // numeric style: [data-cy="border-radius-input"] shows 6 → click border-radius-fx-button.
        // source: numberinput.js:256 (default {{6}} numberinput.js:370)
        verifyAndModifyStyleNumberFx('Border radius', '6', '{{4}}');
    });

    it('field group — backgroundColor (Background) fx-code path (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // backgroundColor colorSwatches fx default var(--cc-surface1-surface) → #FFFFFF.
        // source: numberinput.js:205 (default numberinput.js:371)
        verifyAndModifyStylePickerFx(
            'Background',
            'Surface/Surface1', // source: numberinput.js:208
            '#222222',
            0,
            '',
            false,
            '#FFFFFF' // resolved hex of var(--cc-surface1-surface)
        );
    });

    it('field group — borderColor (Border) fx-code path (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // borderColor colorSwatches fx default var(--cc-default-border) → #CCD1D5.
        // source: numberinput.js:211 (default numberinput.js:372)
        verifyAndModifyStylePickerFx(
            'Border',
            'Border/Default', // source: numberinput.js:214
            '#333333',
            0,
            '',
            false,
            '#CCD1D5' // resolved hex of var(--cc-default-border)
        );
    });

    it('field group — accentColor (Accent) fx-code path (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // accentColor colorSwatches fx default var(--cc-primary-brand) → #4368E3.
        // source: numberinput.js:217 (default numberinput.js:373)
        verifyAndModifyStylePickerFx(
            'Accent',
            'Brand/Primary', // source: numberinput.js:220
            '#444444',
            0,
            '',
            false,
            '#4368E3' // resolved hex of var(--cc-primary-brand)
        );
    });

    it('field group — textColor (Text) fx-code path (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // textColor colorSwatches fx default var(--cc-primary-text) → #1B1F24.
        // Two 'Text' rows exist (label color + field textColor), both mounted; this is
        // the SECOND in DOM order (field group), so hasIndex=1.
        // source: numberinput.js:223 (default numberinput.js:375)
        verifyAndModifyStylePickerFx(
            'Text',
            'Text/Primary', // source: numberinput.js:226
            '#555555',
            0,
            '',
            1, // hasIndex: field-group 'Text' (textColor) is the 2nd of the two 'Text' rows
            '#1B1F24' // resolved hex of var(--cc-primary-text)
        );
    });

    it('field group — placeholderTextColor (Placeholder Text) fx-code path (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // placeholderTextColor colorSwatches fx default var(--cc-placeholder-text) → #6A727C.
        // source: numberinput.js:229 (default numberinput.js:377)
        verifyAndModifyStylePickerFx(
            'Placeholder Text',
            'Text/Placeholder', // source: numberinput.js:232
            '#666666',
            0,
            '',
            false,
            '#6A727C' // resolved hex of var(--cc-placeholder-text)
        );
    });

    it('field group — errTextColor (Error text) fx-code path (colorSwatches)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // errTextColor colorSwatches fx default var(--cc-error-systemStatus) → #D72D39.
        // source: numberinput.js:235 (default numberinput.js:374)
        verifyAndModifyStylePickerFx(
            'Error text',
            'SystemStatus/Error', // source: numberinput.js:238
            '#777777',
            0,
            '',
            false,
            '#D72D39' // resolved hex of var(--cc-error-systemStatus)
        );
    });

    it('field group — boxShadow fx-code path', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // boxShadow fx default '0px 0px 0px 0px #00000040'. The fx editor splits the leading
        // offset segment ('0px 0px 0px 0px ') from the trailing color '#00000040'.
        // source: numberinput.js:262 (default numberinput.js:385)
        verifyAndModifyStylePickerFx(
            'Box shadow',
            '#00000040', // trailing color (source: numberinput.js:267)
            '2px 4px 6px 0px #ff0000', // dynamic: fake fx value (# required before hex)
            0,
            '0px 0px 0px 0px ' // leading offset segment (source: numberinput.js:267)
        );
    });

    // ── NEGATIVE case — padding (switch, container, fxCapable:false) ─────────────
    it('container group — padding has NO fx toggle (fxCapable:false negative case)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('container', []);

        // padding fxCapable:false → its style row must not expose an fx button
        // source: numberinput.js:271 (isFxNotRequired numberinput.js:278)
        cy.get(commonWidgetSelector.parameterLabel('Padding')).should('exist');
        cy.get(commonWidgetSelector.parameterFxButton('Padding')).should('not.exist'); // source: numberinput.js:278
    });
});
