// Runs via jest `setupFiles`: BEFORE the test framework and before any module
// in the suite is evaluated.
//
// Everything here exists for one reason: the global is touched at MODULE SCOPE
// by a dependency, so by the time `setupFilesAfterEnv` (setupTests.js) or a
// spec body runs, the import has already thrown. Anything that can wait until
// after the framework loads belongs in setupTests.js instead, where `jest.fn()`
// and `expect` are available.

// react-media-recorder (via AppBuilder/Widgets/AudioRecorder) constructs a
// Worker while its module body evaluates. jsdom implements no Worker at all.
if (typeof globalThis.Worker === 'undefined') {
  globalThis.Worker = class Worker {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.onmessage = null;
      this.onmessageerror = null;
      this.onerror = null;
    }
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return false;
    }
  };
}

// react-media-recorder (AudioRecorder) throws "Unsupported Browser" outright
// when window.MediaRecorder is absent, and both AudioRecorder and Camera call
// navigator.mediaDevices.getUserMedia. jsdom implements neither. Same class of
// gap as Worker above: a missing browser API, not product behaviour, so the
// stub belongs in the environment rather than in each spec.
if (typeof globalThis.MediaRecorder === 'undefined') {
  class MediaRecorder {
    static isTypeSupported() {
      return true;
    }
    constructor(stream, options) {
      this.stream = stream;
      this.options = options;
      this.state = 'inactive';
    }
    start() {
      this.state = 'recording';
    }
    stop() {
      this.state = 'inactive';
    }
    pause() {
      this.state = 'paused';
    }
    resume() {
      this.state = 'recording';
    }
    requestData() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return false;
    }
  }
  globalThis.MediaRecorder = MediaRecorder;
}

if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
  // A stream with no tracks: enough for the widgets to mount. A test that
  // asserts on recorded output should supply its own richer stub.
  const emptyStream = () => ({
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
    addTrack() {},
    removeTrack() {},
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value: {
      getUserMedia: () => Promise.resolve(emptyStream()),
      getDisplayMedia: () => Promise.resolve(emptyStream()),
      enumerateDevices: () => Promise.resolve([]),
      addEventListener() {},
      removeEventListener() {},
    },
  });
}
