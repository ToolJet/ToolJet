// Renderable stand-in for `react-qr-reader` (v2.2.1, the camera lib).
//
// Why a stub and not a transform: the real <QrReader> calls
// `navigator.mediaDevices.getUserMedia` at mount, which jsdom has no camera for,
// so a real scan never happens under jest. Per the QrScanner testing contract
// (D-01/D-02 in ee/test/app-builder/widgets/QrScanner/TESTING.md) the real camera
// scan, permissions, localhost/HTTPS, and iOS Safari are QA/browser-owned; the
// engineering layer drives the widget's OWN `onScan`/`onError` handlers through
// the captured props. `__getQrReaderProps()` exposes the latest props so a spec
// can simulate a scan or a lib error without a camera.
const React = require('react');

let latestProps = {};
const __getQrReaderProps = () => latestProps;

const QrReader = (props) => {
  latestProps = props;
  return React.createElement('div', { 'data-testid': 'qr-reader-mock' });
};

module.exports = QrReader;
module.exports.default = QrReader;
module.exports.__getQrReaderProps = __getQrReaderProps;
