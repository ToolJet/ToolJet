import React, { useState } from 'react';
import QrReader from 'react-qr-reader';
import Spinner from '@/_ui/Spinner';
import ErrorModal from './ErrorModal';

export default function QrScanner({ height, properties, styles, fireEvent, setExposedVariable, dataCy }) {
  const { visibility, disabledState, loadingState } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  const handleError = async (errorMessage) => {
    if (!disabledState) {
      console.log(errorMessage);
      await setErrorOccured(true);
    }
  };

  const handleScan = async (data) => {
    if (data && !disabledState) {
      await fireEvent('onDetect');
      await setExposedVariable('lastDetectedValue', data);
    }
  };

  const [errorOccured, setErrorOccured] = useState(false);

  return (
    <div
      data-disabled={disabledState}
      style={{
        height,
        display: visibility ? '' : 'none',
        backgroundColor,
        border: '1px solid',
        borderColor,
        borderRadius: `${borderRadius}px`,
        boxShadow,
      }}
      data-cy={dataCy}
      aria-busy={loadingState}
    >
      {loadingState ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
          <Spinner />
        </div>
      ) : errorOccured ? (
        <ErrorModal />
      ) : (
        <QrReader onError={handleError} onScan={handleScan} />
      )}
    </div>
  );
}
