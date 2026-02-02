import React, { useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Label from '@/_ui/Label';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useFilePicker } from '@/AppBuilder/Widgets/FilePicker/hooks/useFilePicker';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import {
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';

import './fileInput.scss';

export const FileInput = (props) => {
  const {
    id,
    height,
    component,
    fireEvent,
    darkMode,
    styles = {},
    properties = {},
    validation = {},
    setExposedVariable,
    setExposedVariables,
    dataCy,
  } = props;

  const {
    alignment = 'top',
    direction = 'left',
    labelColor = 'var(--cc-primary-text)',
    widthType = 'ofComponent',
    borderRadius = 6,
    backgroundColor = 'var(--cc-surface1-surface)',
    borderColor = 'var(--cc-default-border)',
    accentColor = 'var(--cc-primary-brand)',
    textColor = 'var(--cc-primary-text)',
    errTextColor = 'var(--cc-error-systemStatus)',
    padding = 'default',
    boxShadow = '0px 0px 0px 0px #00000040',
    labelWidth = 0,
    auto: labelAutoWidth = true,
  } = styles;

  const label = properties.label ?? 'Label';
  const placeholder = properties.instructionText ?? 'Select file(s)';

  const isMandatory = validation?.enableValidation ?? false;

  const wrapperRef = useRef(null);

  const inputHeight = useMemo(() => (padding === 'default' ? height || 40 : (height || 40) + 4), [height, padding]);

  const focusFn = () => {
    if (wrapperRef.current) {
      wrapperRef.current.focus();
    }
  };

  const blurFn = () => {
    if (wrapperRef.current) {
      wrapperRef.current.blur();
    }
  };

  const mergedProperties = useMemo(
    () => ({
      ...properties,
      // FileInput is a compact input-style widget: click-to-browse only, no drag area
      enableDropzone: false,
      enablePicker: true,
    }),
    [properties]
  );

  const {
    getRootProps,
    getInputProps,
    selectedFiles,
    isVisible,
    isLoading,
    disabledState,
    disablePicker,
    uiErrorMessage,
  } = useFilePicker({
    ...props,
    properties: mergedProperties,
    styles,
    validation,
    fireEvent,
    setExposedVariable,
    setExposedVariables,
    focusFn,
    blurFn,
  });

  // Expose id as a variable
  useEffect(() => {
    setExposedVariable?.('id', id);
  }, [id, setExposedVariable]);

  const hasError = !!uiErrorMessage;

  const computedStyles = useMemo(
    () => ({
      height: `${inputHeight}px`,
      borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      borderColor: hasError
        ? errTextColor
        : borderColor !== '#CCD1D5'
        ? borderColor
        : disabledState
        ? 'var(--borders-disabled-on-white)'
        : 'var(--borders-default)',
      '--tblr-input-border-color-darker': getModifiedColor(borderColor, 24),
      boxShadow,
      backgroundColor:
        backgroundColor !== '#fff'
          ? backgroundColor
          : disabledState || isLoading
          ? darkMode
            ? 'var(--surfaces-app-bg-default)'
            : 'var(--surfaces-surface-03)'
          : 'var(--surfaces-surface-01)',
      color: !['#1B1F24', '#000', '#000000ff'].includes(textColor)
        ? textColor
        : disabledState
        ? 'var(--text-disabled)'
        : 'var(--text-primary)',
      paddingLeft: padding === 'default' ? '10px' : '0px',
      paddingRight: padding === 'default' ? '10px' : '0px',
    }),
    [
      inputHeight,
      borderRadius,
      hasError,
      errTextColor,
      borderColor,
      boxShadow,
      backgroundColor,
      disabledState,
      isLoading,
      darkMode,
      textColor,
      padding,
    ]
  );

  const componentName = component?.component ?? 'FileInput';
  const _width = getLabelWidthOfInput(widthType, labelWidth);

  const rootProps = getRootProps({
    tabIndex: disabledState || disablePicker ? -1 : 0,
    className: clsx('tj-file-input-field tw-flex tw-items-center tw-justify-between', {
      'tj-file-input-disabled': disabledState || disablePicker,
      'tj-file-input-error': hasError,
    }),
  });

  const inputProps = getInputProps();

  const combinedRootRef = (node) => {
    if (typeof rootProps.ref === 'function') {
      rootProps.ref(node);
    } else if (rootProps.ref) {
      // react-dropzone may provide a ref object
      rootProps.ref.current = node;
    }
    wrapperRef.current = node;
  };

  const selectedSummary =
    selectedFiles.length === 0
      ? placeholder
      : selectedFiles.length === 1
      ? selectedFiles[0].name
      : `${selectedFiles.length} files selected`;

  if (!isVisible) return null;

  return (
    <div
      data-cy={dataCy}
      className={clsx('d-flex', {
        'flex-column': alignment === 'top',
        'align-items-center': alignment !== 'top',
        'flex-row-reverse': direction === 'right' && alignment === 'side',
        'text-right': direction === 'right' && alignment === 'top',
      })}
      style={{ width: '100%' }}
    >
      <Label
        label={label}
        width={labelWidth}
        darkMode={darkMode}
        color={labelColor}
        defaultAlignment={alignment}
        direction={direction}
        auto={labelAutoWidth}
        isMandatory={isMandatory}
        _width={_width}
        widthType={widthType}
        inputId={`component-${id}`}
      />

      <div
        className="px-0 h-100 tw-w-full"
        style={{
          ...getWidthTypeOfComponentStyles(widthType, labelWidth, labelAutoWidth, alignment),
        }}
      >
        <div {...rootProps} ref={combinedRootRef} style={computedStyles} id={`component-${id}`}>
          <input {...inputProps} className="tw-hidden" />

          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-overflow-hidden">
            <span
              className={clsx('tw-text-xs tw-truncate', {
                'tw-text-[color:var(--text-placeholder)]': selectedFiles.length === 0,
              })}
            >
              {selectedSummary}
            </span>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            {isLoading && <Loader width={14} />}
            <button
              type="button"
              className="tj-file-input-button tw-text-xs tw-font-medium"
              disabled={disabledState || disablePicker}
            >
              Browse
            </button>
          </div>
        </div>

        {hasError && (
          <div className="tw-mt-1 tw-text-[11px]" style={{ color: errTextColor }}>
            {uiErrorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

FileInput.propTypes = {
  id: PropTypes.string.isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  component: PropTypes.object,
  fireEvent: PropTypes.func,
  darkMode: PropTypes.bool,
  styles: PropTypes.object,
  properties: PropTypes.object,
  validation: PropTypes.object,
  setExposedVariable: PropTypes.func,
  setExposedVariables: PropTypes.func,
  dataCy: PropTypes.string,
};

FileInput.defaultProps = {
  height: 40,
  darkMode: false,
  styles: {},
  properties: {},
  validation: {},
  fireEvent: () => {},
  setExposedVariable: () => {},
  setExposedVariables: () => {},
};

export default FileInput;
