import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyStylePickerFx,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// stylesFx facet — the fx (dynamic-binding) path for every fx-capable style,
// plus the NEGATIVE case for `padding` (isFxNotRequired:true).
//
// The `defaultValue` arg is the swatch's DESIGN-TOKEN label — ColorSwatches.jsx
// :36-46 builds it as `${category}/${type}` from `var(--cc-${type}-${category})`.
// The `fxDefaultValue` arg is the hex the fx editor shows once the token is
// resolved (light theme values, AppBuilder/_stores/utils.js:681-766).
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Toggle Switch — stylesFx facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'
    const INNER = `[data-cy="${W}"]`; // ToggleV2.jsx:264 (data-cy) / :253 (alignment class)

    // switch-type styles expose an fx button too — renderFx() only bails for
    // paramType 'query', paramLabel 'Type', or a defined isFxNotRequired
    // (SingleLineCodeEditor.jsx:698-700) — but they have no toggle/stylePicker
    // row to hover, so the fx control stays CSS-hidden until the label is hovered.
    // SELF-TUNE CANDIDATE: belongs in a shared verifyAndModifySwitchFx helper.
    const openSwitchFx = (paramName) => {
        cy.get(commonWidgetSelector.parameterLabel(paramName)).scrollIntoView().realHover();
        cy.get(commonWidgetSelector.parameterFxButton(paramName)).click({ force: true });
    };

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-StylesFx-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── label accordion group ─────────────────────────────────────────────────
    it('label group — textColor fx-code path', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);

        // textColor fx default var(--cc-primary-text) — source: toggleswitchv2.js:98 (default :225)
        verifyAndModifyStylePickerFx(
            'Text color',
            'Text/Primary', // swatch design-token label (source: toggleswitchv2.js:225)
            '#111111', // dynamic: fx test literal (CodeMirror echoes verbatim)
            0,
            '',
            false,
            '#1B1F24' // source: AppBuilder/_stores/utils.js:703 — resolved hex of var(--cc-primary-text)
        );
    });

    // ── switch accordion group ────────────────────────────────────────────────
    it('switch group — borderColor fx-code path', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // borderColor fx default var(--cc-default-border) — source: toggleswitchv2.js:106 (default :228)
        verifyAndModifyStylePickerFx(
            'Border color',
            'Border/Default', // source: toggleswitchv2.js:228
            '#222222', // dynamic: fx test literal
            0,
            '',
            false,
            '#CCD1D5' // source: AppBuilder/_stores/utils.js:720 — resolved hex of var(--cc-default-border)
        );
    });

    it('switch group — toggleSwitchColor (Checked color) fx-code path', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // toggleSwitchColor fx default var(--cc-primary-brand) — source: toggleswitchv2.js:114 (default :226)
        verifyAndModifyStylePickerFx(
            'Checked color',
            'Brand/Primary', // source: toggleswitchv2.js:226
            '#333333', // dynamic: fx test literal
            0,
            '',
            false,
            '#4368E3' // source: AppBuilder/_stores/utils.js:686 — resolved hex of var(--cc-primary-brand)
        );
    });

    it('switch group — uncheckedColor fx-code path', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // uncheckedColor fx default var(--cc-surface3-surface) — source: toggleswitchv2.js:122 (default :227)
        verifyAndModifyStylePickerFx(
            'Unchecked color',
            'Surface/Surface3', // source: toggleswitchv2.js:227
            '#444444', // dynamic: fx test literal
            0,
            '',
            false,
            '#E4E7EB' // source: AppBuilder/_stores/utils.js:760 — resolved hex of var(--cc-surface3-surface)
        );
    });

    it('switch group — handleColor fx-code path', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // handleColor fx default var(--cc-surface1-surface) — source: toggleswitchv2.js:130 (default :229)
        verifyAndModifyStylePickerFx(
            'Handle color',
            'Surface/Surface1', // source: toggleswitchv2.js:229
            '#555555', // dynamic: fx test literal
            0,
            '',
            false,
            '#FFFFFF' // source: AppBuilder/_stores/utils.js:752 — resolved hex of var(--cc-surface1-surface)
        );
    });

    it('switch group — boxShadow fx-code path', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // boxShadow fx default '0px 0px 0px 0px #00000090' — source: toggleswitchv2.js:148 (default :231)
        // The leading offset segment is passed separately as the boxShadow prefix.
        verifyAndModifyStylePickerFx(
            'Box shadow',
            '#00000090', // trailing colour — source: toggleswitchv2.js:231
            '2px 4px 6px 0px #ff0000', // dynamic: test fx value (# required before hex)
            0,
            '0px 0px 0px 0px ' // leading offset segment — source: toggleswitchv2.js:231
        );
    });

    // ── fx-capable SWITCH style (alignment) ───────────────────────────────────
    it('label group — alignment fx: a {{ }} binding flips the flex direction', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('label', []);

        // alignment is type 'switch' with no isFxNotRequired, so it renders an fx
        // button (SingleLineCodeEditor.jsx:698-700).
        // source: toggleswitchv2.js:138 (default 'right', toggleswitchv2.js:230)
        cy.get(INNER).should('have.class', 'flex-row-reverse'); // source: ToggleV2.jsx:253

        openSwitchFx('Alignment');
        // The fx editor's default text for a plain-string style value is NOT
        // runtime-confirmed for this field, so assert the fx EFFECT rather than
        // guess the echoed default.
        cy.get(commonWidgetSelector.parameterInputField('Alignment'))
            .clearAndTypeOnCodeMirror("{{'left'}}"); // source: toggleswitchv2.js:143
        // CodeMirror commits on BLUR — without this the editor keeps focus and the
        // store never sees the typed value (runtime-confirmed).
        cy.forceClickOnCanvas();
        cy.get(INNER).should('have.class', 'flex-row').and('not.have.class', 'flex-row-reverse'); // source: ToggleV2.jsx:253
    });

    // ── NEGATIVE — padding carries isFxNotRequired:true ───────────────────────
    it('switch group — padding has NO fx toggle (isFxNotRequired negative case)', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion('switch', []);

        // the control renders...
        cy.get(commonWidgetSelector.parameterLabel('Padding')).should('exist');
        // ...but exposes no fx button — source: toggleswitchv2.js:161 (isFxNotRequired: true)
        cy.get(commonWidgetSelector.parameterFxButton('Padding')).should('not.exist');
    });
});
