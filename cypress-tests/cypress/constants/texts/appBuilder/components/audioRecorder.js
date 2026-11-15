// Texts for the Audio Recorder widget. Config: packages/widget-definitions/src/widgets/audioRecorder.js
// Runtime: frontend/src/AppBuilder/Widgets/AudioRecorder/*
export const audioRecorderText = {
  displayName: "Audio Recorder", // audioRecorder.js:3
  defaultWidgetName: "audiorecorder1",
  widgetPrefix: "audiorecorder",
  defaultSize: { width: 10, height: 70 }, // audioRecorder.js:6-9
  defaultLabel: "Click to start recording", // audioRecorder.js:160

  // Recorder button aria-label per state (AudioRecorder.jsx:286-293)
  aria: {
    idle: "Start recording",
    recording: "Pause recording",
    paused: "Resume recording",
    playing: "Pause playback",
    stopped: "Play recording",
    denied: "Microphone permission denied",
  },
  deniedText: "Microphone permission denied", // RecorderStatusDisplay.jsx:6
  knowMoreText: "Know more", // RecorderActions.jsx:38
  micHelpUrl: "https://support.google.com/chrome/answer/2693767", // AudioRecorder.jsx:75
  zeroTime: "00:00:00", // RecordTimer.jsx:5 + utils.js formatSecondsToHHMMSS

  // Waveform geometry (Waveform.jsx:32-36,53-57,108): 32 bars, 2px wide, 3px gap, canvas 160x40
  waveform: { bars: 32, barWidth: 2, barGap: 3, width: 160, height: 40, minBarRows: 2 },

  // Saved definition defaults — merged under every AudioRecorder that addAudioRecordersViaApi posts
  // (audioRecorder.js:154-179)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // audioRecorder.js:156
      showOnMobile: { value: "{{false}}" }, // audioRecorder.js:157
    },
    properties: {
      label: { value: "Click to start recording" }, // audioRecorder.js:160
      visibility: { value: "{{true}}" },
      disabledState: { value: "{{false}}" },
      loadingState: { value: "{{false}}" },
      tooltip: { value: "" },
      tooltipFormat: { value: "plainText" }, // audioRecorder.js:165
    },
    styles: {
      recorderIcon: { value: "IconMicrophone" }, // audioRecorder.js:169
      recorderIconColor: { value: "#F6430D" },
      labelColor: { value: "var(--cc-primary-text)" },
      accentColor: { value: "var(--cc-primary-brand)" },
      backgroundColor: { value: "var(--cc-surface1-surface)" },
      borderColor: { value: "var(--cc-default-border)" },
      borderRadius: { value: "{{6}}" },
      boxShadow: { value: "0px 0px 0px 0px #00000040" },
      iconVisibility: { value: true }, // audioRecorder.js:177
    },
  },
};
