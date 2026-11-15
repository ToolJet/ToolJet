/**
 * SPEC — Map — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   Map-BRW-004 — with the app in dark mode the map hands darkModeStyles to the real SDK (every styled tile the
 *                 SDK requests carries the dark style payload) and the search box takes the dark classes; light
 *                 mode requests no dark-styled tile (control)
 * Environment note: the dev key answers BillingNotEnabledMapError, and Google then swaps every requested style for
 * its own "development purposes only" dimming — so the PAINTED tiles cannot turn dark here. The assertion is on the
 * style payload the real SDK sends (Map.jsx:263 options.styles), which is what a billed key paints.
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, addMapsViaApi, openMapAppInViewer,
 * tileStyleStrings.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { mapSelector } from "Selectors/appBuilder/components/map";
import { mapText } from "Texts/appBuilder/components/map";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import {
    addMapsViaApi,
    openMapAppInViewer,
    waitForMapTiles,
    tileStyleStrings,
} from "Support/utils/appBuilder/components/map";

const W = mapText.defaultWidgetName;
const T = mapText;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Map — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Map-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — show on desktop / mobile toggles visibility', () => {
            verifyLayout(W);
        });

        it('exposed-value context — published state observable in the inspector tree', () => {
            waitForMapTiles(W); // bounds publish on the first settle (Map.jsx:135-162)
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'center', type: 'Object', value: '{3}' }, // lat/lng/googleMapUrl — Map.jsx:127-130, 219
                { key: 'markers', type: 'Array', value: '[1]' }, // definition defaultMarkers — map.js:147, Map.jsx:220
                { key: 'bounds', type: 'Object', value: '{2}' }, // northEast/southWest — Map.jsx:140-143
                { key: 'setLocation', type: 'Function', value: 'function' }, // map.js:103, Map.jsx:209
            ], verifyNodeData);
        });
    });

    // ── Map-BRW-004 ──────────────────────────────────────────────────────────
    // RenderWidget passes the app's dark mode as `darkMode`; Map.jsx:263 sets options.styles = darkModeStyles
    // (styles.js) and Map.jsx:278 adds the dark classes to the search input.
    describe('app theme', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Map-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[Map-BRW-004] Dark mode hands the dark style array to the real map', () => {
            const hasDarkPayload = (style) => T.darkStyleColors.every((c) => style.includes(`p.c:${c}`)); // source: styles.js:7-133
            addMapsViaApi([{ name: W, layout: { top: 40, left: 2, width: 20, height: 420 } }]);

            // light (control): no tile is requested with the dark style, the search box is not dark
            openMapAppInViewer([W]);
            cy.get('.dark-theme').should('not.exist');
            cy.get(mapSelector.searchInput(W)).should(($i) =>
                T.searchDarkClasses.forEach((c) => expect($i[0].classList.contains(c), `light: no ${c}`).to.eq(false))); // source: Map.jsx:278
            tileStyleStrings().then((styles) => {
                expect(styles.filter(hasDarkPayload), 'light: dark-styled tile requests').to.have.length(0);
            });

            // dark: the SDK requests its tiles with the darkModeStyles payload; the search box goes dark
            cy.apiUpdateGlobalSettings({ appMode: 'dark' });
            openMapAppInViewer([W]); // a fresh page: Resource Timing only holds this load's tile requests
            cy.get('.dark-theme', { timeout: 30000 }).should('exist');
            cy.get(mapSelector.searchInput(W)).should(($i) =>
                T.searchDarkClasses.forEach((c) => expect($i[0].classList.contains(c), `dark: ${c}`).to.eq(true))); // source: Map.jsx:278
            tileStyleStrings().then((styles) => {
                expect(styles.filter(hasDarkPayload).length, 'dark: tile requests carrying every darkModeStyles colour').to.be.gte(1);
            });
        });
    });
});
