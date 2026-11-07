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
  const [isVisible, setVisibility] = useState(properties?.visibility ?? true);
  const [isDisabled, setIsDisabled] = useState(properties?.disabledState ?? false);

  const { boxShadow } = styles;

  useEffect(() => {
    if (isVisible !== properties?.visibility) setVisibility(properties?.visibility ?? true);
    if (isDisabled !== properties?.disabledState) setIsDisabled(properties?.disabledState ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties?.visibility, properties?.disabledState]);

  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    setExposedVariable('isDisabled', isDisabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]);

  useEffect(() => {
    setExposedVariables({
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        setVisibility(!!value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
        setIsDisabled(!!value);
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
