import React from 'react';
import PropTypes from 'prop-types';
import SolidIcon from '@/_ui/Icon/SolidIcons';

// Renamed from DropzoneArea
const UploadArea = ({
  getRootProps,
  maxFileCount,
  getInputProps,
  isDragActive,
  isDragAccept,
  isDragReject,
  isParsing,
  selectedFilesCount,
  instructionText,
  handleFocus,
  handleBlur,
  disabledState,
  augmentedInputProps,
}) => {
  // --- Refactored Conditions for Readability ---
  const canShowInstructionText = !isParsing && !isDragActive && selectedFilesCount < maxFileCount && !disabledState;
  const showParsingMessage = isParsing;
  const showGenericDropMessage = isDragActive && !isDragAccept && !isDragReject;
  const showAcceptDropMessage = isDragActive && isDragAccept;
  const showRejectDropMessage = isDragActive && isDragReject;
  // --- End Refactored Conditions ---

  return (
    <div {...getRootProps()} onFocus={handleFocus} onBlur={handleBlur} tabIndex={disabledState ? -1 : 0}>
      <input {...augmentedInputProps} />

      {showParsingMessage && <p className="dropzone-message">Parsing files...</p>}

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

      {/* TODO: Add Global Error message display */}
    </div>
  );
};

UploadArea.propTypes = {
  getRootProps: PropTypes.func.isRequired,
  maxFileCount: PropTypes.number.isRequired,
  getInputProps: PropTypes.func.isRequired,
  isDragActive: PropTypes.bool.isRequired,
  isDragAccept: PropTypes.bool.isRequired,
  isDragReject: PropTypes.bool.isRequired,
  isParsing: PropTypes.bool.isRequired,
  selectedFilesCount: PropTypes.number.isRequired,
  instructionText: PropTypes.string.isRequired,
  handleFocus: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  disabledState: PropTypes.bool.isRequired,
  augmentedInputProps: PropTypes.object.isRequired,
};

// Renamed default export
export default UploadArea;
