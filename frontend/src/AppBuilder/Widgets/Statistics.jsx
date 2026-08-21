import React, { useEffect, useRef, useState } from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';

import { cn } from '@/lib/utils';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import WidgetIcon from '@/../assets/images/icons/widgets';

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

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    primaryValue: primaryValue,
    secondaryValue: secondaryValue,
    isLoading: loadingState,
    isVisible: visibility,
  });

  // ===== DYNAMIC HEIGHT =====
  // The card's values/labels wrap (word-break) and depend on width, so measure the
  // rendered card rather than deriving from data. Enabled only in view mode.
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

  useEffect(() => {
    const exposedVariables = {
      primaryLabel: primaryValueLabel,
      secondaryLabel: secondaryValueLabel,
      primaryValue,
      secondaryValue,
      secondarySignDisplay,
      isLoading: loadingState,
      isVisible: visibility,
      setPrimaryValue: async function (newValue) {
        setExposedVariable('primaryValue', newValue);
        updateExposedVariablesState('primaryValue', newValue);
      },
      setSecondaryValue: async function (newValue) {
        setExposedVariable('secondaryValue', newValue);
        updateExposedVariablesState('secondaryValue', newValue);
      },
      setLoading: async function (loading) {
        setExposedVariable('isLoading', !!loading);
        updateExposedVariablesState('isLoading', !!loading);
      },
      setVisibility: async function (visibility) {
        setExposedVariable('isVisible', !!visibility);
        updateExposedVariablesState('isVisible', !!visibility);
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
        setExposedVariable('primaryValue', primaryValue);
        updateExposedVariablesState('primaryValue', primaryValue);
      },
    },
    {
      dep: secondaryValue,
      sideEffect: () => {
        setExposedVariable('secondaryValue', secondaryValue);
        updateExposedVariablesState('secondaryValue', secondaryValue);
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
        setExposedVariable('isLoading', loadingState);
        updateExposedVariablesState('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable('isVisible', visibility);
        updateExposedVariablesState('isVisible', visibility);
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
    wordBreak: 'break-all',
    overflow: isDynamicHeightEnabled ? 'visible' : 'hidden',
    height: isDynamicHeightEnabled ? 'auto' : padding === 'default' ? height : height + BOX_PADDING * 2,
    ...(isDynamicHeightEnabled && { minHeight: padding === 'default' ? height : height + BOX_PADDING * 2 }),
    boxShadow,
    padding: '1.5rem',
    ...((dataAlignment === 'center' || exposedVariablesTemporaryState.isLoading === true) && {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    ...(iconDirection === 'right' &&
      dataAlignment !== 'center' && {
        flexDirection: 'row-reverse',
      }),
  };

  const letterStyle = {
    fontSize: '14px',
    wordBreak: 'break-all',
    lineHeight: 1.3,
    textAlign: dataAlignment,
    marginBottom: 0,
  };

  const primaryStyle = {
    fontSize: `${primaryValueSize ?? 34}px`,
    color: primaryTextColour !== '#000000' ? primaryTextColour : darkMode && '#FFFFFC',
    fontWeight: '700',
    marginBottom: '0px',
    wordBreak: 'break-all',
    textAlign: dataAlignment,
    lineHeight: 1.3,
  };

  const secondaryContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: ' center',
    wordBreak: 'break-all',
    borderRadius: '58px',
    color: secondarySignDisplay !== 'negative' ? positiveSecondaryValueColor : negativeSecondaryValueColor,
    fontWeight: '700',
    lineHeight: 1.3,
    fontSize: `${secondaryValueSize ?? 14}px`,
    marginBottom: 0,
  };

  const derivedPrimaryValue = `
    ${primaryPrefixText ?? ''}${String(exposedVariablesTemporaryState.primaryValue)}${primarySuffixText ?? ''}
  `;
  const derivedSecondaryValue = `
    ${secondaryPrefixText ?? ''}${exposedVariablesTemporaryState.secondaryValue}${secondarySuffixText ?? ''}
  `;
  const trendIconSize = (secondaryValueSize ?? 14) * 1.3;

  return (
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
            className={cn('tw-flex-1 tw-grid tw-content-between', {
              'tw-flex-grow-0 tw-justify-center tw-content-start tw-gap-y-6': dataAlignment === 'center',
              'tw-justify-end': dataAlignment === 'right',
            })}
          >
            <div>
              <p
                style={{
                  ...letterStyle,
                  color: primaryLabelColour !== '#8092AB' ? primaryLabelColour : darkMode && '#FFFFFC',
                  fontSize: `${primaryLabelSize ?? 14}px`,
                }}
              >
                {primaryValueLabel}
              </p>

              <h2 style={primaryStyle}>{derivedPrimaryValue}</h2>
            </div>

            {!hideSecondary && (
              <div
                className={cn('tw-flex tw-gap-1', {
                  'tw-flex-col': secondaryValueAlignment === 'vertical',
                  'tw-justify-center': dataAlignment === 'center',
                  'tw-justify-end': dataAlignment === 'right',
                })}
              >
                <div
                  className={cn('tw-flex tw-items-center tw-gap-2', {
                    'tw-justify-center': dataAlignment === 'center',
                    'tw-justify-end': dataAlignment === 'right',
                  })}
                >
                  <WidgetIcon
                    name={secondarySignDisplay !== 'negative' ? 'upstatistics' : 'downstatistics'}
                    width={trendIconSize}
                    height={trendIconSize}
                  />

                  <p style={secondaryContainerStyle}>{derivedSecondaryValue}</p>
                </div>

                <p
                  style={{
                    ...letterStyle,
                    color: secondaryLabelColour !== '#8092AB' ? secondaryLabelColour : darkMode && '#FFFFFC',
                    fontSize: `${secondaryLabelSize ?? 14}px`,
                  }}
                >
                  {secondaryValueLabel}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
