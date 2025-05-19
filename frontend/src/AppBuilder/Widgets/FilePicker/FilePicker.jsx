import React, { useMemo, useState, useEffect } from 'react';
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

  // Set the CSS variable globally when dropzoneActiveColor, dropzoneErrorColor, dropzoneTitleColor, or the container style props change
  useEffect(() => {
    if (dropzoneActiveColor) {
      document.documentElement.style.setProperty('--file-picker-primary-brand', dropzoneActiveColor);
    }
    if (dropzoneErrorColor) {
      document.documentElement.style.setProperty('--file-picker-error-strong', dropzoneErrorColor);
    }
    if (dropzoneTitleColor) {
      document.documentElement.style.setProperty('--file-picker-text-primary', dropzoneTitleColor);
    }
    if (borderRadius !== undefined) {
      document.documentElement.style.setProperty(
        '--file-picker-border-radius',
        typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
      );
    }
    if (containerBackgroundColor) {
      document.documentElement.style.setProperty('--file-picker-background-color', containerBackgroundColor);
    }
    if (containerBorder) {
      document.documentElement.style.setProperty('--file-picker-border', containerBorder);
    }
    if (containerBoxShadow) {
      document.documentElement.style.setProperty('--file-picker-box-shadow', containerBoxShadow);
    }
    if (containerPadding !== undefined) {
      document.documentElement.style.setProperty('--file-picker-padding', `${Number.parseInt(containerPadding, 10)}px`);
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
    }),
    [darkMode, numericWidgetHeight, isVisible, isSmallWidget]
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
    <div className="file-picker-widget-wrapper" style={{ ...dynamicDropzoneStyle }} data-cy={dataCy}>
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
