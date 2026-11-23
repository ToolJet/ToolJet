/**
 * SPEC — Audio Recorder — userflow facet.
 * FOR AI: the four TESTING.md browser scenarios (frontend/ee/test/app-builder/widgets/AudioRecorder):
 *   AudioRecorder-BRW-001 — the canvas Waveform visualizes the live recording (AnalyserNode bars)
 *   AudioRecorder-BRW-002 — the recorded audio plays back through a real HTMLAudioElement, play/pause toggles
 *   AudioRecorder-BRW-003 — record → pause shows save; resume; save produces the recording; discard resets
 *   AudioRecorder-BRW-004 — a denied microphone shows the "Know more" helper
 * Mechanism: the app is seeded over the API and opened in the viewer; `navigator.mediaDevices.getUserMedia` is
 * replaced in-page by a real Web Audio oscillator stream (mediaCommon.installFakeMic) — the real MediaRecorder
 * (react-media-recorder) records it, the real AnalyserNode sees it, and the real <audio> plays the result. The
 * widget asks for the mic twice per start: once itself (the Waveform's stream, AudioRecorder.jsx:92) and once inside
 * react-media-recorder's startRecording (the recorded stream). All clicks are trusted (realClick) so the page holds
 * user activation for AudioContext / play().
 * Helpers: addAudioRecordersViaApi, expectWaveform, timerSeconds, installFakeMic, denyFakeMic, setFakeMicLevel,
 * expectFakeMic, trackMediaPlayback, mediaPlayback, expectMediaPlayback, counterEvent, counterText, expectCounter, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { audioRecorderSelector as SEL } from "Selectors/appBuilder/components/audioRecorder";
import { audioRecorderText } from "Texts/appBuilder/components/audioRecorder";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { addAudioRecordersViaApi, expectWaveform, timerSeconds } from "Support/utils/appBuilder/components/audioRecorder";
import {
    installFakeMic,
    denyFakeMic,
    setFakeMicLevel,
    fakeMicState,
    expectFakeMic,
    trackMediaPlayback,
    mediaPlayback,
    expectMediaPlayback,
} from "Support/utils/appBuilder/components/mediaCommon";

const T = audioRecorderText;
const A = T.aria;
const W = 'rec'; // dynamic: seeded widget names
const STARTS = 'startcount';
const SAVES = 'savecount';
const DATA = 'dataprobe';
const ACCENT = '#2D9CDB'; // test-chosen accent colour (rgb(45, 156, 219)) for the "Know more" helper
const RT = { realClick: { scrollBehavior: false } };

// The probe also reads `isVisible`: a binding that reads ONLY `dataURL` stays blank until a recording is saved (the
// Timeline-family resolver bug — a binding on a never-re-published exposed value is not evaluated), which would
// hide the reset-to-null this facet asserts. `isVisible` is always true here.
const dataProbeText = `{{components.${W}.isVisible && components.${W}.dataURL == null ? 'dataURL:null' : 'dataURL:' + components.${W}.dataURL.split(',')[0] + ':' + components.${W}.dataURL.split(',')[1].length}}`;
const DATA_URL_RE = /^dataURL:data:audio\/[\w.+-]+(;[\w=.+-]+)*;base64:(\d+)$/;

const clickRecorder = (aria) => cy.get(SEL.recorderButtonByAria(W, aria)).realClick(RT.realClick);
const expectState = (aria) => cy.get(SEL.recorderButton(W)).should('have.attr', 'aria-label', aria);
const dataProbe = () => cy.get(`[data-cy="draggable-widget-${DATA}"]`);
const expectDataUrlNull = () => dataProbe().should(($p) => expect($p.text().trim()).to.eq('dataURL:null'));
const expectDataUrlRecorded = () =>
    dataProbe().should(($p) => {
        const m = $p.text().trim().match(DATA_URL_RE);
        expect(m, `base64 audio dataURL, got "${$p.text().trim()}"`).to.not.eq(null);
        expect(Number(m[2]), 'base64 payload length').to.be.greaterThan(100);
    });
const timerAtLeast = (n) =>
    cy.get(SEL.timer(W)).should(($t) => {
        const [h, m, s] = $t.text().trim().split('/').pop().split(':').map(Number);
        expect(h * 3600 + m * 60 + s, `recorded seconds (${$t.text()})`).to.be.at.least(n);
    });

// start → wait → pause → save: leaves the widget in `stopped` with a recording of ~`seconds` seconds
const recordAndSave = (seconds) => {
    clickRecorder(A.idle);
    expectState(A.recording);
    timerAtLeast(seconds);
    clickRecorder(A.recording);
    expectState(A.paused);
    cy.get(SEL.saveButton(W)).realClick(RT.realClick);
    expectState(A.stopped);
};

describe('Audio Recorder — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-AudioRecorder-userflow-${Cypress._.uniqueId()}`);
        addAudioRecordersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 20, height: 70 },
                styles: { accentColor: { value: ACCENT } }, // audioRecorder.js:91-97
                events: [counterEvent('onRecordingStart', 'starts'), counterEvent('onRecordingSave', 'saves')], // audioRecorder.js:65-68
            },
            counterText(STARTS, 'starts', { top: 140, left: 2, width: 10 }),
            counterText(SAVES, 'saves', { top: 190, left: 2, width: 10 }),
            {
                type: 'Text',
                name: DATA,
                layout: { top: 240, left: 2, width: 30, height: 40 },
                properties: { text: { value: dataProbeText } },
            },
        ]);
        openLinkAppInViewer(SEL.recorderButtonByAria(W, A.idle));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[AudioRecorder-BRW-003] Pause shows save; resume continues; save produces the recording; discard resets', () => {
        installFakeMic();
        cy.get(SEL.label(W)).should('have.text', T.defaultLabel); // audioRecorder.js:160
        cy.get(SEL.saveButton(W)).should('not.exist');
        expectCounter(STARTS, 'starts', 0);
        expectDataUrlNull();

        // idle → recording: one onRecordingStart, the timer replaces the label, no save button yet
        clickRecorder(A.idle);
        expectState(A.recording);
        expectCounter(STARTS, 'starts', 1);
        cy.get(SEL.saveButton(W)).should('not.exist');
        cy.get(SEL.timer(W)).should('be.visible');
        expectFakeMic((s) => {
            expect(s.calls, 'widget + recorder each ask for the mic').to.deep.eq([{ audio: true }, { audio: true, video: false }]);
            expect(s.streams.map((st) => st.active), 'both streams live').to.deep.eq([true, true]);
        });
        timerAtLeast(1);

        // recording → paused: save (✓) and discard (✗) appear; the timer freezes
        clickRecorder(A.recording);
        expectState(A.paused);
        cy.get(SEL.saveButton(W)).should('be.visible');
        cy.get(SEL.discardButton(W)).should('have.length', 1).and('be.visible');
        timerSeconds(W).then(([frozen]) => {
            cy.wait(1600); // > one RecordTimer tick (RecordTimer.jsx:10-12)
            timerSeconds(W).should('deep.eq', [frozen]);

            // paused → recording (resume): save hides again, the timer continues from where it stopped
            clickRecorder(A.paused);
            expectState(A.recording);
            cy.get(SEL.saveButton(W)).should('not.exist');
            timerAtLeast(frozen + 1);
        });
        expectCounter(STARTS, 'starts', 1); // resume is not a new recording

        // pause again → save: the recording is stopped and produced (dataURL + onRecordingSave), the mic released
        clickRecorder(A.recording);
        expectState(A.paused);
        cy.get(SEL.saveButton(W)).realClick(RT.realClick);
        expectState(A.stopped);
        expectCounter(SAVES, 'saves', 1);
        expectDataUrlRecorded();
        cy.get(SEL.saveButton(W)).should('not.exist');
        cy.get(SEL.discardButton(W)).should('have.length', 1).and('be.visible'); // the trash button
        cy.get(SEL.timer(W)).should(($t) => expect($t.text()).to.match(/^00:00:00\/00:00:0[2-9]$/));
        expectFakeMic((s) =>
            expect(s.streams, 'every mic track stopped after save').to.deep.eq([
                { active: false, tracks: ['ended'] },
                { active: false, tracks: ['ended'] },
            ])
        );

        // discard (trash) on the saved recording resets the widget and its dataURL
        cy.get(SEL.discardButton(W)).realClick(RT.realClick);
        expectState(A.idle);
        cy.get(SEL.label(W)).should('have.text', T.defaultLabel);
        expectDataUrlNull();
        expectCounter(SAVES, 'saves', 1);
        expectCounter(STARTS, 'starts', 1);
    });

    it('[AudioRecorder-BRW-003] Discard while paused resets without saving, releases the mic, and a new recording can start', () => {
        installFakeMic();
        clickRecorder(A.idle);
        expectState(A.recording);
        timerAtLeast(1);
        clickRecorder(A.recording);
        expectState(A.paused);

        cy.get(SEL.discardButton(W)).realClick(RT.realClick);
        expectState(A.idle);
        cy.get(SEL.label(W)).should('have.text', T.defaultLabel);
        cy.get(SEL.timer(W)).should('not.exist');
        cy.get(SEL.waveformCanvas(W)).should('not.exist');
        cy.get(SEL.saveButton(W)).should('not.exist');
        expectDataUrlNull();
        cy.wait(1000); // a late onStop would publish dataURL / fire onRecordingSave
        expectCounter(SAVES, 'saves', 0);
        expectDataUrlNull();
        // the widget's own (Waveform) stream is stopped by the discard (AudioRecorder.jsx:173-176) …
        expectFakeMic((s) => expect(s.streams[0].tracks, 'widget stream after discard').to.deep.eq(['ended']));
        cy.wait(500);
        fakeMicState().then((s) => cy.wrap(s.streams.map((st) => st.tracks)).as('tracksAfterDiscard'));

        // the widget is reusable: a new recording starts and saves normally
        recordAndSave(1);
        expectCounter(STARTS, 'starts', 2);
        expectCounter(SAVES, 'saves', 1);
        expectDataUrlRecorded();
        // … and discarding must end the whole capture: no handed-out microphone track may stay live. Checked last so
        // the reuse above is verified too. PRODUCT BUG (red): the X button only runs onReset (RecorderActions.jsx:17,
        // AudioRecorder.jsx:167-191), which never calls stopRecording — the paused MediaRecorder and its microphone
        // stream are left running (browser mic indicator stays on) until the next save/unmount.
        cy.get('@tracksAfterDiscard').then((tracks) =>
            expect(tracks, 'mic tracks right after discard').to.deep.eq([['ended'], ['ended']])
        );
    });

    it('[AudioRecorder-BRW-002] The saved recording plays back through an audio element and play/pause toggles', () => {
        installFakeMic();
        recordAndSave(2);
        expectDataUrlRecorded();
        cy.get(SEL.timer(W)).should(($t) => expect($t.text()).to.match(/^00:00:00\/00:00:0[2-9]$/));

        trackMediaPlayback();
        // play: a real (detached) HTMLAudioElement plays the recording's blob URL
        clickRecorder(A.stopped);
        expectState(A.playing);
        expectMediaPlayback((els) => {
            expect(els, 'one audio element').to.have.length(1);
            expect(els[0]).to.include({ tag: 'audio', paused: false, playError: null, inDom: false });
            expect(els[0].src, 'plays the recording blob').to.match(/^blob:/);
            expect(els[0].currentTime, 'playback advances').to.be.greaterThan(0.3);
        });
        cy.get(SEL.timer(W)).should(($t) => expect($t.text()).to.match(/^00:00:01\//)); // played-time counter runs

        // pause: the same element stops; its position no longer advances
        clickRecorder(A.playing);
        expectState(A.stopped);
        expectMediaPlayback((els) => expect(els[0].paused, 'paused').to.eq(true));
        mediaPlayback().then(([el]) => {
            cy.wait(700);
            expectMediaPlayback((els) => expect(els[0].currentTime, 'position frozen').to.eq(el.currentTime));

            // play again: resumes the same element from where it paused
            clickRecorder(A.stopped);
            expectState(A.playing);
            expectMediaPlayback((els) => {
                expect(els, 'still one audio element').to.have.length(1);
                expect(els[0].paused).to.eq(false);
                expect(els[0].currentTime, 'resumed past the pause point').to.be.greaterThan(el.currentTime);
            });
        });

        // playback reaches the end: the button returns to "Play recording" and the played-time counter resets
        cy.get(SEL.recorderButton(W), { timeout: 10000 }).should('have.attr', 'aria-label', A.stopped);
        expectMediaPlayback((els) => expect(els[0].ended, 'ended').to.eq(true));
        cy.get(SEL.timer(W)).should(($t) => expect($t.text()).to.match(/^00:00:00\/00:00:0[2-9]$/));
    });

    it('[AudioRecorder-BRW-001] While recording the Waveform bars follow the live microphone level; pause flattens them', () => {
        installFakeMic({ level: 1 });
        cy.get(SEL.waveformCanvas(W)).should('not.exist'); // no waveform at idle (AudioRecorder.jsx:330)
        clickRecorder(A.idle);
        expectState(A.recording);

        // loud input → tall frequency bars on the 32-bar canvas
        expectWaveform(W, (w) => {
            expect([w.width, w.height], 'canvas size').to.deep.eq([T.waveform.width, T.waveform.height]);
            expect(w.bars).to.have.length(T.waveform.bars);
            expect(w.bars.filter((h) => h > 6).length, `bars above 6px (${w.bars})`).to.be.at.least(8);
        });

        // silence → every bar collapses to the 1px-up/1px-down minimum (the analyser follows the live input)
        setFakeMicLevel(0);
        expectWaveform(W, (w) =>
            expect(w.bars, 'silent input').to.deep.eq(Array(T.waveform.bars).fill(T.waveform.minBarRows))
        );

        // input back → bars rise again (the canvas keeps animating from the analyser)
        setFakeMicLevel(1);
        expectWaveform(W, (w) => expect(w.bars.filter((h) => h > 6).length, `bars (${w.bars})`).to.be.at.least(8));

        // pause → a static flat line even though the input is loud (Waveform.jsx:59-65)
        clickRecorder(A.recording);
        expectState(A.paused);
        expectWaveform(W, (w) =>
            expect(w.bars, 'paused static line').to.deep.eq(Array(T.waveform.bars).fill(T.waveform.minBarRows))
        );
        cy.wait(500);
        expectWaveform(W, (w) =>
            expect(w.bars, 'still static').to.deep.eq(Array(T.waveform.bars).fill(T.waveform.minBarRows))
        );

        // resume → live bars return
        clickRecorder(A.paused);
        expectState(A.recording);
        expectWaveform(W, (w) => expect(w.bars.filter((h) => h > 6).length, `bars (${w.bars})`).to.be.at.least(8));
    });

    it('[AudioRecorder-BRW-004] A denied microphone shows the denied state and the "Know more" helper', () => {
        installFakeMic();
        denyFakeMic('NotAllowedError');
        cy.window().then((win) => cy.stub(win, 'open').as('windowOpen'));
        cy.get(SEL.knowMore(W)).should('not.exist');

        clickRecorder(A.idle);
        expectState(A.denied);
        cy.get(SEL.label(W)).should('have.text', T.deniedText);
        cy.get(SEL.knowMore(W))
            .should('have.text', T.knowMoreText)
            .and('be.visible')
            .and('have.css', 'color', 'rgb(45, 156, 219)'); // the widget's accentColor (RecorderActions.jsx:37)
        // nothing was recorded and onRecordingStart never fired
        expectCounter(STARTS, 'starts', 0);
        cy.get(SEL.timer(W)).should('not.exist');
        cy.get(SEL.waveformCanvas(W)).should('not.exist');
        expectFakeMic((s) => {
            expect(s.calls, 'only the widget asked; the recorder never started').to.deep.eq([{ audio: true }]);
            expect(s.streams).to.have.length(0);
        });

        // "Know more" opens the browser's microphone-permission help in a new tab
        cy.get(SEL.knowMore(W)).realClick(RT.realClick);
        cy.get('@windowOpen').should('have.been.calledOnceWithExactly', T.micHelpUrl, '_blank');
    });
});
