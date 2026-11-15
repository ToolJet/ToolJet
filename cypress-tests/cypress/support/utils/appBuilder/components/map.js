/**
 * MODULE — appBuilder/components/map: browser-only helpers for the Map widget (real Google Maps JS SDK).
 * FOR AI: addMapsViaApi seeds Maps (map.js definition defaults merged) plus helper widgets and their events in one
 * components POST; mapProbe/readMapProbe expose the widget's published center/bounds/markers through a Text
 * widget; openMapAppInViewer opens the running app, waits for real tiles and closes Google's unbilled-key dialog;
 * mapBoxes reads the real layout boxes (viewport, centre overlay pin tip, SDK marker anchors, search input);
 * mercator/pixelToLatLng/viewportBounds are Web-Mercator maths to check published numbers against real pixels;
 * dragMapBy pans with real CDP mouse events; trackTileRequests/tileStyleStrings decode the style payload the
 * SDK sends with each styled raster tile request.
 */
import { mapText } from "Texts/appBuilder/components/map";
import { mapSelector } from "Selectors/appBuilder/components/map";

const authHeaders = (cookie) => ({
  "Content-Type": "application/json",
  "Tj-Workspace-Id": Cypress.env("workspaceId"),
  Cookie: `tj_auth_token=${cookie.value}`,
});

/**
 * @tjBlock  contexts
 * @tjUsage  addMapsViaApi([{ name: 'map1', layout: { top: 40, left: 2, width: 20, height: 420 }, properties: { initialLocation: { value: '{{ {"lat": 1, "lng": 2} }}' } }, events: [counterEvent('onCreateMarker', 'created')] }, mapProbe('probe', 'map1')])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components
 *           (a Map gets map.js definition defaults merged with the overrides, any other `type` only what is
 *           passed) → POST .../events per handler (merged over { actionId: 'show-alert', alertType: 'info' }).
 *           Sets Cypress.env('editingVersionId') (apiUpdateGlobalSettings reads it).
 */
export const addMapsViaApi = (items, appIdArg) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = authHeaders(cookie);
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      Cypress.env("editingVersionId", versionId);
      const D = mapText.definition;
      const ids = {};
      items.forEach((item) => {
        ids[item.name] = crypto.randomUUID();
      });
      const diff = {};
      const events = [];
      items.forEach((item) => {
        const id = ids[item.name];
        const type = item.type || "Map";
        const isMap = type === "Map";
        const layout = {
          top: 40,
          left: 2,
          width: mapText.defaultSize.width,
          height: isMap ? mapText.defaultSize.height : 40,
          ...item.layout,
        };
        diff[id] = {
          name: item.name,
          type,
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: { ...(isMap ? D.properties : {}), ...item.properties },
          styles: { ...(isMap ? D.styles : {}), ...item.styles },
          others: { ...(isMap ? D.others : {}), ...item.others },
          validation: {},
        };
        (item.events || []).forEach((e, index) => {
          events.push({
            name: e.eventId, // event_handlers.name is NOT NULL (the editor stores the event id)
            event: { actionId: "show-alert", alertType: "info", ...e },
            eventType: "component",
            attachedTo: id,
            index,
          });
        });
      });
      cy.request({
        method: "POST",
        url: `${api}/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: { is_user_switched_version: false, pageId, diff },
        failOnStatusCode: false,
      }).then((r) => expect(r.status, `create components: ${JSON.stringify(r.body)}`).to.eq(201));
      events.forEach((body) =>
        cy
          .request({
            method: "POST",
            url: `${api}/v2/apps/${appId}/versions/${versionId}/events`,
            headers,
            body,
            failOnStatusCode: false,
          })
          .then((r) => expect(r.status, `create event: ${JSON.stringify(r.body)}`).to.be.oneOf([200, 201]))
      );
    });
  });

/**
 * @tjBlock  events
 * @tjUsage  mapProbe('probe', 'map1', { top: 40, left: 25 }, ['created'])
 * @tjDom    a Text widget rendering JSON of the map's published center [lat,lng], bounds NE/SW [lat,lng], markers
 *           and the given counter variables (googleMapUrl is left out: the Text widget renders `&center` as `¢er`)
 */
export const mapProbe = (name, mapName, layout = {}, counters = []) => {
  const m = `components.${mapName}`;
  const pair = (p) => `(${p} ? [${p}.lat, ${p}.lng] : null)`;
  const counts = counters.map((k) => `${k}: variables.${k} ?? 0`).join(", ");
  return {
    type: "Text",
    name,
    layout: { top: 40, left: 25, width: 18, height: 160, ...layout },
    properties: {
      text: {
        value: `{{JSON.stringify({ c: ${pair(`${m}.center`)}, ne: ${pair(`(${m}.bounds || {}).northEast`)}, sw: ${pair(`(${m}.bounds || {}).southWest`)}, m: ${m}.markers${counts ? `, ${counts}` : ""} })}}`,
      },
    },
  };
};

/**
 * @tjBlock  events
 * @tjUsage  readMapProbe('probe', (s) => expect(s.ne).to.not.eq(null)).then((s) => …)
 * @tjDom    parses the probe Text widget's JSON (retrying until it parses and `assertFn` passes); yields the object
 */
export const readMapProbe = (name, assertFn) =>
  cy
    .get(mapSelector.draggableWidget(name), { timeout: 30000 })
    .should(($el) => {
      let state;
      try {
        state = JSON.parse($el.text().trim());
      } catch (e) {
        throw new Error(`probe ${name} is not JSON yet: "${$el.text().trim()}"`);
      }
      if (assertFn) assertFn(state);
    })
    .then(($el) => JSON.parse($el.text().trim()));

/**
 * @tjBlock  canvas
 * @tjUsage  waitForMapTiles('map1')
 * @tjDom    retries until the SDK root is mounted and at least `min` raster tiles inside the viewport finished loading
 */
export const waitForMapTiles = (name, min = 2) =>
  cy.get(mapSelector.gmRoot(name), { timeout: 30000 }).should(($gm) => {
    const view = $gm[0].getBoundingClientRect();
    const loaded = [...$gm[0].querySelectorAll('img[src*="/maps/vt"]')].filter((img) => {
      const r = img.getBoundingClientRect();
      const inView = r.right > view.left && r.left < view.right && r.bottom > view.top && r.top < view.bottom;
      return inView && img.complete && img.naturalWidth > 0;
    });
    expect(loaded.length, `${name}: loaded tiles in the viewport`).to.be.gte(min);
  });

/**
 * @tjBlock  contexts
 * @tjUsage  dismissMapsDevDialog()
 * @tjDom    polls (every 500ms, up to `maxMs`) for Google's "This page can't load Google Maps correctly" dialog —
 *           shown once the SDK key check fails (unbilled/invalid key; the map keeps working in development mode) —
 *           and closes every instance; with a billed key it never appears and this just waits `maxMs`.
 *           (cy.intercept does not see the key-check JSONP script, so there is no request to wait on.)
 */
export const dismissMapsDevDialog = (maxMs = 15000) => {
  const poll = (left) =>
    cy.document({ log: false }).then((doc) => {
      const buttons = doc.querySelectorAll(mapSelector.devDialogDismiss);
      if (buttons.length) {
        buttons.forEach((btn) => btn.click());
        return cy.get(mapSelector.devDialogDismiss).should("not.exist");
      }
      if (left <= 0) return null;
      return cy.wait(500, { log: false }).then(() => poll(left - 500));
    });
  return poll(maxMs);
};

/**
 * @tjBlock  contexts
 * @tjUsage  openMapAppInViewer(['map1', 'map2'], { query: '' })
 * @tjDom    visits /applications/<appId>/home?version=v1<query> (Resource Timing buffer raised so mapResourceUrls
 *           sees every SDK request), waits for real tiles in every named map and closes Google's dev-mode dialog
 */
export const openMapAppInViewer = (names, { appId, query = "" } = {}) => {
  cy.then(() =>
    cy.visit(`/applications/${appId || Cypress.env("appId")}/home?version=v1${query}`, {
      // keep every SDK request in Resource Timing (tiles + JSONP scripts — cy.intercept does not see them all)
      onBeforeLoad: (win) => win.performance.setResourceTimingBufferSize(20000),
    })
  );
  names.forEach((name) => waitForMapTiles(name));
  dismissMapsDevDialog();
};

// ── Web Mercator (Google Maps world coordinates: 256px world at zoom 0) ─────────────────────────────────
const worldSize = (zoom) => mapText.tileSize * 2 ** zoom;

/**
 * @tjBlock  canvas
 * @tjUsage  mercator.project(51.5, -0.12, 12) → { x, y } ; mercator.unproject(x, y, 12) → { lat, lng }
 * @tjDom    pure maths — no DOM
 */
export const mercator = {
  project: (lat, lng, zoom) => {
    const s = Math.sin((lat * Math.PI) / 180);
    return {
      x: (worldSize(zoom) * (lng + 180)) / 360,
      y: worldSize(zoom) * (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)),
    };
  },
  unproject: (x, y, zoom) => {
    const n = Math.PI - (2 * Math.PI * y) / worldSize(zoom);
    return {
      lat: (180 / Math.PI) * Math.atan(Math.sinh(n)),
      lng: (360 * x) / worldSize(zoom) - 180,
    };
  },
};

/**
 * @tjBlock  canvas
 * @tjUsage  pixelToLatLng([lat, lng], 12, dx, dy) → { lat, lng } of the point dx/dy px from the viewport centre
 * @tjDom    pure maths — no DOM
 */
export const pixelToLatLng = ([lat, lng], zoom, dx, dy) => {
  const c = mercator.project(lat, lng, zoom);
  return mercator.unproject(c.x + dx, c.y + dy, zoom);
};

/**
 * @tjBlock  canvas
 * @tjUsage  viewportBounds([lat, lng], 12, width, height) → { ne: [lat, lng], sw: [lat, lng] }
 * @tjDom    pure maths — the NE/SW corners of a width×height px viewport centred on [lat, lng]
 */
export const viewportBounds = (center, zoom, width, height) => {
  const ne = pixelToLatLng(center, zoom, width / 2, -height / 2);
  const sw = pixelToLatLng(center, zoom, -width / 2, height / 2);
  return { ne: [ne.lat, ne.lng], sw: [sw.lat, sw.lng] };
};

/** degrees of longitude per screen pixel at `zoom` — the tolerance unit for "same pixel" comparisons */
export const degPerPx = (zoom) => 360 / worldSize(zoom);

/**
 * @tjBlock  canvas
 * @tjUsage  mapBoxes('map1', (b) => expect(b.pinTip.x).to.be.closeTo(b.viewport.cx, 3))
 * @tjDom    retries the callback with: the GoogleMap viewport rect (+cx/cy), the widget root and grid box, the
 *           centre overlay pin tip (marker.svg drawn `meet` inside its 24x64 <img>), the anchor (bottom-centre) of
 *           every SDK default marker icon, and the search input rect
 */
export const mapBoxes = (name, assertFn) =>
  cy.get(mapSelector.container(name), { timeout: 30000 }).should(($c) => {
    const doc = $c[0].ownerDocument;
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };
    const img = doc.querySelector(mapSelector.overlayImg(name));
    let pinTip = null;
    if (img) {
      const r = img.getBoundingClientRect();
      const { width: vw, height: vh, tipX, tipY } = mapText.markerSvg;
      const scale = Math.min(r.width / vw, r.height / vh); // preserveAspectRatio xMidYMid meet
      pinTip = {
        x: r.left + (r.width - vw * scale) / 2 + tipX * scale,
        y: r.top + (r.height - vh * scale) / 2 + tipY * scale,
      };
    }
    // the SDK draws each marker icon twice (icon layer + clickable overlay); keep the icon images only
    const markers = [...doc.querySelectorAll(mapSelector.googleMarkers(name))].map((m) => {
      const r = m.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.bottom };
    });
    assertFn({
      viewport: rect(doc.querySelector(mapSelector.mapViewport(name))),
      container: rect($c[0]),
      widget: rect(doc.querySelector(mapSelector.draggableWidget(name))),
      pinTip,
      markers,
      search: rect(doc.querySelector(mapSelector.searchInput(name))),
    });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  dragMapBy('map1', { x: 400, y: 300 }, { dx: -150, dy: -60 })
 * @tjDom    real CDP mouse down / stepped moves / pause / up on the GoogleMap viewport (positions relative to it);
 *           the pause before release keeps the SDK's kinetic pan from carrying the map further
 */
export const dragMapBy = (name, from, { dx, dy }, steps = 6) => {
  const opts = { scrollBehavior: false };
  cy.get(mapSelector.mapViewport(name)).realMouseMove(from.x, from.y, opts);
  cy.get(mapSelector.mapViewport(name)).realMouseDown({ x: from.x, y: from.y, ...opts });
  for (let i = 1; i <= steps; i++) {
    cy.get(mapSelector.mapViewport(name)).realMouseMove(from.x + (dx * i) / steps, from.y + (dy * i) / steps, opts);
    cy.wait(50);
  }
  cy.wait(400);
  cy.get(mapSelector.mapViewport(name)).realMouseUp({ x: from.x + dx, y: from.y + dy, ...opts });
};

/**
 * @tjBlock  contexts
 * @tjUsage  mapResourceUrls('/maps/vt').then((urls) => …)
 * @tjDom    decoded URLs of every request the page made (Resource Timing — images and JSONP scripts included) whose
 *           URL contains `fragment`; open the app with openMapAppInViewer so the buffer holds them all
 */
export const mapResourceUrls = (fragment) =>
  cy.window().then((win) =>
    win.performance
      .getEntriesByType("resource")
      .map((e) => {
        try {
          return decodeURIComponent(e.name);
        } catch (err) {
          return e.name;
        }
      })
      .filter((u) => u.includes(fragment))
  );

/**
 * @tjBlock  contexts
 * @tjUsage  tileStyleStrings().then((styles) => expect(styles.some((s) => s.includes('p.c:#021019'))).to.eq(true))
 * @tjDom    the decoded `styles` payload (`…!1sstyles!2z<base64>…`, e.g. "s.t:6|p.c:#021019,…") of every SDK raster
 *           tile request (maps.googleapis.com/maps/vt) made by the current page that carries one
 */
export const tileStyleStrings = () =>
  mapResourceUrls(`maps.googleapis.com${mapText.tilePath}?`).then((urls) => {
    const out = [];
    urls.forEach((u) => {
      const m = u.match(/1sstyles!2z([A-Za-z0-9+/_=-]+)/);
      if (!m) return;
      try {
        out.push(atob(m[1].replace(/-/g, "+").replace(/_/g, "/")));
      } catch (e) {
        /* not base64 — ignore */
      }
    });
    return out;
  });
