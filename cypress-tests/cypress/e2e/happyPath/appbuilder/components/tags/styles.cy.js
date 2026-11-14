/**
 * SPEC — Tags — styles facet (scenario-scoped).
 * FOR AI: only the computed-style half of TESTING.md browser scenario:
 *   Tags-BRW-001 — box shadow and border radius configured in the Styles tab render as configured
 *                  (computed CSS, unclipped) on the editor canvas and in the running app.
 * The layout half (wrap/scroll, alignment, dynamic height) lives in canvas.cy.js.
 * Helpers: openEditorSidebar, fillBoxShadowParams, selectColourFromColourPicker, addTagsViaApi,
 * expectBadgeTitles, openAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tagsSelector, tagsStyleSelector } from "Selectors/appBuilder/components/tags";
import { tagsText } from "Texts/appBuilder/components/tags";
import { openEditorSidebar, fillBoxShadowParams, selectColourFromColourPicker } from "Support/utils/commonWidget";
import { addTagsViaApi, expectBadgeTitles } from "Support/utils/appBuilder/components/tags";
import { openAppInViewer } from "Support/utils/appBuilder/components/textArea";

const W = tagsText.defaultWidgetName;
const T = tagsText;

describe('Tags — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tags-styles-${Cypress._.uniqueId()}`);
        addTagsViaApi([{ name: W, layout: { top: 60, left: 10, width: 14, height: 40 } }]);
        cy.openApp('', undefined, undefined, tagsSelector.container(W));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Tags-BRW-001 (computed shadow / radius) ──────────────────────────────
    // Tags.jsx:291-294 puts `boxShadow` on the outer region; Tags.jsx:264 gives every badge
    // `borderRadius: <n>px`. jsdom only sees the inline strings — here the cascade computes them.
    it('[Tags-BRW-001] Box shadow and border radius set in Styles render as configured on the canvas and in the viewer', () => {
        const radius = '14'; // dynamic (default '8' — tags.js:237)
        const shadow = [2, 4, 6, 1]; // dynamic: x/y/blur/spread (default 0 0 0 0 — tags.js:236)
        const shadowColor = [255, 0, 0, 90]; // dynamic: alpha < 100 → rgba
        const expectedShadow = `rgba(${shadowColor[0]}, ${shadowColor[1]}, ${shadowColor[2]}, ${shadowColor[3] / 100}) ${shadow[0]}px ${shadow[1]}px ${shadow[2]}px ${shadow[3]}px`;

        // defaults first: 8px radius, no visible shadow
        expectBadgeTitles(W, T.defaultTitles);
        cy.get(tagsSelector.badges(W)).each(($b) => cy.wrap($b).should('have.css', 'border-top-left-radius', `${T.defaultBorderRadius}px`));

        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        cy.get(tagsStyleSelector.borderRadiusInput).should('be.visible').type(`{selectall}${radius}`); // source: tags.js:119-124
        cy.get(tagsStyleSelector.borderRadiusInput).should('have.value', radius);
        cy.get(commonWidgetSelector.boxShadowColorPicker).click(); // source: tags.js:138-146
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, shadow);
        selectColourFromColourPicker('Box shadow Color', shadowColor.map(String), 0);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        const expectConfigured = (where) => {
            cy.log(`configured styles — ${where}`);
            cy.get(tagsSelector.badges(W)).should('have.length', T.defaultTitles.length);
            cy.get(tagsSelector.badges(W)).each(($b) => {
                cy.wrap($b)
                    .should('have.css', 'border-top-left-radius', `${radius}px`)
                    .and('have.css', 'border-bottom-right-radius', `${radius}px`);
            });
            cy.get(tagsSelector.region(W)).should('have.css', 'box-shadow', expectedShadow);
            // the shadow is drawn, not clipped: the grid box around the region does not hide overflow
            cy.get(tagsSelector.widgetBox(W)).should('have.css', 'overflow', 'visible');
        };

        expectConfigured('editor');
        openAppInViewer(tagsSelector.container(W));
        expectConfigured('viewer');
    });
});
