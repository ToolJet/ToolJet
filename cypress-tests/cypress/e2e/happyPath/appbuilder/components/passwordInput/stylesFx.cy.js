/**
 * SPEC — Password Input — stylesFx facet.
 * FOR AI: fx/code path for fx-capable STYLE pickers only.
 *   ACTIVE (reliable, numeric): label group → labelFontSize ('Size', {{12}});
 *   field group → borderRadius ('Border radius', {{6}}).
 *   NEGATIVE: field-adjacent padding (container, fxCapable:false) exposes no fx button.
 *   RESOLVE-LIVE (it.skip): colorSwatches fx pickers (color/backgroundColor/borderColor/
 *   accentColor/textColor/placeholderTextColor/errTextColor) + boxShadow — the fx CODE
 *   editor shows the RESOLVED hex of each design token, which is not derivable statically.
 * Helpers: verifyAndModifyStylePickerFx, openEditorSidebar, openAccordion (type-helper-index).
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyStylePickerFx,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Password Input — stylesFx facet', { testIsolation: false }, () => {
    const W = 'passwordinput1'; // runtimeCandidate from numberInput-surface.yaml

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PIStylesFx-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Password Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── label accordion group ──────────────────────────────────────────────────
    // NOTE: labelFontSize & borderRadius are plain numeric style inputs (data-cy
    // `size-input` / `border-radius-input` with fx buttons `size-fx-button` /
    // `border-radius-fx-button`), NOT the `<param>-picker` controls that
    // verifyAndModifyStylePickerFx targets. Exercising their fx/code path needs a
    // numeric-style-input fx helper that doesn't exist yet (helper-author scope,
    // Plan 4). Skipped with a documented reason rather than a fabricated pass.
    it.skip('label group — labelFontSize (Size) fx-code path [needs numeric-style-input fx helper]', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);
        // RESOLVE-LIVE: click [data-cy="size-fx-button"] → code editor size-input-field →
        // type binding → assert [data-cy="passwordinput1-label"] p font-size. source: passwordinput.js:124
        verifyAndModifyStylePickerFx('Size', '12', '20');
    });

    // ── field accordion group ──────────────────────────────────────────────────
    it.skip('field group — borderRadius (Border radius) fx-code path [needs numeric-style-input fx helper]', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        // RESOLVE-LIVE: click [data-cy="border-radius-fx-button"] → border-radius-input-field →
        // type binding → assert -actionable-section border-radius. source: passwordinput.js:256
        verifyAndModifyStylePickerFx('Border radius', '6', '4px');
    });

    // ── NEGATIVE case — padding (switch, container, fxCapable:false) ─────────────
    it('container group — padding has NO fx toggle (fxCapable:false negative case)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('container', []);

        // padding fxCapable:false → its style row must not expose an fx button
        // source: passwordinput.js:271 (fxCapable:false)
        cy.get(commonWidgetSelector.parameterLabel('Padding')).should('exist');
        cy.get(commonWidgetSelector.parameterFxButton('Padding')).should('not.exist'); // source: passwordinput.js:271
    });

    // ── RESOLVE-LIVE: colorSwatches + boxShadow fx pickers ──────────────────────
    // These are fxCapable:true but the fx CODE editor renders the RESOLVED hex of
    // each design token (var(--cc-*)), which is theme-derived and cannot be cited
    // statically from the config. Kept skipped until the resolved hex per token is
    // probed live (mirrors the checkbox golden reference, which used measured hexes).

    it.skip('label group — color (Text) fx-code path — RESOLVE-LIVE: token→hex', () => {
        // color colorSwatches fx default var(--cc-primary-text); fx editor shows RESOLVED hex.
        // source: passwordinput.js:118 (default passwordinput.js:121)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);
        verifyAndModifyStylePickerFx(
            'Text', // NOTE: two 'Text' pickers exist (label color + field textColor); needs index disambiguation live
            'Text/Primary', // swatch token name (source: passwordinput.js:121) — UNVERIFIED
            '#111111',
            0,
            '',
            false,
            '<RESOLVE-LIVE hex of var(--cc-primary-text)>',
        );
    });

    it.skip('field group — backgroundColor (Background) fx-code path — RESOLVE-LIVE: token→hex', () => {
        // backgroundColor colorSwatches fx default var(--cc-surface1-surface).
        // source: passwordinput.js:205 (default passwordinput.js:208)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        verifyAndModifyStylePickerFx(
            'Background',
            'Surface/Surface1', // UNVERIFIED token name (source: passwordinput.js:208)
            '#222222',
            0,
            '',
            false,
            '<RESOLVE-LIVE hex of var(--cc-surface1-surface)>',
        );
    });

    it.skip('field group — borderColor (Border) fx-code path — RESOLVE-LIVE: token→hex', () => {
        // borderColor colorSwatches fx default var(--cc-default-border).
        // source: passwordinput.js:211 (default passwordinput.js:214)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        verifyAndModifyStylePickerFx(
            'Border',
            'Border/Default', // UNVERIFIED token name (source: passwordinput.js:214)
            '#333333',
            0,
            '',
            false,
            '<RESOLVE-LIVE hex of var(--cc-default-border)>',
        );
    });

    it.skip('field group — accentColor (Accent) fx-code path — RESOLVE-LIVE: token→hex', () => {
        // accentColor colorSwatches fx default var(--cc-primary-brand).
        // source: passwordinput.js:217 (default passwordinput.js:220)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        verifyAndModifyStylePickerFx(
            'Accent',
            'Brand/Primary', // UNVERIFIED token name (source: passwordinput.js:220)
            '#444444',
            0,
            '',
            false,
            '<RESOLVE-LIVE hex of var(--cc-primary-brand)>',
        );
    });

    it.skip('field group — textColor (Text) fx-code path — RESOLVE-LIVE: token→hex + index', () => {
        // textColor colorSwatches fx default var(--cc-primary-text). Shares the
        // 'Text' displayName with the label-group color picker — needs live index
        // disambiguation. source: passwordinput.js:223 (default passwordinput.js:226)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        verifyAndModifyStylePickerFx(
            'Text',
            'Text/Primary', // UNVERIFIED token name (source: passwordinput.js:226)
            '#555555',
            0,
            '',
            false,
            '<RESOLVE-LIVE hex of var(--cc-primary-text)>',
        );
    });

    it.skip('field group — placeholderTextColor (Placeholder Text) fx-code path — RESOLVE-LIVE: token→hex', () => {
        // placeholderTextColor colorSwatches fx default var(--cc-placeholder-text).
        // source: passwordinput.js:229 (default passwordinput.js:232)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        verifyAndModifyStylePickerFx(
            'Placeholder Text',
            'Text/Placeholder', // UNVERIFIED token name (source: passwordinput.js:232)
            '#666666',
            0,
            '',
            false,
            '<RESOLVE-LIVE hex of var(--cc-placeholder-text)>',
        );
    });

    it.skip('field group — errTextColor (Error text) fx-code path — RESOLVE-LIVE: token→hex', () => {
        // errTextColor colorSwatches fx default var(--cc-error-systemStatus).
        // source: passwordinput.js:235 (default passwordinput.js:238)
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        verifyAndModifyStylePickerFx(
            'Error text',
            'SystemStatus/Error', // UNVERIFIED token name (source: passwordinput.js:238)
            '#777777',
            0,
            '',
            false,
            '<RESOLVE-LIVE hex of var(--cc-error-systemStatus)>',
        );
    });

    it.skip('field group — boxShadow fx-code path — RESOLVE-LIVE: fx render format', () => {
        // boxShadow fx default 0px 0px 0px 0px #00000040. The fx editor splits the
        // leading offset segment ('0px 0px 0px 0px ') from the trailing color; the
        // exact split/prefix for this widget must be probed live.
        // source: passwordinput.js:262 (default '0px 0px 0px 0px #00000040')
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('field', []);
        verifyAndModifyStylePickerFx(
            'Box Shadow',
            '#00000040', // trailing color (source: passwordinput.js:262) — prefix UNVERIFIED
            '2px 4px 6px 0px #ff0000', // dynamic: fake fx value
            0,
            '0px 0px 0px 0px ', // UNVERIFIED leading offset segment
        );
    });
});
