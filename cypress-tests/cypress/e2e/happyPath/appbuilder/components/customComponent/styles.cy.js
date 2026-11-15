/**
 * SPEC — Custom Component — styles facet (scenario-scoped).
 * FOR AI: only the TESTING.md browser scenario that needs a real cascade:
 *   CustomComponent-BRW-002 — the configured border colour, radius and box shadow paint on the wrapper in a real
 *                             browser (editor and running app), including after changing the colour (also to white,
 *                             the regression of commit 5049ae5ba3), and the wrapper shows no stray outline.
 * CustomComponent.jsx:170-183 forwards Border color as `--cc-custom-component-border-color` and consumes it in an
 * inline `border: 1px solid var(...) !important` (jsdom drops it — D-04), plus `outline: none` against card.scss:4.
 * Colours are asserted on getComputedStyle; the default theme token is resolved in-page (resolveCssVarColor).
 * Helpers: addCustomComponentsViaApi, inFrame, cardStyle, openEditorSidebar, selectColourFromColourPicker,
 * fillBoxShadowParams, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { customComponentSelector } from "Selectors/appBuilder/components/customComponent";
import { customComponentText } from "Texts/appBuilder/components/customComponent";
import { openEditorSidebar, selectColourFromColourPicker, fillBoxShadowParams } from "Support/utils/commonWidget";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { addCustomComponentsViaApi, inFrame, cardStyle } from "Support/utils/appBuilder/components/customComponent";

const T = customComponentText;
const S = customComponentSelector;
const W = T.defaultWidgetName;
const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const sides = (c) => [c.borderTopColor, c.borderRightColor, c.borderBottomColor, c.borderLeftColor];

// self-contained author code — styles do not depend on the CDN-backed default code
const CODE = 'ReactDOM.render(<p id="cc-who">styles</p>, document.body);';

describe('Custom Component — styles facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CustomComponent-styles-${Cypress._.uniqueId()}`);
        addCustomComponentsViaApi([
            { name: W, layout: { top: 60, left: 4, width: 15, height: 200 }, properties: { code: { value: CODE } } },
        ]);
        cy.then(() => cy.openApp('', undefined, undefined, S.card(W)));
        inFrame(W, '#cc-who').should('have.text', 'styles');
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    // One swatch popover at a time: commit each pick by clicking the canvas, then reopen the Styles tab.
    const pickColour = (...args) => {
        selectColourFromColourPicker(...args);
        cy.forceClickOnCanvas();
        openStyles();
    };

    // ── CustomComponent-BRW-002 ──────────────────────────────────────────────
    it('[CustomComponent-BRW-002] Border colour, radius and box shadow paint as configured, also after changing the colour; no stray outline', () => {
        const border = [0, 0, 255]; // dynamic: first configured border colour
        const white = [255, 255, 255]; // dynamic: second colour — the "border still visible on white" regression
        const radius = 14; // dynamic (default {{6}} — customComponent.js:84)
        const shadow = [3, 5, 7, 1]; // dynamic: x/y/blur/spread
        const shadowColor = [255, 0, 0, 90]; // dynamic: alpha < 100 → rgba
        const shadowCss = `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, ${shadowColor[3] / 100}) ${shadow[0]}px ${shadow[1]}px ${shadow[2]}px ${shadow[3]}px`;

        // ── defaults: 1px solid border in the --cc-weak-border token, 6px radius, the zero shadow, no outline
        resolveCssVarColor(T.defaultBorderColorVar, S.card(W)).then((weakBorder) => {
            cardStyle(W, (c) => {
                expect(sides(c), 'default border colour on every side').to.deep.eq(Array(4).fill(weakBorder)); // source: customComponent.js:85
                expect(c.borderTopWidth).to.eq('1px'); // CustomComponent.jsx:178
                expect(c.borderTopStyle).to.eq('solid');
                expect(c.borderRadius).to.eq(`${T.defaultBorderRadius}px`); // source: customComponent.js:84
                expect(c.boxShadow).to.eq(T.defaultBoxShadow); // source: customComponent.js:86
                expect(c.outlineStyle, 'no stray outline').to.eq('none');
            });
        });
        // control: without the wrapper's inline override, `.card` paints an outline here (card.scss:4) —
        // so the `outline: none` assertions above and below can fail
        cy.get(S.card(W)).then(($card) => {
            const doc = $card[0].ownerDocument;
            const bare = doc.createElement('div');
            bare.className = 'card';
            $card[0].parentNode.appendChild(bare);
            const outline = doc.defaultView.getComputedStyle(bare).outlineStyle;
            bare.remove();
            expect(outline, 'card.scss outline is active in this document').to.eq(T.cardOutlineStyle);
        });

        // ── configure colour, radius and shadow
        openStyles();
        pickColour(T.borderColor, [...border.map(String), '100']); // source: customComponent.js:28
        cy.get(S.borderRadiusInput).type(`{selectall}${radius}`); // source: customComponent.js:37
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // source: customComponent.js:43
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, shadow);
        selectColourFromColourPicker(T.boxShadowColor, shadowColor.map(String), 0);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        const expectPainted = (colour, context) => {
            cy.log(`painted styles — ${context}`);
            cardStyle(W, (c) => {
                expect(sides(c), `${context}: border colour on every side`).to.deep.eq(Array(4).fill(rgb(colour)));
                expect(c.borderTopWidth).to.eq('1px');
                expect(c.borderTopStyle).to.eq('solid');
                expect(c.borderRadius, `${context}: radius`).to.eq(`${radius}px`);
                expect(c.borderBottomRightRadius).to.eq(`${radius}px`);
                expect(c.boxShadow, `${context}: shadow`).to.eq(shadowCss);
                expect(c.outlineStyle, `${context}: no stray outline`).to.eq('none');
            });
        };
        expectPainted(border, 'editor');

        // ── change the colour again — to white, the case that used to leave a visible outline
        openStyles();
        pickColour(T.borderColor, [...white.map(String), '100']);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        expectPainted(white, 'editor, after changing the colour');

        // ── the running app paints the saved styles
        cy.openPreview(S.card(W));
        inFrame(W, '#cc-who').should('have.text', 'styles');
        expectPainted(white, 'running app');
    });
});
