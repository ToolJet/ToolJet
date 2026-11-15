/**
 * SPEC — Camera — userflow facet.
 * FOR AI: the TESTING.md browser scenarios (frontend/ee/test/app-builder/widgets/Camera):
 *   Camera-BRW-001 — live preview; capture photo → onImageSave + a real imageDataURL; record → save → playable videoDataURL
 *   Camera-BRW-003 — switching camera / microphone switches the live stream; the mobile flip toggles front/back
 *   Camera-BRW-004 — fullscreen forces borderRadius 0; exiting restores the configured radius
 * Mechanism: the app is seeded over the API and opened in the viewer. No real camera exists in headless Electron
 * and the shared config has no fake-device flags, so `navigator.mediaDevices.getUserMedia` / `enumerateDevices` are
 * replaced in-page BEFORE the widget mounts (installFakeCamera) by a real canvas.captureStream() video track (+ a Web
 * Audio track) painted in the selected device's colour with a moving white bar. Everything downstream is real: the
 * <video> preview, the canvas still capture (Camera.jsx:144-176), MediaRecorder (react-media-recorder), FileReader
 * data URLs, and the Fullscreen API (realClick = trusted user activation).
 * Helpers: installFakeCamera, expectFakeCamera, addCamerasViaApi, videoFrame, expectLivePreview, decodeImage,
 * decodeVideo, pickDevice, counterEvent, counterText, expectCounter, openLinkAppInViewer, viewerPath.
 */
import { fake } from "Fixtures/fake";
import { cameraSelector as SEL } from "Selectors/appBuilder/components/camera";
import { cameraText } from "Texts/appBuilder/components/camera";
import { openLinkAppInViewer, viewerPath } from "Support/utils/appBuilder/components/link";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    FAKE_DEVICES,
    FRAME,
    installFakeCamera,
    expectFakeCamera,
    addCamerasViaApi,
    videoFrame,
    expectLivePreview,
    decodeImage,
    decodeVideo,
    pickDevice,
} from "Support/utils/appBuilder/components/camera";

const T = cameraText;
const A = T.aria;
const [CAM_A, CAM_B] = FAKE_DEVICES.desktopCameras;
const [MIC_A, MIC_B] = FAKE_DEVICES.microphones;
const [FRONT, BACK] = FAKE_DEVICES.mobileCameras;
const W = 'cam'; // dynamic: seeded widget name
const RC = { scrollBehavior: false };
const RADIUS = 20; // test-chosen border radius (px) — distinguishable from the 0 forced by fullscreen

// Probe Text widgets. They also read `isVisible` (always true here): a binding that reads ONLY a never-re-published
// exposed value can stay blank on load (the Timeline-family resolver bug).
const urlProbe = (name, key, top) => ({
    type: 'Text',
    name,
    layout: { top, left: 20, width: 20, height: 40 },
    properties: { text: { value: `{{components.${W}.isVisible ? String(components.${W}.${key}) : ''}}` } },
});
const probeText = (name) => cy.get(`[data-cy="draggable-widget-${name}"]`).invoke('text').then((t) => t.trim());
const expectProbe = (name, re) =>
    cy.get(`[data-cy="draggable-widget-${name}"]`).should(($p) => expect($p.text().trim().slice(0, 60)).to.match(re));
const expectColour = (rgb, device, what) =>
    rgb.forEach((c, i) => expect(c, `${what} colour channel ${i}`).to.be.closeTo(device.rgb[i], 12));

const seedAndOpen = (camera, extras = [], { query = '' } = {}) => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Camera-userflow-${Cypress._.uniqueId()}`);
    addCamerasViaApi([{ name: W, layout: { top: 40, left: 2, width: 15, height: 500 }, ...camera }, ...extras]);
    if (query) cy.then(() => cy.visit(viewerPath(undefined, query)));
    else openLinkAppInViewer(SEL.container(W));
    cy.get(SEL.container(W), { timeout: 30000 }).should('be.visible');
};

describe('Camera — userflow facet', { testIsolation: false }, () => {
    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[Camera-BRW-001] photo: live preview, capture shows the still, save fires onImageSave and exposes a real imageDataURL', () => {
        installFakeCamera();
        seedAndOpen({ events: [counterEvent('onImageSave', 'imgsaves')] }, [ // camera.js:67
            counterText('imgcount', 'imgsaves', { top: 40, left: 20, width: 10 }),
            urlProbe('imgprobe', 'imageDataURL', 100), // camera.js:116
        ]);

        // granted camera → live preview of the default (first) camera; nothing saved yet
        expectLivePreview(W, CAM_A);
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', A.capturePhoto).and('not.be.disabled');
        expectCounter('imgcount', 'imgsaves', 0);
        expectProbe('imgprobe', /^null$/);

        // capture → the still (a blob: URL of the canvas PNG) replaces the preview; save/discard appear; no event yet
        cy.get(SEL.captureButton(W)).realClick(RC);
        cy.get(SEL.capturedImage(W)).should('have.attr', 'alt', T.capturedAlt).and('have.attr', 'src').and('match', /^blob:/);
        cy.get(SEL.video(W)).should('not.exist');
        cy.get(SEL.saveButton(W)).should('be.visible');
        cy.get(SEL.discardButton(W)).should('be.visible');
        cy.get(SEL.capturedImage(W)).invoke('attr', 'src').then((src) => decodeImage(src)).then((img) => {
            expect([img.width, img.height], 'still = full camera frame').to.deep.eq([FRAME.width, FRAME.height]);
            expectColour(img.rgb, CAM_A, 'still');
        });
        expectCounter('imgcount', 'imgsaves', 0);

        // save → exactly one onImageSave, imageDataURL is a base64 PNG of the captured frame, preview resumes
        cy.get(SEL.saveButton(W)).realClick(RC);
        expectCounter('imgcount', 'imgsaves', 1);
        expectProbe('imgprobe', /^data:image\/png;base64,/);
        probeText('imgprobe').then((url) => decodeImage(url)).then((img) => {
            expect([img.width, img.height], 'imageDataURL size').to.deep.eq([FRAME.width, FRAME.height]);
            expectColour(img.rgb, CAM_A, 'imageDataURL');
        });
        cy.get(SEL.capturedImage(W)).should('not.exist');
        expectLivePreview(W, CAM_A);
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', A.capturePhoto);
    });

    it('[Camera-BRW-001] video: record → stop → save fires onRecordingStart/onRecordingSave and exposes a playable videoDataURL', () => {
        installFakeCamera();
        seedAndOpen(
            {
                properties: { ...T.definition.properties, content: { value: 'video' } }, // camera.js:18-24
                events: [counterEvent('onRecordingStart', 'starts'), counterEvent('onRecordingSave', 'vidsaves')], // camera.js:65-66
            },
            [
                counterText('startcount', 'starts', { top: 40, left: 20, width: 10 }),
                counterText('vidcount', 'vidsaves', { top: 90, left: 20, width: 10 }),
                urlProbe('vidprobe', 'videoDataURL', 140), // camera.js:117
            ]
        );

        expectLivePreview(W, CAM_A);
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', A.startRecording).and('not.be.disabled');
        expectProbe('vidprobe', /^null$/);

        // start → one onRecordingStart; the button becomes Stop recording; the preview stays live
        cy.get(SEL.captureButton(W)).realClick(RC);
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', A.stopRecording);
        expectCounter('startcount', 'starts', 1);
        expectCounter('vidcount', 'vidsaves', 0);
        cy.wait(1500); // record ~1.5s of frames

        // stop → the recording replaces the live preview (blob src + controls), save/discard appear
        cy.get(SEL.captureButton(W)).realClick(RC);
        cy.get(SEL.saveButton(W)).should('be.visible');
        cy.get(SEL.video(W)).should('have.attr', 'controls');
        cy.get(SEL.video(W)).should('have.attr', 'src').and('match', /^blob:/);
        expectCounter('vidcount', 'vidsaves', 0);

        // save → one onRecordingSave and a base64 videoDataURL that a real <video> decodes and plays
        cy.get(SEL.saveButton(W)).realClick(RC);
        expectCounter('vidcount', 'vidsaves', 1);
        expectCounter('startcount', 'starts', 1);
        expectProbe('vidprobe', /^data:video\/[\w.+-]+(;[\w=.+-]+)*;base64,/);
        probeText('vidprobe').then((url) => {
            expect(url.length, 'videoDataURL payload length').to.be.greaterThan(1000);
            return decodeVideo(url);
        }).then((v) => {
            expect(v.error, 'decode error').to.eq(null);
            expect([v.width, v.height], 'recorded frame size').to.deep.eq([FRAME.width, FRAME.height]);
            expectColour(v.rgb, CAM_A, 'recorded frame');
            expect(v.played, 'recording plays (currentTime advances)').to.eq(true);
        });
        // back to idle with a live preview
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', A.startRecording);
        expectLivePreview(W, CAM_A);
    });

    it('[Camera-BRW-003] desktop: selecting another camera / microphone switches the live stream', () => {
        installFakeCamera();
        seedAndOpen({ properties: { ...T.definition.properties, content: { value: 'video' } } }); // camera.js:18-24 (video shows the mic select, Footer.jsx:73)

        expectLivePreview(W, CAM_A);
        cy.get(SEL.flipButton(W)).should('not.exist'); // webcams carry no facing hint → list, not flip
        expectFakeCamera((s) => {
            const last = s.calls[s.calls.length - 1];
            expect(last, 'first-device constraints').to.deep.eq({ video: { deviceId: { exact: CAM_A.deviceId } }, audio: { deviceId: { exact: MIC_A.deviceId } } });
        });

        // the camera list shows both devices, the current one selected
        cy.get(SEL.cameraSelect(W)).realClick(RC);
        cy.get(SEL.deviceOption).should(($o) => {
            expect($o.toArray().map((o) => [o.textContent.trim(), o.getAttribute('aria-selected')])).to.deep.eq([
                [CAM_A.label, 'true'],
                [CAM_B.label, 'false'],
            ]);
        });
        cy.realPress('Escape');
        cy.get(SEL.deviceOption).should('not.exist');

        // camera B → a new stream from B, the old stream released
        pickDevice(W, 'camera', CAM_B.label);
        expectLivePreview(W, CAM_B);
        expectFakeCamera((s) => {
            const last = s.calls[s.calls.length - 1];
            expect(last.video, 'camera constraint').to.deep.eq({ deviceId: { exact: CAM_B.deviceId } });
            expect(s.streams.filter((st) => st.active).map((st) => st.camera), 'only the B stream is live').to.deep.eq([CAM_B.deviceId]);
        });

        // microphone B → a new stream with mic B (camera B kept)
        pickDevice(W, 'microphone', MIC_B.label);
        cy.get(SEL.video(W)).should(($v) =>
            expect({ ...$v[0].srcObject.__tjDevices }, 'preview stream devices').to.deep.eq({ camera: CAM_B.deviceId, mic: MIC_B.deviceId }));
        expectLivePreview(W, CAM_B);
        cy.get(SEL.microphoneSelect(W)).realClick(RC);
        cy.contains(SEL.deviceOption, MIC_B.label).should('have.attr', 'aria-selected', 'true');
        cy.realPress('Escape');
    });

    // PRODUCT BUG (kept red): the recorder ignores the selected camera/mic. Camera passes the live stream as
    // react-media-recorder's `customMediaStream` (Camera.jsx:56-71), but the library memoises getMediaStream with deps
    // [audio, video, screen] only, so it keeps the null stream of the first render and calls
    // getUserMedia({ audio: true, video: true }) itself on Start recording → the DEFAULT devices are recorded.
    it('[Camera-BRW-003] a recording made after switching camera records the selected camera', () => {
        installFakeCamera();
        seedAndOpen({
            properties: { ...T.definition.properties, content: { value: 'video' } }, // camera.js:18-24
        }, [urlProbe('vidprobe', 'videoDataURL', 40)]);

        pickDevice(W, 'camera', CAM_B.label);
        pickDevice(W, 'microphone', MIC_B.label);
        expectLivePreview(W, CAM_B);
        cy.get(SEL.captureButton(W)).realClick(RC);
        cy.get(SEL.captureButton(W)).should('have.attr', 'aria-label', A.stopRecording);
        cy.wait(1200); // record ~1.2s of frames
        cy.get(SEL.captureButton(W)).realClick(RC);
        cy.get(SEL.saveButton(W)).realClick(RC);
        expectProbe('vidprobe', /^data:video\//);
        probeText('vidprobe').then((url) => decodeVideo(url)).then((v) => {
            cy.window().then((win) => {
                const s = win.__tjFakeCam;
                const recorderStream = s.streams[s.streams.length - 1];
                expect({
                    recordedColour: v.rgb.map((c, i) => Math.abs(c - CAM_B.rgb[i]) <= 12),
                    recorderAsked: s.calls[s.calls.length - 1],
                    recorderDevices: { ...recorderStream.__tjDevices },
                }, 'recording uses the selected camera B + mic B').to.deep.eq({
                    recordedColour: [true, true, true],
                    recorderAsked: { video: { deviceId: { exact: CAM_B.deviceId } }, audio: { deviceId: { exact: MIC_B.deviceId } } },
                    recorderDevices: { camera: CAM_B.deviceId, mic: MIC_B.deviceId },
                });
            });
        });
    });

    it('[Camera-BRW-003] mobile: the flip button toggles the back / front camera via facingMode', () => {
        cy.viewport(375, 740);
        installFakeCamera({ cameras: FAKE_DEVICES.mobileCameras });
        seedAndOpen(
            { others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{true}}' } }, layout: { top: 40, left: 2, width: 40, height: 500 } }, // camera.js:141-142
            [],
            { query: '&layout=mobile' }
        );

        // front + back labels → mobile mode: one flip button, no camera device list; back camera first (Camera.jsx:36)
        cy.get(SEL.flipButton(W)).should('have.attr', 'aria-label', A.flip).and('not.be.disabled');
        cy.get(SEL.cameraSelect(W)).should('not.exist');
        expectLivePreview(W, BACK);
        expectFakeCamera((s) => expect(s.calls[s.calls.length - 1].video, 'constraint').to.deep.eq({ facingMode: { ideal: 'environment' } }));

        cy.get(SEL.flipButton(W)).realClick(RC);
        expectLivePreview(W, FRONT);
        expectFakeCamera((s) => {
            expect(s.calls[s.calls.length - 1].video, 'constraint').to.deep.eq({ facingMode: { ideal: 'user' } });
            expect(s.streams.filter((st) => st.active).map((st) => st.camera), 'previous camera released').to.deep.eq([FRONT.deviceId]);
        });

        cy.get(SEL.flipButton(W)).realClick(RC);
        expectLivePreview(W, BACK);
        expectFakeCamera((s) => expect(s.calls[s.calls.length - 1].video, 'constraint').to.deep.eq({ facingMode: { ideal: 'environment' } }));
    });

    it('[Camera-BRW-004] fullscreen fills the screen with borderRadius 0; exiting restores the configured radius', () => {
        installFakeCamera();
        seedAndOpen({ styles: { ...T.definition.styles, borderRadius: { value: `{{${RADIUS}}}` } } }); // camera.js:97-102,157
        expectLivePreview(W, CAM_A);

        const measure = ($c) => {
            const r = $c[0].getBoundingClientRect();
            const win = $c[0].ownerDocument.defaultView;
            return {
                w: Math.round(r.width),
                h: Math.round(r.height),
                fullscreen: win.document.fullscreenElement === $c[0],
                screen: [win.innerWidth, win.innerHeight],
            };
        };
        const expectBox = (fn) => cy.get(SEL.container(W)).should(($c) => fn(measure($c)));
        const expectRadius = (px) => cy.get(SEL.container(W)).should(($c) => {
            expect($c[0].style.borderRadius, 'inline radius').to.eq(`${px}px`);
            expect(getComputedStyle($c[0]).borderTopLeftRadius, 'computed radius').to.eq(`${px}px`);
        });

        expectRadius(RADIUS);
        cy.get(SEL.container(W)).then(($c) => measure($c)).then((before) => {
            expect(before.fullscreen, 'not fullscreen yet').to.eq(false);

            cy.get(SEL.fullscreenButton(W)).should('have.attr', 'aria-label', A.enterFullscreen).realClick(RC);
            cy.get(SEL.container(W)).should('have.class', 'camera-container--fullscreen');
            cy.get(SEL.fullscreenButton(W)).should('have.attr', 'aria-label', A.exitFullscreen);
            expectRadius(0);
            expectBox((fs) => {
                expect(fs.fullscreen, 'container is the fullscreen element').to.eq(true);
                expect([fs.w, fs.h], 'preview fills the screen').to.deep.eq(fs.screen);
                expect(fs.w, 'larger than the widget').to.be.greaterThan(before.w);
            });
            expectLivePreview(W, CAM_A);

            // Let the browser window finish its fullscreen transition: an exitFullscreen() issued mid-transition never
            // settles in headless Electron (observed: promise pending forever, still fullscreen) — environment, not widget.
            cy.wait(1500);
            // exitFullscreen needs no user activation; a real (CDP) click would land off-target because the AUT
            // iframe itself is the fullscreen element now, so a DOM click drives the exit button
            cy.get(SEL.fullscreenButton(W)).click();
            cy.get(SEL.container(W)).should('not.have.class', 'camera-container--fullscreen');
            cy.get(SEL.fullscreenButton(W)).should('have.attr', 'aria-label', A.enterFullscreen);
            expectRadius(RADIUS);
            expectBox((after) => {
                expect(after.fullscreen, 'fullscreen exited').to.eq(false);
                expect([after.w, after.h], 'widget size restored').to.deep.eq([before.w, before.h]);
            });
        });
    });
});
