// Stand-in for `react-media-recorder` (the video-recording lib).
//
// Why a stub and not a transform: the real `useReactMediaRecorder` wraps the
// browser `MediaRecorder` and `navigator.mediaDevices.getUserMedia`, neither of
// which jsdom implements, so a real recording never happens under jest. Per the
// Camera testing contract (D-01/D-02 in ee/test/app-builder/widgets/Camera/TESTING.md)
// real photo capture (canvas) and live recording are QA/browser-owned; the
// engineering layer drives the widget's OWN recording handlers.
//
// This stub holds `status`/`mediaBlobUrl` in real React state so calling a handle
// re-renders the widget (which reads `status`), and it invokes the widget's own
// `recorderOptions.onStart`/`onStop` callbacks so `onRecordingStart` /
// `setRecordingResult` run for real. `stopRecording` hands `onStop` a genuine
// Blob so the widget's `blobToDataURL` (FileReader, which jsdom does implement)
// can produce a real `videoDataURL`. `__getRecorderOptions()` exposes the latest
// options for specs that need to drive the callbacks directly.
const React = require('react');

let latestOptions = null;
const __getRecorderOptions = () => latestOptions;

const useReactMediaRecorder = (options = {}) => {
  latestOptions = options;
  const [status, setStatus] = React.useState('idle');
  const [mediaBlobUrl, setMediaBlobUrl] = React.useState(undefined);

  const startRecording = React.useCallback(() => {
    setStatus('recording');
    options.onStart && options.onStart();
  }, [options]);

  const stopRecording = React.useCallback(() => {
    const blob = new Blob(['mock-camera-recording'], { type: 'video/webm' });
    const url = 'blob:mock/camera-recording';
    setMediaBlobUrl(url);
    setStatus('stopped');
    options.onStop && options.onStop(url, blob);
  }, [options]);

  const clearBlobUrl = React.useCallback(() => {
    setMediaBlobUrl(undefined);
    setStatus('idle');
  }, []);

  return { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl, error: null };
};

module.exports = { useReactMediaRecorder, __getRecorderOptions };
