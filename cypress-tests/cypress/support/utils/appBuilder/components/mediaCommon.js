/**
 * MODULE — appBuilder/components/mediaCommon: shared media-device fakes for media widgets (AudioRecorder; Camera /
 * QrScanner can reuse and extend it).
 * FOR AI: the shared cypress config cannot get Chromium's --use-fake-device-for-media-stream flags, so the AUT's
 * `navigator.mediaDevices.getUserMedia` is replaced IN-PAGE with a real Web Audio source: a sawtooth oscillator →
 * GainNode → a fresh MediaStreamAudioDestinationNode per call. The returned MediaStream is genuine, so the real
 * MediaRecorder records it, AnalyserNodes see its spectrum, and the recording plays back through a real
 * HTMLAudioElement. The microphone "level" is the gain (0 = silence) so a spec can prove a visualizer follows the
 * live input. denyFakeMic makes every call reject with a DOMException (NotAllowedError by default) — the
 * permission-denied path. trackMediaPlayback records every media element the page plays/pauses (also detached
 * `new Audio()` elements that never enter the DOM).
 * Install AFTER the page has loaded (cy.visit / cy.openApp) and BEFORE the first click that asks for media: the
 * stub lives on that document only and is lost on reload. Video constraints are not faked (audio only) — extend
 * `getUserMedia` below (e.g. canvas.captureStream()) when a video widget needs it.
 */

/**
 * @tjBlock  userflow
 * @tjUsage  installFakeMic()            // granted, loud input
 *           installFakeMic({ level: 0 }) // granted, silent input
 * @tjDom    window.navigator.mediaDevices.getUserMedia → own-property override on the AUT's MediaDevices; state in
 *           window.__tjFakeMedia = { calls[], streams[], deny, ctx, gain }. The AudioContext is created on the
 *           first call (inside the user's click → allowed to start) and resumed if the autoplay policy suspended it.
 */
export const installFakeMic = ({ level = 1, frequency = 375 } = {}) =>
  cy.window().then((win) => {
    const state = { calls: [], streams: [], deny: null, ctx: null, gain: null, level, frequency };
    win.__tjFakeMedia = state;
    const ensureSource = async () => {
      if (!state.ctx) {
        const ctx = new win.AudioContext();
        // sawtooth: harmonics at every multiple of `frequency`, so every analyser bin of a small FFT gets energy
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = state.frequency;
        const gain = ctx.createGain();
        gain.gain.value = state.level;
        osc.connect(gain);
        osc.start();
        Object.assign(state, { ctx, gain });
      }
      if (state.ctx.state === "suspended") await state.ctx.resume().catch(() => {});
    };
    const getUserMedia = async (constraints) => {
      state.calls.push(JSON.parse(JSON.stringify(constraints || {})));
      if (state.deny) throw new win.DOMException("Permission denied", state.deny);
      await ensureSource();
      const dest = state.ctx.createMediaStreamDestination();
      state.gain.connect(dest);
      state.streams.push(dest.stream);
      return dest.stream;
    };
    Object.defineProperty(win.navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      writable: true,
      value: getUserMedia,
    });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  denyFakeMic()                    // every getUserMedia call rejects NotAllowedError
 *           denyFakeMic('NotFoundError')
 * @tjDom    sets window.__tjFakeMedia.deny (installs the fake first when missing)
 */
export const denyFakeMic = (errorName = "NotAllowedError") =>
  cy.window().then((win) => {
    if (!win.__tjFakeMedia) return installFakeMic().then(() => (win.__tjFakeMedia.deny = errorName));
    win.__tjFakeMedia.deny = errorName;
  });

/**
 * @tjBlock  userflow
 * @tjUsage  setFakeMicLevel(0)   // silence;  setFakeMicLevel(1) // loud
 * @tjDom    window.__tjFakeMedia.gain.gain.value (applies to every stream already handed out)
 */
export const setFakeMicLevel = (level) =>
  cy.window().then((win) => {
    const state = win.__tjFakeMedia;
    state.level = level;
    if (state.gain) state.gain.gain.setValueAtTime(level, state.ctx.currentTime);
  });

const snapshotFakeMic = (s) => ({
  calls: s.calls.slice(),
  deny: s.deny || null,
  contextState: s.ctx ? s.ctx.state : null,
  streams: s.streams.map((st) => ({ active: st.active, tracks: st.getTracks().map((t) => t.readyState) })),
});

/**
 * @tjBlock  userflow
 * @tjUsage  fakeMicState().then((s) => …)   // one-shot snapshot (does NOT retry — use expectFakeMic to assert)
 * @tjDom    plain snapshot of window.__tjFakeMedia: calls (constraints), contextState, and per handed-out stream
 *           { active, tracks: [readyState…] }
 */
export const fakeMicState = () =>
  cy.window().then((win) => snapshotFakeMic(win.__tjFakeMedia || { calls: [], streams: [] }));

/**
 * @tjBlock  userflow
 * @tjUsage  expectFakeMic((s) => expect(s.calls).to.have.length(2))
 * @tjDom    retries `fn(snapshot)` against the live window.__tjFakeMedia until it passes
 */
export const expectFakeMic = (fn) =>
  cy.window().should((win) => fn(snapshotFakeMic(win.__tjFakeMedia || { calls: [], streams: [] })));

/**
 * @tjBlock  userflow
 * @tjUsage  trackMediaPlayback(); …; mediaPlayback().should((els) => expect(els[0].paused).to.eq(false))
 * @tjDom    wraps HTMLMediaElement.prototype.play/pause/load of the AUT window; every element they run on is kept in
 *           window.__tjMediaEls (works for detached `new Audio()`); `play` also records whether its promise rejected
 */
export const trackMediaPlayback = () =>
  cy.window().then((win) => {
    const els = (win.__tjMediaEls = []);
    const proto = win.HTMLMediaElement.prototype;
    const remember = (el) => {
      if (!els.includes(el)) els.push(el);
    };
    const origPlay = proto.play;
    const origPause = proto.pause;
    proto.play = function (...args) {
      remember(this);
      this.__tjPlayCalls = (this.__tjPlayCalls || 0) + 1;
      const p = origPlay.apply(this, args);
      if (p && p.catch) p.catch((e) => (this.__tjPlayError = e && e.name));
      return p;
    };
    proto.pause = function (...args) {
      remember(this);
      this.__tjPauseCalls = (this.__tjPauseCalls || 0) + 1;
      return origPause.apply(this, args);
    };
  });

const snapshotMedia = (els) =>
  (els || []).map((el) => ({
    tag: el.tagName.toLowerCase(),
    src: el.src,
    paused: el.paused,
    ended: el.ended,
    currentTime: el.currentTime,
    readyState: el.readyState,
    playCalls: el.__tjPlayCalls || 0,
    pauseCalls: el.__tjPauseCalls || 0,
    playError: el.__tjPlayError || null,
    inDom: el.isConnected,
  }));

/**
 * @tjBlock  userflow
 * @tjUsage  mediaPlayback().then(([el]) => …)   // one-shot snapshot (does NOT retry — use expectMediaPlayback)
 * @tjDom    plain snapshot per tracked element: { tag, src, paused, ended, currentTime, playCalls, pauseCalls,
 *           playError, readyState, inDom }
 */
export const mediaPlayback = () => cy.window().then((win) => snapshotMedia(win.__tjMediaEls));

/**
 * @tjBlock  userflow
 * @tjUsage  expectMediaPlayback((els) => expect(els[0].paused).to.eq(false))
 * @tjDom    retries `fn(snapshot)` against the live tracked media elements until it passes
 */
export const expectMediaPlayback = (fn) => cy.window().should((win) => fn(snapshotMedia(win.__tjMediaEls)));
