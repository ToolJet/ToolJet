import React, { useEffect, useRef, useState } from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';

import { cn } from '@/lib/utils';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import WidgetIcon from '@/../assets/images/icons/widgets';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import WidgetTooltip from '@/AppBuilder/AppCanvas/WidgetTooltip';

// Same result the Value property's string validation gives: text, finite numbers as text, anything else blank.
const toDisplayText = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

// 2022 default hexes (96457e7dbc) still saved in old apps; they mean "no colour chosen", so use today's theme default.
const LEGACY_DEFAULT_COLOURS = { '#000000': 'var(--cc-primary-text)', '#8092AB': 'var(--cc-placeholder-text)' };
export const themeColour = (colour) => LEGACY_DEFAULT_COLOURS[colour] ?? colour;

// Values set by an action, per card, with the property value they replaced. A parent loader
// (Container, Form, Tabs...) unmounts the card; on remount these win while the property is unchanged.
const actionValues = new Map();

const rememberActionValue = (cardKey, key, propertyValue, value) => {
  actionValues.set(cardKey, { ...actionValues.get(cardKey), [key]: { propertyValue, value } });
};

const forgetActionValue = (cardKey, key) => {
  const { [key]: _forgotten, ...rest } = actionValues.get(cardKey) ?? {};
  actionValues.set(cardKey, rest);
};

// The store check drops a remembered value from an earlier app session (it no longer holds that value).
const restoreActionValues = (cardKey, propertyValues, exposedValues) =>
  Object.fromEntries(
    Object.entries(propertyValues).map(([key, propertyValue]) => {
      const remembered = actionValues.get(cardKey)?.[key];
      const isCurrent =
        remembered && remembered.propertyValue === propertyValue && exposedValues?.[key] === remembered.value;
      return [key, isCurrent ? remembered.value : propertyValue];
    })
  );

const ONE_LINE = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 };

// One line ending in "…"; when it is cut off, hovering it shows the full text instead of the card tooltip.
const CutOffText = ({ as: Tag, text, style, darkMode, onCutOffHover }) => {
  const ref = useRef(null);
  const [isCutOff, setIsCutOff] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => onCutOffHover(false), []);

  return (
    // Closes on leave, not after Radix's hoverable-content grace, so the card tooltip never shows alongside it.
    <WidgetTooltip
      content={typeof text === 'string' ? text : ''}
      show={isCutOff}
      darkMode={darkMode}
      open={isOpen && isHovered}
      onOpenChange={setIsOpen}
    >
      <Tag
        ref={ref}
        style={{ ...style, ...ONE_LINE }}
        onPointerEnter={() => {
          const cutOff = ref.current.scrollWidth > ref.current.clientWidth;
          setIsCutOff(cutOff);
          setIsHovered(true);
          onCutOffHover(cutOff);
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          onCutOffHover(false);
        }}
      >
        {text}
      </Tag>
    </WidgetTooltip>
  );
};

export const Statistics = function Statistics({
  id,
  width,
  height,
  properties,
  styles,
  darkMode,
  dataCy,
  setExposedVariable,
  setExposedVariables,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
  tooltipProps,
}) {
  const {
    primaryValueLabel,
    primaryValue,
    secondaryValueLabel,
    secondaryValue,
    secondarySignDisplay,
    hideSecondary,
    loadingState,
    visibility,
    primaryPrefixText,
    primarySuffixText,
    secondaryPrefixText,
    secondarySuffixText,
    dataAlignment,
    icon,
    iconDirection,
    secondaryValueAlignment,
  } = properties;
  const {
    primaryLabelSize,
    primaryLabelColour,
    primaryValueSize,
    primaryTextColour,
    iconColor,
    secondaryLabelSize,
    secondaryLabelColour,
    secondaryValueSize,
    positiveSecondaryValueColor,
    negativeSecondaryValueColor,
    backgroundColor,
    borderColor,
    borderRadius,
    boxShadow,
    padding,
    iconVisibility,
  } = styles;

  const { moduleId } = useModuleContext();
  const cardKey = `${moduleId}:${id}:${subContainerIndex ?? ''}`;
  const propertyValues = { primaryValue, secondaryValue, isLoading: loadingState, isVisible: visibility };
  const propertyValuesRef = useRef(propertyValues);
  propertyValuesRef.current = propertyValues;

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState(() =>
    restoreActionValues(
      cardKey,
      propertyValues,
      useStore.getState().getExposedValueOfComponent(id, moduleId, subContainerIndex)
    )
  );

  const [isCardTooltipOpen, setIsCardTooltipOpen] = useState(false);
  const [isOverCutOffText, setIsOverCutOffText] = useState(false);

  // ===== DYNAMIC HEIGHT =====
  // The card's height depends on fonts, icon and layout, so measure the rendered
  // card rather than deriving from data. Enabled only in view mode.
  const statRef = useRef(null);
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const heightChangeValue = useHeightObserver(statRef, isDynamicHeightEnabled);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility: exposedVariablesTemporaryState.isVisible,
    subContainerIndex,
    componentType,
  });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const setFromAction = (key, value) => {
    rememberActionValue(cardKey, key, propertyValuesRef.current[key], value);
    setExposedVariable(key, value);
    updateExposedVariablesState(key, value);
  };

  const setFromProperty = (key, value) => {
    forgetActionValue(cardKey, key);
    setExposedVariable(key, value);
    updateExposedVariablesState(key, value);
  };

  useEffect(() => {
    const exposedVariables = {
      primaryLabel: primaryValueLabel,
      secondaryLabel: secondaryValueLabel,
      primaryValue: exposedVariablesTemporaryState.primaryValue,
      secondaryValue: exposedVariablesTemporaryState.secondaryValue,
      secondarySignDisplay,
      isLoading: exposedVariablesTemporaryState.isLoading,
      isVisible: exposedVariablesTemporaryState.isVisible,
      setPrimaryValue: async function (newValue) {
        setFromAction('primaryValue', toDisplayText(newValue));
      },
      setSecondaryValue: async function (newValue) {
        setFromAction('secondaryValue', toDisplayText(newValue));
      },
      setLoading: async function (loading) {
        setFromAction('isLoading', !!loading);
      },
      setVisibility: async function (visibility) {
        setFromAction('isVisible', !!visibility);
      },
    };

    setExposedVariables(exposedVariables);
  }, []);

  useBatchedUpdateEffectArray([
    {
      dep: primaryValueLabel,
      sideEffect: () => {
        setExposedVariable('primaryLabel', primaryValueLabel);
      },
    },
    {
      dep: secondaryValueLabel,
      sideEffect: () => {
        setExposedVariable('secondaryLabel', secondaryValueLabel);
      },
    },
    {
      dep: primaryValue,
      sideEffect: () => {
        setFromProperty('primaryValue', primaryValue);
      },
    },
    {
      dep: secondaryValue,
      sideEffect: () => {
        setFromProperty('secondaryValue', secondaryValue);
      },
    },
    {
      dep: secondarySignDisplay,
      sideEffect: () => {
        setExposedVariable('secondarySignDisplay', secondarySignDisplay);
      },
    },
    {
      dep: loadingState,
      sideEffect: () => {
        setFromProperty('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        setFromProperty('isVisible', visibility);
      },
    },
  ]);

  const baseStyle = {
    borderRadius: `${borderRadius ?? 4}px`,
    backgroundColor: backgroundColor ?? 'var(--cc-surface1-surface)',
    margin: '0px auto',
    border: `1px solid ${borderColor ?? 'var(--cc-default-border)'}`,
    fontFamily: 'Inter',
    display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
    gap: '1.5rem 2rem',
    overflow: isDynamicHeightEnabled ? 'visible' : 'hidden',
    height: isDynamicHeightEnabled ? 'auto' : padding === 'default' ? height : height + BOX_PADDING * 2,
    ...(isDynamicHeightEnabled && { minHeight: padding === 'default' ? height : height + BOX_PADDING * 2 }),
    boxShadow,
    padding: '1.5rem',
    ...((dataAlignment === 'center' || exposedVariablesTemporaryState.isLoading === true) && {
      flexDirection: 'column',
      alignItems: 'center',
      // Content taller than the card keeps its top (icon, label, value) visible.
      justifyContent: exposedVariablesTemporaryState.isLoading === true ? 'center' : 'safe center',
    }),
    ...(iconDirection === 'right' &&
      dataAlignment !== 'center' && {
        flexDirection: 'row-reverse',
      }),
  };

  const letterStyle = {
    fontSize: '14px',
    lineHeight: 1.3,
    textAlign: dataAlignment,
    marginBottom: 0,
  };

  const primaryStyle = {
    fontSize: `${primaryValueSize ?? 34}px`,
    color: themeColour(primaryTextColour),
    fontWeight: '700',
    marginBottom: '0px',
    textAlign: dataAlignment,
    lineHeight: 1.3,
  };

  const secondaryContainerStyle = {
    borderRadius: '58px',
    color: secondarySignDisplay !== 'negative' ? positiveSecondaryValueColor : negativeSecondaryValueColor,
    fontWeight: '700',
    lineHeight: 1.3,
    fontSize: `${secondaryValueSize ?? 14}px`,
    marginBottom: 0,
  };

  const derivedPrimaryValue = `${primaryPrefixText ?? ''}${toDisplayText(exposedVariablesTemporaryState.primaryValue)}${
    primarySuffixText ?? ''
  }`;
  const derivedSecondaryValue = `${secondaryPrefixText ?? ''}${toDisplayText(
    exposedVariablesTemporaryState.secondaryValue
  )}${secondarySuffixText ?? ''}`;
  const trendIconSize = (secondaryValueSize ?? 14) * 1.3;

  return (
    <WidgetTooltip
      {...tooltipProps}
      darkMode={darkMode}
      open={isCardTooltipOpen && !isOverCutOffText}
      onOpenChange={setIsCardTooltipOpen}
    >
      <div style={baseStyle} data-cy={dataCy} ref={statRef}>
        {exposedVariablesTemporaryState.isLoading === true ? (
          <div style={{ width }} className="p-2">
            <center>
              <div className="spinner-border" role="status"></div>
            </center>
          </div>
        ) : (
          <>
            {Boolean(iconVisibility) && (
              <TablerIcon
                iconName={icon}
                className="tw-shrink-0"
                size={(primaryValueSize ?? 34) * 1.3}
                stroke={1.5}
                color={iconColor}
              />
            )}

            <div
              className={cn(
                'tw-flex-1 tw-grid tw-grid-cols-[minmax(0,1fr)] tw-content-between tw-min-w-0 tw-max-w-full',
                {
                  'tw-flex-grow-0 tw-justify-center tw-content-start tw-gap-y-6': dataAlignment === 'center',
                  'tw-justify-end': dataAlignment === 'right',
                }
              )}
            >
              <div className="tw-min-w-0">
                <CutOffText
                  as="p"
                  text={primaryValueLabel}
                  style={{
                    ...letterStyle,
                    color: themeColour(primaryLabelColour),
                    fontSize: `${primaryLabelSize ?? 14}px`,
                  }}
                  darkMode={darkMode}
                  onCutOffHover={setIsOverCutOffText}
                />

                <CutOffText
                  as="h2"
                  text={derivedPrimaryValue}
                  style={primaryStyle}
                  darkMode={darkMode}
                  onCutOffHover={setIsOverCutOffText}
                />
              </div>

              {!hideSecondary && (
                <div
                  className={cn('tw-flex tw-gap-1 tw-min-w-0', {
                    'tw-flex-col': secondaryValueAlignment === 'vertical',
                    'tw-justify-center': dataAlignment === 'center',
                    'tw-justify-end': dataAlignment === 'right',
                  })}
                >
                  <div
                    className={cn('tw-flex tw-items-center tw-gap-2 tw-min-w-0 tw-shrink-0 tw-max-w-full', {
                      'tw-justify-center': dataAlignment === 'center',
                      'tw-justify-end': dataAlignment === 'right',
                    })}
                  >
                    {secondarySignDisplay !== 'none' && (
                      <WidgetIcon
                        name={secondarySignDisplay !== 'negative' ? 'upstatistics' : 'downstatistics'}
                        width={trendIconSize}
                        height={trendIconSize}
                      />
                    )}

                    <CutOffText
                      as="p"
                      text={derivedSecondaryValue}
                      style={secondaryContainerStyle}
                      darkMode={darkMode}
                      onCutOffHover={setIsOverCutOffText}
                    />
                  </div>

                  <CutOffText
                    as="p"
                    text={secondaryValueLabel}
                    style={{
                      ...letterStyle,
                      color: themeColour(secondaryLabelColour),
                      fontSize: `${secondaryLabelSize ?? 14}px`,
                    }}
                    darkMode={darkMode}
                    onCutOffHover={setIsOverCutOffText}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </WidgetTooltip>
  );
};
