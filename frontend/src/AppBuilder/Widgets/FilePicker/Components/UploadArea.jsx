import React from 'react';
import PropTypes from 'prop-types';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import ErrorMessage from './ErrorMessage';
import { formatFileSize } from '@/_helpers/utils';

// Renamed from DropzoneArea
const UploadArea = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isDragAccept,
  isDragReject,
  isDisabled,
  isFocused,
  uiErrorMessage,
  onFocus,
  onBlur,
  borderRadius,
  boxShadow,
  height,
  instructionText,
  minSize,
  maxSize,
  maxCount,
  fileTypeCategory,
}) => {
  // --- Refactored Conditions for Readability ---
  const canShowInstructionText = !isDragActive && !isDisabled;
  const showGenericDropMessage = isDragActive && !isDragAccept && !isDragReject;
  const showAcceptDropMessage = isDragActive && isDragAccept;
  const showRejectDropMessage = isDragActive && isDragReject;
  const hasUiError = uiErrorMessage && uiErrorMessage.trim() !== '.';
  // --- End Refactored Conditions ---

  const dropzoneClasses = [
    'file-picker-dropzone',
    isDragActive ? 'is-dragging' : '',
    isDragAccept ? 'is-accepting' : '',
    isDragReject ? 'is-rejecting' : '',
    isFocused ? 'is-focused' : '',
    isDisabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      {...getRootProps({ className: dropzoneClasses })}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={isDisabled ? -1 : 0}
      style={{ borderRadius: `${borderRadius}px`, boxShadow, height }}
    >
      <input {...getInputProps()} />

      {hasUiError && (
        <div className="ui-error-message-container">
          <ErrorMessage message={uiErrorMessage} />
        </div>
      )}

      {!hasUiError && (
        <>
          {canShowInstructionText && (
            <p className="dropzone-instruction">
              {instructionText.includes('click')
                ? instructionText.split('click').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      {part}
                      {index < arr.length - 1 && <span className="dropzone-instruction-link">click</span>}
                    </React.Fragment>
                  ))
                : instructionText}
            </p>
          )}

          {showGenericDropMessage && <p className="dropzone-message">Drop the files here ...</p>}
          {showAcceptDropMessage && (
            <p className="dropzone-message">
              <SolidIcon name="pageUpload" width="25px" height="25px" fill="var(--primary-brand)" />
              Drop file to start uploading
            </p>
          )}
          {showRejectDropMessage && <p className="dropzone-message">Cannot upload these files</p>}
        </>
      )}
    </div>
  );
};

UploadArea.propTypes = {
  getRootProps: PropTypes.func.isRequired,
  getInputProps: PropTypes.func.isRequired,
  isDragActive: PropTypes.bool.isRequired,
  isDragAccept: PropTypes.bool.isRequired,
  isDragReject: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  isFocused: PropTypes.bool.isRequired,
  instructionText: PropTypes.string.isRequired,
  uiErrorMessage: PropTypes.string,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  borderRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  boxShadow: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minSize: PropTypes.number,
  maxSize: PropTypes.number,
  maxCount: PropTypes.number,
  fileTypeCategory: PropTypes.string,
};

UploadArea.defaultProps = {
  borderRadius: 6,
  boxShadow: '',
  height: '100%',
  uiErrorMessage: '.',
  minSize: 0,
  maxSize: Infinity,
  maxCount: Infinity,
  fileTypeCategory: '*/*',
};

export default UploadArea;
