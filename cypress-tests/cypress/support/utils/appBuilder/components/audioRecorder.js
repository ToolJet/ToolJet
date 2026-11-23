/**
 * MODULE — appBuilder/components/audioRecorder: browser-only helpers for the Audio Recorder widget.
 * FOR AI: addAudioRecordersViaApi seeds fully-configured Audio Recorders (audioRecorder.js definition defaults
 * merged) plus helper widgets and events in one components POST (delegates to addIconsViaApi, which posts any
 * non-Icon `type` verbatim). expectWaveform reads the live <canvas> Waveform's pixels (on every retry) into the painted height
 * of each of its 32 bars. Media fakes (getUserMedia / playback tracking) live in ./mediaCommon.
 */
import { audioRecorderText } from "Texts/appBuilder/components/audioRecorder";
import { audioRecorderSelector } from "Selectors/appBuilder/components/audioRecorder";
import { addIconsViaApi } from "Support/utils/appBuilder/components/icon";

const T = audioRecorderText;

/**
 * @tjBlock  userflow
 * @tjUsage  addAudioRecordersViaApi([{ name: 'rec', layout: { top: 40, left: 2, width: 14, height: 70 }, events: [counterEvent('onRecordingStart', 'starts')] }, counterText('startcount', 'starts', { top: 140 })])
 * @tjDom    item without `type` → an AudioRecorder with audioRecorder.js:154-179 definition defaults under
 *           properties/styles/others; any other `type` posts only what is passed. Events per addIconsViaApi.
 */
export const addAudioRecordersViaApi = (items, appIdArg) => {
  const D = T.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== "AudioRecorder"
        ? item
        : {
            ...item,
            type: "AudioRecorder",
            layout: { top: 40, left: 2, width: T.defaultSize.width, height: T.defaultSize.height, ...item.layout },
            properties: { ...D.properties, ...item.properties },
            styles: { ...D.styles, ...item.styles },
            others: { ...D.others, ...item.others },
          }
    ),
    appIdArg
  );
};

const readWaveform = (canvas) => {
  const { width, height } = canvas;
  const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const { bars: n, barWidth, barGap } = T.waveform;
  const bars = [];
  for (let i = 0; i < n; i++) {
    const x = i * (barWidth + barGap);
    let rows = 0;
    for (let y = 0; y < height; y++) if (data[(y * width + x) * 4 + 3] > 0) rows++;
    bars.push(rows);
  }
  return { width, height, bars };
};

/**
 * @tjBlock  userflow
 * @tjUsage  expectWaveform('rec', (w) => expect(Math.max(...w.bars)).to.be.greaterThan(2))
 * @tjDom    the Waveform <canvas> (Waveform.jsx:104-116), re-read on every retry — getImageData over the whole
 *           canvas; bar i occupies columns i*(barWidth+barGap)…+barWidth-1 (Waveform.jsx:54-57,77-89); its height is
 *           the number of rows with any painted (alpha>0) pixel in its first column. fn gets { width, height, bars[] }.
 */
export const expectWaveform = (name, fn) =>
  cy.get(audioRecorderSelector.waveformCanvas(name)).should(($c) => fn(readWaveform($c[0])));

/**
 * @tjBlock  userflow
 * @tjUsage  timerSeconds('rec').then((s) => …)   // [elapsed] or [played, total] in seconds
 * @tjDom    .audio-recorder-timer-container text "HH:MM:SS" or "HH:MM:SS/HH:MM:SS" (RecorderStatusDisplay.jsx:10-18)
 */
export const timerSeconds = (name) =>
  cy.get(audioRecorderSelector.timer(name)).then(($t) =>
    $t
      .text()
      .split("/")
      .map((part) => part.trim().split(":").map(Number))
      .map(([h, m, s]) => h * 3600 + m * 60 + s)
  );
