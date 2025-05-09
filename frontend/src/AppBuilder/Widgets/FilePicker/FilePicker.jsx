import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import FileList from './Components/FileList';
import UploadArea from './Components/UploadArea';
import ValidationBar from './Components/ValidationBar';
import './style.scss';
import { useFilePicker } from './hooks/useFilePicker';

const FilePicker = (props) => {
  const {
    id,
    width,
    height,
    component,
    fireEvent,
    onComponentOptionChanged,
    darkMode,
    styles,
    properties,
    validation,
    setExposedVariable,
    setExposedVariables,
    dataCy,
  } = props;

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    selectedFiles,
    fileErrors,
    uploadingStatus,
    isParsing,
    handleRemoveFile,
    labelText,
    instructionText,
    disablePicker,
    disabledState,
    borderRadius,
    boxShadow,
    isVisible,
    isLoading,
    isMandatory,
  } = useFilePicker({ ...props, setExposedVariable, setExposedVariables });

  const [isFocused, setIsFocused] = useState(false);

  const dynamicDropzoneStyle = useMemo(
    () => ({
      display: isVisible ? 'flex' : 'none',
      borderRadius: `${borderRadius}px`,
      backgroundColor: darkMode ? '#2b3541' : '#fcfcfd',
      color: darkMode ? '#c3c9d2' : '#5e6571',
      boxShadow: boxShadow,
      height: `${height}px`,
    }),
    [borderRadius, darkMode, boxShadow, height, isVisible]
  );

  const dropzoneClasses = clsx('file-picker-dropzone', {
    'is-dragging': isDragActive,
    'is-accepting': isDragAccept,
    'is-rejecting': isDragReject,
    'is-disabled': disabledState || disablePicker,
    'is-focused': isFocused,
  });

  const widgetVisibility = styles?.visibility ?? true;
  if (!widgetVisibility) {
    return null;
  }

  const handleFocus = () => {
    if (!disabledState) {
      setIsFocused(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const rootProps = getRootProps({ className: dropzoneClasses });
  const inputProps = getInputProps();
  const augmentedInputProps = {
    ...inputProps,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  const { enableMultiple } = properties;
  const { minSize, maxSize, minFileCount, maxFileCount } = validation;
  return (
    <div className="file-picker-widget-wrapper" style={{ ...dynamicDropzoneStyle }} data-cy={dataCy}>
      {isLoading ? (
        <div className="p-2 tw-flex tw-items-center tw-justify-center h-full">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : (
        <>
          <div className="tw-shrink-0 tw-flex tw-flex-col tw-gap-3 tw-h-full">
            <h3 className="file-picker-title">{labelText}</h3>

            <UploadArea
              getRootProps={() => rootProps}
              getInputProps={() => augmentedInputProps}
              augmentedInputProps={augmentedInputProps}
              maxFileCount={maxFileCount}
              isDragActive={isDragActive}
              isDragAccept={isDragAccept}
              isDragReject={isDragReject}
              isParsing={isParsing}
              selectedFilesCount={selectedFiles.length}
              instructionText={instructionText}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              disabledState={disabledState || disablePicker}
            />

            {isMandatory && (
              <ValidationBar
                minSize={minSize}
                maxSize={maxSize}
                selectedFileCount={selectedFiles.length}
                minFileCount={minFileCount}
                maxFileCount={maxFileCount}
                enableMultiple={enableMultiple}
              />
            )}
          </div>
          {selectedFiles.length > 0 && (
            <div className="file-picker-files-pane">
              <FileList
                files={selectedFiles}
                onRemoveFile={handleRemoveFile}
                errors={fileErrors}
                uploadingStatus={uploadingStatus}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

FilePicker.propTypes = {
  id: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  component: PropTypes.object,
  fireEvent: PropTypes.func,
  onComponentOptionChanged: PropTypes.func,
  darkMode: PropTypes.bool,
  styles: PropTypes.object,
  properties: PropTypes.object,
  setExposedVariable: PropTypes.func,
  setExposedVariables: PropTypes.func,
  dataCy: PropTypes.string,
};

FilePicker.defaultProps = {
  width: '100%',
  darkMode: false,
  styles: {},
  properties: {},
  fireEvent: () => {},
  setExposedVariable: () => {},
  setExposedVariables: () => {},
};

export default FilePicker;
