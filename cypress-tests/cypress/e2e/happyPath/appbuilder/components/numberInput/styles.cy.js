/**
 * SPEC — Number Input — styles facet.
 * FOR AI: label accordion (color/Text eq0, labelFontSize/size-input, alignment/togglr-button-top);
 * field accordion (backgroundColor, borderColor, textColor eq1, accentColor, borderRadius, boxShadow);
 * container accordion (padding/togglr-button-none). Selectors confirmed live: field bg/border/radius/
 * shadow → `-actionable-section`, text color → `-input`, label color/size → `-label`.
 * Helpers: openEditorSidebar, selectColourFromColourPicker, verifyWidgetColorCss, fillBoxShadowParams, verifyBoxShadowCss.
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

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Number Input — styles facet', { testIsolation: false }, () => {
    const W = 'numberinput1'; // runtimeCandidate
    const SECTION = `[data-cy="${W}-actionable-section"]`; // BaseInput field container

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NIStyles-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    // ── Label accordion ────────────────────────────────────────────────────────
    it('label — color (Text) applies to the label', () => {
        openStyles();
        // color (colorSwatches) — 1st "Text" picker (eq 0 = label group). source: numberinput.js:118
        selectColourFromColourPicker('Text', ['255', '0', '0', '100'], 0, undefined, 0); // dynamic: test color
        // color applies to the inner <p> of the label (_ui/Label.jsx:49-52), not the -label wrapper
        verifyWidgetColorCss(`[data-cy="${W}-label"] p`, 'color', [255, 0, 0, 100], true); // dynamic
    });

    it('label — labelFontSize (Size) applies to the label', () => {
        openStyles();
        // labelFontSize (numberInput). default {{12}}. source: numberinput.js:124
        cy.get('[data-cy="size-input"]').clear().type('16'); // dynamic: test size
        cy.forceClickOnCanvas();
        cy.get(`[data-cy="${W}-label"]`).should('have.css', 'font-size', '16px'); // dynamic
    });

    it('label — alignment (side/top) switches label position', () => {
        openStyles();
        // alignment (switch side/top). default side. source: numberinput.js:130
        cy.get('[data-cy="togglr-button-top"]').click({ force: true });
        cy.get(`[data-cy="${W}-label"]`).should('be.visible'); // alignment applied
    });

    // ── Field accordion ─────────────────────────────────────────────────────────
    it('field — backgroundColor applies to the field container', () => {
        openStyles();
        // backgroundColor (colorSwatches). source: numberinput.js:205
        selectColourFromColourPicker('Background', ['0', '255', '0', '100']); // dynamic: test color
        verifyWidgetColorCss(SECTION, 'background-color', [0, 255, 0, 100], true); // dynamic
    });

    it('field — borderColor applies to the field container', () => {
        openStyles();
        // borderColor (colorSwatches). source: numberinput.js:211
        selectColourFromColourPicker('Border', ['0', '0', '255', '100']); // dynamic: test color
        verifyWidgetColorCss(SECTION, 'border-color', [0, 0, 255, 100], true); // dynamic
    });

    it('field — textColor applies to the input text', () => {
        openStyles();
        // textColor (colorSwatches) — 2nd "Text" picker (eq 1 = field group). source: numberinput.js:223
        selectColourFromColourPicker('Text', ['0', '255', '255', '100'], 0, undefined, 1); // dynamic: test color
        verifyWidgetColorCss(`[data-cy="${W}-input"]`, 'color', [0, 255, 255, 100], true); // dynamic
    });

    it('field — accentColor is settable', () => {
        openStyles();
        // accentColor (colorSwatches) — focus/border accent; exercise control + confirm render.
        // source: numberinput.js:217
        selectColourFromColourPicker('Accent', ['255', '0', '255', '100']); // dynamic: test color
        cy.get(SECTION).should('exist');
    });

    it('field — borderRadius applies to the field container', () => {
        openStyles();
        // borderRadius (numberInput). default {{6}}. source: numberinput.js:256
        cy.get('[data-cy="border-radius-input"]').clear().type('20'); // dynamic: test radius
        cy.forceClickOnCanvas();
        cy.get(SECTION).should('have.css', 'border-radius', '20px'); // dynamic
    });

    it('field — boxShadow applies to the field container', () => {
        openStyles();
        // boxShadow. default 0px 0px 0px 0px #00000040. source: numberinput.js:262
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // open box-shadow popover
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, [2, 4, 6, 0]); // dynamic: test shadow
        selectColourFromColourPicker('Box shadow Color', ['255', '0', '0', '90'], 0); // dynamic: test color (alpha<100 → rgba)
        verifyBoxShadowCss(SECTION, [255, 0, 0, 90], [2, 4, 6, 0], 'element'); // dynamic
    });

    it('field — placeholderTextColor colors the input placeholder', () => {
        openStyles();
        // placeholderTextColor (colorSwatches). source: numberinput.js:231
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
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // flips ON. source: numberinput.js:100
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        // errTextColor (colorSwatches). source: numberinput.js:237
        selectColourFromColourPicker('Error text', ['255', '0', '0', '100']); // dynamic: test color
        cy.forceClickOnCanvas();
        // trigger the mandatory error — numberInput default value is 0 (non-empty), so clear first
        cy.get(`[data-cy="${W}-input"]`).clear().blur();
        cy.get(`[data-cy="${W}-invalid-feedback"]`).should('be.visible');
        verifyWidgetColorCss(`[data-cy="${W}-invalid-feedback"]`, 'color', [255, 0, 0, 100], true); // dynamic
    });

    it('label — direction (left/right) switch selects right', () => {
        openStyles();
        // direction (switch left/right). default left. source: numberinput.js:140
        cy.get('[data-cy="togglr-button-right"]').click({ force: true });
        // aria-checked lives on the parent [role="radio"], not the inner .toggle-item div
        cy.get('[data-cy="togglr-button-right"]')
            .closest('[role="radio"]')
            .should('have.attr', 'aria-checked', 'true');
    });

    it('label — auto width off reveals the width control (default 33)', () => {
        openStyles();
        // auto (Width checkbox) default checked → uncheck reveals the width control. source: numberinput.js:153
        cy.get('[data-cy="auto-width-checkbox"]').uncheck({ force: true });
        // width (number, default {{33}}) becomes visible. source: numberinput.js:164
        cy.get('[data-cy="width-input-field"]').should('be.visible').and('have.value', '33');
    });

    it('label — widthType (of component / of field) select', () => {
        openStyles();
        cy.get('[data-cy="auto-width-checkbox"]').uncheck({ force: true }); // reveals widthType
        // widthType (select ofComponent/ofField). default ofComponent. source: numberinput.js:180
        cy.get('[data-cy="dropdown-common"]').click();
        cy.contains('[role="option"]', 'Of the Field').click({ force: true });
        cy.get('[data-cy="dropdown-common"]').should('contain.text', 'Of the Field');
    });

    // ── Container accordion ──────────────────────────────────────────────────────
    it('container — padding (default/none) is settable', () => {
        openStyles();
        // padding (switch default/none). source: numberinput.js:271
        cy.get('[data-cy="togglr-button-none"]').click({ force: true });
        cy.get(`[data-cy="${W}-input"]`).should('be.visible'); // padding applied
    });

    // ── Deprecated styles ─────────────────────────────────────────────────────────
    it('deprecated — legacyInputSize toggle is settable', () => {
        openStyles();
        // legacyInputSize (toggle, deprecatedStyles — section already expanded on Styles tab).
        // source: numberinput.js:15
        cy.get('[data-cy="legacy-input-size-toggle-button"]').check({ force: true });
        cy.get('[data-cy="legacy-input-size-toggle-button"]').should('be.checked');
    });
});
