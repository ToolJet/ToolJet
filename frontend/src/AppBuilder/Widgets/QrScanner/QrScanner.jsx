import React, { useState, useEffect } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';

export default function QrScanner({ properties, styles, fireEvent, setExposedVariable, setExposedVariables, dataCy }) {
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

  const { boxShadow } = styles;
  const { visibility, disabledState } = properties;
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  // A changed Visibility / Disable property wins over an earlier setVisibility / setDisable call.
  useEffect(() => {
    setIsVisible(visibility);
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setIsDisabled(disabledState);
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      isDisabled: disabledState,
      setVisibility: async function (value) {
        setIsVisible(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value) {
        setIsDisabled(!!value);
        setExposedVariable('isDisabled', !!value);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-disabled={isDisabled} style={{ display: isVisible ? '' : 'none', boxShadow }} data-cy={dataCy}>
      {errorOccured ? <ErrorModal /> : <QrReader onError={handleError} onScan={handleScan} />}
    </div>
  );
}
