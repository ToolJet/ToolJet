import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { IconX } from '@tabler/icons-react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import Label from '@/_ui/Label';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useFilePicker } from '@/AppBuilder/Widgets/FilePicker/hooks/useFilePicker';
import { Button } from '@/components/ui/Button/Button';
import RemoveRectangle from '@/_ui/Icon/bulkIcons/RemoveRectangle';

import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import {
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';

import './fileInput.scss';

export const CustomClearIndicator = (props) => {
  return (
    <ClearIndicator {...props}>
      <IconX size={16} color="var(--borders-strong)" className="cursor-pointer clear-indicator" />
    </ClearIndicator>
  );
};

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
    icon = 'IconFileSearch',
    iconColor = 'var(--cc-default-icon)',
  } = styles;

  const label = properties.label ?? 'Label';
  const placeholder = properties.instructionText ?? 'Click to select file';
  const enableClearSelection = properties.enableClearSelection ?? false;

  const isMandatory = validation?.enableValidation ?? false;

  const wrapperRef = useRef(null);

  const _height = useMemo(() => {
    const baseHeight = height || 60;
    return padding === 'default' ? `${baseHeight}px` : `${baseHeight + 4}px`;
  }, [height, padding]);

  // For 'top' alignment, reduce height to account for label space
  const inputElementHeight = useMemo(() => {
    if (alignment === 'top') {
      const baseHeight = height || 60;
      const calculatedHeight = padding === 'default' ? baseHeight : baseHeight + 4;
      return `${calculatedHeight - 18}px`;
    }
    return _height;
  }, [_height, alignment, height, padding]);

  const focusFn = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.focus();
    }
  }, []);

  const blurFn = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.blur();
    }
  }, []);

  const mergedProperties = useMemo(
    () => ({
      ...properties,
      // FileInput is a compact input-style widget: click-to-browse only, no drag area
      enableDropzone: false,
      enablePicker: true,
    }),
    [properties]
  );

  /*
   * Filter out deprecated keys that FilePicker exposes but FileInput should not.
   * - file: legacy single-file array (use files instead)
   * - clearFiles: legacy action name (use clear instead)
   * - setFileName: action not supported in FileInput
   */
  const wrappedSetExposedVariables = useCallback(
    (variables) => {
      const { file, clearFiles, setFileName, ...rest } = variables;
      setExposedVariables(rest);
    },
    [setExposedVariables]
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
    clearFiles,
  } = useFilePicker({
    ...props,
    properties: mergedProperties,
    styles,
    validation,
    fireEvent,
    setExposedVariable,
    setExposedVariables: wrappedSetExposedVariables,
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
      width: '100%',
      height: '100%',
      borderRadius: Number.isNaN(Number(borderRadius)) ? borderRadius : `${borderRadius}px`,
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
      display: 'flex',
      alignItems: 'center',
      overflow: 'visible',
    }),
    [
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
    ]
  );

  const componentName = component?.component ?? 'FileInput';
  const _width = getLabelWidthOfInput(widthType, labelWidth);

  const rootProps = getRootProps({
    tabIndex: disabledState || disablePicker ? -1 : 0,
    className: clsx('tj-file-input-field', {
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
      className={clsx('tw-flex', {
        'tw-flex-col': alignment === 'top',
        'tw-flex-row': alignment === 'side',
        'tw-flex-row-reverse': direction === 'right' && alignment === 'side',
        'tw-text-right': direction === 'right' && alignment === 'top',
      })}
      style={{ width: '100%', height: '100%' }}
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
        style={alignment === 'side' ? { alignItems: 'center', height: '100%' } : {}}
      />

      <div
        className="tw-px-0 tw-h-full tw-min-h-0 tw-w-full tw-flex tw-items-center"
        style={{
          ...getWidthTypeOfComponentStyles(widthType, labelWidth, labelAutoWidth, alignment),
        }}
      >
        <div {...rootProps} ref={combinedRootRef} style={computedStyles} id={`component-${id}`}>
          <input {...inputProps} className="tw-hidden" />

          <div
            className="tw-flex tw-items-center tw-gap-2 tw-border-l-0 tw-border-t-0 tw-border-b-0 tw-border-r tw-border-solid tw-border-border-default tw-px-0"
            style={{ height: '100%' }}
          >
            {isLoading ? (
              <div
                className="tw-flex tw-items-center tw-min-w-[80px] tw-gap-1.5 tw-px-2 tw-rounded-none tw-justify-center"
                style={{ height: '100%' }}
              >
                <Loader color="var(--borders-strong)" width={14} className="tw-inline-block" />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="default"
                className="tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-rounded-none"
                style={{ height: '100%' }}
                disabled={disabledState || disablePicker}
              >
                <TablerIcon iconName={icon} size={16} color={iconColor} className="cursor-pointer clear-indicator" />
                <span className="tw-text-lg">Browse</span>
              </Button>
            )}
          </div>
          <div
            className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-px-2.5"
            style={{ height: '100%', minWidth: 0, overflow: 'hidden' }}
          >
            <span
              className={clsx('tw-text-lg tw-truncate tw-inline-block tw-w-full', {
                'tw-text-[color:var(--text-placeholder)]': selectedFiles.length === 0,
              })}
            >
              {selectedSummary}
            </span>
            {selectedFiles.length > 0 && enableClearSelection && (
              <Button
                variant="ghost"
                iconOnly
                size="small"
                disabled={disabledState}
                onClick={(e) => {
                  e.stopPropagation();
                  clearFiles();
                }}
                style={{ flexShrink: 0 }}
              >
                <IconX width={16} className="cursor-pointer" color={'var(--icon-weak)'} />
              </Button>
            )}
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
  height: 60,
  darkMode: false,
  styles: {},
  properties: {},
  validation: {},
  fireEvent: () => {},
  setExposedVariable: () => {},
  setExposedVariables: () => {},
};

export default FileInput;
