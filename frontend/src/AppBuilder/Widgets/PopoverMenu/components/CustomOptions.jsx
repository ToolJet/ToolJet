import React from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import cx from 'classnames';
import * as Icons from '@tabler/icons-react';
import DOMPurify from 'dompurify';
// eslint-disable-next-line import/no-unresolved
import Markdown from 'react-markdown';

export const CustomOptions = (props) => {
  // ===== PROPS DESTRUCTURING =====
  const {
    exposedVariablesTemporaryState,
    transformedOptions,
    updateExposedVariablesState,
    id,
    optionsTextColor,
    optionsIconColor,
    optionsDescriptionColor,
    fireEvent,
    setExposedVariable,
  } = props;

  // ===== EVENT HANDLERS =====
  const handleArrowKeyNavigation = (direction) => {
    if (!exposedVariablesTemporaryState.showPopover || !transformedOptions || !Array.isArray(transformedOptions)) {
      return;
    }

    const visibleOptions = transformedOptions.filter((option) => option.visible !== false);
    if (visibleOptions.length === 0) return;

    let newIndex = exposedVariablesTemporaryState.selectedOptionIndex;

    if (direction === 'up') {
      // Find the previous available option
      let attempts = 0;
      do {
        newIndex--;
        if (newIndex < 0) {
          newIndex = visibleOptions.length - 1; // Wrap to bottom
        }
        attempts++;
        // Prevent infinite loop if all options are disabled
        if (attempts >= visibleOptions.length) break;
      } while (visibleOptions[newIndex]?.disable === true);
    } else if (direction === 'down') {
      // Find the next available option
      let attempts = 0;
      do {
        newIndex++;
        if (newIndex >= visibleOptions.length) {
          newIndex = 0; // Wrap to top
        }
        attempts++;
        // Prevent infinite loop if all options are disabled
        if (attempts >= visibleOptions.length) break;
      } while (visibleOptions[newIndex]?.disable === true);
    }

    // Find the actual index in the original array
    const actualIndex = transformedOptions.findIndex((option) => option.value === visibleOptions[newIndex]?.value);

    updateExposedVariablesState('selectedOptionIndex', actualIndex);
  };

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

  // ===== RENDER HELPERS =====
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

  // ===== CONDITIONAL RENDERS =====
  if (exposedVariablesTemporaryState.areOptionsLoading) {
    return (
      <div
        data-cy="popover-menu-options-loading"
        className="d-flex justify-content-center p-3"
        style={{ alignItems: 'center', justifyContent: 'center' }}
        role="status"
        aria-live="polite"
        aria-label="Loading options"
      >
        <Loader color={'var(--cc-primary-brand)'} width="24" />
      </div>
    );
  }

  if (!transformedOptions || !Array.isArray(transformedOptions) || transformedOptions.length === 0) {
    return (
      <div
        data-cy="popover-menu-no-options"
        className="p-3 text-center text-muted"
        role="status"
        aria-label="No options available"
      >
        No options
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div
      data-cy="popover-menu-options-listbox"
      style={{ width: '100%', maxHeight: '323px', overflowY: 'auto' }}
      role="listbox"
      aria-label="Menu options"
      aria-expanded={exposedVariablesTemporaryState.showPopover}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (
            exposedVariablesTemporaryState.selectedOptionIndex !== -1 &&
            transformedOptions[exposedVariablesTemporaryState.selectedOptionIndex]
          ) {
            handleOptionClick(transformedOptions[exposedVariablesTemporaryState.selectedOptionIndex]);
          }
        }
      }}
    >
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

        const optionId = `popover-option-${id}-${index}`;
        const isIconVisible = iconVisibility && IconElement;
        return (
          <div
            className={cx('popover-option', {
              'popover-option-disabled': disable,
              'popover-option-selected': index === exposedVariablesTemporaryState.selectedOptionIndex,
            })}
            key={option.value || index}
            id={optionId}
            role="option"
            aria-selected={index === exposedVariablesTemporaryState.selectedOptionIndex}
            aria-disabled={disable}
            tabIndex={disable ? -1 : 0}
            data-cy={`popover-menu-option-${index}`}
            onMouseEnter={() => {
              if (!disable) {
                updateExposedVariablesState('selectedOptionIndex', index);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleArrowKeyNavigation('down');
                e.stopPropagation();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                handleArrowKeyNavigation('up');
                e.stopPropagation();
              }
            }}
            onClick={() => handleOptionClick(option)}
          >
            <div data-cy="popover-menu-option-content" className="popover-option-content">
              <div data-cy="popover-menu-option-header" className="popover-option-header">
                {isIconVisible && (
                  <div data-cy="popover-menu-option-icon" className="popover-option-icon" aria-hidden="true">
                    <IconElement name={option.icon} size={16} color={optionsIconColor || '#000000'} />
                  </div>
                )}
                <div
                  data-cy="popover-menu-option-label"
                  className="popover-option-label"
                  style={{ color: optionsTextColor || '#000000' }}
                >
                  {renderFormattedText(option.label, format)}
                </div>
              </div>
              {option.description && (
                <div
                  data-cy="popover-menu-option-description"
                  className="popover-option-description"
                  style={{ color: optionsDescriptionColor || '#000000', marginLeft: isIconVisible ? '23px' : '0px' }}
                >
                  {renderFormattedText(option.description, format)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
