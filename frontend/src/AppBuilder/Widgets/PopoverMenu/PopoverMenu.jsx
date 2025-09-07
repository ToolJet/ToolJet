import React, { useEffect, useState } from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import './popoverMenu.scss';
import { CustomOptions, CustomButton } from './components';
import { getModifiedColor } from '@/Editor/Components/utils';

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

  const { optionsTextColor, optionsIconColor, optionsDescriptionColor } = styles;

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

  // ===== STATE MANAGEMENT =====
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState || loadingState,
    areOptionsLoading: optionsLoadingState,
    hovered: false,
    showPopover: false,
    selectedOptionIndex: -1,
  });

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
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
  const computedOptionHoverColor = getModifiedColor('var(--cc-surface1-surface)', 'hover');

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

  // CUSTOM BUTTON RENDER
  const renderCustomButton = (props) => {
    return <CustomButton {...props} />;
  };

  // ===== MAIN RENDER =====
  return (
    <div style={{ display: visibility ? 'block' : 'none' }} role="region" aria-label="Popover menu" data-cy={dataCy}>
      <Popover.Root
        open={exposedVariablesTemporaryState.showPopover}
        onOpenChange={(open) => updateExposedVariablesState('showPopover', open)}
      >
        <Popover.Trigger asChild>
          {renderCustomButton({
            styles,
            buttonType,
            height,
            exposedVariablesTemporaryState,
            updateExposedVariablesState,
            transformedOptions,
            trigger,
            id,
            label,
          })}
        </Popover.Trigger>
        <Popover.Portal>
          <div data-cy="popover-menu-portal-container" className="popover-menu-container">
            <Popover.Content
              id={`popover-menu-${id}`}
              className={cx('popover-content', { 'dark-theme': darkMode })}
              data-cy="popover-menu-content"
              sideOffset={2}
              align="start"
              style={{
                width: width,
                maxWidth: width,
                '--popover-option-hover-color': computedOptionHoverColor,
                ...((optionsLoadingState || hasNoOptions) && {
                  height: '120px',
                  alignItems: 'center',
                }),
              }}
              side="bottom"
              avoidCollisions={true}
              collisionPadding={8}
              onEscapeKeyDown={() => updateExposedVariablesState('showPopover', false)}
              onInteractOutside={() => {
                if (exposedVariablesTemporaryState.hovered) return;
                updateExposedVariablesState('showPopover', false);
              }}
              {...(trigger === 'hover' && {
                onMouseEnter: () => {
                  updateExposedVariablesState('showPopover', true);
                },
                onMouseLeave: () => {
                  updateExposedVariablesState('showPopover', false);
                },
              })}
              role="dialog"
              aria-label="Menu options"
              aria-modal="false"
            >
              <div data-cy="popover-menu-options-container" className="p-0 w-100">
                <CustomOptions
                  id={id}
                  fireEvent={fireEvent}
                  setExposedVariable={setExposedVariable}
                  transformedOptions={transformedOptions}
                  optionsTextColor={optionsTextColor}
                  optionsIconColor={optionsIconColor}
                  optionsDescriptionColor={optionsDescriptionColor}
                  exposedVariablesTemporaryState={exposedVariablesTemporaryState}
                  updateExposedVariablesState={updateExposedVariablesState}
                />
              </div>
            </Popover.Content>
          </div>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
