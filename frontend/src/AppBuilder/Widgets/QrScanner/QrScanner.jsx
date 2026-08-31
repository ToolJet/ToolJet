import React, { useState, useEffect } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';
import { qrScannerFrameStyle } from './qrScannerUtils';

export default function QrScanner({ styles, fireEvent, setExposedVariable, dataCy, height }) {
  const handleError = async (errorMessage) => {
    console.log(errorMessage);
    await setErrorOccured(true);
  };

  const handleScan = async (data) => {
    if (data) {
      await fireEvent('onDetect');
      await setExposedVariable('lastDetectedValue', data);
    }
  };

  const [errorOccured, setErrorOccured] = useState(false);

  const { visibility, disabledState, boxShadow } = styles;

  return (
    <div
      data-disabled={disabledState}
      style={{ display: visibility ? '' : 'none', boxShadow, height, overflow: 'hidden' }}
      data-cy={dataCy}
    >
      {errorOccured ? (
        <ErrorModal />
      ) : (
        // QrReader is square-by-width; this frame is what stops the square from
        // growing past the widget box on a wide canvas. See qrScannerUtils.
        <div style={qrScannerFrameStyle(height)}>
          <QrReader onError={handleError} onScan={handleScan} />
        </div>
      )}
    </div>
  );
}
