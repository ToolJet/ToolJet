import { screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for the Camera widget.
// Contract: frontend/ee/test/app-builder/widgets/Camera/TESTING.md.
// react-media-recorder is mocked at the module boundary (jest.config
// moduleNameMapper -> __mocks__/reactMediaRecorder.jsx): the stub holds the
// recorder status in real React state and invokes the widget's own
// recorderOptions.onStart/onStop, so onRecordingStart / videoDataURL run for
// real. navigator.mediaDevices (getUserMedia/enumerateDevices),
// URL.createObjectURL, and window.alert are stubbed per D-01 — the camera
// hardware only. Image capture (canvas) and live recording are QA (BRW-001).
// Each test is GREEN against current production and proven RED by the fault
// named in its `// Break this catches:` note.

const ID = 'camera1';

const widget = createWidgetHarness({
  componentType: 'Camera',
  handle: ID,
  id: ID,
  defaultProperties: {
    content: binding('image'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('#ffffff'),
    borderRadius: binding('{{6}}'),
    borderColor: binding('#e5e5e5'),
    boxShadow: binding('0px 0px 0px 0px rgb(0, 0, 0)'),
    textColor: binding('#101010'),
    accentColor: binding('#4d72fa'),
  },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const camContainer = () => document.querySelector('.camera-container');
const wrapper = () => document.querySelector(`[data-cy="draggable-widget-${ID}"]`);

const onRecordingStartCounter = () =>
  setVariableOn(ID, 'onRecordingStart', {
    key: 'onRecordingStartCount',
    value: '{{(variables.onRecordingStartCount ?? 0) + 1}}',
  });
const onRecordingSaveCounter = () =>
  setVariableOn(ID, 'onRecordingSave', {
    key: 'onRecordingSaveCount',
    value: '{{(variables.onRecordingSaveCount ?? 0) + 1}}',
  });

// A DOMException-shaped rejection is how getUserMedia reports a failure.
const rejectGetUserMedia = (name) => () => Promise.reject(Object.assign(new Error(name), { name }));
// The only stream surface the widget touches is getTracks().forEach(stop).
const fakeStream = () => ({ getTracks: () => [{ stop: () => {} }] });

function setMediaDevices(value) {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, writable: true, value });
}

let consoleErrorSpy;
const savedMediaMethods = [];
let originalMediaDevicesDescriptor;
let originalAlert;
let originalCreateObjectURL;
let originalRevokeObjectURL;

beforeAll(() => {
  // jsdom implements none of these on HTMLMediaElement; the Content preview calls
  // them, so stub them to no-ops to keep the recording paths from throwing.
  ['play', 'pause', 'load'].forEach((method) => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, method);
    savedMediaMethods.push([method, descriptor]);
    Object.defineProperty(HTMLMediaElement.prototype, method, {
      configurable: true,
      value: method === 'play' ? jest.fn().mockResolvedValue(undefined) : jest.fn(),
    });
  });
});

afterAll(() => {
  savedMediaMethods.forEach(([method, descriptor]) => {
    if (descriptor) Object.defineProperty(HTMLMediaElement.prototype, method, descriptor);
  });
});

describe('Camera widget', () => {
  beforeEach(() => {
    widget.setup();
    originalAlert = window.alert;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    window.alert = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:mock/object-url');
    URL.revokeObjectURL = jest.fn();
    // Production error paths (getUserMedia rejection, media element quirks) log
    // by design; silence to keep output pristine without hiding assertions.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert = originalAlert;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    if (originalMediaDevicesDescriptor) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevicesDescriptor);
    } else {
      try {
        delete navigator.mediaDevices;
      } catch (e) {
        /* jsdom leaves it undefined */
      }
    }
    consoleErrorSpy.mockRestore();
    widget.teardown();
  });

  // --- Exposed state on mount -------------------------------------------------

  test('[Camera-VAR-001] mount exposes isVisible/isDisabled and the four action functions', async () => {
    // Break this catches: the mount effect not exposing the vars/actions
    // (Camera.jsx:281-304), so {{camera1.setVisibility}} etc. are undefined on load.
    widget.render({});

    await waitFor(() => expect(exposed().isVisible).toBe(true));
    expect(exposed().isDisabled).toBe(false);
    expect(exposed().setVisibility).toBeInstanceOf(Function);
    expect(exposed().setDisable).toBeInstanceOf(Function);
    expect(exposed().resetVideo).toBeInstanceOf(Function);
    expect(exposed().resetImage).toBeInstanceOf(Function);
  });

  test('[Camera-VAR-002] mount seeds imageDataURL and videoDataURL as null', async () => {
    // Break this catches: camera.js exposedVariables not seeding imageDataURL/
    // videoDataURL, so they read as undefined (not null) before any capture.
    widget.render({});

    await waitFor(() => expect(exposed().setVisibility).toBeInstanceOf(Function));
    expect(exposed().imageDataURL).toBeNull();
    expect(exposed().videoDataURL).toBeNull();
  });

  // --- CSA --------------------------------------------------------------------

  test('[Camera-CSA-001] setVisibility flips isVisible and the container display', async () => {
    // Break this catches: setVisibility not updating the temporary visibility
    // state (Camera.jsx:295-297), so a hidden camera stays on screen.
    widget.render({});
    await waitFor(() => expect(camContainer()).toBeInTheDocument());

    await widget.act('setVisibility', false);

    await waitFor(() => expect(camContainer()).toHaveStyle({ display: 'none' }));
    expect(exposed().isVisible).toBe(false);
  });

  test('[Camera-CSA-002] setDisable flips isDisabled and the wrapper disabled class', async () => {
    // Break this catches: setDisable not exposing isDisabled=true
    // (Camera.jsx:299-300), so RenderWidget never adds the wrapper `disabled` class.
    widget.render({});
    await waitFor(() => expect(wrapper()).toBeInTheDocument());

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(wrapper()).toHaveClass('disabled');
  });

  test('[Camera-CSA-003] resetImage nulls imageDataURL', async () => {
    // Break this catches: resetImage not clearing imageDataURL (Camera.jsx:289-291),
    // so a captured image lingers after a reset.
    widget.render({});
    await waitFor(() => expect(exposed().resetImage).toBeInstanceOf(Function));
    widget.setExposedValue(ID, 'imageDataURL', 'data:image/png;base64,QUJD');
    await waitFor(() => expect(exposed().imageDataURL).toBe('data:image/png;base64,QUJD'));

    await widget.act('resetImage');

    await waitFor(() => expect(exposed().imageDataURL).toBeNull());
  });

  test('[Camera-CSA-004] resetVideo nulls videoDataURL', async () => {
    // Break this catches: resetVideo not clearing videoDataURL (Camera.jsx:283-285),
    // so a saved recording lingers after a reset.
    widget.render({});
    await waitFor(() => expect(exposed().resetVideo).toBeInstanceOf(Function));
    widget.setExposedValue(ID, 'videoDataURL', 'data:video/webm;base64,QUJD');
    await waitFor(() => expect(exposed().videoDataURL).toBe('data:video/webm;base64,QUJD'));

    await widget.act('resetVideo');

    await waitFor(() => expect(exposed().videoDataURL).toBeNull());
  });

  // --- Mode (content = image | video) ----------------------------------------

  test('[Camera-MODE-001] content=image shows the capture-photo control and no mic selector', async () => {
    // Break this catches: the footer not gating the mic selector on content
    // (Footer.jsx:71) or mislabelling the capture button, so image mode exposes a
    // microphone picker it never uses.
    widget.render({ properties: { content: binding('image') } });

    expect(await screen.findByRole('button', { name: 'Capture photo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select microphone device' })).not.toBeInTheDocument();
  });

  test('[Camera-MODE-002] content=video shows the start-recording control and the mic selector', async () => {
    // Break this catches: video mode not rendering the mic selector (Footer.jsx:71)
    // or not showing the record control, so audio input can never be chosen.
    widget.render({ properties: { content: binding('video') } });

    expect(await screen.findByRole('button', { name: 'Start recording' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select microphone device' })).toBeInTheDocument();
  });

  // --- Permission / error placeholders ---------------------------------------

  test('[Camera-PERM-001] unsupported environment shows the not-supported placeholder', async () => {
    // Break this catches: the getUserMedia-absent branch not setting
    // permissionError='unsupported' (Camera.jsx:376-382), so an unsupported browser
    // shows a dead preview with no message and an enabled fullscreen button.
    setMediaDevices(undefined); // no navigator.mediaDevices -> the unsupported path
    widget.render({});

    expect(await screen.findByText('Camera preview is not supported in this browser.')).toBeInTheDocument();
    await waitFor(() => expect(camContainer()).toHaveAttribute('data-permission-error', 'unsupported'));
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeDisabled();
  });

  test('[Camera-PERM-002] getUserMedia NotAllowedError shows the permission-denied placeholder', async () => {
    // Break this catches: the getUserMedia catch not recording error.name as
    // permissionError (Camera.jsx:428-430), so a denied prompt shows the neutral
    // 'preview will appear' text and no Learn-more help.
    setMediaDevices({
      getUserMedia: rejectGetUserMedia('NotAllowedError'),
      enumerateDevices: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    widget.render({});

    expect(await screen.findByText('Camera permission denied.')).toBeInTheDocument();
    expect(screen.getByText('Learn more')).toBeInTheDocument();
  });

  test('[Camera-PERM-003] getUserMedia NotFoundError shows the no-device placeholder', async () => {
    // Break this catches: the NotFoundError -> 'No camera device found' mapping
    // (Content.jsx:107-109), the representative device-error branch that
    // NotReadableError/OverconstrainedError share.
    setMediaDevices({
      getUserMedia: rejectGetUserMedia('NotFoundError'),
      enumerateDevices: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    widget.render({});

    expect(await screen.findByText(/No camera device found/)).toBeInTheDocument();
  });

  // --- Device enumeration -----------------------------------------------------

  test('[Camera-DEV-001] empty device list disables the camera selector', async () => {
    // Break this catches: DeviceSelect dropping the !hasDevices guard on
    // isTriggerDisabled (DeviceSelect.jsx:21), so an empty camera list still opens
    // an interactive, empty picker.
    widget.render({});

    const trigger = await screen.findByRole('button', { name: 'Select camera device' });
    expect(trigger).toBeDisabled();
  });

  test('[Camera-DEV-002] populated device list renders the camera options', async () => {
    // Break this catches: refreshDeviceLists not pushing enumerated cameras into
    // deviceLists (Camera.jsx:335-353), so a connected camera never reaches the picker.
    setMediaDevices({
      getUserMedia: rejectGetUserMedia('NotAllowedError'),
      enumerateDevices: () =>
        Promise.resolve([
          { kind: 'videoinput', deviceId: 'cam-a', label: 'FaceTime HD Camera' },
          { kind: 'videoinput', deviceId: 'cam-b', label: 'Logitech C920' },
        ]),
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    widget.render({});

    const trigger = await screen.findByRole('button', { name: 'Select camera device' });
    await waitFor(() => expect(trigger).not.toBeDisabled());
    await widget.session.store.act(async () => {
      fireEvent.click(trigger);
    });

    expect(await screen.findByText('FaceTime HD Camera')).toBeInTheDocument();
    expect(screen.getByText('Logitech C920')).toBeInTheDocument();
  });

  // --- Recording (video) ------------------------------------------------------

  test('[Camera-REC-001] recording start fires onRecordingStart once', async () => {
    // Break this catches: recorderOptions.onStart not firing onRecordingStart
    // (Camera.jsx:60-62), so an app never learns a recording began.
    setMediaDevices({
      getUserMedia: () => Promise.resolve(fakeStream()),
      enumerateDevices: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    widget.render({ properties: { content: binding('video') }, events: onRecordingStartCounter() });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Start recording' })).not.toBeDisabled());
    await widget.session.store.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    });

    await waitFor(() => expect(widget.variables().onRecordingStartCount).toBe(1));
    expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument();
  });

  test('[Camera-REC-002] saving a stopped recording exposes videoDataURL and fires onRecordingSave', async () => {
    // Break this catches: the stopped+save branch not routing the blob through
    // blobToDataURL / not firing onRecordingSave (Camera.jsx:224-230), so a saved
    // recording never reaches the app.
    setMediaDevices({
      getUserMedia: () => Promise.resolve(fakeStream()),
      enumerateDevices: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    widget.render({ properties: { content: binding('video') }, events: onRecordingSaveCounter() });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Start recording' })).not.toBeDisabled());
    await widget.session.store.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument());
    await widget.session.store.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }));
    });
    await waitFor(() => expect(document.querySelector('.camera-save-button')).toBeInTheDocument());
    await widget.session.store.act(async () => {
      fireEvent.click(document.querySelector('.camera-save-button'));
    });

    await waitFor(() => expect(exposed().videoDataURL).toMatch(/^data:video\/webm/));
    expect(widget.variables().onRecordingSaveCount).toBe(1);
  });

  test('[Camera-REC-003] discarding a stopped recording leaves videoDataURL null', async () => {
    // Break this catches: the discard branch calling the save path
    // (Camera.jsx:224-233), so discarding wrongly exposes videoDataURL and fires
    // onRecordingSave.
    setMediaDevices({
      getUserMedia: () => Promise.resolve(fakeStream()),
      enumerateDevices: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    widget.render({ properties: { content: binding('video') }, events: onRecordingSaveCounter() });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Start recording' })).not.toBeDisabled());
    await widget.session.store.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument());
    await widget.session.store.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }));
    });
    await waitFor(() => expect(document.querySelector('.camera-discard-button')).toBeInTheDocument());
    await widget.session.store.act(async () => {
      fireEvent.click(document.querySelector('.camera-discard-button'));
    });

    await waitFor(() => expect(exposed().videoDataURL).toBeNull());
    expect(widget.variables().onRecordingSaveCount).toBeUndefined();
  });

  // --- Styles -----------------------------------------------------------------

  test('[Camera-STYLE-001] visibility=false hides the container', async () => {
    // Break this catches: the container display not tracking visibility
    // (Camera.jsx:494), so a hidden camera stays on screen.
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(camContainer()).toBeInTheDocument());
    expect(camContainer()).toHaveStyle({ display: 'none' });
  });

  test('[Camera-STYLE-002] disabledState=true sets the wrapper disabled class', async () => {
    // Break this catches: disabledState not reaching the exposed isDisabled the
    // wrapper reads. isDisabled has TWO publishers (the mount-effect temp-state
    // spread Camera.jsx:281-304 AND the batched effect Camera.jsx:260-273); both
    // must fail for a disabled camera to stay interactive.
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(wrapper()).toHaveClass('disabled'));
  });

  test('[Camera-STYLE-003] borderColor and boxShadow are applied inline on the container', async () => {
    // Break this catches: dropping the border/boxShadow inline mappings
    // (Camera.jsx:490-497), so the configured frame styling never renders.
    widget.render({
      styles: {
        borderColor: binding('rgb(18, 52, 86)'),
        boxShadow: binding('0px 1px 2px 0px rgb(10, 20, 30)'),
      },
    });

    await waitFor(() => expect(camContainer()).toBeInTheDocument());
    expect(camContainer().style.borderColor).toBe('rgb(18, 52, 86)');
    expect(camContainer().style.boxShadow).toBe('0px 1px 2px 0px rgb(10, 20, 30)');
  });

  test('[Camera-STYLE-004] borderRadius is applied inline as px on the container', async () => {
    // Break this catches: dropping the `${borderRadius}px` mapping (Camera.jsx:493),
    // so the configured corner radius never renders.
    widget.render({ styles: { borderRadius: binding('{{12}}') } });

    await waitFor(() => expect(camContainer()).toBeInTheDocument());
    expect(camContainer().style.borderRadius).toBe('12px');
  });

  // --- Capture guard ----------------------------------------------------------

  test('[Camera-CAP-001] no stream disables the capture control', async () => {
    // Break this catches: captureDisabled dropping the !mediaStream term
    // (Camera.jsx:482), so the capture button is clickable with no camera. A
    // never-resolving getUserMedia keeps mediaStream null with no permissionError,
    // so !mediaStream is the sole disabling term.
    setMediaDevices({
      getUserMedia: () => new Promise(() => {}),
      enumerateDevices: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    widget.render({ properties: { content: binding('image') } });

    const capture = await screen.findByRole('button', { name: 'Capture photo' });
    await waitFor(() => expect(capture).toBeDisabled());
  });
});
