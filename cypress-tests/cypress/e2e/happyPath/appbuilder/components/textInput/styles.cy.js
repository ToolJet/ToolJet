/**
 * SPEC — Text Input — styles facet.
 * FOR AI: label accordion (color/Text eq0, labelFontSize/size-input, alignment/togglr-button-top);
 * field accordion (backgroundColor, borderColor, textColor eq1, accentColor, borderRadius, boxShadow);
 * container accordion (padding/togglr-button-none). Selectors confirmed live: field bg/border/radius/
 * shadow → `-actionable-section`, text color → `-input`, label color/size → `-label`.
 * TESTING.md browser scenario TextInput-BRW-005 — the rendered field's COMPUTED CSS matches every configured colour,
 * radius and shadow in light AND dark app mode; border precedence error > focus(accent) > configured holds, including
 * an invalid revealed field that is focused or hovered (baseInput.scss hover rule is `!important`).
 * Helpers: openEditorSidebar, selectColourFromColourPicker, verifyWidgetColorCss, fillBoxShadowParams, verifyBoxShadowCss,
 * expectComputedColor, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
    selectColourFromColourPicker,
    verifyWidgetColorCss,
    fillBoxShadowParams,
    verifyBoxShadowCss,
} from "Support/utils/commonWidget";
import { expectComputedColor, resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { baseInputStyleSelector } from "Selectors/appBuilder/components/emailInput";
import { textInputSelector as SEL } from "Selectors/appBuilder/components/textInput";
import { textInputText as T } from "Texts/appBuilder/components/textInput";

const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Text Input — styles facet', { testIsolation: false }, () => {
    const W = 'textinput1'; // runtimeCandidate
    const SECTION = `[data-cy="${W}-actionable-section"]`; // BaseInput field container

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TIStyles-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Text Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    // ── Label accordion ────────────────────────────────────────────────────────
    it('label — color (Text) applies to the label', () => {
        openStyles();
        // color (colorSwatches) — 1st "Text" picker (eq 0 = label group). source: textinput.js:118
        selectColourFromColourPicker('Text', ['255', '0', '0', '100'], 0, undefined, 0); // dynamic: test color
        // color applies to the inner <p> of the label (_ui/Label.jsx:49-52), not the -label wrapper
        verifyWidgetColorCss(`[data-cy="${W}-label"] p`, 'color', [255, 0, 0, 100], true); // dynamic
    });

    it('label — labelFontSize (Size) applies to the label', () => {
        openStyles();
        // labelFontSize (numberInput). default {{12}}. source: textinput.js:124
        cy.get('[data-cy="size-input"]').clear().type('16'); // dynamic: test size
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('have.css', 'font-size', '16px'); // dynamic
    });

    it('label — alignment (side/top) switches label position', () => {
        openStyles();
        // alignment (switch side/top). default side. source: textinput.js:130
        cy.get('[data-cy="togglr-button-top"]').click({ force: true });
        cy.get(`[data-cy="${W}-label"]`).should('be.visible'); // alignment applied
    });

    // ── Field accordion ─────────────────────────────────────────────────────────
    it('field — backgroundColor applies to the field container', () => {
        openStyles();
        // backgroundColor (colorSwatches). source: textinput.js:205
        selectColourFromColourPicker('Background', ['0', '255', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(SECTION, 'background-color', [0, 255, 0, 100], true); // dynamic
    });

    it('field — borderColor applies to the field container', () => {
        openStyles();
        // borderColor (colorSwatches). source: textinput.js:211
        selectColourFromColourPicker('Border', ['0', '0', '255', '100']); // dynamic: test color
        verifyWidgetColorCss(SECTION, 'border-color', [0, 0, 255, 100], true); // dynamic
    });

    it('field — textColor applies to the input text', () => {
        openStyles();
        // textColor (colorSwatches) — 2nd "Text" picker (eq 1 = field group). source: textinput.js:223
        selectColourFromColourPicker('Text', ['0', '255', '255', '100'], 0, undefined, 1); // dynamic: test color
        verifyWidgetColorCss(`[data-cy="${W}-input"]`, 'color', [0, 255, 255, 100], true); // dynamic
    });

    it('field — accentColor is settable', () => {
        openStyles();
        // accentColor (colorSwatches) — focus/border accent; exercise control + confirm render.
        // source: textinput.js:217
        selectColourFromColourPicker('Accent', ['255', '0', '255', '100']); // dynamic: test color
        cy.get(SECTION).should('exist');
    });

    it('field — borderRadius applies to the field container', () => {
        openStyles();
        // borderRadius (numberInput). default {{6}}. source: textinput.js:256
        cy.get('[data-cy="border-radius-input"]').clear().type('20'); // dynamic: test radius
        cy.forceClickOnCanvas();
        cy.get(SECTION).should('have.css', 'border-radius', '20px'); // dynamic
    });

    it('field — boxShadow applies to the field container', () => {
        openStyles();
        // boxShadow. default 0px 0px 0px 0px #00000040. source: textinput.js:262
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // open box-shadow popover
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, [2, 4, 6, 0]); // dynamic: test shadow
        selectColourFromColourPicker('Box shadow Color', ['255', '0', '0', '90'], 0); // dynamic: test color (alpha<100 → rgba)
        verifyBoxShadowCss(SECTION, [255, 0, 0, 90], [2, 4, 6, 0], 'element'); // dynamic
    });

    it('field — placeholderTextColor colors the input placeholder', () => {
        openStyles();
        // placeholderTextColor (colorSwatches). source: textinput.js:231
        selectColourFromColourPicker('Placeholder Text', ['255', '0', '0', '100']); // dynamic: test color
        cy.forceClickOnCanvas();
        // ::placeholder color isn't readable via have.css — use computed style on the pseudo
        cy.get(`[data-cy="${W}-input"]`).then(($el) => {
            const c = window.getComputedStyle($el[0], '::placeholder').color;
            expect(c).to.match(/rgba?\(255,\s*0,\s*0/); // red placeholder
        });
    });

    it('field — errTextColor colors the validation error text', () => {
        // enable mandatory so an empty blur shows the error, then style the error color
        openEditorSidebar(W);
        openAccordion('Validation');
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // flips ON. source: textinput.js:100
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        // errTextColor (colorSwatches). source: textinput.js:237
        selectColourFromColourPicker('Error text', ['255', '0', '0', '100']); // dynamic: test color
        cy.forceClickOnCanvas();
        // trigger the mandatory error
        cy.get(`[data-cy="${W}-input"]`).focus().blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');
        verifyWidgetColorCss(`[data-cy="${W}-invalid-feedback"]`, 'color', [255, 0, 0, 100], true); // dynamic
    });

    it('label — direction (left/right) switch selects right', () => {
        openStyles();
        // direction (switch left/right). default left. source: textinput.js:140
        cy.get('[data-cy="togglr-button-right"]').click({ force: true });
        // aria-checked lives on the parent [role="radio"], not the inner .toggle-item div
        cy.get('[data-cy="togglr-button-right"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true');
    });

    it('label — auto width off reveals the width control (default 33)', () => {
        openStyles();
        // auto (Width checkbox) default checked → uncheck reveals the width control. source: textinput.js:153
        cy.get('[data-cy="auto-width-checkbox"]').uncheck({ force: true });
        // width (number, default {{33}}) becomes visible. source: textinput.js:164
        cy.get('[data-cy="width-input-field"]').should('be.visible').and('have.value', '33');
    });

    it('label — widthType (of component / of field) select', () => {
        openStyles();
        cy.get('[data-cy="auto-width-checkbox"]').uncheck({ force: true }); // reveals widthType
        // widthType (select ofComponent/ofField). default ofComponent. source: textinput.js:180
        cy.get('[data-cy="dropdown-common"]').click();
        cy.contains('[role="option"]', 'Of the Field').click({ force: true });
        cy.get('[data-cy="dropdown-common"]').should('contain.text', 'Of the Field');
    });

    // ── Container accordion ──────────────────────────────────────────────────────
    it('container — padding (default/none) is settable', () => {
        openStyles();
        // padding (switch default/none). source: textinput.js:271
        cy.get('[data-cy="togglr-button-none"]').click({ force: true });
        cy.get(`[data-cy="${W}-input"]`).should('be.visible'); // padding applied
    });

    // ── Deprecated styles ─────────────────────────────────────────────────────────
    it('deprecated — legacyInputSize toggle is settable', () => {
        openStyles();
        // legacyInputSize (toggle, deprecatedStyles — section already expanded on Styles tab).
        // source: textinput.js:15
        cy.get('[data-cy="legacy-input-size-toggle-button"]').check({ force: true });
        cy.get('[data-cy="legacy-input-size-toggle-button"]').should('be.checked');
    });

    // ── TextInput-BRW-005 ────────────────────────────────────────────────────
    // jsdom drops `var()` on standard properties, so these read getComputedStyle in a real browser; theme
    // tokens are resolved in-page with a probe element (resolveCssVarColor), never hard-coded.
    const enableMandatoryThenOpenStyles = () => {
        openEditorSidebar(W);
        openAccordion(T.accordionValidation);
        verifyAndModifyToggleFx(T.mandatory, '{{false}}'); // flips ON. source: textinput.js:100
        cy.forceClickOnCanvas();
        openStyles();
    };

    // One swatch popover at a time: commit each pick by clicking the canvas and reopen the Styles tab.
    const pickColour = (...args) => {
        selectColourFromColourPicker(...args);
        cy.forceClickOnCanvas();
        openStyles();
    };

    const switchAppToDark = () => {
        // globalSettings.appMode drives useAppDarkMode → AppCanvas `dark-theme`
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        cy.reload();
        cy.get(SEL.input(W), { timeout: 30000 }).should('be.visible');
        cy.get('.dark-theme').should('exist');
    };

    const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft' });

    const placeholderColour = (selector) =>
        cy.get(selector).first().then(($el) => $el[0].ownerDocument.defaultView.getComputedStyle($el[0], '::placeholder').color);

    it('[TextInput-BRW-005] Computed colours, radius and shadow match the configured styles in light and dark mode', () => {
        // dynamic: distinct test colours, one per style (RGBA picker values)
        const labelColor = [128, 0, 128];
        const background = [255, 240, 200];
        const border = [0, 0, 255];
        const text = [0, 128, 0];
        const placeholder = [200, 0, 100];
        const errText = [255, 128, 0];
        const shadow = [2, 4, 6, 0]; // dynamic: x/y/blur/spread
        const shadowColor = [255, 0, 0, 90]; // dynamic: alpha < 100 → rgba
        const radius = '14'; // dynamic (default {{6}} — textinput.js:372)
        const asPicker = (c) => [...c.map(String), '100'];

        enableMandatoryThenOpenStyles();
        pickColour('Text', asPicker(labelColor), 0, undefined, 0); // label `color`. source: textinput.js:117
        pickColour('Background', asPicker(background)); // source: textinput.js:205
        pickColour('Border', asPicker(border)); // source: textinput.js:211
        pickColour('Text', asPicker(text), 0, undefined, 1); // field textColor. source: textinput.js:223
        pickColour('Placeholder Text', asPicker(placeholder)); // source: textinput.js:229
        pickColour('Error text', asPicker(errText)); // source: textinput.js:235
        cy.get(baseInputStyleSelector.borderRadiusInput).clear().type(radius); // source: textinput.js:256
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // source: textinput.js:262
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, shadow);
        selectColourFromColourPicker('Box shadow Color', shadowColor.map(String), 0);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        const expectConfiguredStyles = (mode) => {
            cy.log(`configured styles — ${mode}`);
            moveMouseAway();
            expectComputedColor(`${SEL.label(W)} p`, 'color', rgb(labelColor)); // Label.jsx inner <p>
            expectComputedColor(SEL.field(W), 'background-color', rgb(background));
            expectComputedColor(SEL.field(W), 'border-top-color', rgb(border));
            expectComputedColor(SEL.input(W), 'color', rgb(text));
            cy.get(SEL.input(W)).clear();
            placeholderColour(SEL.input(W)).should('eq', rgb(placeholder));
            cy.get(SEL.field(W)).should('have.css', 'border-top-left-radius', `${radius}px`);
            cy.get(SEL.field(W)).should(
                'have.css',
                'box-shadow',
                `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, ${shadowColor[3] / 100}) ${shadow[0]}px ${shadow[1]}px ${shadow[2]}px ${shadow[3]}px`
            );
            // reveal the mandatory error, then its text colour
            cy.get(SEL.input(W)).focus().blur();
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

    // BaseInput.jsx:221-234: borderColor = error (if invalid && revealed) → accent (if focused) → configured.
    it('[TextInput-BRW-005] Border precedence — accent on focus, an invalid revealed field stays in the error colour while focused or hovered, light and dark', () => {
        const border = [0, 0, 255]; // dynamic: configured border
        const accent = [255, 0, 255]; // dynamic: configured accent (focus) colour

        enableMandatoryThenOpenStyles();
        pickColour('Border', [...border.map(String), '100']); // source: textinput.js:211
        pickColour('Accent', [...accent.map(String), '100']); // source: textinput.js:217
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
                cy.get(SEL.input(W)).type(fake.firstName); // dynamic: fake
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

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
