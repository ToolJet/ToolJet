/**
 * MODULE — appBuilder/components/camera: browser-only helpers for the Camera widget.
 * FOR AI: the Camera asks for the camera ON MOUNT (Camera.jsx:379-456), so the fake has to be in the AUT window
 * before the widget renders — installFakeCamera patches the current window AND every window loaded later in the test
 * (`window:before:load`), unlike mediaCommon.installFakeMic (audio-only, installed after load). The fake
 * `getUserMedia` returns a REAL MediaStream: a video track from `canvas.captureStream()` painted in the chosen
 * device's colour with a white bar that moves every frame (so "live" is measurable), plus a Web Audio oscillator
 * track. Devices are picked like real hardware would honour the widget's constraints: `deviceId.exact` → that
 * device, `facingMode.ideal` → the device whose `facing` matches, `video: true` → the first device. The real
 * MediaRecorder records it, a real <canvas> captures stills from it. State: window.__tjFakeCam = { calls[], streams[] }.
 * addCamerasViaApi seeds Cameras (camera.js definition defaults merged) + helper widgets + events in one POST.
 */
import { cameraText } from "Texts/appBuilder/components/camera";
import { cameraSelector } from "Selectors/appBuilder/components/camera";
import { addIconsViaApi } from "Support/utils/appBuilder/components/icon";

const T = cameraText;

// Test-chosen fake devices. Desktop labels carry no facing hint (cameraDevices.js:6-9) → the DeviceSelect list;
// "Front"/"Back" labels make hasFrontAndBackCameras true (cameraDevices.js:3-4,43-44) → the mobile flip button.
export const FAKE_DEVICES = {
  desktopCameras: [
    { deviceId: "tj-cam-a", label: "TJ Webcam A", rgb: [220, 30, 30] },
    { deviceId: "tj-cam-b", label: "TJ Webcam B", rgb: [30, 60, 220] },
  ],
  mobileCameras: [
    { deviceId: "tj-cam-front", label: "Front Camera", facing: "user", rgb: [30, 180, 60] },
    { deviceId: "tj-cam-back", label: "Back Camera", facing: "environment", rgb: [230, 150, 20] },
  ],
  microphones: [
    { deviceId: "tj-mic-a", label: "TJ Mic A" },
    { deviceId: "tj-mic-b", label: "TJ Mic B" },
  ],
};
export const FRAME = { width: 320, height: 240, bar: 16 };

const pick = (constraint) => {
  if (!constraint || typeof constraint !== "object") return {};
  const v = (c) => (c && typeof c === "object" ? c.exact ?? c.ideal : c);
  return { id: v(constraint.deviceId), facing: v(constraint.facingMode) };
};

const patchWindow = (win, { cameras, microphones, deny }) => {
  const md = win.navigator.mediaDevices;
  if (!md) return; // insecure context: nothing to patch
  const state = { calls: [], streams: [], deny: deny || null };
  win.__tjFakeCam = state;
  let ctx = null;

  const videoTrack = (cam) => {
    const canvas = win.document.createElement("canvas");
    canvas.width = FRAME.width;
    canvas.height = FRAME.height;
    const g = canvas.getContext("2d");
    let frame = 0;
    const draw = () => {
      g.fillStyle = `rgb(${cam.rgb.join(",")})`;
      g.fillRect(0, 0, FRAME.width, FRAME.height);
      g.fillStyle = "#ffffff";
      g.fillRect((frame * 8) % (FRAME.width - FRAME.bar), 0, FRAME.bar, FRAME.height);
      frame += 1;
    };
    draw();
    const timer = win.setInterval(draw, 40);
    const track = canvas.captureStream(25).getVideoTracks()[0];
    const stop = track.stop.bind(track);
    track.stop = () => {
      win.clearInterval(timer);
      stop();
    };
    return track;
  };

  const audioTrack = () => {
    try {
      ctx = ctx || new win.AudioContext();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const dest = ctx.createMediaStreamDestination();
      osc.connect(dest);
      osc.start();
      return dest.stream.getAudioTracks()[0];
    } catch (e) {
      return null;
    }
  };

  const getUserMedia = async (constraints = {}) => {
    state.calls.push(JSON.parse(JSON.stringify(constraints)));
    if (state.deny) throw new win.DOMException("Permission denied", state.deny);
    const stream = new win.MediaStream();
    const tag = { camera: null, mic: null };
    if (constraints.video) {
      const { id, facing } = pick(constraints.video);
      const cam = id ? cameras.find((d) => d.deviceId === id) : (facing && cameras.find((d) => d.facing === facing)) || cameras[0];
      if (!cam) throw new win.DOMException("Requested device not found", id ? "OverconstrainedError" : "NotFoundError");
      stream.addTrack(videoTrack(cam));
      tag.camera = cam.deviceId;
    }
    if (constraints.audio) {
      const { id } = pick(constraints.audio);
      const mic = id ? microphones.find((d) => d.deviceId === id) : microphones[0];
      if (!mic) throw new win.DOMException("Requested device not found", id ? "OverconstrainedError" : "NotFoundError");
      const track = audioTrack();
      if (track) stream.addTrack(track);
      tag.mic = mic.deviceId;
    }
    stream.__tjDevices = tag;
    state.streams.push(stream);
    return stream;
  };

  const enumerateDevices = async () =>
    [
      ...cameras.map((d) => ({ ...d, kind: "videoinput" })),
      ...microphones.map((d) => ({ ...d, kind: "audioinput" })),
    ].map(({ deviceId, kind, label }) => ({ deviceId, kind, label, groupId: "tj-fake", toJSON: () => ({ deviceId, kind, label }) }));

  Object.defineProperty(md, "getUserMedia", { configurable: true, writable: true, value: getUserMedia });
  Object.defineProperty(md, "enumerateDevices", { configurable: true, writable: true, value: enumerateDevices });
};

/**
 * @tjBlock  userflow
 * @tjUsage  installFakeCamera()                                      // desktop: 2 webcams + 2 mics
 *           installFakeCamera({ cameras: FAKE_DEVICES.mobileCameras }) // phone: front + back → flip button
 *           installFakeCamera({ deny: 'NotAllowedError' })            // every getUserMedia rejects
 * @tjDom    own-property overrides of navigator.mediaDevices.getUserMedia / enumerateDevices on the current AUT
 *           window and on every window loaded later in this test (cy.on('window:before:load')); state in
 *           window.__tjFakeCam. Install BEFORE the Camera mounts (before drop / before cy.visit of the viewer).
 */
export const installFakeCamera = ({ cameras = FAKE_DEVICES.desktopCameras, microphones = FAKE_DEVICES.microphones, deny } = {}) => {
  const opts = { cameras, microphones, deny };
  cy.on("window:before:load", (win) => patchWindow(win, opts));
  return cy.window({ log: false }).then((win) => patchWindow(win, opts));
};

const snapshotFakeCam = (s) => ({
  calls: s.calls.slice(),
  streams: s.streams.map((st) => ({ ...st.__tjDevices, active: st.active })),
});

/**
 * @tjBlock  userflow
 * @tjUsage  expectFakeCamera((s) => expect(s.calls.at(-1).video).to.deep.eq({ deviceId: { exact: 'tj-cam-b' } }))
 * @tjDom    retries fn({ calls: [constraints…], streams: [{ camera, mic, active }…] }) against window.__tjFakeCam
 */
export const expectFakeCamera = (fn) =>
  cy.window().should((win) => fn(snapshotFakeCam(win.__tjFakeCam || { calls: [], streams: [] })));

// Most frequent colour (8-level buckets) of an RGBA buffer + the x of the white bar on the middle row.
const analyse = (data, width, height) => {
  const counts = {};
  let best = null;
  for (let i = 0; i < data.length; i += 4 * 7) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 235 && g > 235 && b > 235) continue; // the moving bar
    const key = `${r >> 3},${g >> 3},${b >> 3}`;
    counts[key] = counts[key] || { n: 0, rgb: [r, g, b] };
    counts[key].n += 1;
    if (!best || counts[key].n > best.n) best = counts[key];
  }
  const row = Math.floor(height / 2) * width * 4;
  let barX = -1;
  for (let x = 0; x < width; x++) {
    const i = row + x * 4;
    if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
      barX = x;
      break;
    }
  }
  return { width, height, rgb: best ? best.rgb : null, barX };
};

const readPixels = (win, source, width, height) => {
  const canvas = win.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  g.drawImage(source, 0, 0, width, height);
  return analyse(g.getImageData(0, 0, width, height).data, width, height);
};

/**
 * @tjBlock  userflow
 * @tjUsage  videoFrame(cameraSelector.video('cam')).then((f) => …)   // { width, height, rgb, barX, readyState, currentTime, paused, srcObject }
 * @tjDom    draws the <video>'s current frame onto a scratch canvas (natural videoWidth×videoHeight); rgb = dominant
 *           colour (ignoring the white bar), barX = x of the fake's moving bar on the middle row. srcObject is the
 *           fake's device tag ({ camera, mic }) or null. One-shot (no retry).
 */
export const videoFrame = (selector) =>
  cy.get(selector).then(($v) => {
    const v = $v[0];
    const win = v.ownerDocument.defaultView;
    const meta = {
      readyState: v.readyState,
      currentTime: v.currentTime,
      paused: v.paused,
      srcObject: v.srcObject ? { ...v.srcObject.__tjDevices } : null,
      src: v.getAttribute("src"),
    };
    if (!v.videoWidth) return { ...meta, width: 0, height: 0, rgb: null, barX: -1 };
    return { ...meta, ...readPixels(win, v, v.videoWidth, v.videoHeight) };
  });

/**
 * @tjBlock  userflow
 * @tjUsage  expectLivePreview('cam', FAKE_DEVICES.desktopCameras[0])
 * @tjDom    the <video> plays the fake device's stream: srcObject tag = device, decoded frame FRAMExFRAME in the
 *           device colour (±12 per channel), and the moving bar position changes between two reads (live, not a still).
 */
export const expectLivePreview = (name, device) => {
  const sel = cameraSelector.video(name);
  cy.get(sel).should(($v) => {
    expect($v[0].srcObject && $v[0].srcObject.__tjDevices.camera, "preview stream device").to.eq(device.deviceId);
    expect($v[0].readyState, "video readyState").to.be.at.least(2);
  });
  return videoFrame(sel).then((first) => {
    expect([first.width, first.height], "preview frame size").to.deep.eq([FRAME.width, FRAME.height]);
    first.rgb.forEach((c, i) => expect(c, `preview colour channel ${i}`).to.be.closeTo(device.rgb[i], 12));
    cy.get(sel).should(($v) => {
      const now = readPixels($v[0].ownerDocument.defaultView, $v[0], FRAME.width, FRAME.height);
      expect(now.barX, "moving bar advanced (live preview)").to.not.eq(first.barX);
    });
  });
};

/**
 * @tjBlock  userflow
 * @tjUsage  decodeImage(dataUrl).then((img) => expect(img.rgb).to.…)
 * @tjDom    loads a data/blob URL into an Image in the AUT window; resolves { width, height, rgb, barX } of its pixels
 */
export const decodeImage = (url) =>
  cy.window().then(
    (win) =>
      new Cypress.Promise((resolve, reject) => {
        const img = new win.Image();
        img.onload = () => resolve(readPixels(win, img, img.naturalWidth, img.naturalHeight));
        img.onerror = () => reject(new Error(`image failed to decode: ${url.slice(0, 40)}…`));
        img.src = url;
      })
  );

/**
 * @tjBlock  userflow
 * @tjUsage  decodeVideo(dataUrl).then((v) => expect(v.played).to.be.true)
 * @tjDom    loads a data URL into a detached muted <video> in the AUT window, waits for loadeddata, plays it for
 *           ~400ms, then samples the frame; resolves { width, height, rgb, barX, played (currentTime advanced), error }
 */
export const decodeVideo = (url) =>
  cy.window().then(
    (win) =>
      new Cypress.Promise((resolve) => {
        const v = win.document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        const done = (extra) => resolve({ width: v.videoWidth, height: v.videoHeight, ...extra });
        const t = win.setTimeout(() => done({ error: "timeout", played: false }), 15000);
        v.onerror = () => {
          win.clearTimeout(t);
          done({ error: (v.error && v.error.message) || `media error ${v.error && v.error.code}`, played: false });
        };
        v.onloadeddata = () => {
          const t0 = v.currentTime;
          v.play()
            .then(
              () =>
                new Promise((r) => win.setTimeout(r, 400)).then(() => {
                  win.clearTimeout(t);
                  // sampled while playing: the very first decoded frame of a MediaRecorder webm can be black
                  done({ ...readPixels(win, v, v.videoWidth, v.videoHeight), played: v.currentTime > t0, error: null });
                }),
              (e) => {
                win.clearTimeout(t);
                done({ ...frame, played: false, error: `play() rejected: ${e && e.name}` });
              }
            );
        };
        v.src = url;
      })
  );

/**
 * @tjBlock  userflow
 * @tjUsage  addCamerasViaApi([{ name: 'cam', layout: { top: 40, left: 2, width: 15, height: 500 }, events: [counterEvent('onImageSave', 'saves')] }])
 * @tjDom    item without `type` → a Camera with camera.js:139-160 definition defaults under properties/styles/others;
 *           any other `type` posts only what is passed. Events per addIconsViaApi.
 */
export const addCamerasViaApi = (items, appIdArg) => {
  const D = T.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== "Camera"
        ? item
        : {
            ...item,
            type: "Camera",
            layout: { top: 40, left: 2, width: T.defaultSize.width, height: T.defaultSize.height, ...item.layout },
            properties: { ...D.properties, ...item.properties },
            styles: { ...D.styles, ...item.styles },
            others: { ...D.others, ...item.others },
          }
    ),
    appIdArg
  );
};

/**
 * @tjBlock  userflow
 * @tjUsage  pickDevice('cam', 'camera', 'TJ Webcam B')
 * @tjDom    opens the DeviceSelect popover (DeviceSelect.jsx:41-49, trigger aria-label) and clicks the portalled
 *           [role=option] with that label (DeviceSelect.jsx:57-75); the popover closes on select
 */
export const pickDevice = (name, kind, label) => {
  const trigger = kind === "camera" ? cameraSelector.cameraSelect(name) : cameraSelector.microphoneSelect(name);
  cy.get(trigger).should("not.be.disabled").realClick({ scrollBehavior: false });
  cy.contains(cameraSelector.deviceOption, label).realClick({ scrollBehavior: false });
  cy.get(cameraSelector.deviceOption).should("not.exist");
};
