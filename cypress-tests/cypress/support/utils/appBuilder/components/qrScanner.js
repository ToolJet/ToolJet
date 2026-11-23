/**
 * MODULE — appBuilder/components/qrScanner: in-page fake camera + helpers for the QR Scanner widget.
 * FOR AI: the shared cypress config cannot get Chromium's --use-fake-device-for-media-stream flags, and the
 * widget's camera lib (react-qr-reader) asks for the camera the moment the widget MOUNTS — on app load, before any
 * spec command could run. So the fake is installed from `window:before:load` (cy.on, per test) and re-installed on
 * every page load of the test (editor → viewer visits keep working). getUserMedia resolves with a genuine
 * `canvas.captureStream()` video MediaStream; the canvas paints a QR code fixture (or a blank frame) every 100 ms,
 * so the real <video> plays it and the lib's real jsQR worker decodes it — the end-to-end camera path minus the
 * physical lens. `deny` makes every call reject with a DOMException (NotAllowedError = permission denied,
 * NotFoundError = no camera); `noMediaDevices` removes navigator.mediaDevices the way browsers do on an insecure
 * (plain-http, non-localhost) origin. The audio-only microphone fake lives in mediaCommon.js (read-only here).
 */
import { qrScannerText } from "Texts/appBuilder/components/qrScanner";

const FRAME = 480; // fake camera frame size (px, square — the lib crops the frame to a 1:1 square anyway)

const toDataUri = (base64) => `data:image/png;base64,${base64}`;

// runs inside the AUT window (window:before:load) — plain DOM only
const installInWindow = (win, cfg) => {
  const state = { calls: [], streams: [], frames: 0, cfg };
  win.__tjFakeCam = state;
  if (cfg.noMediaDevices) {
    Object.defineProperty(win.navigator, "mediaDevices", { configurable: true, get: () => undefined });
    return;
  }
  let canvas = null;
  let img = null;
  const paint = () => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, FRAME, FRAME);
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, 60, 60, FRAME - 120, FRAME - 120);
    state.frames += 1;
  };
  state.setQr = (uri) => {
    cfg.qr = uri;
    if (!uri) {
      img = null;
      return;
    }
    const next = new win.Image();
    next.onload = () => {
      img = next;
    };
    next.src = uri;
  };
  state.setQr(cfg.qr);
  const getUserMedia = async (constraints) => {
    state.calls.push(JSON.parse(JSON.stringify(constraints || {})));
    if (cfg.deny) throw new win.DOMException("Permission denied", cfg.deny);
    if (!canvas) {
      canvas = win.document.createElement("canvas");
      canvas.width = FRAME;
      canvas.height = FRAME;
      paint();
      // a canvas stream only emits a frame when the canvas is painted — keep painting
      win.setInterval(paint, 100);
    }
    const stream = canvas.captureStream(15);
    state.streams.push(stream);
    return stream;
  };
  Object.defineProperty(win.navigator.mediaDevices, "getUserMedia", {
    configurable: true,
    writable: true,
    value: getUserMedia,
  });
};

/**
 * @tjBlock  userflow
 * @tjUsage  loadQrFixture('alpha').then((uri) => installFakeCamera({ qr: uri }))
 * @tjDom    cy.fixture(<qrScannerText.qr[key].fixture>, 'base64') → `data:image/png;base64,…` (yields the URI)
 */
export const loadQrFixture = (key) =>
  cy.fixture(qrScannerText.qr[key].fixture, "base64").then(toDataUri);

/**
 * @tjBlock  userflow
 * @tjUsage  installFakeCamera()                       // granted camera, blank frame (no QR in view)
 *           installFakeCamera({ qr: dataUri })         // granted camera showing that QR
 *           installFakeCamera({ deny: 'NotAllowedError' })   // permission denied
 *           installFakeCamera({ noMediaDevices: true })      // insecure origin: no navigator.mediaDevices
 * @tjDom    cy.on('window:before:load') → own-property navigator.mediaDevices.getUserMedia on every AUT window of
 *           this test; state in window.__tjFakeCam = { calls[], streams[], frames, cfg, setQr }. Call BEFORE
 *           cy.openApp / cy.visit (the widget asks for the camera on mount).
 */
export const installFakeCamera = ({ qr = null, deny = null, noMediaDevices = false } = {}) =>
  cy.then(() => {
    const cfg = { qr, deny, noMediaDevices };
    cy.on("window:before:load", (win) => installInWindow(win, cfg));
  });

/**
 * @tjBlock  userflow
 * @tjUsage  showQrToCamera(dataUri)   // hold a QR in front of the fake camera
 *           showQrToCamera(null)      // take it away (blank frame)
 * @tjDom    window.__tjFakeCam.setQr(uri) on the current AUT window (also the start frame for later page loads)
 */
export const showQrToCamera = (uri) =>
  cy.window().then((win) => {
    expect(win.__tjFakeCam, "fake camera installed (installFakeCamera before the page load)").to.exist;
    win.__tjFakeCam.setQr(uri);
  });

const snapshotCam = (s) => ({
  calls: s.calls.slice(),
  frames: s.frames,
  streams: s.streams.map((st) => ({
    active: st.active,
    tracks: st.getTracks().map((t) => ({ kind: t.kind, readyState: t.readyState })),
  })),
});

/**
 * @tjBlock  userflow
 * @tjUsage  expectFakeCamera((s) => expect(s.calls).to.have.length(1))
 * @tjDom    retries `fn(snapshot)` against the live window.__tjFakeCam: { calls: [constraints…], frames,
 *           streams: [{ active, tracks: [{ kind, readyState }] }] }
 */
export const expectFakeCamera = (fn) =>
  cy.window().should((win) => fn(snapshotCam(win.__tjFakeCam || { calls: [], streams: [], frames: 0 })));

/**
 * @tjBlock  userflow
 * @tjUsage  expectScannerVideo('qrscanner1', (v) => expect(v.playing).to.eq(true))
 * @tjDom    retries `fn` with the widget's react-qr-reader <video>: { count, playing (not paused, readyState 4),
 *           videoWidth, videoHeight, fromFakeCamera (srcObject is a stream the fake handed out), transform }
 */
export const expectScannerVideo = (name, fn) =>
  cy.get(`[data-cy="${name}"]`).should(($root) => {
    const videos = $root[0].querySelectorAll("video");
    const v = videos[0];
    const win = $root[0].ownerDocument.defaultView;
    const fake = win.__tjFakeCam;
    fn({
      count: videos.length,
      playing: !!v && !v.paused && v.readyState === 4,
      videoWidth: v ? v.videoWidth : 0,
      videoHeight: v ? v.videoHeight : 0,
      fromFakeCamera: !!(v && fake && fake.streams.includes(v.srcObject)),
      transform: v ? win.getComputedStyle(v).transform : null,
    });
  });

/**
 * @tjBlock  events
 * @tjUsage  addIconsViaApi([qrScannerItem('qrscanner1', { events: [counterEvent('onDetect', 'detects')] }), …])
 * @tjDom    a QrScanner diff item for addIconsViaApi (components/icon.js) — definition defaults
 *           (qrscanner.js:39-50) merged with the overrides; default size 10 x 300 (qrscanner.js:6-9)
 */
export const qrScannerItem = (name, { layout = {}, styles = {}, others = {}, events = [] } = {}) => {
  const D = qrScannerText.definition;
  return {
    type: "QrScanner",
    name,
    layout: { top: 40, left: 2, width: qrScannerText.defaultSize.width, height: qrScannerText.defaultSize.height, ...layout },
    properties: {},
    styles: { ...D.styles, ...styles },
    others: { ...D.others, ...others },
    events,
  };
};

/**
 * @tjBlock  events
 * @tjUsage  addIconsViaApi([valueText('valuetext', 'qrscanner1', { top: 360 })]); expectValueText('valuetext', T.qr.alpha.payload)
 * @tjDom    a Text widget rendering `value:<components.<scanner>.lastDetectedValue>`
 */
export const valueText = (name, scanner, layout = {}) => ({
  type: "Text",
  name,
  layout: { top: 360, left: 2, width: 20, height: 40, ...layout },
  properties: { text: { value: `{{"value:" + components.${scanner}.lastDetectedValue}}` } },
});

/**
 * @tjBlock  events
 * @tjUsage  expectValueText('valuetext', 'TJ-QR-ALPHA-7F3C')
 * @tjDom    trimmed text of the value Text widget equals `value:<expected>`
 */
export const expectValueText = (name, expected) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"]`)
    .should(($el) => expect($el.text().trim(), "lastDetectedValue rendered by a binding").to.eq(`value:${expected}`));

/**
 * @tjBlock  events
 * @tjUsage  seenEvent('onDetect', 'seen', 'qrscanner1')   // + seenText('seentext', 'seen')
 * @tjDom    set-custom-variable: variables[key] = [...previous, components.<scanner>.lastDetectedValue] — what an
 *           onDetect handler reads from the exposed value at the moment the event runs
 */
export const seenEvent = (eventId, key, scanner) => ({
  eventId,
  actionId: "set-custom-variable",
  key,
  value: `{{[...(variables.${key} ?? []), components.${scanner}.lastDetectedValue]}}`,
});

/**
 * @tjBlock  events
 * @tjUsage  seenText('seentext', 'seen', { top: 420 })
 * @tjDom    a Text widget rendering `first:<JSON of the first recorded value>` (`first:none` before any dispatch)
 */
export const seenText = (name, key, layout = {}) => ({
  type: "Text",
  name,
  layout: { top: 420, left: 2, width: 20, height: 40, ...layout },
  properties: {
    text: { value: `{{"first:" + ((variables.${key} ?? []).length ? JSON.stringify(variables.${key}[0]) : "none")}}` },
  },
});

/**
 * @tjBlock  userflow
 * @tjUsage  hitTest('[data-cy="qrscanner1"] .modal-footer button').then(({ hitsSelf, visible }) => …)
 * @tjDom    document.elementFromPoint at the element's centre: does a real pointer land on the element (not
 *           clipped by the widget box / covered)? Plain object { hitsSelf, rect }.
 */
export const hitTest = (selector) =>
  cy.get(selector).first().then(($el) => {
    const el = $el[0];
    const r = el.getBoundingClientRect();
    const hit = el.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { hitsSelf: !!hit && (hit === el || el.contains(hit)), rect: { w: r.width, h: r.height } };
  });

/**
 * @tjBlock  contexts
 * @tjUsage  openQrAppInViewer('[data-cy="qrscanner1"]', { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a widget
 */
export const openQrAppInViewer = (waitForSelector, { query = "" } = {}) => {
  cy.then(() => cy.visit(`/applications/${Cypress.env("appId")}/home?version=v1${query}`));
  if (waitForSelector) cy.get(waitForSelector, { timeout: 30000 }).should("exist");
};
