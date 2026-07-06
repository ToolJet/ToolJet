import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';
import './popoverMenu.scss';
import { CustomOptions, CustomButton } from './components';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

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
    componentType,
    moduleId,
    resolveIndex,
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

  const isInitialRender = useRef(true);
  const exposedOpts = { resolveIndex, moduleId };
  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth for isVisible/isLoading/isDisabled.
  // hovered/showPopover/selectedOptionIndex are render-only UI state, never
  // exposed to the store (matches old — updateExposedVariablesState never
  // wrote them via setExposedVariable either). areOptionsLoading was also
  // never exposed by old code — it read straight off the resolved property.
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState || loadingState);

  const [uiState, setUiState] = useState({ hovered: false, showPopover: false, selectedOptionIndex: -1 });
  const updateExposedVariablesState = (key, value) => {
    setUiState((prevState) => ({ ...prevState, [key]: value }));
  };

  const exposedVariablesTemporaryState = {
    isLoading,
    isVisible,
    isDisabled,
    areOptionsLoading: optionsLoadingState,
    ...uiState,
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

  // ===== EFFECTS (property-sync write-throughs; skip-initial) ──────────
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('options', formatOptions(transformedOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformedOptions]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers.
  useEffect(() => {
    setExposedVariables({
      label: label,
      options: formatOptions(transformedOptions),
      lastClickedOption: null,
      isDisabled: disabledState || loadingState,
      isVisible: visibility,
      isLoading: loadingState,
      ...csaShims(),
    });
    isInitialRender.current = false;
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
