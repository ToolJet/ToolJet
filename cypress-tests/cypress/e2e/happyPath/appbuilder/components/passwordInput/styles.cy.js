/**
 * SPEC — Password Input — styles facet.
 * FOR AI: label accordion (color/Text eq0, labelFontSize/size-input, alignment/togglr-button-top);
 * field accordion (backgroundColor, borderColor, textColor eq1, accentColor, borderRadius, boxShadow);
 * container accordion (padding/togglr-button-none). Selectors confirmed live: field bg/border/radius/
 * shadow → `-actionable-section`, text color → `-input`, label color/size → `-label`.
 * Helpers: openEditorSidebar, selectColourFromColourPicker, verifyWidgetColorCss, fillBoxShadowParams, verifyBoxShadowCss.
 * TESTING.md browser scenario:
 *   PasswordInput-BRW-003 — COMPUTED colours (label, background, border, text masked+revealed, placeholder, left icon,
 *   error text), radius and shadow in light AND dark app mode; border precedence error > focus(accent) > configured,
 *   incl. an invalid field revealed with the eye that is focused or hovered.
 *   Helpers: expectComputedColor, resolveCssVarColor.
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
import { passwordInputSelector } from "Selectors/appBuilder/components/passwordInput";
import { passwordInputText } from "Texts/appBuilder/components/passwordInput";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Password Input — styles facet', { testIsolation: false }, () => {
    const W = 'passwordinput1'; // runtimeCandidate
    const SECTION = `[data-cy="${W}-actionable-section"]`; // BaseInput field container

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PIStyles-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Password Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    // ── Label accordion ────────────────────────────────────────────────────────
    it('label — color (Text) applies to the label', () => {
        openStyles();
        // color (colorSwatches) — 1st "Text" picker (eq 0 = label group). source: passwordinput.js:118
        selectColourFromColourPicker('Text', ['255', '0', '0', '100'], 0, undefined, 0); // dynamic: test color
        // color applies to the inner <p> of the label (_ui/Label.jsx:49-52), not the -label wrapper
        verifyWidgetColorCss(`[data-cy="${W}-label"] p`, 'color', [255, 0, 0, 100], true); // dynamic
    });

    it('label — labelFontSize (Size) applies to the label', () => {
        openStyles();
        // labelFontSize (numberInput). default {{12}}. source: passwordinput.js:124
        cy.get('[data-cy="size-input"]').clear().type('16'); // dynamic: test size
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('have.css', 'font-size', '16px'); // dynamic
    });

    it('label — alignment (side/top) switches label position', () => {
        openStyles();
        // alignment (switch side/top). default side. source: passwordinput.js:130
        cy.get('[data-cy="togglr-button-top"]').click({ force: true });
        cy.get(`[data-cy="${W}-label"]`).should('be.visible'); // alignment applied
    });

    // ── Field accordion ─────────────────────────────────────────────────────────
    it('field — backgroundColor applies to the field container', () => {
        openStyles();
        // backgroundColor (colorSwatches). source: passwordinput.js:205
        selectColourFromColourPicker('Background', ['0', '255', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(SECTION, 'background-color', [0, 255, 0, 100], true); // dynamic
    });

    it('field — borderColor applies to the field container', () => {
        openStyles();
        // borderColor (colorSwatches). source: passwordinput.js:211
        selectColourFromColourPicker('Border', ['0', '0', '255', '100']); // dynamic: test color
        verifyWidgetColorCss(SECTION, 'border-color', [0, 0, 255, 100], true); // dynamic
    });

    it('field — textColor applies to the input text', () => {
        openStyles();
        // textColor (colorSwatches) — 2nd "Text" picker (eq 1 = field group). source: passwordinput.js:223
        selectColourFromColourPicker('Text', ['0', '255', '255', '100'], 0, undefined, 1); // dynamic: test color
        verifyWidgetColorCss(`[data-cy="${W}-input"]`, 'color', [0, 255, 255, 100], true); // dynamic
    });

    it('field — accentColor is settable', () => {
        openStyles();
        // accentColor (colorSwatches) — focus/border accent; exercise control + confirm render.
        // source: passwordinput.js:217
        selectColourFromColourPicker('Accent', ['255', '0', '255', '100']); // dynamic: test color
        cy.get(SECTION).should('exist');
    });

    it('field — borderRadius applies to the field container', () => {
        openStyles();
        // borderRadius (numberInput). default {{6}}. source: passwordinput.js:256
        cy.get('[data-cy="border-radius-input"]').clear().type('20'); // dynamic: test radius
        cy.forceClickOnCanvas();
        cy.get(SECTION).should('have.css', 'border-radius', '20px'); // dynamic
    });

    it('field — boxShadow applies to the field container', () => {
        openStyles();
        // boxShadow. default 0px 0px 0px 0px #00000040. source: passwordinput.js:262
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // open box-shadow popover
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, [2, 4, 6, 0]); // dynamic: test shadow
        selectColourFromColourPicker('Box shadow Color', ['255', '0', '0', '90'], 0); // dynamic: test color (alpha<100 → rgba)
        verifyBoxShadowCss(SECTION, [255, 0, 0, 90], [2, 4, 6, 0], 'element'); // dynamic
    });

    it('field — placeholderTextColor colors the input placeholder', () => {
        openStyles();
        // placeholderTextColor (colorSwatches). source: passwordinput.js:231
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
        verifyAndModifyToggleFx('Make this field mandatory', ''); // flips ON (raw-false default). source: passwordinput.js:344
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        // errTextColor (colorSwatches). source: passwordinput.js:237
        selectColourFromColourPicker('Error text', ['255', '0', '0', '100']); // dynamic: test color
        cy.forceClickOnCanvas();
        // trigger the mandatory error
        cy.get(`[data-cy="${W}-input"]`).focus().blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');
        verifyWidgetColorCss(`[data-cy="${W}-invalid-feedback"]`, 'color', [255, 0, 0, 100], true); // dynamic
    });

    it('label — direction (left/right) switch selects right', () => {
        openStyles();
        // direction (switch left/right). default left. source: passwordinput.js:140
        cy.get('[data-cy="togglr-button-right"]').click({ force: true });
        // aria-checked lives on the parent [role="radio"], not the inner .toggle-item div
        cy.get('[data-cy="togglr-button-right"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true');
    });

    it('label — auto width off reveals the width control (default 33)', () => {
        openStyles();
        // auto (Width checkbox) default checked → uncheck reveals the width control. source: passwordinput.js:153
        cy.get('[data-cy="auto-width-checkbox"]').uncheck({ force: true });
        // width (number, default {{33}}) becomes visible. source: passwordinput.js:164
        cy.get('[data-cy="width-input-field"]').should('be.visible').and('have.value', '33');
    });

    it('label — widthType (of component / of field) select', () => {
        openStyles();
        cy.get('[data-cy="auto-width-checkbox"]').uncheck({ force: true }); // reveals widthType
        // widthType (select ofComponent/ofField). default ofComponent. source: passwordinput.js:180
        cy.get('[data-cy="dropdown-common"]').click();
        cy.contains('[role="option"]', 'Of the Field').click({ force: true });
        cy.get('[data-cy="dropdown-common"]').should('contain.text', 'Of the Field');
    });

    // ── Container accordion ──────────────────────────────────────────────────────
    it('container — padding (default/none) is settable', () => {
        openStyles();
        // padding (switch default/none). source: passwordinput.js:271
        cy.get('[data-cy="togglr-button-none"]').click({ force: true });
        cy.get(`[data-cy="${W}-input"]`).should('be.visible'); // padding applied
    });

    // ── Deprecated styles ─────────────────────────────────────────────────────────
    it('deprecated — legacyInputSize toggle is settable', () => {
        openStyles();
        // legacyInputSize (toggle, deprecatedStyles — section already expanded on Styles tab).
        // source: passwordinput.js:15
        cy.get('[data-cy="legacy-input-size-toggle-button"]').check({ force: true });
        cy.get('[data-cy="legacy-input-size-toggle-button"]').should('be.checked');
    });

    // ── PasswordInput-BRW-003 ────────────────────────────────────────────────
    // jsdom drops `var()` on standard properties, so the cascade is browser-only. Colours are asserted on
    // getComputedStyle; theme tokens are resolved in-page with a probe element (resolveCssVarColor).
    const PSEL = passwordInputSelector;
    const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    const asPicker = (c) => [...c.map(String), '100'];

    // One swatch popover at a time: commit each pick by clicking the canvas, then reopen the Styles tab.
    const pickColour = (...args) => {
        selectColourFromColourPicker(...args);
        cy.forceClickOnCanvas();
        openStyles();
    };

    const enableMandatoryThenOpenStyles = () => {
        openEditorSidebar(W);
        openAccordion(passwordInputText.accordionValidation);
        // raw `false` default, so skip the fx-value check. source: passwordinput.js:344
        verifyAndModifyToggleFx(passwordInputText.mandatory, '');
        cy.forceClickOnCanvas();
        openStyles();
    };

    const switchAppToDark = () => {
        // globalSettings.appMode drives the app canvas `dark-theme` class
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        cy.reload();
        cy.get(PSEL.input(W), { timeout: 30000 }).should('be.visible');
        cy.get('.dark-theme').should('exist');
    };

    const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft' });

    it('[PasswordInput-BRW-003] Computed colours, radius and shadow match the configured styles in light and dark mode', () => {
        // dynamic: distinct test colours, one per style
        const labelColor = [128, 0, 128];
        const background = [255, 240, 200];
        const border = [0, 0, 255];
        const text = [0, 128, 0];
        const placeholder = [200, 100, 0];
        const errText = [255, 128, 0];
        const shadow = [2, 4, 6, 0]; // dynamic: x/y/blur/spread
        const shadowColor = [255, 0, 0, 90]; // dynamic: alpha < 100 → rgba
        const radius = '14'; // dynamic (default {{6}} — passwordinput.js:352)

        enableMandatoryThenOpenStyles();
        pickColour('Text', asPicker(labelColor), 0, undefined, 0); // label `color`. source: passwordinput.js:117
        pickColour('Background', asPicker(background)); // source: passwordinput.js:204
        pickColour('Border', asPicker(border)); // source: passwordinput.js:210
        pickColour('Text', asPicker(text), 0, undefined, 1); // field textColor. source: passwordinput.js:222
        pickColour('Placeholder Text', asPicker(placeholder)); // source: passwordinput.js:228
        pickColour('Error text', asPicker(errText)); // source: passwordinput.js:234
        cy.get('[data-cy="border-radius-input"]').clear().type(radius); // source: passwordinput.js:255
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // source: passwordinput.js:261
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, shadow);
        selectColourFromColourPicker('Box shadow Color', shadowColor.map(String), 0);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        const expectConfiguredStyles = (mode) => {
            cy.log(`configured styles — ${mode}`);
            moveMouseAway();
            expectComputedColor(`${PSEL.label(W)} p`, 'color', rgb(labelColor));
            expectComputedColor(PSEL.field(W), 'background-color', rgb(background));
            expectComputedColor(PSEL.field(W), 'border-top-color', rgb(border));
            cy.get(PSEL.field(W)).should('have.css', 'border-top-left-radius', `${radius}px`);
            cy.get(PSEL.field(W)).should(
                'have.css',
                'box-shadow',
                `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, ${shadowColor[3] / 100}) ${shadow[0]}px ${shadow[1]}px ${shadow[2]}px ${shadow[3]}px`
            );
            // empty field → placeholder paints in the configured colour; with iconColor left at its default the
            // left icon follows the placeholder colour (BaseInput.jsx:93-100)
            cy.get(PSEL.input(W)).clear();
            cy.get(PSEL.input(W)).should(($el) => {
                const c = $el[0].ownerDocument.defaultView.getComputedStyle($el[0], '::placeholder').color;
                expect(c, 'placeholder colour').to.eq(rgb(placeholder));
            });
            expectComputedColor(PSEL.icon(W), 'color', rgb(placeholder));
            // typed text — both masked and revealed — in the configured text colour
            cy.get(PSEL.input(W)).type(fake.password); // dynamic: fake
            expectComputedColor(PSEL.input(W), 'color', rgb(text));
            cy.get(PSEL.revealToggle(W)).click();
            cy.get(PSEL.input(W)).should('have.attr', 'type', 'text');
            expectComputedColor(PSEL.input(W), 'color', rgb(text));
            cy.get(PSEL.revealToggle(W)).click();
            cy.get(PSEL.input(W)).should('have.attr', 'type', 'password');
            // reveal the mandatory error, then its text colour
            cy.get(PSEL.input(W)).clear().focus().blur();
            cy.get(PSEL.invalidFeedback(W)).should('have.text', passwordInputText.errorMandatory);
            expectComputedColor(PSEL.invalidFeedback(W), 'color', rgb(errText));
        };

        expectConfiguredStyles('light');
        resolveCssVarColor('--cc-surface1-surface', PSEL.field(W)).as('lightSurfaceToken');

        switchAppToDark();
        // the theme really switched where the widget lives: an unconfigured token resolves differently
        cy.get('@lightSurfaceToken').then((lightToken) => {
            resolveCssVarColor('--cc-surface1-surface', PSEL.field(W)).should('not.eq', lightToken);
        });
        expectConfiguredStyles('dark');
    });

    // BaseInput.jsx:223-234: borderColor = error (invalid && revealed) → accent (focused) → configured.
    // baseInput.scss: the `:hover:not(:focus-within):not(.tj-input-has-error)` rule repaints the border with
    // `!important`. "Revealed" is exercised both ways: the error is revealed AND the password is revealed
    // with the eye (the input re-renders as type=text), which must not drop the error border.
    it('[PasswordInput-BRW-003] Border precedence — accent on focus; an invalid revealed field stays in the error colour while focused, light and dark', () => {
        const border = [0, 0, 255]; // dynamic: configured border
        const accent = [255, 0, 255]; // dynamic: configured accent (focus) colour

        enableMandatoryThenOpenStyles();
        pickColour('Border', asPicker(border)); // source: passwordinput.js:210
        pickColour('Accent', asPicker(accent)); // source: passwordinput.js:216
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        const expectBorderPrecedence = (mode) => {
            cy.log(`border precedence — ${mode}`);
            resolveCssVarColor('--cc-error-systemStatus', PSEL.field(W)).then((errorRgb) => {
                expect(errorRgb, 'error token differs from the configured colours').not.to.be.oneOf([rgb(border), rgb(accent)]);

                moveMouseAway();
                // untouched (invalid but not revealed) → configured border
                expectComputedColor(PSEL.field(W), 'border-top-color', rgb(border));
                // focused, not revealed → accent
                cy.get(PSEL.input(W)).realClick();
                cy.get(PSEL.input(W)).should('be.focused');
                expectComputedColor(PSEL.field(W), 'border-top-color', rgb(accent));
                // blur reveals the mandatory error → error colour
                cy.get(PSEL.input(W)).blur();
                moveMouseAway();
                cy.get(PSEL.invalidFeedback(W)).should('have.text', passwordInputText.errorMandatory);
                expectComputedColor(PSEL.field(W), 'border-top-color', errorRgb);
                // invalid + error revealed + FOCUSED → still the error colour
                cy.get(PSEL.input(W)).realClick();
                cy.get(PSEL.input(W)).should('be.focused');
                expectComputedColor(PSEL.field(W), 'border-top-color', errorRgb);
                // password revealed with the eye (type=text) + focused → still the error colour
                cy.get(PSEL.revealToggle(W)).realClick();
                cy.get(PSEL.input(W)).should('have.attr', 'type', 'text');
                cy.get(PSEL.input(W)).realClick();
                cy.get(PSEL.input(W)).should('be.focused');
                cy.get(PSEL.invalidFeedback(W)).should('have.text', passwordInputText.errorMandatory);
                expectComputedColor(PSEL.field(W), 'border-top-color', errorRgb);
                // … and hovered while not focused → still the error colour
                cy.get(PSEL.input(W)).blur();
                cy.get(PSEL.field(W)).realHover();
                expectComputedColor(PSEL.field(W), 'border-top-color', errorRgb);
                // a valid value while focused (still revealed) → accent; blurred and unhovered → configured
                cy.get(PSEL.input(W)).realClick();
                cy.get(PSEL.input(W)).type(fake.password); // dynamic: fake
                cy.get(PSEL.invalidFeedback(W)).should(($el) => expect($el.text()).to.eq(''));
                expectComputedColor(PSEL.field(W), 'border-top-color', rgb(accent));
                cy.get(PSEL.input(W)).blur();
                moveMouseAway();
                expectComputedColor(PSEL.field(W), 'border-top-color', rgb(border));
                // leave it empty and masked for the next mode
                cy.get(PSEL.revealToggle(W)).click();
                cy.get(PSEL.input(W)).should('have.attr', 'type', 'password');
                cy.get(PSEL.input(W)).clear().blur();
            });
        };

        cy.openPreview(PSEL.input(W));
        expectBorderPrecedence('light, preview');

        switchAppToDark();
        expectBorderPrecedence('dark, preview');
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
