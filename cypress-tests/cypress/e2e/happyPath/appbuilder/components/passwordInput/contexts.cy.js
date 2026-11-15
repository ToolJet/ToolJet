/**
 * SPEC — Password Input — contexts facet.
 * FOR AI: 2 cases — device context — show on desktop / mobile toggles visibility; exposed-value context — value observable in the inspector….
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData.
 * TESTING.md browser scenario:
 *   PasswordInput-BRW-002 — an app saved before the input revamp (imported fixture, tooljet_version 3.15.1) keeps
 *   its value, label placement, validation rules, left icon and reveal toggle, in the editor and in preview.
 *   Helpers: importAppFixture, getLabelShare, expectLabelFieldSplit, expectRectInside, expectRectsDisjoint,
 *   resolveCssVarColor, expectComputedColor, openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verifyLayout, openEditorSidebar } from "Support/utils/commonWidget";
import { passwordInputSelector } from "Selectors/appBuilder/components/passwordInput";
import { baseInputStyleSelector } from "Selectors/appBuilder/components/emailInput";
import { passwordInputText } from "Texts/appBuilder/components/passwordInput";
import {
    expectComputedColor,
    resolveCssVarColor,
    getLabelShare,
    expectLabelFieldSplit,
    expectRectInside,
    expectRectsDisjoint,
    importAppFixture,
} from "Support/utils/appBuilder/components/baseInput";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";

// Contexts facet — the checkbox across device + data-binding contexts.
// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Password Input — contexts facet', { testIsolation: false }, () => {
    const W = 'passwordinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PasswordInput-Contexts`);
        cy.openApp();
        cy.dragAndDropWidget('Password Input', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Device-visibility context matrix: Show on Desktop / Show on Mobile.
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // Exposed-value context: components.passwordinput1.value is observable in the
    // app's component tree (default state Off → false). Uses the same
    // inspector-tree navigation proven green in inspector.cy.js.
    it('exposed-value context — value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click(); // open the left inspector
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('passwordinput1', [
            { key: 'value', type: 'String', value: '""' }, // default '' (empty string)
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});

// ── PasswordInput-BRW-002 ────────────────────────────────────────────────────
// Fixture = a Password Input export in its pre-revamp shape: no widthType (814feab911), no labelFontSize /
// placeholderTextColor / legacyInputSize, colour sentinels #1B1F24/#CCD1D5/#fff/#D72D39 (pre-9b78959b68),
// tooljet_version 3.15.1. Import backfills widthType: 'ofField' — the path a saved app takes.
describe('Password Input — saved pre-revamp app', { testIsolation: false }, () => {
    const W = passwordInputText.defaultWidgetName;
    const T = passwordInputText;
    const SEL = passwordInputSelector;

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // Rule order in componentsSlice.js validateWidget is regex → minLength → maxLength → … → mandatory,
    // so the saved minLength reports for an empty field before the mandatory message would.
    const expectLegacyValidation = () => {
        cy.get(SEL.input(W)).clear().blur();
        cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMinLength(T.legacy.minLength));
        cy.get(SEL.input(W)).should('have.attr', 'aria-invalid', 'true');
        cy.get(SEL.input(W)).type('Ab1!').blur(); // dynamic: 4 chars < minLength
        cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMinLength(T.legacy.minLength));
        cy.get(SEL.input(W)).clear().type('Ab1!Ab1!Ab1!Ab1!Ab1!').blur(); // dynamic: 20 chars > maxLength
        cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMaxLength(T.legacy.maxLength));
        cy.get(SEL.input(W)).clear().type(T.legacy.value).blur();
        // once revealed the feedback node stays mounted, empty, while the value is valid
        cy.get(SEL.invalidFeedback(W)).should(($el) => expect($el.text()).to.eq(''));
        cy.get(SEL.input(W)).should('have.attr', 'aria-invalid', 'false');
    };

    const expectLegacyPreserved = (context) => {
        cy.log(`legacy — ${context}`);
        // value stays masked. source: passwordInputPreRevamp.json:65
        cy.get(SEL.input(W)).should('have.value', T.legacy.value).and('have.attr', 'type', 'password');
        // label + mandatory marker. source: passwordInputPreRevamp.json:68 / :148
        cy.get(SEL.label(W)).should('contain.text', T.legacy.label).and('contain.text', '*');
        // label placement: side, saved width {{40}} → 40 × 0.7 = 28 % of the widget, capped at 70 %
        // (pre-revamp Label.jsx used (width/100)*70). source: passwordInputPreRevamp.json:113 / :116
        cy.get(SEL.label(W))
            .should('have.attr', 'style')
            .and('include', `width: ${T.legacy.width * 0.7}%`)
            .and('include', 'max-width: 70%');
        getLabelShare(W).then((share) => {
            expect(share, 'legacy label share').to.be.gt(0).and.lt(T.legacy.width / 100);
            expectLabelFieldSplit(W, share, null);
        });
        // saved left icon kept + the reveal toggle still inside the field. source: passwordInputPreRevamp.json:131
        cy.get(SEL.icon(W)).find(T.iconLockPath).should('exist');
        expectRectInside(SEL.revealToggle(W), SEL.field(W));
        expectRectsDisjoint(SEL.revealToggle(W), SEL.label(W));
        cy.get(SEL.revealToggle(W)).click();
        cy.get(SEL.input(W)).should('have.attr', 'type', 'text').and('have.value', T.legacy.value);
        cy.get(SEL.revealToggle(W)).click();
        cy.get(SEL.input(W)).should('have.attr', 'type', 'password');
        // colour sentinels still fall back to theme tokens (BaseInput.jsx:102-111, 221-243).
        // source: passwordInputPreRevamp.json:89 / :92 / :104
        // the real pointer can rest over the field, and the container's hover rule repaints the border
        cy.get('body').realHover({ position: 'topLeft' });
        resolveCssVarColor('--surfaces-surface-01', SEL.field(W)).then((rgb) =>
            expectComputedColor(SEL.field(W), 'background-color', rgb));
        resolveCssVarColor('--borders-default', SEL.field(W)).then((rgb) =>
            expectComputedColor(SEL.field(W), 'border-top-color', rgb));
        resolveCssVarColor('--text-primary', SEL.field(W)).then((rgb) =>
            expectComputedColor(SEL.input(W), 'color', rgb));
        // saved validation rules: mandatory + minLength {{10}} + maxLength {{16}}.
        // source: passwordInputPreRevamp.json:148 / :154 / :157
        expectLegacyValidation();
        // error text sentinel #D72D39 → --status-error-strong (BaseInput.jsx:307). source: passwordInputPreRevamp.json:98
        cy.get(SEL.input(W)).clear().blur();
        resolveCssVarColor('--status-error-strong', SEL.field(W)).then((rgb) =>
            expectComputedColor(SEL.invalidFeedback(W), 'color', rgb));
        cy.get(SEL.input(W)).type(T.legacy.value).blur();
    };

    it('[PasswordInput-BRW-002] A saved pre-revamp app keeps its Password Input value, label and validation', () => {
        cy.apiLogin();
        importAppFixture(T.legacyFixture, `${fake.companyName}-PILegacy-${Cypress._.uniqueId()}`);
        cy.then(() => cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), SEL.input(W)));

        expectLegacyPreserved('editor');
        // Styles panel reports the deprecated widthType the import backfilled
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        cy.get(baseInputStyleSelector.widthTypeDropdown).should('contain.text', T.widthTypeOfField);
        cy.forceClickOnCanvas();

        cy.openPreview(SEL.input(W));
        expectLegacyPreserved('preview');
    });
});
