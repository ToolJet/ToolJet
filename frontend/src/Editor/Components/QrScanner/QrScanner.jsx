import React, { useState } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';

export const QrScanner = function QrScanner({
  component, onEvent, onComponentOptionChanged
}) {

  const handleError = async (errorMessage) => {
    console.log(errorMessage);
    setErrorOccured(true);
  };

  const handleScan = async (data) => {
    if (data != null) {
      onEvent('onDetect', { component, data: data });
      onComponentOptionChanged(component, 'lastDetectedValue', data);
    };
  };

  let [errorOccured, setErrorOccured] = useState(false);

  return (
    <div>
      {
        errorOccured ?
          <ErrorModal />
        :
          <QrReader
            onError={handleError}
            onScan={handleScan}
          />
      }
    </div>
  );
};
