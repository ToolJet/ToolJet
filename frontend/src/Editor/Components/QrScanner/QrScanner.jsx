import React, { useState, useEffect } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';

export const QrScanner = function QrScanner({ styles, fireEvent, setExposedVariable, dataCy }) {
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

  const { visibility, disabledState, boxShadow, backgroundColor, borderColor, borderRadius } = styles;

  return (
    <div
      data-disabled={disabledState}
      style={{
        display: visibility ? '' : 'none',
        boxShadow,
        backgroundColor,
        borderColor,
        borderRadius: Number(borderRadius),
        borderWidth: borderColor ? '1px' : '0px',
        borderStyle: borderColor ? 'solid' : 'none',
      }}
      data-cy={dataCy}
    >
      {errorOccured ? <ErrorModal /> : <QrReader onError={handleError} onScan={handleScan} />}
    </div>
  );
};
