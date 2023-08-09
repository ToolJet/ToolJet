import React, { useState } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';

export const QrScanner = function QrScanner({ styles, fireEvent, setExposedVariable, dataCy }) {
  const handleError = async (errorMessage) => {
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
    <div data-disabled={disabledState} style={{ display: visibility ? '' : 'none', boxShadow }} data-cy={dataCy}>
      {errorOccured ? <ErrorModal /> : <QrReader onError={handleError} onScan={handleScan} />}
    </div>
  );
};
