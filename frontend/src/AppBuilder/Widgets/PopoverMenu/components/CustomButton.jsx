import React, { forwardRef } from 'react';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import * as Icons from '@tabler/icons-react';
import { getModifiedColor, getSafeRenderableValue } from '@/Editor/Components/utils';
const tinycolor = require('tinycolor2');

export const CustomButton = forwardRef((props, forwardedRef) => {
  // ===== PROPS DESTRUCTURING =====
  const {
    styles,
    buttonType,
    height,
    exposedVariablesTemporaryState,
    updateExposedVariablesState,
    transformedOptions,
    trigger,
    label,
    id,
  } = props;

  // ===== STYLE PROPS =====
  const {
    backgroundColor,
    textColor,
    borderRadius,
    loaderColor,
    borderColor,
    boxShadow,
    iconColor,
    direction,
    iconVisibility,
    icon,
  } = styles;

  // ===== COMPUTED STYLES =====
  const iconName = icon;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[iconName] === undefined ? Icons['IconAlignBoxBottomLeft'] : Icons[iconName];

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
    height: height === 36 ? '36px' : height,
    '--tblr-btn-color-darker': getModifiedColor(computedBgColor, 'hover'),
    '--tblr-btn-color-clicked':
      buttonType === 'primary'
        ? getModifiedColor(computedBgColor, 'active')
        : 'var(--interactive-overlay-fill-pressed)',
    '--loader-color': tinycolor(computedLoaderColor ?? 'var(--icons-on-solid)').toString(),
    borderColor: computedBorderColor,
    boxShadow: buttonType === 'primary' && boxShadow,
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

  // ===== HELPERS =====
  const findFirstAvailableOptionIndex = () => {
    if (!transformedOptions || !Array.isArray(transformedOptions)) {
      return -1;
    }

    const visibleOptions = transformedOptions.filter((option) => option.visible !== false);
    if (visibleOptions.length === 0) return -1;

    // Find the first non-disabled option
    for (let i = 0; i < visibleOptions.length; i++) {
      if (!visibleOptions[i].disable) {
        // Find the actual index in the original array
        return transformedOptions.findIndex((option) => option.value === visibleOptions[i]?.value);
      }
    }

    // If all options are disabled, return -1
    return -1;
  };

  // ===== MAIN RENDER =====
  return (
    <div
      data-cy="popover-menu-button-container"
      className={`widget-button d-flex align-items-center`}
      style={{
        position: 'relative',
      }}
      disabled={exposedVariablesTemporaryState.isDisabled || exposedVariablesTemporaryState.isLoading}
      ref={forwardedRef}
      {...(trigger === 'hover' && {
        onMouseOver: () => {
          updateExposedVariablesState('showPopover', true);
        },
      })}
    >
      <button
        className={cx('overflow-hidden jet-btn')}
        style={computedStyles}
        {...(trigger === 'click' && {
          onClick: () => {
            const newPopoverState = !exposedVariablesTemporaryState.showPopover;
            updateExposedVariablesState('showPopover', newPopoverState);
            // Reset selected option when opening popover - find first available option
            if (newPopoverState) {
              const firstAvailableIndex = findFirstAvailableOptionIndex();
              updateExposedVariablesState('selectedOptionIndex', firstAvailableIndex);
            } else {
              updateExposedVariablesState('selectedOptionIndex', -1);
            }
          },
        })}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={exposedVariablesTemporaryState.showPopover}
        aria-controls={`popover-menu-${id}`}
        aria-label={label || 'Toggle menu'}
        aria-live="polite"
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
              <div data-cy="popover-menu-button-icon-container" className="d-flex" aria-hidden="true">
                {!exposedVariablesTemporaryState.isLoading && iconVisibility && (
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
          <Loader color={computedLoaderColor} width="16" aria-label="Loading" />
        )}
      </button>
    </div>
  );
});
