import React, { useMemo, useCallback, useRef } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/Button/Button';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { useFilePicker } from '@/AppBuilder/Widgets/FilePicker/hooks/useFilePicker';
import clsx from 'clsx';

const fontWeightClass = {
  normal: 'tw-font-normal',
  medium: 'tw-font-medium',
  bold: 'tw-font-bold',
};

const justifyClass = {
  left: 'tw-justify-start',
  center: 'tw-justify-center',
  right: 'tw-justify-end',
};

export const FileButton = (props) => {
  const {
    height,
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
    labelColor = 'var(--cc-surface1-surface)',
    icon = 'IconHome2',
    iconVisibility,
    iconColor = 'var(--cc-surface1-surface)',
    iconDirection = 'left',
    loaderColor = 'var(--cc-surface1-surface)',
    contentAlignment = 'center',
    buttonType = 'solid',
    backgroundColor = 'var(--cc-primary-brand)',
    hoverBackgroundColor = 'auto',
    borderRadius = 6,
    boxShadow = '0px 0px 0px 0px #00000040',
    padding = 'default',
  } = styles;

  const buttonText = properties.buttonText ?? 'Upload file';
  const enableClearSelection = properties.enableClearSelection ?? false;

  const DEFAULT_SURFACE_COLOR = 'var(--cc-surface1-surface)';

  const computedLabelColor =
    DEFAULT_SURFACE_COLOR === labelColor
      ? buttonType === 'solid'
        ? labelColor
        : 'var(--cc-primary-text)'
      : labelColor;

  const computedIconColor =
    DEFAULT_SURFACE_COLOR === iconColor ? (buttonType === 'solid' ? iconColor : 'var(--cc-primary-text)') : iconColor;

  const computedLoaderColor =
    DEFAULT_SURFACE_COLOR === loaderColor
      ? buttonType === 'solid'
        ? loaderColor
        : 'var(--cc-primary-brand)'
      : loaderColor;

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

  // Dynamic values that cannot be expressed as static Tailwind classes
  const buttonStyle = {
    borderRadius: `${borderRadius}px`,
    boxShadow,
    ...(buttonType === 'solid' && {
      '--button-primary': backgroundColor,
      ...(hoverBackgroundColor !== 'auto' && { '--button-primary-hover': hoverBackgroundColor }),
    }),
    ...(buttonType === 'outline' && {
      background: 'transparent',
      ...(hoverBackgroundColor !== 'auto' && { '--button-outline-hover': hoverBackgroundColor }),
    }),
  };

  const selectedSummary = selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`;

  if (!isVisible) return null;

  return (
    <div className="fileButton-widget tw-flex tw-flex-col tw-w-full" data-cy={dataCy}>
      <div className="tw-flex tw-items-center" style={{ height, width: '100%' }}>
        <input {...inputProps} className="tw-hidden" />
        <Button
          ref={browseButtonRef}
          variant={buttonVariant}
          size="default"
          className={clsx(
            'tw-flex tw-group tw-w-full tw-h-full tw-items-center tw-gap-1.5',
            'focus:tw-ring-2 focus:tw-ring-[var(--interactive-focus-outline)] focus:tw-ring-offset-2 focus:tw-ring-offset-background',
            justifyClass[contentAlignment] ?? 'tw-justify-start',
            iconVisibility ?? 'tw-justify-center',
            {
              'tw-flex-row-reverse': iconDirection === 'right',
            },
            { 'tw-p-0': padding === 'none' }
          )}
          style={buttonStyle}
          disabled={disabledState}
          onClick={openFilePicker}
        >
          {isLoading ? (
            <div className="tw-w-full tw-flex-1 tw-h-full tw-flex tw-items-center tw-justify-center">
              <Loader color={computedLoaderColor} width="16" />
            </div>
          ) : (
            <>
              {iconVisibility && <TablerIcon iconName={icon} size={16} color={computedIconColor} />}
              <span
                className={clsx(
                  'tw-flex tw-items-center tw-gap-1.5 tw-flex-1 tw-min-w-0 tw-overflow-hidden',
                  justifyClass[contentAlignment] ?? 'tw-justify-start'
                )}
              >
                <span
                  style={{ fontSize: `${labelSize}px`, color: computedLabelColor }}
                  className={clsx('tw-truncate', fontWeightClass[labelWeight] ?? 'tw-font-medium')}
                >
                  {selectedFiles.length === 0 ? buttonText : selectedSummary}
                </span>
                {selectedFiles.length > 0 && enableClearSelection && (
                  <Button
                    variant="ghost"
                    iconOnly
                    size="small"
                    disabled={disabledState}
                    className="tw-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      clearFiles();
                    }}
                  >
                    <IconX width={16} className="tw-cursor-pointer" color={computedLabelColor} />
                  </Button>
                )}
              </span>
            </>
          )}
        </Button>
      </div>
      {uiErrorMessage && (
        <div className="tw-text-[11px] tw-font-normal tw-leading-4 tw-mt-0.5 tw-text-[color:var(--cc-error-systemStatus)]">
          {uiErrorMessage}
        </div>
      )}
    </div>
  );
};
