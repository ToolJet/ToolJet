/**
 * SPEC — Phone Input — styles facet (scenario-scoped).
 * FOR AI: only the TESTING.md browser scenario that needs a real stylesheet cascade:
 *   PhoneInput-BRW-005 — focusing a field that shows a validation message keeps the red (error) border instead of the
 *   accent colour: `.tj-text-input-widget.is-invalid` carries `!important` (theme.scss `.tj-text-input-widget`), while
 *   the focus colour is a plain inline borderColor (PhoneInput.jsx:214-222). The country control mirrors it with an
 *   inline `!important` error colour (CountrySelect.jsx:66-68).
 * jsdom loads no stylesheet and drops `var()`, so this is browser-only. Colours are read with getComputedStyle and
 * theme tokens are resolved in-page (resolveCssVarColor), never hard-coded.
 * Helpers: openEditorSidebar, openAccordion, verifyAndModifyToggleFx, selectColourFromColourPicker,
 * expectComputedColor, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { phoneInputSelector } from "Selectors/appBuilder/components/phoneInput";
import { phoneInputText } from "Texts/appBuilder/components/phoneInput";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
} from "Support/utils/commonWidget";
import { expectComputedColor, resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = phoneInputText.defaultWidgetName;
const T = phoneInputText;
const SEL = phoneInputSelector;

const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Phone Input — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PhoneInput-styles-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 500, 100);
        closeQueryPanel();
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

    // ── PhoneInput-BRW-005 ───────────────────────────────────────────────────
    it('[PhoneInput-BRW-005] An invalid, focused Phone Input keeps its error border instead of the accent colour', () => {
        const border = [0, 0, 255]; // dynamic: configured border
        const accent = [255, 0, 255]; // dynamic: configured accent (focus) colour

        openEditorSidebar(W);
        openAccordion(T.accordionValidation);
        verifyAndModifyToggleFx(T.mandatory, '{{false}}'); // flips ON. source: phoneinput.js:108
        cy.forceClickOnCanvas();
        openStyles();
        pickColour('Border', [...border.map(String), '100']); // source: phoneinput.js:218
        pickColour('Accent', [...accent.map(String), '100']); // source: phoneinput.js:224
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        cy.openPreview(SEL.input(W));

        resolveCssVarColor('--cc-error-systemStatus', SEL.field(W)).then((fieldErrorRgb) => {
            resolveCssVarColor('--status-error-strong', SEL.field(W)).then((controlErrorRgb) => {
                expect(fieldErrorRgb, 'error token differs from the configured colours').not.to.be.oneOf([rgb(border), rgb(accent)]);

                moveMouseAway();
                // untouched → configured border on the number field
                expectComputedColor(SEL.input(W), 'border-top-color', rgb(border));
                // focused, error not revealed → accent
                cy.get(SEL.input(W)).realClick();
                cy.get(SEL.input(W)).should('be.focused');
                expectComputedColor(SEL.input(W), 'border-top-color', rgb(accent));

                // blur reveals the mandatory error → error colour on the field and on the country control
                cy.get(SEL.input(W)).blur();
                moveMouseAway();
                cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMandatory);
                cy.get(SEL.input(W)).should('have.class', 'is-invalid').and('have.attr', 'aria-invalid', 'true');
                expectComputedColor(SEL.input(W), 'border-top-color', fieldErrorRgb);
                expectComputedColor(SEL.countryControl(W), 'border-top-color', controlErrorRgb);

                // invalid + revealed + FOCUSED → still the error colour (the scenario's guarantee)
                cy.get(SEL.input(W)).realClick();
                cy.get(SEL.input(W)).should('be.focused');
                cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMandatory);
                expectComputedColor(SEL.input(W), 'border-top-color', fieldErrorRgb);
                expectComputedColor(SEL.countryControl(W), 'border-top-color', controlErrorRgb);

                // a valid number while focused → the accent returns; blurred → the configured border again
                cy.get(SEL.input(W)).type(`201555${Cypress._.random(1000, 9999)}`); // dynamic: US national number
                cy.get(SEL.input(W)).should('not.have.class', 'is-invalid');
                expectComputedColor(SEL.input(W), 'border-top-color', rgb(accent));
                cy.get(SEL.input(W)).blur();
                moveMouseAway();
                expectComputedColor(SEL.input(W), 'border-top-color', rgb(border));
            });
        });
    });
});
