/**
 * SPEC — Email Input — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenarios:
 *   EmailInput-BRW-003 — editor canvas, preview, released app and public app agree on value, validation, styling
 *   EmailInput-BRW-004 — an app saved before the input revamp (imported fixture, tooljet_version 3.15.1)
 *                        keeps its value, label placement, validation rules and its original IconMailFilled
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, openEditorSidebar, openAccordion,
 * verifyAndModifyParameter, verifyAndModifyToggleFx, selectColourFromColourPicker, expectComputedColor,
 * resolveCssVarColor, getLabelShare, expectLabelFieldSplit, importAppFixture, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { emailInputSelector, baseInputStyleSelector } from "Selectors/appBuilder/components/emailInput";
import { emailInputText } from "Texts/appBuilder/components/emailInput";
import {
    verifyLayout,
    openEditorSidebar,
    openAccordion,
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
} from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import {
    expectComputedColor,
    resolveCssVarColor,
    getLabelShare,
    expectLabelFieldSplit,
    importAppFixture,
    releaseAndMakePublic,
} from "Support/utils/appBuilder/components/baseInput";

const W = emailInputText.defaultWidgetName;
const T = emailInputText;

// Validation walk shared by every context: empty → `emptyMessage`, malformed → email, valid → clean.
// Messages: componentsSlice.js validateWidget. Rule order there is email → regex → minLength → maxLength →
// … → mandatory, so an empty field with a minLength reports the length message, not the mandatory one.
const expectValidationBehaviour = (validValue, emptyMessage = T.errorMandatory) => {
    cy.get(emailInputSelector.input(W)).clear().blur();
    cy.get(emailInputSelector.invalidFeedback(W)).should('have.text', emptyMessage);
    cy.get(emailInputSelector.input(W)).should('have.attr', 'aria-invalid', 'true');
    cy.get(emailInputSelector.input(W)).type('not-an-email').blur(); // dynamic: malformed address
    cy.get(emailInputSelector.invalidFeedback(W)).should('have.text', T.errorInvalidEmail);
    cy.get(emailInputSelector.input(W)).clear().type(validValue).blur();
    // once revealed the feedback node stays mounted, empty, while the value is valid (BaseInput.jsx:303)
    cy.get(emailInputSelector.invalidFeedback(W)).should(($el) => expect($el.text()).to.eq(''));
    cy.get(emailInputSelector.input(W)).should('have.attr', 'aria-invalid', 'false');
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Email Input — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-EIContexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiLogin(); // BRW-003 logs out for the public app
            cy.apiDeleteApp();
        });

        it('device context — show on desktop / mobile toggles visibility', () => {
            verifyLayout(W);
        });

        it('exposed-value context — value observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'value', type: 'String', value: '""' }, // default ''. source: emailinput.js:335
            ], verifyNodeData);
        });

        // ── EmailInput-BRW-003 ───────────────────────────────────────────────
        // RenderWidget passes currentMode through; the only widget-level branch is Label's viewer-only
        // htmlFor (Label.jsx:95). Value, validation and styling must not depend on the mode.
        it('[EmailInput-BRW-003] Editor, preview, released app and public app agree on value, validation and styling', () => {
            const value = fake.email; // dynamic: fake
            const label = fake.firstName; // dynamic: fake
            const slug = `ei-parity-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            const background = ['0', '128', '0', '100']; // dynamic: test colour → rgb(0, 128, 0)
            const radius = '14'; // dynamic: test radius (default {{6}} — emailinput.js:354)

            openEditorSidebar(W);
            verifyAndModifyParameter(T.label, label); // source: emailinput.js:22
            // array form → typed verbatim: the token splitter in clearAndTypeOnCodeMirror drops '@'
            verifyAndModifyParameter(T.defaultValue, [value]); // source: emailinput.js:35
            openAccordion(T.accordionValidation);
            verifyAndModifyToggleFx(T.mandatory, '{{false}}'); // flips ON. source: emailinput.js:322
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
            selectColourFromColourPicker('Background', background); // source: emailinput.js:204
            cy.get(baseInputStyleSelector.borderRadiusInput).clear().type(radius); // source: emailinput.js:249
            cy.forceClickOnCanvas();
            cy.waitForAutoSave();

            const expectParity = (context) => {
                cy.log(`parity — ${context}`);
                cy.get(emailInputSelector.input(W)).should('have.value', value).and('have.attr', 'type', 'email');
                cy.get(emailInputSelector.label(W)).should('contain.text', label).and('contain.text', '*');
                expectComputedColor(emailInputSelector.field(W), 'background-color', 'rgb(0, 128, 0)');
                cy.get(emailInputSelector.field(W)).should('have.css', 'border-top-left-radius', `${radius}px`);
                expectValidationBehaviour(value);
            };

            expectParity('editor canvas');

            cy.openPreview(emailInputSelector.input(W));
            expectParity('preview');

            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            cy.get(emailInputSelector.input(W), { timeout: 30000 }).should('be.visible');
            expectParity('released app');

            cy.apiLogout();
            cy.clearCookies();
            cy.visit(`/applications/${slug}`);
            cy.get(emailInputSelector.input(W), { timeout: 30000 }).should('be.visible');
            expectParity('public app (signed out)');
        });
    });

    // ── EmailInput-BRW-004 ───────────────────────────────────────────────────
    // Fixture = a real export of an Email Input in its pre-revamp shape: no widthType (814feab911), colour
    // sentinels #1B1F24/#CCD1D5/#fff (9b78959b68), icon IconMailFilled (pre-f130abf2c7), tooljet_version 3.15.1.
    // Import backfills widthType: 'ofField' (app-import-export.service.ts) — the path a saved app takes.
    describe('saved pre-revamp app', () => {
        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[EmailInput-BRW-004] A saved pre-revamp app keeps its Email Input value, label and validation', () => {
            cy.apiLogin();
            importAppFixture(T.legacyFixture, `${fake.companyName}-EILegacy-${Cypress._.uniqueId()}`);
            cy.then(() => cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), emailInputSelector.input(W)));

            const expectLegacyPreserved = (context) => {
                cy.log(`legacy — ${context}`);
                // value + label. source: fixtures/templates/appbuilderApps/emailInputPreRevamp.json:65 / :67
                cy.get(emailInputSelector.input(W)).should('have.value', T.legacy.value);
                cy.get(emailInputSelector.label(W)).should('contain.text', T.legacy.label).and('contain.text', '*');
                // label placement: side, saved width {{40}} → 40 × 0.7 = 28 % of the widget, capped at 70 %
                // (pre-revamp Label.jsx used (width/100)*70). source: emailInputPreRevamp.json:112
                cy.get(emailInputSelector.label(W))
                    .should('have.attr', 'style')
                    .and('include', `width: ${T.legacy.width * 0.7}%`)
                    .and('include', 'max-width: 70%');
                getLabelShare(W).then((share) => {
                    expect(share, 'legacy label share').to.be.gt(0).and.lt(T.legacy.width / 100);
                    expectLabelFieldSplit(W, share, null);
                });
                // original icon kept. source: emailInputPreRevamp.json:131
                cy.get(emailInputSelector.icon(W)).find(T.iconMailFilledPath).should('exist');
                cy.get(emailInputSelector.icon(W)).find(T.iconMailPath).should('not.exist');
                // colour sentinels still fall back to theme tokens (BaseInput.jsx:102-111, 230-243).
                // source: emailInputPreRevamp.json:89 / :92 / :104
                resolveCssVarColor('--surfaces-surface-01', emailInputSelector.field(W)).then((rgb) =>
                    expectComputedColor(emailInputSelector.field(W), 'background-color', rgb));
                resolveCssVarColor('--borders-default', emailInputSelector.field(W)).then((rgb) =>
                    expectComputedColor(emailInputSelector.field(W), 'border-top-color', rgb));
                resolveCssVarColor('--text-primary', emailInputSelector.field(W)).then((rgb) =>
                    expectComputedColor(emailInputSelector.input(W), 'color', rgb));
                // saved validation rules: mandatory + minLength {{12}} + built-in email check.
                // source: emailInputPreRevamp.json:147 / :153
                cy.get(emailInputSelector.input(W)).clear().type('a@b.co').blur(); // dynamic: valid but 6 chars
                cy.get(emailInputSelector.invalidFeedback(W)).should('have.text', T.errorMinLength(T.legacy.minLength));
                expectValidationBehaviour(T.legacy.value, T.errorMinLength(T.legacy.minLength));
            };

            expectLegacyPreserved('editor');
            // Styles panel reports the deprecated widthType the import backfilled
            openEditorSidebar(W);
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
            cy.get(baseInputStyleSelector.widthTypeDropdown).should('contain.text', T.widthTypeOfField);
            cy.forceClickOnCanvas();

            cy.openPreview(emailInputSelector.input(W));
            expectLegacyPreserved('preview');
        });
    });
});
