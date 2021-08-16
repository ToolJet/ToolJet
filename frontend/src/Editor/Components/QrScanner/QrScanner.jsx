import React, { useState } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import QrReader from 'react-qr-reader'
import ErrorModal from './ErrorModal';

export const QrScanner = function QrScanner({
  component, onEvent, onComponentOptionChanged, currentState
}) {

  const handleError = async (errorMessage) => {
    console.log(errorMessage)
    setErrorOccured(true)
  };

  const handleScan = async (data) => {
    if (data != null) {
      onEvent('onDetect', { component, data: data })
      onComponentOptionChanged(component, 'lastDetectedValue', data)
    }
  };

  const active = resolveReferences(
    component.definition.properties.active.value,
    currentState
  );

  let [errorOccured, setErrorOccured] = useState(false);

  return (
    <div>
      {
        active === true ?
          errorOccured ?
            <ErrorModal />
          :
            <QrReader
              onError={handleError}
              onScan={handleScan}
            /> 
        :
          ''
      }
    </div>
  );
};
