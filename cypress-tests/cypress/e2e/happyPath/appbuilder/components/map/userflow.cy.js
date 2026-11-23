/**
 * SPEC — Map — userflow facet (real Google Maps JS SDK in the running app).
 * FOR AI: TESTING.md browser scenarios that need real map interaction:
 *   Map-BRW-001 — the real map renders tiles at the configured centre, pans (real drag + camera control) and
 *                 zooms (camera control), and the widget publishes each settled viewport
 *   Map-BRW-002 — clicking the live map adds a marker at the real clicked coordinates; dragging the map moves
 *                 the published centre by the real pixel geometry
 *   (Map-BRW-003 wiring only — real Places predictions need a billed key; see the last test's note)
 * Published numbers are checked against real pixels with Web-Mercator maths (zoom fixed at 12 — Map.jsx:262):
 * an SDK default marker icon is anchored at its lat/lng, so its on-screen anchor is ground truth.
 * Environment: the dev key answers BillingNotEnabledMapError — the SDK keeps working in development mode
 * (watermarked tiles + a dialog that openMapAppInViewer closes); Places requests are denied.
 * Helpers: addMapsViaApi, mapProbe, readMapProbe, openMapAppInViewer, mapBoxes, dragMapBy, pixelToLatLng,
 * mercator, degPerPx, mapResourceUrls, counterEvent.
 */
import { fake } from "Fixtures/fake";
import { mapSelector } from "Selectors/appBuilder/components/map";
import { mapText } from "Texts/appBuilder/components/map";
import {
    addMapsViaApi,
    mapProbe,
    readMapProbe,
    openMapAppInViewer,
    mapBoxes,
    dragMapBy,
    pixelToLatLng,
    mercator,
    degPerPx,
    mapResourceUrls,
    emulateKeylessMaps,
} from "Support/utils/appBuilder/components/map";
import { counterEvent } from "Support/utils/appBuilder/components/icon";

const T = mapText;
const Z = T.zoom; // source: Map.jsx:262
const PX = 2; // on-screen tolerance (px)
const DEG = degPerPx(Z); // one screen pixel in degrees of longitude at zoom 12
const NO_POLYGON = { value: '{{[]}}' }; // a polygon would swallow map clicks (Map.jsx:285-298)

const loc = (lat, lng) => ({ value: `{{ {"lat": ${lat}, "lng": ${lng}} }}` });
const markersOf = (list) => ({ value: `{{ ${JSON.stringify(list)} }}` });
const expectLatLng = (actual, expected, tolDeg, label) => {
    expect(actual[0], `${label} lat`).to.be.closeTo(expected.lat, tolDeg);
    expect(actual[1], `${label} lng`).to.be.closeTo(expected.lng, tolDeg);
};

describe('Map — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Map-userflow-${Cypress._.uniqueId()}`);
        emulateKeylessMaps();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Map-BRW-001 ──────────────────────────────────────────────────────────
    // Map.jsx:257-270 mounts GoogleMap (center = sanitised initialLocation, zoom 12) once the shared loader has the
    // SDK (useJsApiLoader, Map.jsx:86-90); handleIdle (Map.jsx:135-162) publishes bounds/center on every settle.
    it('[Map-BRW-001] Real map renders tiles at the configured centre, pans and zooms', () => {
        const home = { lat: 48.8566, lng: 2.3522 }; // dynamic: a non-default configured centre (Paris)
        addMapsViaApi([
            {
                name: 'map1',
                layout: { top: 40, left: 2, width: 20, height: 420 },
                properties: { initialLocation: loc(home.lat, home.lng), defaultMarkers: markersOf([home]), polygonPoints: NO_POLYGON },
            },
            mapProbe('probe', 'map1'),
        ]);
        openMapAppInViewer(['map1']);

        // renders: real raster tiles cover the viewport centre, the widget publishes the configured centre and
        // the SDK draws the configured marker exactly at the viewport centre
        cy.get(mapSelector.tiles('map1')).should(($tiles) => {
            // 256 CSS px per tile (the SDK fetches 512px images on a 2x screen)
            const loaded = [...$tiles].filter((t) => t.complete && t.naturalWidth > 0 && Math.round(t.getBoundingClientRect().width) === T.tileSize);
            expect(loaded.length, 'loaded 256px tiles').to.be.gte(4);
        });
        mapBoxes('map1', (b) => {
            const atCentre = [...Cypress.$(mapSelector.tiles('map1'))].some((t) => {
                const r = t.getBoundingClientRect();
                return r.left <= b.viewport.cx && r.right >= b.viewport.cx && r.top <= b.viewport.cy && r.bottom >= b.viewport.cy;
            });
            expect(atCentre, 'a tile under the viewport centre').to.eq(true);
            expect(b.markers, 'one SDK marker').to.have.length(1);
            expect(b.markers[0].x, 'marker x at viewport centre').to.be.closeTo(b.viewport.cx, PX);
            expect(b.markers[0].y, 'marker y at viewport centre').to.be.closeTo(b.viewport.cy, PX);
        });
        readMapProbe('probe', (s) => {
            expectLatLng(s.c, home, 1e-9, 'published centre');
            expect(s.ne, 'bounds published on the load settle').to.be.an('array');
        });

        // pan — a real drag: the marker follows the pointer and the published centre moves by exactly the
        // pixels the map actually moved (ground truth: the marker's own displacement)
        const drag = { dx: -160, dy: -70 }; // dynamic: pan gesture
        let before;
        mapBoxes('map1', (b) => {
            before = b;
        });
        cy.then(() => dragMapBy('map1', { x: before.viewport.width / 2 + 120, y: before.viewport.height / 2 + 80 }, drag));
        mapBoxes('map1', (b) => {
            const moved = { x: b.markers[0].x - before.markers[0].x, y: b.markers[0].y - before.markers[0].y };
            // the SDK swallows its drag-start threshold, so the map trails the pointer by a few dozen px
            expect(moved.x, 'marker followed the drag (x)').to.be.within(drag.dx * 1.15, drag.dx * 0.6);
            expect(moved.y, 'marker followed the drag (y)').to.be.within(drag.dy * 1.15, drag.dy * 0.6);
        });
        cy.then(() =>
            mapBoxes('map1', (b) => {
                const moved = { x: b.markers[0].x - before.markers[0].x, y: b.markers[0].y - before.markers[0].y };
                const expected = pixelToLatLng([home.lat, home.lng], Z, -moved.x, -moved.y);
                const s = JSON.parse(Cypress.$(mapSelector.draggableWidget('probe')).text().trim());
                expectLatLng(s.c, expected, DEG, 'published centre after the drag');
            })
        );

        // pan — the SDK camera control "Move left" shifts the viewport west; centre latitude is kept
        let panned;
        readMapProbe('probe').then((s) => {
            panned = s;
        });
        cy.get(mapSelector.cameraControls('map1')).click();
        cy.get(mapSelector.cameraButton('map1', 'Move left')).click();
        cy.then(() =>
            readMapProbe('probe', (s) => {
                expect(s.c[1], 'centre moved west').to.be.lessThan(panned.c[1] - 10 * DEG);
                expect(s.c[0], 'latitude kept').to.be.closeTo(panned.c[0], 1e-6);
            })
        );

        // zoom — Zoom in halves the published bounds span around the same centre; Zoom out restores it
        let wide;
        cy.wait(500);
        readMapProbe('probe').then((s) => {
            wide = s;
        });
        cy.get(mapSelector.cameraButton('map1', 'Zoom in')).click();
        cy.then(() =>
            readMapProbe('probe', (s) => {
                const ratio = (s.ne[1] - s.sw[1]) / (wide.ne[1] - wide.sw[1]);
                expect(ratio, 'lng span after Zoom in').to.be.closeTo(0.5, 0.002);
                expectLatLng(s.c, { lat: wide.c[0], lng: wide.c[1] }, 1e-6, 'centre kept on zoom');
            })
        );
        mapBoxes('map1', (b) => {
            // the configured marker sits twice as far from the centre at zoom 13
            const p = mercator.project(home.lat, home.lng, Z + 1);
            const c = mercator.project(wide.c[0], wide.c[1], Z + 1);
            expect(b.markers[0].x - b.viewport.cx, 'marker x at zoom 13').to.be.closeTo(p.x - c.x, PX);
            expect(b.markers[0].y - b.viewport.cy, 'marker y at zoom 13').to.be.closeTo(p.y - c.y, PX);
        });
        cy.get(mapSelector.cameraButton('map1', 'Zoom out')).click();
        cy.then(() =>
            readMapProbe('probe', (s) => {
                expect(s.ne[1] - s.sw[1], 'lng span back after Zoom out').to.be.closeTo(wide.ne[1] - wide.sw[1], 1e-6);
                expect(s.ne[0] - s.sw[0], 'lat span back after Zoom out').to.be.closeTo(wide.ne[0] - wide.sw[0], 1e-6);
            })
        );
    });

    // ── Map-BRW-002 ──────────────────────────────────────────────────────────
    // Map.jsx:111-125 handleMapClick reads the SDK's real e.latLng, appends it to markers, publishes markers and
    // fires onCreateMarker; a drag publishes the moved centre on idle (Map.jsx:135-162) and adds nothing.
    it('[Map-BRW-002] Click-to-add and map drag produce the real coordinates', () => {
        const home = { lat: 51.5074, lng: -0.1278 }; // dynamic: configured centre (London)
        addMapsViaApi([
            {
                name: 'map1',
                layout: { top: 40, left: 2, width: 20, height: 420 },
                properties: { initialLocation: loc(home.lat, home.lng), defaultMarkers: markersOf([]), polygonPoints: NO_POLYGON },
                events: [counterEvent(T.eventOnCreateMarker, 'created')], // source: map.js:97
            },
            mapProbe('probe', 'map1', {}, ['created']),
        ]);
        openMapAppInViewer(['map1']);
        readMapProbe('probe', (s) => {
            expectLatLng(s.c, home, 1e-9, 'configured centre');
            expect(s.m, 'no markers yet').to.deep.eq([]);
        });

        // click a point off-centre (clear of the overlay pin and the SDK controls)
        const click = { dx: 130, dy: 95 }; // dynamic: offset from the viewport centre (px)
        let view;
        mapBoxes('map1', (b) => {
            view = b.viewport;
        });
        cy.then(() =>
            cy.get(mapSelector.mapViewport('map1')).realClick({ x: view.width / 2 + click.dx, y: view.height / 2 + click.dy, scrollBehavior: false })
        );
        const expected = pixelToLatLng([home.lat, home.lng], Z, click.dx, click.dy);
        readMapProbe('probe', (s) => {
            expect(s.created, 'onCreateMarker fired once').to.eq(1);
            expect(s.m, 'one marker added').to.have.length(1);
            expectLatLng([s.m[0].lat, s.m[0].lng], expected, DEG, 'added marker');
        });
        // the SDK draws the added marker anchored on the clicked pixel
        mapBoxes('map1', (b) => {
            expect(b.markers, 'SDK markers').to.have.length(1);
            expect(b.markers[0].x, 'added marker anchor x').to.be.closeTo(b.viewport.cx + click.dx, PX);
            expect(b.markers[0].y, 'added marker anchor y').to.be.closeTo(b.viewport.cy + click.dy, PX);
        });

        // drag the map: the published centre follows the real geometry — the added marker's on-screen offset from
        // the viewport centre equals the Mercator offset between its lat/lng and the published centre
        dragMapBy('map1', { x: 200, y: 150 }, { dx: -110, dy: -60 }); // dynamic: pan gesture
        mapBoxes('map1', (b) => {
            expect(b.markers[0].x, 'marker moved with the map').to.be.lessThan(b.viewport.cx + click.dx - 60);
        });
        cy.then(() =>
            mapBoxes('map1', (b) => {
                const s = JSON.parse(Cypress.$(mapSelector.draggableWidget('probe')).text().trim());
                expect(s.m, 'a drag adds no marker').to.have.length(1);
                expect(s.created, 'a drag fires no onCreateMarker').to.eq(1);
                const m = mercator.project(s.m[0].lat, s.m[0].lng, Z);
                const c = mercator.project(s.c[0], s.c[1], Z);
                expect(b.markers[0].x - b.viewport.cx, 'marker x offset = published geometry').to.be.closeTo(m.x - c.x, PX);
                expect(b.markers[0].y - b.viewport.cy, 'marker y offset = published geometry').to.be.closeTo(m.y - c.y, PX);
            })
        );
    });

    // Map-BRW-003 stays QA-owned: real Places predictions need a billed key (this key answers
    // BillingNotEnabledMapError, so the service returns no rows). This test covers only the ToolJet-owned wiring
    // that holds with any key: the search input (Map.jsx:272-281) is bound to the real Places Autocomplete, which
    // queries the service with what the user typed, and an empty suggestion list is never shown
    // (styles.scss:1-3 `.pac-container:not(:has(.pac-item))` — PR 17594).
    it('search box drives the real Places Autocomplete service (BRW-003 wiring)', () => {
        const query = fake.firstName.replace(/\W/g, '').slice(0, 6) || 'Paris'; // dynamic: typed search text
        addMapsViaApi([{ name: 'map1', layout: { top: 40, left: 2, width: 20, height: 420 } }]);
        openMapAppInViewer(['map1']);

        cy.get(mapSelector.searchInput('map1'))
            .should('have.attr', 'placeholder', T.searchPlaceholder) // source: Map.jsx:276
            .and('have.class', 'pac-target-input'); // the SDK Autocomplete took the input over
        cy.get(mapSelector.searchInput('map1')).realClick({ scrollBehavior: false });
        cy.get(mapSelector.searchInput('map1')).realType(query, { delay: 60 });
        // the SDK queries the Places service (JSONP) with the typed text as it grows — poll Resource Timing
        const predictedTexts = (urls) => urls.map((u) => (u.match(/[?&]1s([^&]*)/) || [])[1]);
        const waitForQuery = (left = 20) =>
            mapResourceUrls(T.placesPredictionPath).then((urls) => {
                if (predictedTexts(urls).includes(query) || left === 0) return urls;
                return cy.wait(500).then(() => waitForQuery(left - 1));
            });
        waitForQuery().then((urls) => {
            expect(urls.length, 'prediction requests sent').to.be.gte(1);
            expect(predictedTexts(urls), 'the service is queried with what the user typed').to.include(query);
        });
        cy.get(mapSelector.pacContainer).should(($pac) => {
            [...$pac].forEach((p) => {
                if (!p.querySelector(mapSelector.pacItem)) expect(getComputedStyle(p).display, 'empty suggestion list hidden').to.eq('none');
            });
        });
    });
});
