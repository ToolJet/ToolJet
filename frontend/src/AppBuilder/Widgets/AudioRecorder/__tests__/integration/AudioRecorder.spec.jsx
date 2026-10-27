import { waitFor, fireEvent } from '@testing-library/react';
// eslint-disable-next-line import/named
import { __getRecorderOptions } from 'react-media-recorder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for AudioRecorder (react-media-recorder). Sibling of Camera.
// Contract: frontend/ee/test/app-builder/widgets/AudioRecorder/TESTING.md.
// Characterization specs: each is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.
//
// Boundary stubs (D-01), all browser APIs jsdom lacks and scoped to this spec:
//  - AudioContext + a canvas getContext no-op (beforeEach; restored in afterEach)
//    so the Waveform (rendered at status !== idle) does not crash the recording state.
//  - The react-media-recorder stub, the Node-Blob FileReader shim (setupGlobals),
//    getUserMedia (setupGlobals), and the @tabler/icons-react/dist/esm/icons/* mapper
//    are ambient. dataURL is asserted shape-only (D-02).

const ID = 'audiorecorder1';

const defaultProperties = {
  label: binding('Click to start recording'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
  disabledState: binding('{{false}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
};

const defaultStyles = {
  recorderIcon: binding('IconMicrophone'),
  recorderIconColor: binding('#F6430D'),
  labelColor: binding('var(--cc-primary-text)'),
  accentColor: binding('var(--cc-primary-brand)'),
  backgroundColor: binding('var(--cc-surface1-surface)'),
  borderColor: binding('var(--cc-default-border)'),
  borderRadius: binding('{{6}}'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  iconVisibility: binding('{{true}}'),
};

const widget = createWidgetHarness({
  componentType: 'AudioRecorder',
  handle: ID,
  id: ID,
  defaultProperties,
  defaultStyles,
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const wrapper = () =>
  document.querySelector('.audio-recorder-button-container, .audio-recorder-loader-container')?.parentElement;
const rwWrapper = () => document.querySelector(`[data-cy="draggable-widget-${ID}"]`);
const waitMounted = () =>
  waitFor(
    () =>
      expect(document.querySelector('.audio-recorder-button-container, .audio-recorder-loader-container')).toBeTruthy(),
    {
      timeout: 8000,
    }
  );

const startCounter = () =>
  setVariableOn(ID, 'onRecordingStart', { key: 'startCount', value: '{{(variables.startCount ?? 0) + 1}}' });
const saveCounter = () =>
  setVariableOn(ID, 'onRecordingSave', { key: 'saveCount', value: '{{(variables.saveCount ?? 0) + 1}}' });

describe('AudioRecorder widget', () => {
  let origGetContext;
  beforeEach(() => {
    // Browser boundaries jsdom lacks; scoped so no other canvas widget is affected.
    global.AudioContext = class {
      createMediaStreamSource() {
        return { connect() {} };
      }
      createAnalyser() {
        return { fftSize: 0, frequencyBinCount: 32, getByteFrequencyData() {} };
      }
      close() {}
    };
    origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, fillRect() {}, fillStyle: '' });
    widget.setup();
  });
  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = origGetContext;
    delete global.AudioContext;
    widget.teardown();
  });

  test('[AudioRecorder-VAR-001] mount publishes isVisible/isDisabled/isLoading/dataURL and the CSA', async () => {
    // Break this catches: the mount effect + batched publishers not seeding the
    // exposed flags/dataURL/CSA (AudioRecorder.jsx:195-260).
    widget.render({});
    await waitMounted();

    await waitFor(() => expect(exposed().isVisible).toBe(true));
    expect(exposed().isDisabled).toBe(false);
    expect(exposed().isLoading).toBe(false);
    expect(exposed().dataURL).toBeNull();
    expect(exposed().resetAudio).toBeInstanceOf(Function);
    expect(exposed().setVisibility).toBeInstanceOf(Function);
    expect(exposed().setLoading).toBeInstanceOf(Function);
    expect(exposed().setDisable).toBeInstanceOf(Function);
  });

  test('[AudioRecorder-LABEL-001] the label text renders at idle', async () => {
    // Break this catches: not passing the label through to the status display
    // (AudioRecorder.jsx:305-313 -> RecorderStatusDisplay).
    widget.render({ properties: { label: binding('Tap to record') } });
    await waitMounted();

    await waitFor(() => expect(document.body.textContent).toContain('Tap to record'));
  });

  test('[AudioRecorder-REC-001] clicking start fires onRecordingStart and flips the status', async () => {
    // Break this catches: onClick(idle) not firing onRecordingStart / not starting
    // recording (AudioRecorder.jsx:88-100).
    widget.render({ events: startCounter() });
    await waitMounted();
    await waitFor(() => expect(document.querySelector('[aria-label="Start recording"]')).toBeTruthy());

    await widget.session.store.act(async () => {
      fireEvent.click(document.querySelector('[aria-label="Start recording"]'));
    });

    await waitFor(() => expect(widget.variables().startCount).toBe(1));
    expect(document.querySelector('[aria-label="Pause recording"]')).toBeTruthy();
  });

  test('[AudioRecorder-REC-002] a stop produces the base64 dataURL and fires onRecordingSave', async () => {
    // Break this catches: onStop not running blobToDataURL / not publishing dataURL
    // / not firing onRecordingSave (AudioRecorder.jsx:52-64).
    widget.render({ events: saveCounter() });
    await waitMounted();

    await widget.session.store.act(async () => {
      await __getRecorderOptions().onStop('blob:mock/audio', new Blob(['audio-data'], { type: 'audio/wav' }));
    });

    await waitFor(() => expect(exposed().dataURL).toMatch(/^data:.*;base64,/));
    expect(widget.variables().saveCount).toBe(1);
  });

  test('[AudioRecorder-CSA-001] resetAudio clears dataURL to null', async () => {
    // Break this catches: resetAudio not clearing dataURL (AudioRecorder.jsx:168-190).
    widget.render({});
    await waitMounted();
    await widget.session.store.act(async () => {
      await __getRecorderOptions().onStop('blob:mock/audio', new Blob(['audio-data'], { type: 'audio/wav' }));
    });
    await waitFor(() => expect(exposed().dataURL).toMatch(/^data:.*;base64,/));

    await widget.act('resetAudio');

    await waitFor(() => expect(exposed().dataURL).toBeNull());
  });

  test('[AudioRecorder-CSA-002] setVisibility publishes isVisible and hides the wrapper', async () => {
    // Break this catches: setVisibility not updating the exposed var + state ->
    // display (AudioRecorder.jsx:205-217,272).
    widget.render({});
    await waitMounted();
    await waitFor(() => expect(exposed().setVisibility).toBeInstanceOf(Function));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed().isVisible).toBe(false));
    expect(wrapper()).toHaveStyle({ display: 'none' });
  });

  test('[AudioRecorder-CSA-003] setLoading publishes isLoading and swaps in the Loader', async () => {
    // Break this catches: setLoading not updating the exposed var + state ->
    // Loader (AudioRecorder.jsx:205-217,288-292).
    widget.render({});
    await waitMounted();
    await waitFor(() => expect(exposed().setLoading).toBeInstanceOf(Function));

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed().isLoading).toBe(true));
    expect(document.querySelector('.audio-recorder-loader-container')).toBeTruthy();
  });

  test('[AudioRecorder-CSA-004] setDisable publishes isDisabled', async () => {
    // Break this catches: setDisable not updating the exposed variable
    // (AudioRecorder.jsx:205-217).
    widget.render({});
    await waitMounted();
    await waitFor(() => expect(exposed().setDisable).toBeInstanceOf(Function));

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
  });

  test('[AudioRecorder-STYLE-001] visibility=false hides the wrapper with display:none', async () => {
    // Break this catches: dropping the isVisible -> display:none mapping
    // (AudioRecorder.jsx:272).
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await waitMounted();

    expect(wrapper()).toHaveStyle({ display: 'none' });
  });

  test('[AudioRecorder-STYLE-002] disabledState publishes isDisabled and applies the RenderWidget disabled class', async () => {
    // Break this catches: not publishing isDisabled / the RenderWidget wrapper not
    // taking the disabled class (AudioRecorder.jsx:219-224; RenderWidget).
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await waitMounted();

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(rwWrapper().className).toContain('disabled');
  });

  test('[AudioRecorder-STYLE-003] backgroundColor is applied to the wrapper inline style', async () => {
    // Break this catches: not forwarding backgroundColor to the wrapper
    // (AudioRecorder.jsx:266).
    widget.render({ styles: { backgroundColor: binding('rgb(1, 2, 3)') } });
    await waitMounted();

    expect(wrapper()).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });

  test('[AudioRecorder-STYLE-004] borderColor is applied to the wrapper inline border', async () => {
    // Break this catches: not forwarding borderColor to the wrapper border
    // (AudioRecorder.jsx:268).
    widget.render({ styles: { borderColor: binding('rgb(4, 5, 6)') } });
    await waitMounted();

    expect(wrapper().getAttribute('style')).toContain('1px solid rgb(4, 5, 6)');
  });

  test('[AudioRecorder-STYLE-005] borderRadius is applied to the wrapper inline style', async () => {
    // Break this catches: not forwarding borderRadius to the wrapper
    // (AudioRecorder.jsx:269).
    widget.render({ styles: { borderRadius: binding('{{12}}') } });
    await waitMounted();

    expect(wrapper()).toHaveStyle({ borderRadius: '12px' });
  });

  test('[AudioRecorder-STYLE-006] boxShadow is applied to the wrapper inline style', async () => {
    // Break this catches: not forwarding boxShadow to the wrapper
    // (AudioRecorder.jsx:271).
    widget.render({ styles: { boxShadow: binding('10px 10px 5px 0px rgb(1, 2, 3)') } });
    await waitMounted();

    expect(wrapper()).toHaveStyle({ boxShadow: '10px 10px 5px 0px rgb(1, 2, 3)' });
  });

  test('[AudioRecorder-STYLE-007] labelColor is applied to the label span inline', async () => {
    // Break this catches: not forwarding labelColor to the label span
    // (AudioRecorder.jsx:278-283,305).
    widget.render({ styles: { labelColor: binding('rgb(7, 8, 9)') } });
    await waitMounted();

    expect(document.querySelector('.audio-recorder-label')).toHaveStyle({ color: 'rgb(7, 8, 9)' });
  });

  test('[AudioRecorder-LOAD-001] loadingState renders the Loader', async () => {
    // Break this catches: not rendering the Loader container for loadingState
    // (AudioRecorder.jsx:288-292).
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitMounted();

    expect(document.querySelector('.audio-recorder-loader-container')).toBeTruthy();
    expect(document.querySelector('.audio-recorder-button-container')).toBeNull();
  });

  test('[AudioRecorder-PREC-001] setDisable survives an unrelated property re-resolve', async () => {
    // Break this catches: re-syncing isDisabled from disabledState on an unrelated
    // re-resolve (AudioRecorder.jsx:219-224 deps), clobbering the CSA.
    widget.render({});
    await waitMounted();
    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed().isDisabled).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Changed label', 'properties');
    });

    expect(exposed().isDisabled).toBe(true);
  });
});
