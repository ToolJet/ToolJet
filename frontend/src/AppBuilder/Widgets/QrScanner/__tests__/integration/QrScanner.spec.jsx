import { screen, waitFor } from '@testing-library/react';
import { __getQrReaderProps } from 'react-qr-reader';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
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
});
