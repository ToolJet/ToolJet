import React, { useMemo, useCallback, useRef } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { components } from 'react-select';
import { IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/Button/Button';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { useFilePicker } from '@/AppBuilder/Widgets/FilePicker/hooks/useFilePicker';
import clsx from 'clsx';

const { ClearIndicator } = components;

export const CustomClearIndicator = (props) => {
  return (
    <ClearIndicator {...props}>
      <IconX size={16} color="var(--borders-strong)" className="cursor-pointer clear-indicator" />
    </ClearIndicator>
  );
};

export const FileButton = (props) => {
  const {
    height,
    width,
    properties,
    styles,
    fireEvent,
    setExposedVariable,
    setExposedVariables,
    darkMode,
    validation = {},
    dataCy,
    id,
  } = props;
  const browseButtonRef = useRef(null);

  const {
    labelSize = 14,
    labelWeight = 'medium',
    labelColor = 'var(--cc-text-on-solid)',
    icon = 'IconHome2',
    iconVisibility,
    iconColor = 'var(--cc-surface1-surface)',
    iconDirection = 'left',
    loaderColor = 'var(--cc-surface1-surface)',
    contentAlignment = 'left',

    buttonType = 'solid',
    backgroundColor = 'var(--cc-primary-brand)',
    hoverBackgroundColor = 'auto',
    borderRadius = 6,
    boxShadow = '0px 0px 0px 0px #00000040',
    padding = 'default',
  } = styles;

  const buttonText = properties.buttonText ?? 'Upload file';
  const enableClearSelection = properties.enableClearSelection ?? false;

  const mergedProperties = useMemo(
    () => ({
      ...properties,
      enableDropzone: false,
      enablePicker: true,
    }),
    [properties]
  );

  const wrappedSetExposedVariables = useCallback(
    (variables) => {
      const { file: _file, clearFiles: _clearFiles, setFileName: _setFileName, ...rest } = variables;
      setExposedVariables(rest);
    },
    [setExposedVariables]
  );

  const focusFn = useCallback(() => {
    if (browseButtonRef.current && !browseButtonRef.current.disabled) {
      browseButtonRef.current.focus();
    }
  }, []);

  const blurFn = useCallback(() => {
    if (browseButtonRef.current && document.activeElement === browseButtonRef.current) {
      browseButtonRef.current.blur();
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    selectedFiles,
    isVisible,
    isLoading,
    disabledState,
    disablePicker,
    clearFiles,
    uiErrorMessage,
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

  const { onClick: openFilePicker } = getRootProps();
  const inputProps = getInputProps();

  const buttonVariant = buttonType === 'outline' ? 'outline' : 'primary';
  const contentJustify = { left: 'flex-start', center: 'center', right: 'flex-end' }[contentAlignment] ?? 'flex-start';

  const buttonStyle = {
    height: '100%',
    borderRadius: `${borderRadius}px`,
    boxShadow,
    justifyContent: contentJustify,
    ...(padding === 'none' && { padding: 0 }),
    // Override CSS vars so Tailwind hover classes work correctly
    ...(buttonType === 'solid' && {
      '--button-primary': backgroundColor,
      ...(hoverBackgroundColor !== 'auto' && { '--button-primary-hover': hoverBackgroundColor }),
    }),
    ...(buttonType === 'outline' && {
      ...(hoverBackgroundColor !== 'auto' && { '--button-outline-hover': hoverBackgroundColor }),
    }),
  };
  const labelStyle = { fontSize: `${labelSize}px`, fontWeight: labelWeight, color: labelColor };
  const iconWrapStyle = {
    display: 'flex',
    flexDirection: iconDirection === 'right' ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    overflow: 'hidden',
  };

  const selectedSummary = selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`;

  if (!isVisible) return null;

  return (
    <div className="fileButton-widget tw-flex tw-flex-col tw-w-full" data-cy={dataCy}>
      <div className="tw-flex tw-items-center tw-gap-2" style={{ height, width: '100%' }}>
        {isLoading ? (
          <Loader color={loaderColor} />
        ) : (
          <>
            <input {...inputProps} className="tw-hidden" />
            <Button
              ref={browseButtonRef}
              variant={buttonVariant}
              size="default"
              className="tw-flex tw-group tw-w-full tw-items-center tw-gap-1.5 focus:tw-ring-2 focus:tw-ring-[var(--interactive-focus-outline)] focus:tw-ring-offset-2 focus:tw-ring-offset-background "
              style={buttonStyle}
              disabled={disabledState}
              onClick={openFilePicker}
            >
              <span style={iconWrapStyle}>
                {iconVisibility && <TablerIcon iconName={icon} size={16} color={iconColor} />}
                <span style={labelStyle} className="tw-text-lg tw-truncate">
                  {selectedFiles.length === 0 ? buttonText : selectedSummary}
                </span>
              </span>
              {selectedFiles.length > 0 && enableClearSelection && (
                <Button
                  variant="ghost"
                  iconOnly
                  size="small"
                  disabled={disabledState}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    clearFiles();
                  }}
                  style={{ flexShrink: 0 }}
                >
                  <IconX width={16} className="cursor-pointer" color="var(--icon-default)" />
                </Button>
              )}
            </Button>
          </>
        )}
      </div>
      {uiErrorMessage && (
        <div
          style={{
            color: 'var(--cc-error-systemStatus)',
            fontSize: '11px',
            fontWeight: 400,
            lineHeight: '16px',
            marginTop: '2px',
          }}
        >
          {uiErrorMessage}
        </div>
      )}
    </div>
  );
};
