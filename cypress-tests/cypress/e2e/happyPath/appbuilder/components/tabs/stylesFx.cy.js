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
describe('Tabs — stylesFx facet', { testIsolation: false, retries: 1 }, () => {
    const W = 'tabs1'; // runtimeCandidate

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-StylesFx-App`);
        cy.openApp();
        cy.realDragRewarm();
        cy.wait(500);
        cy.dragAndDropWidget('Tabs', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── Tabs accordion — colorSwatches with CSS-var defaults ─────────────────
    // For CSS-var defaults the swatch shows a design-token name (e.g. 'Surface/Surface1'),
    // not the raw CSS variable string. The token name must be confirmed by live inspection;
    // each such case is marked RESOLVE-LIVE below.

    it('Tabs accordian — headerBackground fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // headerBackground (colorSwatches, fxCapable:true) default var(--cc-surface1-surface)
        // source: tabs.js:162
        // RESOLVE-LIVE: swatch label for headerBackground — token name not confirmed;
        // expected to be 'Surface/Surface1' (same token as checkbox uncheckedColor).
        verifyAndModifyStylePickerFx(
            'Header background',
            'Surface/Surface1', // RESOLVE-LIVE: swatch label (design-token name) — confirm at runtime; source: tabs.js:167
            '#111111',          // fx test literal (CodeMirror echoes verbatim)
            0,
            '',
            false,
            '#FFFFFF'           // RESOLVE-LIVE: resolved hex of var(--cc-surface1-surface) — confirm at runtime
        );
    });

    it('Tabs accordian — divider fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // divider (colorSwatches, fxCapable:true) default var(--cc-default-border)
        // source: tabs.js:171
        // RESOLVE-LIVE: swatch label for divider — token name not confirmed;
        // expected to be 'Border/Default'.
        verifyAndModifyStylePickerFx(
            'Divider',
            'Border/Default', // RESOLVE-LIVE: swatch label (design-token name) — confirm at runtime; source: tabs.js:176
            '#222222',        // fx test literal
            0,
            '',
            false,
            '#CCD1D5'         // RESOLVE-LIVE: resolved hex of var(--cc-default-border) — confirm at runtime
        );
    });

    // ── Tabs accordion — colorSwatches with raw hex defaults ─────────────────
    // For raw hex defaults the swatch shows the hex value directly; no token name involved.

    it('Tabs accordian — unselectedText fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // unselectedText (colorSwatches) definition value: var(--cc-placeholder-text)
        // source: tabs.js definition:462. The validation.defaultValue '#375FCF' is the
        // schema fallback but the runtime value is the CSS var, which resolves to
        // #6A727C (light mode: text.placeholder.light from utils.js:707) and maps to
        // token name 'Text/Placeholder' in the colorMap.
        verifyAndModifyStylePickerFx(
            'Unselected text',
            'Text/Placeholder', // swatch token name — var(--cc-placeholder-text) colorMap label
            '#333333',          // fx test literal
            0,
            '',
            false,
            '#6A727C'           // resolved hex: text.placeholder.light (utils.js:707)
        );
    });

    it('Tabs accordian — selectedText fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // selectedText (colorSwatches, fxCapable:true) default var(--cc-primary-text)
        // source: tabs.js:189
        // RESOLVE-LIVE: swatch label for selectedText — token name not confirmed;
        // expected to be 'Text/Primary'.
        verifyAndModifyStylePickerFx(
            'Selected text',
            'Text/Primary', // RESOLVE-LIVE: swatch label (design-token name) — confirm at runtime; source: tabs.js:194
            '#444444',      // fx test literal
            0,
            '',
            false,
            '#1B1F24'       // RESOLVE-LIVE: resolved hex of var(--cc-primary-text) — confirm at runtime
        );
    });

    it('Tabs accordian — hoverBackground fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // hoverBackground (colorSwatches, fxCapable:true) default '#1B1F24'
        // source: tabs.js:198
        // Raw hex default; swatch shows the hex value directly (no token name).
        verifyAndModifyStylePickerFx(
            'Hover Background',
            '#1B1F24',  // source: tabs.js:203 (raw-hex default)
            '#555555',  // fx test literal
            0,
            '',
            false,
            '#1B1F24'   // fxDefaultValue matches defaultValue for raw-hex swatches
        );
    });

    it('Tabs accordian — unselectedIcon fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // unselectedIcon definition value: var(--cc-default-icon) — source: tabs.js:466.
        // --cc-default-icon is set to the same value as --cc-placeholder-text in useAppData.js:745
        // (placeholder/text color). Light mode: #6A727C. colorMap label: 'Icon/Default'.
        verifyAndModifyStylePickerFx(
            'Unselected Icon',
            'Icon/Default', // swatch token name — var(--cc-default-icon) colorMap label
            '#666666',      // fx test literal
            0,
            '',
            false,
            '#6A727C'       // resolved hex: same as --cc-placeholder-text (utils.js:707)
        );
    });

    it('Tabs accordian — selectedIcon fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // selectedIcon definition value: var(--cc-default-icon) — source: tabs.js:467.
        // Same CSS var and resolved color as unselectedIcon. colorMap label: 'Icon/Default'.
        verifyAndModifyStylePickerFx(
            'Selected Icon',
            'Icon/Default', // swatch token name — var(--cc-default-icon) colorMap label
            '#777777',      // fx test literal
            0,
            '',
            false,
            '#6A727C'       // resolved hex: same as --cc-placeholder-text (utils.js:707)
        );
    });

    it('Tabs accordian — accent fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // accent (colorSwatches, fxCapable:true) default var(--cc-primary-brand)
        // source: tabs.js:225
        // RESOLVE-LIVE: swatch label for accent — token name not confirmed;
        // expected to be 'Brand/Primary'.
        verifyAndModifyStylePickerFx(
            'Accent',
            'Brand/Primary', // RESOLVE-LIVE: swatch label (design-token name) — confirm at runtime; source: tabs.js:230
            '#888888',       // fx test literal
            0,
            '',
            false,
            '#4368E3'        // RESOLVE-LIVE: resolved hex of var(--cc-primary-brand) — confirm at runtime
        );
    });

    // ── NEGATIVE cases — Tabs accordion (fxCapable:false) ────────────────────

    it('Tabs accordian — tabWidth (select) has fx button (select controls render fx button)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // tabWidth (select) — source: tabs.js:243
        // fx buttons are present for ALL style controls unless isFxNotRequired:true is set.
        // select type does not carry isFxNotRequired in the config, so the fx button EXISTS.
        // (Same finding as the propertiesFx hideTabs/renderOnlyActiveTab cases.)
        cy.get(commonWidgetSelector.parameterLabel('Tab width')).should('exist');
        cy.get(commonWidgetSelector.parameterFxButton('Tab width')).should('exist'); // source: tabs.js:243
    });

    it('Tabs accordian — transition (select) has fx button (select controls render fx button)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Tabs');

        // transition (select) — source: tabs.js:252. Same as tabWidth: fx button exists.
        cy.get(commonWidgetSelector.parameterLabel('Transition')).should('exist');
        cy.get(commonWidgetSelector.parameterFxButton('Transition')).should('exist'); // source: tabs.js:252
    });

    // ── Container accordion — colorSwatches with CSS-var defaults ────────────

    it('Container accordian — commonBackgroundColor fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // commonBackgroundColor (colorSwatches, fxCapable:true) default var(--cc-surface1-surface)
        // source: tabs.js:261
        // RESOLVE-LIVE: swatch label for commonBackgroundColor — token name not confirmed;
        // expected to be 'Surface/Surface1'.
        verifyAndModifyStylePickerFx(
            'Common background color',
            'Surface/Surface1', // RESOLVE-LIVE: swatch label (design-token name) — confirm at runtime; source: tabs.js:266
            '#AABBCC',          // fx test literal
            0,
            '',
            false,
            '#FFFFFF'           // RESOLVE-LIVE: resolved hex of var(--cc-surface1-surface) — confirm at runtime
        );
    });

    it('Container accordian — border fx-code path (colorSwatches, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // border (colorSwatches, fxCapable:true) default var(--cc-weak-border)
        // source: tabs.js:270
        // RESOLVE-LIVE: swatch label for border — token name not confirmed;
        // expected to be 'Border/Weak'.
        verifyAndModifyStylePickerFx(
            'Border',
            'Border/Weak',  // swatch token name — confirmed at runtime
            '#DDDDDD',      // fx test literal
            0,
            '',
            false,
            '#E4E7EB'       // resolved hex: border.weak.light (utils.js:724) — confirmed at runtime
        );
    });

    // ── Container accordion — borderRadius (numberInput, fxCapable:true) ─────
    // borderRadius is a plain numeric style input rendered via a number-input widget,
    // NOT a `<param>-picker` control. Its fx button is `border-radius-fx-button`,
    // which verifyAndModifyStylePickerFx does not target. A dedicated numeric-style-input
    // fx helper does not exist yet (see type-helper-index.md); skip with a documented reason.

    it.skip('Container accordian — borderRadius (Border radius) fx-code path [needs numeric-style-input fx helper]', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // borderRadius (numberInput, fxCapable:true) — source: tabs.js:279
        // NOTE: dispatch prompt stated default as '{{6}}'; actual config default is `false`
        // (tabs.js:284 `defaultValue: false`). This is a config inconsistency — see findings.
        // RESOLVE-LIVE: click [data-cy="border-radius-fx-button"] → border-radius code input →
        // type binding → assert ROOT border-radius CSS prop.
        verifyAndModifyStylePickerFx('Border radius', '6', '4px'); // placeholder — RESOLVE-LIVE
    });

    // ── Container accordion — boxShadow (boxShadow, fxCapable:true) ──────────
    // CAVEAT: the boxShadow style has `conditionallyRender: { key: 'type', value: 'primary' }`
    // (tabs.js:292-296). This condition references a `type` key that does not appear in the
    // tabs styles config or properties config. The condition may be stale/unreachable, meaning
    // the boxShadow picker may always be visible. Confirm at runtime.

    it('Container accordian — boxShadow fx-code path (boxShadow, fxCapable:true)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // boxShadow (boxShadow, fxCapable:true) default "0px 0px 0px 0px #00000040"
        // source: tabs.js:288
        // CAVEAT: conditionallyRender key='type' value='primary' (tabs.js:292-296).
        // If the condition gates the control, this test will fail with "element not found".
        // In that case, mark as not_automatable until the condition is resolved.
        // The prefix param carries the leading "0px 0px 0px 0px " offset segment.
        verifyAndModifyStylePickerFx(
            'Box shadow',
            '#00000040',             // source: tabs.js:288 — trailing color portion of default value
            '2px 4px 6px 0px #ff0000', // fx test literal (CodeMirror echoes verbatim)
            0,
            '0px 0px 0px 0px '      // source: tabs.js:288 — leading offset segment of default value
        );
    });

    // ── NEGATIVE case — Container accordion (fxCapable:false) ────────────────

    it('Container accordian — padding (switch) has fx button (switch controls render fx button)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('Container');

        // padding (switch) — source: tabs.js:298
        // fx buttons are present for ALL style controls unless isFxNotRequired:true is set.
        // switch type does not carry isFxNotRequired in the config, so the fx button EXISTS.
        // (Same finding as tabWidth/transition select controls and propertiesFx hideTabs toggle.)
        cy.get(commonWidgetSelector.parameterLabel('Padding')).should('exist');
        cy.get(commonWidgetSelector.parameterFxButton('Padding')).should('exist'); // source: tabs.js:298
    });

    afterEach(() => {
        cy.waitForAutoSave();
        // Navigate away before deleting to prevent the editor's WebSocket
        // disconnect from triggering a reactive redirect that races with
        // the next beforeEach's openApp() navigation.
        cy.visit('/');
        cy.apiDeleteApp();
    });
});
