// Texts for the QR Scanner widget. Config: packages/widget-definitions/src/widgets/qrscanner.js
// Runtime: frontend/src/AppBuilder/Widgets/QrScanner/{QrScanner,ErrorModal}.jsx; camera lib react-qr-reader@2.2.1
export const qrScannerText = {
  displayName: "QR Scanner", // qrscanner.js:3
  defaultWidgetName: "qrscanner1", // qrscanner.js:2 (name) → lowercased + 1
  widgetPrefix: "qrscanner",
  defaultSize: { width: 10, height: 300 }, // qrscanner.js:6-9
  eventOnDetect: "onDetect", // qrscanner.js:16
  exposedLastDetectedValue: "lastDetectedValue", // qrscanner.js:37

  // ErrorModal.jsx:15,25-26,20,30
  errorTitle: "QR Scanner is not working",
  errorBody:
    "Please make sure a camera is available on your device. Try closing your browser and opening it again, if it doesn't work, please contact support.",
  closeAriaLabel: "Close",
  closeButtonText: "Close",

  // react-qr-reader defaultProps: delay 500 ms between scans, facingMode 'environment' (lib/index.js:461-465);
  // initiate() asks getUserMedia({ video: { facingMode: { ideal }, frameRate: { ideal: 25, min: 10 } } }) (lib/index.js:185-197)
  scanDelayMs: 500,
  facingMode: "environment",

  // QR code fixtures painted into the fake camera. The payload is baked into the PNG (generated once with the
  // `qrcode` package and verified with jsQR), so it cannot be a fake.* value.
  qr: {
    alpha: { fixture: "qrScanner/qr-alpha.png", payload: "TJ-QR-ALPHA-7F3C" }, // source: fixtures/qrScanner/qr-alpha.png
    beta: { fixture: "qrScanner/qr-beta.png", payload: "https://tooljet.com/qr/beta?id=42" }, // source: fixtures/qrScanner/qr-beta.png
  },

  // Saved definition defaults (qrscanner.js:39-50)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // qrscanner.js:41
      showOnMobile: { value: "{{true}}" }, // qrscanner.js:42
    },
    styles: {
      visibility: { value: "{{true}}" }, // qrscanner.js:47
      disabledState: { value: "{{false}}" }, // qrscanner.js:48
    },
  },
};
