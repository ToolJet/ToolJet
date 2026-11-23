// Selectors for the Audio Recorder widget (frontend/src/AppBuilder/Widgets/AudioRecorder/*).
// Config: packages/widget-definitions/src/widgets/audioRecorder.js
//
// The widget renders NO data-cy of its own (AudioRecorder.jsx:20 discards `dataCy`); everything below is scoped
// under RenderWidget's `draggable-widget-<name>` wrapper and falls back to the widget's own classes/aria-labels.
const root = (name) => `[data-cy="draggable-widget-${name}"]`;

export const audioRecorderSelector = {
  draggableWidget: root,
  // styled wrapper div (AudioRecorder.jsx:297) — the parent of the button/loader container
  wrapper: (name) => `${root(name)} .audio-recorder-button-container`,
  // the main record / pause / resume / play button (AudioRecorder.jsx:304-320); its aria-label tracks the state
  recorderButton: (name) => `${root(name)} .audio-recorder-transparent-button`,
  recorderButtonByAria: (name, aria) => `${root(name)} button[aria-label="${aria}"]`,
  label: (name) => `${root(name)} .audio-recorder-label`, // AudioRecorder.jsx:321
  timer: (name) => `${root(name)} .audio-recorder-timer-container`, // RecorderStatusDisplay.jsx:10
  waveformCanvas: (name) => `${root(name)} .audio-recorder-waveform-container canvas`, // Waveform.jsx:106
  actions: (name) => `${root(name)} .save-discard-button-container`, // AudioRecorder.jsx:341
  saveButton: (name) => `${root(name)} .audio-recorder-save-button`, // RecorderActions.jsx:9-16
  // paused: the X (discard) button next to save; stopped: the trash button (RecorderActions.jsx:17-19,25-32)
  discardButton: (name) => `${root(name)} .save-discard-button-container .audio-recorder-button:not(.audio-recorder-save-button)`,
  knowMore: (name) => `${root(name)} .permission-denied-text`, // RecorderActions.jsx:37
  loader: (name) => `${root(name)} .audio-recorder-loader-container`, // AudioRecorder.jsx:299
};
