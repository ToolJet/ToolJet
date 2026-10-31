import { screen, waitFor } from '@testing-library/react';
import { __getQrReaderProps } from 'react-qr-reader';
import { componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
  drain,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for QrScanner (display name "QR Scanner").
// Contract: frontend/ee/test/app-builder/widgets/QrScanner/TESTING.md.
// react-qr-reader is mocked at the module boundary (jest.config moduleNameMapper
// -> __mocks__/reactQrReader.jsx); __getQrReaderProps() exposes the latest
// onScan/onError props so the widget's own handlers can run without a camera.
// Characterization specs: each is GREEN against current production and proven
// RED by the fault named in its `// Break this catches:` note.

const ID = 'qrscanner1';

const widget = createWidgetHarness({
  componentType: 'QrScanner',
  handle: ID,
  id: ID,
  defaultProperties: {},
  defaultStyles: {
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const container = () => document.querySelector(`[data-cy="${ID}"]`);

const onDetectCounter = () =>
  setVariableOn(ID, 'onDetect', { key: 'onDetectCount', value: '{{(variables.onDetectCount ?? 0) + 1}}' });

describe('QrScanner widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[QrScanner-VAR-001] mount seeds lastDetectedValue as an empty string', async () => {
    // Break this catches: the config not seeding `lastDetectedValue` (qrscanner.js
    // exposedVariables), so `{{qrscanner1.lastDetectedValue}}` is undefined on load.
    widget.render({});

    await waitFor(() => expect(exposed().lastDetectedValue).toBe(''));
  });

  test('[QrScanner-RENDER-001] mount renders the container through the mocked scanner lib', async () => {
    // Break this catches: the container not rendering (QrScanner.jsx:21-24), so the
    // widget has no mount surface at all.
    widget.render({});

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(screen.getByTestId('qr-reader-mock')).toBeInTheDocument();
  });

  test('[QrScanner-DETECT-001] a scan fires onDetect once and exposes lastDetectedValue', async () => {
    // Break this catches: handleScan not firing onDetect / not exposing the value
    // (QrScanner.jsx:11-16), so a scanned code never reaches the app.
    widget.render({ events: onDetectCounter() });
    await waitFor(() => expect(typeof __getQrReaderProps().onScan).toBe('function'));

    await widget.session.store.act(async () => {
      await __getQrReaderProps().onScan('QR-DATA');
    });

    await waitFor(() => expect(exposed().lastDetectedValue).toBe('QR-DATA'));
    expect(widget.variables().onDetectCount).toBe(1);
  });

  test('[QrScanner-DETECT-002] a falsy scan is a no-op', async () => {
    // Break this catches: dropping the `if (data)` guard (QrScanner.jsx:12), so an
    // empty read fires onDetect and clobbers lastDetectedValue.
    widget.render({ events: onDetectCounter() });
    await waitFor(() => expect(typeof __getQrReaderProps().onScan).toBe('function'));

    await widget.session.store.act(async () => {
      await __getQrReaderProps().onScan(null);
    });

    expect(exposed().lastDetectedValue).toBe('');
    expect(widget.variables().onDetectCount).toBeUndefined();
  });

  test('[QrScanner-ERROR-001] a scanner error swaps in the ErrorModal', async () => {
    // Break this catches: handleError not setting errorOccured (QrScanner.jsx:6-9,23),
    // so a camera failure leaves a broken scanner with no explanation.
    widget.render({});
    await waitFor(() => expect(typeof __getQrReaderProps().onError).toBe('function'));

    await widget.session.store.act(async () => {
      await __getQrReaderProps().onError('boom');
    });

    expect(await screen.findByText('QR Scanner is not working')).toBeInTheDocument();
  });

  test('[QrScanner-STYLE-001] visibility=false hides the container', async () => {
    // Break this catches: dropping the `display: visibility ? '' : 'none'` mapping
    // (QrScanner.jsx:22), so a hidden scanner stays on screen.
    widget.render({ styles: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(container()).toHaveStyle({ display: 'none' });
  });

  test('[QrScanner-STYLE-002] disabledState=true sets the container data-disabled', async () => {
    // Break this catches: dropping `data-disabled={disabledState}` (QrScanner.jsx:21),
    // so a disabled scanner stays interactive (the global pointer-events rule no-ops).
    widget.render({ styles: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(container()).toBeInTheDocument());
    expect(container()).toHaveAttribute('data-disabled', 'true');
  });

  describe('detection, availability and recovery (audit QRS-01..05, QRS-07)', () => {
    const reader = () => screen.queryByTestId('qr-reader-mock');
    const readerReady = () => waitFor(() => expect(reader()).toBeInTheDocument());
    // Each call is one react-qr-reader decode tick: a code string, or null for a frame with no code.
    const scan = (data) =>
      widget.session.store.act(async () => {
        await __getQrReaderProps().onScan(data);
      });
    const setStyle = (key, expression) =>
      widget.session.store.act(async () => {
        widget.setComponentProperty(ID, key, expression, 'styles');
      });
    // Lets every handler a scan started finish before an exact count is read.
    const detections = async () => {
      await widget.session.store.act(drain);
      return widget.variables().onDetectCount;
    };

    test('[QrScanner-DETECT-003] an onDetect handler reads the value just scanned, not the previous one', async () => {
      // Break this catches: firing onDetect before publishing lastDetectedValue
      // (QrScanner.jsx handleScan), so every handler resolves the binding one scan behind.
      widget.render({
        events: setVariableOn(ID, 'onDetect', { key: 'seen', value: '{{components.qrscanner1.lastDetectedValue}}' }),
      });
      await readerReady();

      await scan('QR-1');
      await waitFor(() => expect(widget.variables().seen).toBe('QR-1'));

      await scan('QR-2');
      await waitFor(() => expect(widget.variables().seen).toBe('QR-2'));
    });

    test('[QrScanner-DETECT-004] holding one code in view fires onDetect once', async () => {
      // Break this catches: forwarding every decode tick — react-qr-reader re-reports the
      // code in view every `delay` ms — so one physical scan runs the handlers repeatedly.
      widget.render({ events: onDetectCounter() });
      await readerReady();

      await scan('QR-1');
      await scan('QR-1');
      await scan('QR-1');

      expect(await detections()).toBe(1);
      expect(exposed().lastDetectedValue).toBe('QR-1');
    });

    test('[QrScanner-DETECT-005] a different code fires at once; the same code fires again after leaving the frame', async () => {
      // Break this catches: de-duplicating by value alone (a re-shown code never fires) or
      // re-arming only on a null tick (a second code held right after the first is missed).
      widget.render({ events: onDetectCounter() });
      await readerReady();

      await scan('QR-1');
      await scan('QR-2');
      expect(await detections()).toBe(2);

      await scan(null);
      await scan('QR-2');
      expect(await detections()).toBe(3);
      expect(exposed().lastDetectedValue).toBe('QR-2');
    });

    test('[QrScanner-STYLE-003] a disabled scanner keeps its camera but neither exposes nor fires on a scan', async () => {
      // Break this catches: disabledState reaching only data-disabled (pointer-events),
      // which a camera scan ignores, so a disabled scanner keeps detecting.
      widget.render({ styles: { disabledState: binding('{{true}}') }, events: onDetectCounter() });
      await readerReady();

      await scan('QR-1');

      expect(await detections()).toBeUndefined();
      expect(exposed().lastDetectedValue).toBe('');
    });

    test('[QrScanner-STYLE-005] re-enabling resumes detection without re-firing the code handled before', async () => {
      // Break this catches: a disabled scanner still tracking frames, so a code kept in view
      // while a disable-while-processing query runs is submitted a second time on re-enable.
      widget.render({ events: onDetectCounter() });
      await readerReady();
      await scan('QR-1');
      expect(await detections()).toBe(1);

      await setStyle('disabledState', '{{true}}');
      await scan(null);
      await scan('QR-1');
      await setStyle('disabledState', '{{false}}');
      await scan('QR-1');
      expect(await detections()).toBe(1);

      await scan('QR-2');
      expect(await detections()).toBe(2);
      expect(exposed().lastDetectedValue).toBe('QR-2');
    });

    test('[QrScanner-STYLE-004] a hidden scanner keeps the camera reader unmounted until it is shown', async () => {
      // Break this catches: hiding with display:none only, so react-qr-reader still
      // calls getUserMedia at mount and keeps decoding for an invisible widget.
      widget.render({ styles: { visibility: binding('{{false}}') } });
      await waitFor(() => expect(container()).toBeInTheDocument());
      expect(reader()).not.toBeInTheDocument();

      await setStyle('visibility', '{{true}}');
      await readerReady();

      await setStyle('visibility', '{{false}}');
      await waitFor(() => expect(reader()).not.toBeInTheDocument());
    });

    test('[QrScanner-STYLE-006] a scanner shown again starts a fresh session for the code in view', async () => {
      // Break this catches: remembering the last code across a camera restart, so the same
      // code shown to a scanner that was hidden and shown again never fires.
      widget.render({ events: onDetectCounter() });
      await readerReady();
      await scan('QR-1');
      expect(await detections()).toBe(1);

      await setStyle('visibility', '{{false}}');
      await waitFor(() => expect(reader()).not.toBeInTheDocument());
      await setStyle('visibility', '{{true}}');
      await readerReady();
      await scan('QR-1');

      expect(await detections()).toBe(2);
    });

    test('[QrScanner-ERROR-002] closing the camera error retries the camera', async () => {
      // Break this catches: a one-way errorOccured flag whose Close only hides the
      // message, leaving a permanently blank widget until a full page reload.
      widget.render({ events: onDetectCounter() });
      await readerReady();
      await scan('QR-1');
      const failCamera = () =>
        widget.session.store.act(async () => {
          await __getQrReaderProps().onError(new Error('NotAllowedError'));
        });

      await failCamera();
      await screen.findByText('QR Scanner is not working');
      expect(reader()).not.toBeInTheDocument();
      await widget.session.user.click(screen.getByText('Close', { selector: '.modal-footer button' }));
      await readerReady();
      expect(screen.queryByText('QR Scanner is not working')).not.toBeInTheDocument();

      await failCamera();
      await screen.findByText('QR Scanner is not working');
      await widget.session.user.click(screen.getByLabelText('Close'));
      await readerReady();

      await scan('QR-1');
      expect(await detections()).toBe(2);
    });

    test('[QrScanner-VAR-002] a binding reads lastDetectedValue as "" before the first scan', async () => {
      // Break this catches: bindings resolved before the default exposed values are written
      // (componentsSlice initDependencyGraph), so `components.qrscanner1` is missing until a scan.
      widget.render({
        extraComponents: {
          t1: componentDefinition('t1', 'text1', 'Text', {
            text: binding('{{"V:" + JSON.stringify(components.qrscanner1?.lastDetectedValue)}}'),
            visibility: binding('{{true}}'),
          }),
        },
        also: [{ id: 't1', componentType: 'Text' }],
      });

      expect(await screen.findByText('V:""')).toBeInTheDocument();
    });
  });
});
