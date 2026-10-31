import React, { useEffect, useRef, useState } from 'react';
import QrReader from 'react-qr-reader';
import ErrorModal from './ErrorModal';

export default function QrScanner({ styles, fireEvent, setExposedVariable, dataCy }) {
  const [errorOccured, setErrorOccured] = useState(false);
  // react-qr-reader re-reports the code in front of the camera on every scan tick, and reports
  // null on a tick that finds no code. Remembering the code in view makes one appearance one detection.
  const codeInViewRef = useRef(null);

  const { visibility, disabledState, boxShadow } = styles;
  // react-qr-reader requests the camera as soon as it mounts, so it only mounts while the scanner can be seen.
  const isCameraOn = visibility && !errorOccured;

  useEffect(() => {
    // A camera that comes back (shown again, or retried after an error) starts a fresh session.
    if (!isCameraOn) codeInViewRef.current = null;
  }, [isCameraOn]);

  const handleError = async (errorMessage) => {
    console.log(errorMessage);
    await setErrorOccured(true);
  };

  const handleScan = (data) => {
    // Ignored without forgetting the code in view, so re-enabling does not re-fire a code already handled.
    if (disabledState) return;
    if (!data) {
      codeInViewRef.current = null;
      return;
    }
    if (data === codeInViewRef.current) return;
    codeInViewRef.current = data;
    // Published before firing, so onDetect handlers read the value just scanned.
    setExposedVariable('lastDetectedValue', data);
    fireEvent('onDetect');
  };

  return (
    <div
      className="tw-h-full"
      data-disabled={disabledState}
      style={{ display: visibility ? '' : 'none', boxShadow }}
      data-cy={dataCy}
    >
      {errorOccured && <ErrorModal onClose={() => setErrorOccured(false)} />}
      {isCameraOn && (
        // The reader is always square, so it gets the largest square that fits inside the widget.
        <div className="tw-flex tw-h-full tw-items-center tw-justify-center" style={{ containerType: 'size' }}>
          <QrReader style={{ width: 'min(100cqw, 100cqh)' }} onError={handleError} onScan={handleScan} />
        </div>
      )}
    </div>
  );
}
