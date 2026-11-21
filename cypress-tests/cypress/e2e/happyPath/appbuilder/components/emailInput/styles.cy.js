/**
 * SPEC — Email Input — styles facet (scenario-scoped).
 * FOR AI: only the TESTING.md browser scenario that needs a real cascade:
 *   EmailInput-BRW-005 — the rendered field's COMPUTED CSS matches every configured colour, radius and shadow in
 *   light and dark app mode; the border precedence error > focus(accent) > configured holds, including an invalid
 *   revealed field that is focused or hovered (baseInput.scss hover rule is `!important`).
 * jsdom drops `var()` on standard properties, so these are browser-only. Colours are asserted on getComputedStyle,
 * and theme tokens are resolved in-page with a probe element (resolveCssVarColor), never hard-coded.
 * Helpers: openEditorSidebar, openAccordion, verifyAndModifyToggleFx, selectColourFromColourPicker, fillBoxShadowParams,
 * expectComputedColor, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { emailInputSelector, baseInputStyleSelector } from "Selectors/appBuilder/components/emailInput";
import { emailInputText } from "Texts/appBuilder/components/emailInput";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
    fillBoxShadowParams,
} from "Support/utils/commonWidget";
import { expectComputedColor, resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = emailInputText.defaultWidgetName;
const T = emailInputText;
const SEL = emailInputSelector;

const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Email Input — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-EIStyles-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 500, 100);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const enableMandatoryThenOpenStyles = () => {
        openEditorSidebar(W);
        openAccordion(T.accordionValidation);
        verifyAndModifyToggleFx(T.mandatory, '{{false}}'); // flips ON. source: emailinput.js:322
        cy.forceClickOnCanvas();
        openStyles();
    };

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    // One swatch popover at a time: a still-open popover duplicates `togglr-button-color`, so commit each
    // pick by clicking the canvas and reopen the Styles tab before the next one.
    const pickColour = (...args) => {
        selectColourFromColourPicker(...args);
        cy.forceClickOnCanvas();
        openStyles();
    };

    const switchAppToDark = () => {
        // globalSettings.appMode drives useAppDarkMode → AppCanvas `dark-theme` (AppCanvas.jsx:238)
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        cy.reload();
        cy.get(SEL.input(W), { timeout: 30000 }).should('be.visible');
        cy.get('.dark-theme').should('exist');
    };

    const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft' });

    // ── EmailInput-BRW-005 (configured values) ───────────────────────────────
    it('[EmailInput-BRW-005] Computed colours, radius and shadow match the configured styles in light and dark mode', () => {
        // dynamic: distinct test colours, one per style (RGBA picker values)
        const labelColor = [128, 0, 128];
        const background = [255, 240, 200];
        const border = [0, 0, 255];
        const text = [0, 128, 0];
        const errText = [255, 128, 0];
        const iconColor = [0, 128, 128];
        const shadow = [2, 4, 6, 0]; // dynamic: x/y/blur/spread
        const shadowColor = [255, 0, 0, 90]; // dynamic: alpha < 100 → rgba
        const radius = '14'; // dynamic (default {{6}} — emailinput.js:354)
        const asPicker = (c) => [...c.map(String), '100'];

        enableMandatoryThenOpenStyles();
        pickColour('Text', asPicker(labelColor), 0, undefined, 0); // label `color`. source: emailinput.js:117
        pickColour('Background', asPicker(background)); // source: emailinput.js:204
        pickColour('Border', asPicker(border)); // source: emailinput.js:210
        pickColour('Text', asPicker(text), 0, undefined, 1); // field textColor. source: emailinput.js:222
        pickColour('Error text', asPicker(errText)); // source: emailinput.js:228
        pickColour('iconColor', asPicker(iconColor)); // swatch has no label. source: emailinput.js:241
        cy.get(baseInputStyleSelector.borderRadiusInput).clear().type(radius); // source: emailinput.js:249
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // source: emailinput.js:255
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, shadow);
        selectColourFromColourPicker('Box shadow Color', shadowColor.map(String), 0);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        const expectConfiguredStyles = (mode) => {
            cy.log(`configured styles — ${mode}`);
            moveMouseAway();
            expectComputedColor(`${SEL.label(W)} p`, 'color', rgb(labelColor)); // Label.jsx:48
            expectComputedColor(SEL.field(W), 'background-color', rgb(background));
            expectComputedColor(SEL.field(W), 'border-top-color', rgb(border));
            expectComputedColor(SEL.input(W), 'color', rgb(text));
            expectComputedColor(SEL.icon(W), 'color', rgb(iconColor));
            cy.get(SEL.field(W)).should('have.css', 'border-top-left-radius', `${radius}px`);
            cy.get(SEL.field(W)).should(
                'have.css',
                'box-shadow',
                `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, ${shadowColor[3] / 100}) ${shadow[0]}px ${shadow[1]}px ${shadow[2]}px ${shadow[3]}px`
            );
            // reveal the mandatory error, then its text colour
            cy.get(SEL.input(W)).clear().focus().blur();
            cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMandatory);
            expectComputedColor(SEL.invalidFeedback(W), 'color', rgb(errText));
        };

        expectConfiguredStyles('light');
        resolveCssVarColor('--cc-surface1-surface', SEL.field(W)).as('lightSurfaceToken');

        switchAppToDark();
        // the theme really switched where the widget lives: an unconfigured token resolves differently
        cy.get('@lightSurfaceToken').then((lightToken) => {
            resolveCssVarColor('--cc-surface1-surface', SEL.field(W)).should('not.eq', lightToken);
        });
        expectConfiguredStyles('dark');
    });

    // ── EmailInput-BRW-005 (border precedence) ───────────────────────────────
    // BaseInput.jsx:223-234: borderColor = error (if invalid && revealed) → accent (if focused) → configured.
    // baseInput.scss: `:hover:not(:focus-within):not(.tj-input-has-error)` repaints the border with
    // `!important`, which would outrank the inline error colour without the tj-input-has-error guard.
    it('[EmailInput-BRW-005] Border precedence — an invalid revealed field stays in the error colour while focused or hovered, light and dark', () => {
        const border = [0, 0, 255]; // dynamic: configured border
        const accent = [255, 0, 255]; // dynamic: configured accent (focus) colour

        enableMandatoryThenOpenStyles();
        pickColour('Border', [...border.map(String), '100']); // source: emailinput.js:210
        pickColour('Accent', [...accent.map(String), '100']); // source: emailinput.js:216
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        const expectBorderPrecedence = (mode) => {
            cy.log(`border precedence — ${mode}`);
            resolveCssVarColor('--cc-error-systemStatus', SEL.field(W)).then((errorRgb) => {
                expect(errorRgb, 'error token differs from the configured colours').not.to.be.oneOf([rgb(border), rgb(accent)]);

                moveMouseAway();
                // untouched (invalid but not revealed) → configured border
                expectComputedColor(SEL.field(W), 'border-top-color', rgb(border));
                // focused, not revealed → accent
                cy.get(SEL.input(W)).realClick();
                expectComputedColor(SEL.field(W), 'border-top-color', rgb(accent));
                // blur reveals the mandatory error → error colour
                cy.get(SEL.input(W)).blur();
                moveMouseAway();
                cy.get(SEL.invalidFeedback(W)).should('have.text', T.errorMandatory);
                expectComputedColor(SEL.field(W), 'border-top-color', errorRgb);
                // invalid + revealed + FOCUSED → still the error colour (error outranks focus)
                cy.get(SEL.input(W)).realClick();
                cy.get(SEL.input(W)).should('be.focused');
                expectComputedColor(SEL.field(W), 'border-top-color', errorRgb);
                // invalid + revealed + HOVERED (not focused) → still the error colour
                cy.get(SEL.input(W)).blur();
                cy.get(SEL.field(W)).realHover();
                expectComputedColor(SEL.field(W), 'border-top-color', errorRgb);
                // a valid value while focused → accent; blurred and unhovered → configured colour again
                cy.get(SEL.input(W)).realClick();
                cy.get(SEL.input(W)).type(fake.email); // dynamic: fake
                expectComputedColor(SEL.field(W), 'border-top-color', rgb(accent));
                cy.get(SEL.input(W)).blur();
                moveMouseAway();
                expectComputedColor(SEL.field(W), 'border-top-color', rgb(border));
                cy.get(SEL.input(W)).clear().blur(); // leave it empty for the next mode
            });
        };

        cy.openPreview(SEL.input(W));
        expectBorderPrecedence('light, preview');

        switchAppToDark();
        expectBorderPrecedence('dark, preview');
    });
});
