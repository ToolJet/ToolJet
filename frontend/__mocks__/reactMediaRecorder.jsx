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
  // Mirrors the live MediaRecorder state so `stopRecording` can keep the real
  // library's semantics (an inactive recorder never emits onstop) even when a
  // widget calls it from an unmount cleanup, where React state is stale.
  const statusRef = React.useRef('idle');

  const startRecording = React.useCallback(() => {
    statusRef.current = 'recording';
    setStatus('recording');
    options.onStart && options.onStart();
  }, [options]);

  const pauseRecording = React.useCallback(() => {
    if (statusRef.current !== 'recording') return;
    statusRef.current = 'paused';
    setStatus('paused');
  }, []);

  const resumeRecording = React.useCallback(() => {
    if (statusRef.current !== 'paused') return;
    statusRef.current = 'recording';
    setStatus('recording');
  }, []);

  const stopRecording = React.useCallback(() => {
    // Real-lib fidelity (react-media-recorder stopRecording): a recorder whose
    // MediaRecorder is inactive (status idle/stopped) is a no-op — no onStop.
    if (!['recording', 'paused'].includes(statusRef.current)) return;
    statusRef.current = 'stopped';
    const blob = new Blob(['mock-camera-recording'], { type: 'video/webm' });
    const url = 'blob:mock/camera-recording';
    setMediaBlobUrl(url);
    setStatus('stopped');
    options.onStop && options.onStop(url, blob);
  }, [options]);

  const clearBlobUrl = React.useCallback(() => {
    statusRef.current = 'idle';
    setMediaBlobUrl(undefined);
    setStatus('idle');
  }, []);

  return {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaBlobUrl,
    clearBlobUrl,
    error: null,
  };
};

module.exports = { useReactMediaRecorder, __getRecorderOptions };
