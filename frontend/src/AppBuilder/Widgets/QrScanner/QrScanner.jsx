import React, { useState } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';
import './qrScanner.scss';

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
      style={{ display: visibility ? '' : 'none', boxShadow, width: '100%', height, overflow: 'hidden' }}
      data-cy={dataCy}
    >
      {errorOccured ? (
        <ErrorModal />
      ) : (
        <QrReader
          className="qr-scanner__reader"
          style={{ width: '100%', height: '100%' }}
          onError={handleError}
          onScan={handleScan}
        />
      )}
    </div>
  );
}
