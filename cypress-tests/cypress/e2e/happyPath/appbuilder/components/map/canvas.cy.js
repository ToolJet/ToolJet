/**
 * SPEC — Map — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   Map-BRW-005 — the centre overlay pin sits at the map centre for every container size (viewer maps of two
 *                 sizes, an editor resize), and the published bounds are the real viewport's NE/SW numbers
 *                 (also after a real drag)
 *   Map-BRW-006 — on a map narrower than 256px the search box shrinks to the map width minus 16px and stays
 *                 inside it; a wide map keeps the 240px box (control)
 * The overlay is `position: fixed` with right/top computed from the widget's width/height props (Map.jsx:248-256);
 * the grid box's transform makes it the containing block. Bounds are checked with Web-Mercator maths (zoom 12).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addMapsViaApi, mapProbe, readMapProbe, openMapAppInViewer, waitForMapTiles, mapBoxes, dragMapBy,
 * viewportBounds, degPerPx, resizeWidgetBy.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { mapSelector } from "Selectors/appBuilder/components/map";
import { mapText } from "Texts/appBuilder/components/map";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    verifyWidgetCount,
    duplicateWidgetByKeyboard,
    duplicateWidgetFromMenu,
    copyPasteWidget,
    cutWidget,
    pasteWidget,
    nudgeWidget,
    selectAllWidgets,
    multiSelectWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import {
    addMapsViaApi,
    mapProbe,
    readMapProbe,
    openMapAppInViewer,
    waitForMapTiles,
    mapBoxes,
    dragMapBy,
    viewportBounds,
    degPerPx,
} from "Support/utils/appBuilder/components/map";
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";

const W = mapText.defaultWidgetName;
const T = mapText;
const Z = T.zoom; // source: Map.jsx:262
const DEG = degPerPx(Z); // one screen pixel (degrees of longitude) at zoom 12
const PIN = 3; // overlay pin tolerance (px): the 24px image is offset by whole pixels (Map.jsx:251-252)

const loc = (lat, lng) => ({ value: `{{ {"lat": ${lat}, "lng": ${lng}} }}` });

// the overlay pin tip sits on the GoogleMap viewport centre
const expectPinAtCentre = (name) =>
    mapBoxes(name, (b) => {
        expect(b.pinTip, `${name} overlay`).to.not.eq(null);
        expect(b.pinTip.x, `${name} pin x`).to.be.closeTo(b.viewport.cx, PIN);
        expect(b.pinTip.y, `${name} pin y`).to.be.closeTo(b.viewport.cy, PIN);
    });

// the published NE/SW are the corners of the real viewport around the published centre
const expectBoundsMatchViewport = (name, probe) =>
    mapBoxes(name, (b) => {
        const s = JSON.parse(Cypress.$(mapSelector.draggableWidget(probe)).text().trim());
        expect(s.ne, `${name} bounds published`).to.be.an('array');
        const exp = viewportBounds(s.c, Z, b.viewport.width, b.viewport.height);
        expect(s.ne[0], `${name} NE lat`).to.be.closeTo(exp.ne[0], DEG);
        expect(s.ne[1], `${name} NE lng`).to.be.closeTo(exp.ne[1], DEG);
        expect(s.sw[0], `${name} SW lat`).to.be.closeTo(exp.sw[0], DEG);
        expect(s.sw[1], `${name} SW lng`).to.be.closeTo(exp.sw[1], DEG);
    });

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Map — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Map-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            waitForMapTiles(W);
            // definition size (map.js:6-9): the grid box height
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, 2)); // source: map.js:8
            verifyWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 120, before.y + before.h + 90);
                verifyWidgetResized(W, before);
            });
        });

        it('nudge (arrow keys) moves the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                nudgeWidget(W, 'ArrowRight', 12);
                verifyWidgetMoved(W, before);
            });
        });

        it('duplicate via keyboard (Cmd/Ctrl+D)', () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget('Text', 400, 700);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, 'text1']);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'officemap'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Map-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Map-BRW-005 ──────────────────────────────────────────────────────
        // Map.jsx:248-256 positions the overlay from the width/height props; handleIdle (Map.jsx:135-155) publishes
        // the SDK's getBounds() NE/SW and the map centre after every settle.
        it('[Map-BRW-005] The centre overlay sits at the map centre for every size and bounds are the real viewport', () => {
            const big = { lat: 35.6762, lng: 139.6503 }; // dynamic: configured centre (Tokyo)
            const small = { lat: -33.8688, lng: 151.2093 }; // dynamic: configured centre (Sydney)
            addMapsViaApi([
                { name: 'mapbig', layout: { top: 40, left: 2, width: 20, height: 420 }, properties: { initialLocation: loc(big.lat, big.lng) } },
                { name: 'mapsmall', layout: { top: 500, left: 2, width: 9, height: 260 }, properties: { initialLocation: loc(small.lat, small.lng) } },
                mapProbe('probebig', 'mapbig', { top: 40 }),
                mapProbe('probesmall', 'mapsmall', { top: 500 }),
            ]);
            openMapAppInViewer(['mapbig', 'mapsmall']);

            // two container sizes: the pin tip is on each viewport's centre
            expectPinAtCentre('mapbig');
            expectPinAtCentre('mapsmall');
            mapBoxes('mapsmall', (b) => expect(b.viewport.width, 'small map really is smaller').to.be.lessThan(320));

            // live bounds = the real viewport around the configured centre
            readMapProbe('probebig', (s) => {
                expect(s.c[0], 'big centre lat').to.be.closeTo(big.lat, 1e-9);
                expect(s.c[1], 'big centre lng').to.be.closeTo(big.lng, 1e-9);
            });
            readMapProbe('probesmall', (s) => {
                expect(s.c[0], 'small centre lat').to.be.closeTo(small.lat, 1e-9);
                expect(s.c[1], 'small centre lng').to.be.closeTo(small.lng, 1e-9);
            });
            expectBoundsMatchViewport('mapbig', 'probebig');
            expectBoundsMatchViewport('mapsmall', 'probesmall');

            // after a real drag the overlay stays put (it belongs to the widget, not the map) and the published
            // bounds follow the moved viewport
            dragMapBy('mapbig', { x: 300, y: 260 }, { dx: -140, dy: -90 }); // dynamic: pan gesture
            readMapProbe('probebig', (s) => expect(s.c[1], 'centre moved east').to.be.greaterThan(big.lng + 50 * DEG));
            expectPinAtCentre('mapbig');
            expectBoundsMatchViewport('mapbig', 'probebig');

            // editor: resizing the widget re-positions the overlay from the new container size
            cy.openApp('', undefined, undefined, mapSelector.container('mapbig'));
            cy.get('[data-cy="query-manager-toggle-button"]').click(); // the query panel covers the lower canvas
            waitForMapTiles('mapbig');
            expectPinAtCentre('mapbig');
            getWidgetRect('mapbig').as('r0');
            resizeWidgetBy('mapbig', -220, -130); // dynamic: shrink delta (px)
            cy.get('@r0').then((before) => verifyWidgetResized('mapbig', before));
            expectPinAtCentre('mapbig');
        });

        // ── Map-BRW-006 ──────────────────────────────────────────────────────
        // theme.scss .map-widget .place-search-input: width min(240px, calc(100% - 16px)), left 50% +
        // translateX(-50%) — D-14 (QA bug 8: a 206px map showed a 240px box starting 17px outside it).
        it('[Map-BRW-006] The search box stays inside a small map', () => {
            addMapsViaApi([
                { name: 'mapsmall', layout: { top: 40, left: 2, width: 6, height: 300 } },
                { name: 'mapwide', layout: { top: 40, left: 12, width: 20, height: 300 } }, // control: wide map
            ]);
            openMapAppInViewer(['mapsmall', 'mapwide']);

            mapBoxes('mapsmall', (b) => {
                expect(b.viewport.width, 'small map is narrower than 256px').to.be.lessThan(T.searchMaxWidth + T.searchInset);
                expect(b.search, 'search input').to.not.eq(null);
                expect(b.search.width, 'shrinks to map width - 16px').to.be.closeTo(b.viewport.width - T.searchInset, 1); // source: theme.scss .place-search-input
                expect(b.search.left, 'left edge inside the map').to.be.gte(b.viewport.left);
                expect(b.search.right, 'right edge inside the map').to.be.lte(b.viewport.right);
                expect(b.search.cx, 'centred').to.be.closeTo(b.viewport.cx, 1);
            });
            mapBoxes('mapwide', (b) => {
                expect(b.viewport.width, 'wide map').to.be.greaterThan(T.searchMaxWidth + T.searchInset);
                expect(b.search.width, 'wide map keeps the 240px box').to.be.closeTo(T.searchMaxWidth, 0.5); // source: theme.scss .place-search-input
                expect(b.search.cx, 'centred').to.be.closeTo(b.viewport.cx, 1);
            });
        });
    });
});
