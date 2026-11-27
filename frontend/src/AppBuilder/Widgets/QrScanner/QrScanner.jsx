import React, { useState, useEffect } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';
import { themedShadow } from '@/AppBuilder/_helpers/themeStyles';

export default function QrScanner({ styles, fireEvent, setExposedVariable, dataCy }) {
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

  const { visibility, disabledState, boxShadow: savedBoxShadow, boxShadowStyle } = styles;
  // The theme shadow (or this widget's own) as CSS.
  const boxShadow = themedShadow(boxShadowStyle, savedBoxShadow);

  return (
    <div data-disabled={disabledState} style={{ display: visibility ? '' : 'none', boxShadow }} data-cy={dataCy}>
      {errorOccured ? <ErrorModal /> : <QrReader onError={handleError} onScan={handleScan} />}
    </div>
  );
}
