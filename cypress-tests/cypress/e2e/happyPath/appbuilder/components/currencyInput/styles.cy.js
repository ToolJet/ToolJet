/**
 * SPEC — Currency Input — styles facet (scenario-scoped).
 * FOR AI: only the TESTING.md browser scenario that needs a real cascade:
 *   CurrencyInput-BRW-005 — focusing a field that shows a validation message keeps the error border:
 *   `.tj-text-input-widget.is-invalid` carries `!important` (theme.scss), the inline focus colour does not.
 * jsdom loads no stylesheet, so this is browser-only. Colours are asserted on getComputedStyle and theme tokens
 * are resolved in-page with a probe element (resolveCssVarColor), never hard-coded.
 * Helpers: openEditorSidebar, openAccordion, verifyAndModifyToggleFx, selectColourFromColourPicker,
 * expectComputedColor, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { currencyInputSelector } from "Selectors/appBuilder/components/currencyInput";
import { currencyInputText } from "Texts/appBuilder/components/currencyInput";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
} from "Support/utils/commonWidget";
import { expectComputedColor, resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";

const W = currencyInputText.defaultWidgetName;
const T = currencyInputText;
const SEL = currencyInputSelector;

const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Currency Input — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CurrencyInput-styles-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    // One swatch popover at a time: commit each pick by clicking the canvas and reopen the Styles tab.
    const pickColour = (...args) => {
        selectColourFromColourPicker(...args);
        cy.forceClickOnCanvas();
        openStyles();
    };

    const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft' });

    // the amount <input> has no left border (CurrencyInput.jsx:168), so read the top/right/bottom edges
    const expectAmountBorder = (expected) => {
        ['border-top-color', 'border-right-color', 'border-bottom-color'].forEach((side) =>
            expectComputedColor(SEL.input(W), side, expected));
    };

    // ── CurrencyInput-BRW-005 ────────────────────────────────────────────────
    // CurrencyInput.jsx:146-154 inlines borderColor = accent while focused; theme.scss `.tj-text-input-widget.is-invalid`
    // (`border: … var(--cc-error-systemStatus) !important`) must still win once the error is revealed.
    it('[CurrencyInput-BRW-005] An invalid, revealed field keeps its error border while focused', () => {
        const border = [0, 0, 255]; // dynamic: configured border
        const accent = [255, 0, 255]; // dynamic: configured accent (focus) colour

        openEditorSidebar(W);
        openAccordion(T.accordionValidation);
        verifyAndModifyToggleFx(T.mandatory, '{{false}}'); // flips ON. source: currencyinput.js:350
        cy.forceClickOnCanvas();
        openStyles();
        pickColour('Border', [...border.map(String), '100']); // source: currencyinput.js:230
        pickColour('Accent', [...accent.map(String), '100']); // source: currencyinput.js:236
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        cy.openPreview(SEL.input(W));
        resolveCssVarColor('--cc-error-systemStatus', SEL.field(W)).then((errorRgb) => {
            expect(errorRgb, 'error token differs from the configured colours').not.to.be.oneOf([rgb(border), rgb(accent)]);

            moveMouseAway();
            // valid (default 0), unfocused → configured border
            expectAmountBorder(rgb(border));
            // valid + focused → accent
            cy.get(SEL.input(W)).realClick();
            cy.get(SEL.input(W)).should('be.focused');
            expectAmountBorder(rgb(accent));

            // empty + blurred → mandatory error revealed, red border
            cy.get(SEL.input(W)).clear().blur();
            moveMouseAway();
            cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMandatory);
            cy.get(SEL.input(W)).should('have.class', 'is-invalid');
            expectAmountBorder(errorRgb);

            // invalid + revealed + FOCUSED → still the error colour, not the accent
            cy.get(SEL.input(W)).realClick();
            cy.get(SEL.input(W)).should('be.focused');
            cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMandatory);
            expectAmountBorder(errorRgb);
            // the currency picker's border follows the error state too (CountrySelect.jsx:66-68)
            resolveCssVarColor('--status-error-strong', SEL.field(W)).then((pickerErrorRgb) => {
                expectComputedColor(SEL.currencyControl(W), 'border-top-color', pickerErrorRgb);
            });

            // a valid amount while focused → accent again; blurred → configured colour
            cy.get(SEL.input(W)).realType('15'); // dynamic: valid amount
            cy.get(SEL.input(W)).should('not.have.class', 'is-invalid');
            expectAmountBorder(rgb(accent));
            cy.get(SEL.input(W)).blur();
            moveMouseAway();
            expectAmountBorder(rgb(border));
        });
    });
});
