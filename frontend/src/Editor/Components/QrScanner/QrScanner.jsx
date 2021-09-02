import React, { useState } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';
import { resolveReferences, getParsedValue } from '@/_helpers/utils';

export const QrScanner = function QrScanner({
  component, onEvent, onComponentOptionChanged, currentState
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

  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disableState = component.definition.styles?.disableState?.value ?? false;

  const parsedDisableState = typeof disableState !== 'boolean' ? getParsedValue(resolveReferences, disableState, currentState) : disableState;

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  return (
    <div disabled={parsedDisableState} style={{display:parsedWidgetVisibility ? '' : 'none'}}>
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
