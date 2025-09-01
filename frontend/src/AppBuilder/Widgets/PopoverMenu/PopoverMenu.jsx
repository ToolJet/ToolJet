import React, { useEffect, useState, useRef } from 'react';
import cx from 'classnames';
const tinycolor = require('tinycolor2');
import * as Icons from '@tabler/icons-react';
import Loader from '@/ToolJetUI/Loader/Loader';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import DOMPurify from 'dompurify';
// eslint-disable-next-line import/no-unresolved
import Markdown from 'react-markdown';
import './styles.scss';
import { getModifiedColor, getSafeRenderableValue } from '@/Editor/Components/utils';

export const PopoverMenu = function PopoverMenu(props) {
  // ===== PROPS DESTRUCTURING =====
  const {
    height,
    properties,
    styles,
    fireEvent,
    id,
    dataCy,
    setExposedVariable,
    setExposedVariables,
    width,
    darkMode,
  } = props;

  const {
    backgroundColor,
    textColor,
    borderRadius,
    loaderColor,
    borderColor,
    boxShadow,
    iconColor,
    direction,
    icon,
    optionsTextColor,
    optionsIconColor,
  } = styles;

  const {
    loadingState,
    disabledState,
    visibility,
    trigger,
    buttonType,
    label,
    options,
    optionsLoadingState,
    advanced,
    schema,
  } = properties;

  // ===== COMPUTED VALUES =====
  const transformedOptions = advanced ? schema : options;
  const iconName = icon;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] == undefined ? Icons['IconAlignBoxBottomLeft'] : Icons[iconName];

  // ===== STATE MANAGEMENT =====
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState || loadingState,
    areOptionsLoading: optionsLoadingState,
    hovered: false,
    showPopover: false,
  });

  // ===== REFS =====
  const buttonContainerRef = useRef(null);

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const renderFormattedText = (text, format) => {
    if (!text) return '';
    const safeText = typeof text === 'object' ? JSON.stringify(text) : text;
    switch (format) {
      case 'markdown':
        return <Markdown className={'reactMarkdown'}>{safeText}</Markdown>;
      case 'html':
        return (
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(safeText || ''),
            }}
          />
        );
      case 'plain':
      default:
        return <span>{safeText}</span>;
    }
  };

  const formatOptions = (options) => {
    return Array.isArray(options)
      ? options.map((option) => {
          return {
            label: option.label,
            description: option.description,
            value: option.value,
          };
        })
      : [];
  };

  // ===== COMPUTED STYLES =====
  const computedIconColor =
    '#FFFFFF' === iconColor ? (buttonType === 'primary' ? iconColor : 'var(--icons-strong)') : iconColor;

  const computedBorderColor =
    borderColor === 'var(--cc-primary-brand)'
      ? buttonType === 'primary'
        ? borderColor
        : 'var(--cc-default-border)'
      : borderColor;

  const computedTextColor =
    '#FFFFFF' === textColor
      ? buttonType === 'primary'
        ? 'var(--text-on-solid)'
        : 'var(--cc-primary-text)'
      : textColor;

  const computedLoaderColor =
    '#FFFFFF' === loaderColor ? (buttonType === 'primary' ? loaderColor : 'var(--cc-primary-brand)') : loaderColor;

  const computedBgColor =
    '#4368E3' === backgroundColor
      ? buttonType === 'primary'
        ? 'var(--cc-primary-brand)'
        : 'transparent'
      : buttonType === 'primary'
      ? backgroundColor
      : 'transparent';

  const computedStyles = {
    backgroundColor: computedBgColor,
    color: computedTextColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height: height == 36 ? '36px' : height,
    '--tblr-btn-color-darker': getModifiedColor(computedBgColor, 'hover'),
    '--tblr-btn-color-clicked': getModifiedColor(computedBgColor, 'active'),
    '--loader-color': tinycolor(computedLoaderColor ?? 'var(--icons-on-solid)').toString(),
    borderColor: computedBorderColor,
    boxShadow: buttonType == 'primary' ? boxShadow : 'var(--elevation-000-box-shadow)',
    padding: '0px 12px',
    opacity: exposedVariablesTemporaryState.isDisabled && '50%',
    display: exposedVariablesTemporaryState.isVisible
      ? exposedVariablesTemporaryState.isLoading
        ? 'flex'
        : ''
      : 'none',
    justifyContent: 'center',
    alignItems: 'center',
  };

  // ===== EVENT HANDLERS =====
  const handleOptionClick = (option) => {
    if (!option.disable && option.visible !== false) {
      setExposedVariable('lastClickedOption', {
        label: option.label,
        description: option.description,
        value: option.value,
      });
      fireEvent('onSelect', { option });
      updateExposedVariablesState('showPopover', false);
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderOptions = () => {
    if (exposedVariablesTemporaryState.areOptionsLoading) {
      return (
        <div className="d-flex justify-content-center p-3" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Loader color={'var(--cc-primary-brand)' || '#000000'} width="24" />
        </div>
      );
    }

    if (!transformedOptions || !Array.isArray(transformedOptions) || transformedOptions.length === 0) {
      return <div className="p-3 text-center text-muted">No options</div>;
    }

    return (
      <div style={{ width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
        {transformedOptions.map((option, index) => {
          if (option.visible?.value === false) return null;
          const iconName = option.icon;
          // eslint-disable-next-line import/namespace
          const IconElement = Icons[iconName] == undefined ? null : Icons[iconName];
          const format = option.format ?? 'plain';
          const iconVisibility = option.iconVisibility ?? true;
          const disable = option.disable ?? false;
          const visible = option.visible ?? true;
          if (!visible) return null;
          return (
            <div
              className={cx('popover-option', { 'popover-option-disabled': disable })}
              key={option.value || index}
              disabled={disable}
              onClick={() => handleOptionClick(option)}
            >
              {iconVisibility && IconElement && (
                <div className="popover-option-icon">
                  <IconElement name={option.icon} size={16} color={optionsIconColor || '#000000'} />
                </div>
              )}
              <div className="popover-option-content">
                <div className="popover-option-label" style={{ color: optionsTextColor || '#000000' }}>
                  {renderFormattedText(option.label, format)}
                </div>
                <div className="popover-option-description">{renderFormattedText(option.description, format)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderButton = () => (
    <div
      className={`widget-button d-flex align-items-center`}
      style={{
        position: 'relative',
      }}
      disabled={exposedVariablesTemporaryState.isDisabled || exposedVariablesTemporaryState.isLoading}
      ref={buttonContainerRef}
      {...(trigger == 'hover' && {
        onMouseOver: () => {
          updateExposedVariablesState('showPopover', true);
        },
      })}
    >
      <button
        className={cx('overflow-hidden jet-btn')}
        style={computedStyles}
        {...(trigger == 'click' && {
          onClick: () => {
            updateExposedVariablesState('showPopover', !exposedVariablesTemporaryState.showPopover);
          },
        })}
        data-cy={dataCy}
        type="default"
        onMouseOver={() => {
          updateExposedVariablesState('hovered', true);
        }}
        onMouseLeave={() => {
          updateExposedVariablesState('hovered', false);
        }}
      >
        {!exposedVariablesTemporaryState.isLoading ? (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: !exposedVariablesTemporaryState.isLoading ? 'flex' : 'none',
              alignItems: 'center',
              flexDirection: direction == 'left' ? 'row-reverse' : 'row',
              justifyContent: 'center',
              gap: label?.length > 0 && '6px',
            }}
          >
            <div
              style={{
                overflow: 'hidden',
              }}
            >
              <span style={{ maxWidth: ' 100%', minWidth: '0' }}>
                <p
                  className="tj-text-sm"
                  style={{ fontWeight: '500', margin: '0px', padding: '0px', color: computedTextColor }}
                >
                  {getSafeRenderableValue(label)}
                </p>
              </span>
            </div>
            {icon && (
              <div className="d-flex">
                {!exposedVariablesTemporaryState.isLoading && (
                  <IconElement
                    style={{
                      width: '16px',
                      height: '16px',
                      color: computedIconColor,
                    }}
                    stroke={1.5}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <Loader color={computedLoaderColor} width="16" />
        )}
      </button>
    </div>
  );

  // ===== EFFECTS =====
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: properties.visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
    {
      dep: optionsLoadingState,
      sideEffect: () => {
        updateExposedVariablesState('areOptionsLoading', optionsLoadingState);
        setExposedVariable('areOptionsLoading', optionsLoadingState);
      },
    },
    {
      dep: transformedOptions,
      sideEffect: () => {
        updateExposedVariablesState('options', transformedOptions);
        setExposedVariable('options', formatOptions(transformedOptions));
      },
    },
    {
      dep: label,
      sideEffect: () => {
        setExposedVariable('label', label);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      label: label,
      options: formatOptions(transformedOptions),
      lastClickedOption: null,
      isDisabled: disabledState || loadingState,
      isVisible: visibility,
      isLoading: loadingState,
      setDisable: async function (value) {
        updateExposedVariablesState('isDisabled', !!value);
        setExposedVariable('isDisabled', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
    };

    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== COMPUTED VALUES FOR RENDER =====
  const hasNoOptions = !transformedOptions || !Array.isArray(transformedOptions) || transformedOptions.length === 0;

  // ===== MAIN RENDER =====
  return (
    <div
      style={{ display: visibility ? 'block' : 'none' }}
      {...(trigger == 'hover' && {
        onMouseLeave: () => {
          updateExposedVariablesState('showPopover', false);
        },
      })}
    >
      <Popover.Root
        open={exposedVariablesTemporaryState.showPopover}
        onOpenChange={(open) => updateExposedVariablesState('showPopover', open)}
      >
        <Popover.Trigger asChild>{renderButton()}</Popover.Trigger>
        <Popover.Portal>
          <div className="popover-menu-container">
            <Popover.Content
              className={cx('popover-content', { 'dark-theme': darkMode })}
              sideOffset={0}
              align="start"
              style={{
                width: width,
                maxWidth: width,
                ...((optionsLoadingState || hasNoOptions) && {
                  height: '120px',
                  alignItems: 'center',
                }),
              }}
              side="bottom"
              avoidCollisions={true}
              collisionPadding={8}
              onEscapeKeyDown={() => updateExposedVariablesState('showPopover', false)}
              onInteractOutside={() => updateExposedVariablesState('showPopover', false)}
            >
              <div className="p-0 w-100">{renderOptions()}</div>
            </Popover.Content>
          </div>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
