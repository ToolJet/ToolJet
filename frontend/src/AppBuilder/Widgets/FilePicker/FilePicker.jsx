import React, { useMemo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { formatFileSize } from '@/_helpers/utils';

import FileList from './Components/FileList';
import UploadArea from './Components/UploadArea';
import ValidationBar from './Components/ValidationBar';
import ErrorMessage from './Components/ErrorMessage';
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

  const numericWidgetHeight = Number.parseFloat(String(height).replace('px', '')) || 0; // Default to 0 if parsing fails
  const isSmallWidget = numericWidgetHeight < 200;

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
    isVisible,
    isLoading,
    isMandatory,
    minFileCount,
    maxFileCount,
    dropzoneRejections,
    uiErrorMessage,
    containerBackgroundColor,
    borderRadius,
    containerBorder,
    containerBoxShadow,
    containerPadding,
    dropzoneTitleColor,
    dropzoneActiveColor,
    dropzoneErrorColor,
  } = useFilePicker({ ...props, setExposedVariable, setExposedVariables });

  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    if (dropzoneActiveColor) {
      rootRef.current.style.setProperty('--file-picker-primary-brand', dropzoneActiveColor);
    }
    if (dropzoneErrorColor) {
      rootRef.current.style.setProperty('--file-picker-error-strong', dropzoneErrorColor);
    }
    if (dropzoneTitleColor) {
      rootRef.current.style.setProperty('--file-picker-text-primary', dropzoneTitleColor);
    }
    if (borderRadius !== undefined) {
      rootRef.current.style.setProperty(
        '--file-picker-border-radius',
        typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
      );
    }
    if (containerBackgroundColor) {
      rootRef.current.style.setProperty('--file-picker-background-color', containerBackgroundColor);
    }
    if (containerBorder) {
      rootRef.current.style.setProperty('--file-picker-border', containerBorder);
    }
    if (containerBoxShadow) {
      rootRef.current.style.setProperty('--file-picker-box-shadow', containerBoxShadow);
    }
    if (containerPadding !== undefined) {
      rootRef.current.style.setProperty(
        '--file-picker-padding',
        typeof containerPadding === 'number' ? `${containerPadding}px` : containerPadding
      );
    }
  }, [
    dropzoneActiveColor,
    dropzoneErrorColor,
    dropzoneTitleColor,
    borderRadius,
    containerBackgroundColor,
    containerBorder,
    containerBoxShadow,
    containerPadding,
  ]);

  const [isFocused, setIsFocused] = useState(false);

  const dynamicDropzoneStyle = useMemo(
    () => ({
      display: isVisible ? 'flex' : 'none',
      color: darkMode ? '#c3c9d2' : '#5e6571',
      height: `${numericWidgetHeight}px`,
      overflowY: isSmallWidget ? 'auto' : 'visible',
      opacity: disabledState ? 0.5 : 1,
    }),
    [darkMode, numericWidgetHeight, isVisible, isSmallWidget, disabledState]
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
  const { minSize, maxSize, fileType } = validation;

  const filePaneClasses = clsx(
    'file-picker-files-pane',
    isSmallWidget
      ? 'h-auto overflow-y-visible'
      : selectedFiles.length > 4
      ? 'overflow-y-auto max-h-[38.2%] min-h-[180px]'
      : 'h-auto overflow-y-auto'
  );

  const topSectionClasses = clsx('tw-flex tw-flex-col tw-gap-3 tw-shrink-0 tw-grow', {
    'tw-flex-grow': selectedFiles.length === 0,
  });

  return (
    <div ref={rootRef} className="file-picker-widget-wrapper" style={{ ...dynamicDropzoneStyle }} data-cy={dataCy}>
      {isLoading ? (
        <div className="p-2 tw-flex tw-items-center tw-justify-center h-full">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <>
          <div className={topSectionClasses}>
            <h3 className="file-picker-title" style={{ color: 'var(--file-picker-text-primary)' }}>
              {labelText || 'Upload files'}
            </h3>

            <UploadArea
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              isDragAccept={isDragAccept}
              isDragReject={isDragReject}
              isDisabled={disabledState || disablePicker}
              instructionText={instructionText}
              isFocused={isFocused}
              dropzoneRejections={dropzoneRejections}
              minSize={minSize}
              maxSize={maxSize}
              maxCount={maxFileCount}
              fileTypeCategory={fileType}
              uiErrorMessage={uiErrorMessage}
              onFocus={handleFocus}
              onBlur={handleBlur}
              borderRadius={borderRadius}
              height={height}
              selectedFilesLength={selectedFiles.length}
            />

            <ValidationBar
              minSize={minSize}
              maxSize={maxSize}
              selectedFileCount={selectedFiles.length}
              minFileCount={minFileCount}
              maxFileCount={maxFileCount}
              enableMultiple={enableMultiple}
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className={filePaneClasses}>
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
