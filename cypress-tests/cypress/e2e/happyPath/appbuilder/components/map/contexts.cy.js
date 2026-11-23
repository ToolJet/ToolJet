/**
 * SPEC — Map — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   Map-BRW-004 — with the app in dark mode the map hands darkModeStyles to the real SDK (every styled tile the
 *                 SDK requests carries the dark style payload) and the search box takes the dark classes; light
 *                 mode requests no dark-styled tile (control)
 * Environment note: the dev key answers BillingNotEnabledMapError, and Google then swaps every requested style for
 * its own "development purposes only" dimming — so the PAINTED tiles cannot turn dark here. The assertion is on the
 * style payload the real SDK sends (Map.jsx:263 options.styles), which is what a billed key paints. CI has no key at
 * all: then Google sends only its own dimming style with each tile, so the always-on assertion is the style array the
 * real google.maps.Map instance holds, and the tile payload is checked on top whenever a key is configured.
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, addMapsViaApi, openMapAppInViewer,
 * tileStyleStrings, mapInstanceStyles, mapsKeyConfigured.
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
    mapInstanceStyles,
    mapsKeyConfigured,
    emulateKeylessMaps,
    withoutMapsKey,
} from "Support/utils/appBuilder/components/map";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = mapText.defaultWidgetName;
const T = mapText;

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Map — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Map-contexts-${Cypress._.uniqueId()}`);
            emulateKeylessMaps();
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
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
            emulateKeylessMaps();
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
            mapInstanceStyles(W, (styles) =>
                expect(Array.isArray(styles) && styles.length > 0, 'light: no style array on the map').to.eq(false)); // Map.jsx:263 ''
            tileStyleStrings().then((styles) => {
                expect(styles.filter(hasDarkPayload), 'light: dark-styled tile requests').to.have.length(0);
            });

            // dark: the SDK requests its tiles with the darkModeStyles payload; the search box goes dark
            cy.apiUpdateGlobalSettings({ appMode: 'dark' });
            openMapAppInViewer([W]); // a fresh page: Resource Timing only holds this load's tile requests
            cy.get('.dark-theme', { timeout: 30000 }).should('exist');
            cy.get(mapSelector.searchInput(W)).should(($i) =>
                T.searchDarkClasses.forEach((c) => expect($i[0].classList.contains(c), `dark: ${c}`).to.eq(true))); // source: Map.jsx:278
            // the real google.maps.Map holds the darkModeStyles array (styles.js) — with or without an API key
            mapInstanceStyles(W, (styles) => {
                expect(styles, 'dark: style array on the map').to.be.an('array').and.not.be.empty;
                const colours = styles.flatMap((rule) => (rule.stylers || []).map((st) => st.color).filter(Boolean));
                expect(colours, 'dark: every darkModeStyles colour').to.include.members(T.darkStyleColors); // source: styles.js:7-133
            });
            // with a key the SDK also requests its tiles with that payload; with none (CI) Google replaces every
            // tile style with its own development-mode dimming, so there is no app style on the wire to read
            mapsKeyConfigured().then((hasKey) => {
                if (!hasKey) return;
                tileStyleStrings().then((styles) => {
                    expect(styles.filter(hasDarkPayload).length, 'dark: tile requests carrying every darkModeStyles colour').to.be.gte(1);
                });
            });
        });
    });

    // Map.jsx draws a note instead of the map when the server hands the app no GOOGLE_MAPS_API_KEY: Google would
    // otherwise paint its own error over a grey box.
    describe('no API key', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Map-contexts-${Cypress._.uniqueId()}`);
            withoutMapsKey();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('without a key the editor and the running app show the add-a-key note and no map', () => {
            addMapsViaApi([{ name: W, layout: { top: 40, left: 2, width: 20, height: 420 } }]);
            const expectNote = (context) => {
                cy.get(mapSelector.noKeyNote(W), { timeout: 30000 }).should('be.visible').and(($n) => {
                    expect($n.find('.map-widget-no-key-title').text(), `${context}: title`).to.eq(T.noKeyTitle);
                    expect($n.find('.map-widget-no-key-hint').text(), `${context}: hint`).to.eq(T.noKeyHint);
                });
                cy.get(mapSelector.gmRoot(W)).should('not.exist');
                cy.get(mapSelector.searchInput(W)).should('not.exist');
            };
            cy.openApp('', undefined, undefined, mapSelector.container(W));
            expectNote('editor');
            cy.visit(`/applications/${Cypress.env('appId')}/home?version=v1`); // the preview of the editing version
            expectNote('running app');
        });
    });
});
