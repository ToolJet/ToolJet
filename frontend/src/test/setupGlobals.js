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

// jest-fixed-jsdom swaps the global Blob for Node's implementation so undici/MSW
// work, but leaves File as jsdom's — so this environment holds BOTH kinds of
// blob. jsdom's own FileReader only accepts jsdom Blobs/Files and throws
// "parameter 1 is not of type 'Blob'" on a Node Blob (Camera/AudioRecorder's
// blobToDataURL would always reject), while a Node-only reader cannot read jsdom
// Files, which have no arrayBuffer() (FilePicker/FileInput/FileButton specs build
// `new File(...)` and would always select 0 files). Same class of gap as the
// stubs above: an incompatible browser API, not product behaviour. The probe
// below installs a hybrid only when the native FileReader genuinely cannot read
// this env's Blob (plain jsdom keeps its own FileReader untouched): Node blobs
// (anything with arrayBuffer()) take the buffer path, everything else delegates
// to the captured native jsdom reader.
(() => {
  const NativeFileReader = globalThis.FileReader;
  if (typeof NativeFileReader === 'function') {
    try {
      new NativeFileReader().readAsDataURL(new Blob(['x'])); // throws synchronously on a Node Blob
      return; // native FileReader can read this env's Blob — leave it alone
    } catch (e) {
      /* fall through and install the hybrid reader */
    }
  }

  class HybridFileReader {
    constructor() {
      this.result = null;
      this.error = null;
      this.readyState = 0; // EMPTY
      this.onloadstart = null;
      this.onprogress = null;
      this.onload = null;
      this.onloadend = null;
      this.onerror = null;
      this.onabort = null;
      this._listeners = {};
      this._native = null;
    }

    addEventListener(type, cb) {
      (this._listeners[type] = this._listeners[type] || []).push(cb);
    }

    removeEventListener(type, cb) {
      const list = this._listeners[type];
      if (list) this._listeners[type] = list.filter((fn) => fn !== cb);
    }

    _emit(type) {
      const event = { type, target: this };
      if (typeof this['on' + type] === 'function') this['on' + type](event);
      (this._listeners[type] || []).forEach((fn) => fn(event));
    }

    // jsdom Blobs/Files have no arrayBuffer(); read them with the real jsdom
    // reader and mirror its state/events onto this instance.
    _delegate(method, blob) {
      const native = new NativeFileReader();
      this._native = native;
      for (const type of ['loadstart', 'progress', 'load', 'error', 'abort', 'loadend']) {
        native.addEventListener(type, () => {
          this.result = native.result;
          this.error = native.error;
          this.readyState = native.readyState;
          this._emit(type);
        });
      }
      native[method](blob);
    }

    _read(method, blob, encode) {
      if (!(blob && typeof blob.arrayBuffer === 'function')) {
        if (typeof NativeFileReader === 'function') return this._delegate(method, blob);
        // No native reader to fall back to: reject like the browser would.
        this.readyState = 1;
        this._emit('loadstart');
        this.error = new TypeError(`Failed to execute '${method}' on 'FileReader': parameter 1 is not of type 'Blob'.`);
        this.readyState = 2;
        this._emit('error');
        this._emit('loadend');
        return;
      }
      this.readyState = 1; // LOADING
      this._emit('loadstart');
      blob.arrayBuffer().then(
        (buffer) => {
          this.result = encode(Buffer.from(buffer), blob);
          this.readyState = 2; // DONE
          this._emit('load');
          this._emit('loadend');
        },
        (err) => {
          this.error = err;
          this.readyState = 2;
          this._emit('error');
          this._emit('loadend');
        }
      );
    }

    readAsDataURL(blob) {
      this._read(
        'readAsDataURL',
        blob,
        (buf, b) => `data:${(b && b.type) || 'application/octet-stream'};base64,${buf.toString('base64')}`
      );
    }

    readAsText(blob) {
      this._read('readAsText', blob, (buf) => buf.toString('utf-8'));
    }

    readAsBinaryString(blob) {
      this._read('readAsBinaryString', blob, (buf) => buf.toString('binary'));
    }

    readAsArrayBuffer(blob) {
      this._read('readAsArrayBuffer', blob, (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    }

    abort() {
      if (this._native) return this._native.abort();
      this.readyState = 2;
      this._emit('abort');
      this._emit('loadend');
    }
  }
  HybridFileReader.EMPTY = 0;
  HybridFileReader.LOADING = 1;
  HybridFileReader.DONE = 2;

  globalThis.FileReader = HybridFileReader;
})();
