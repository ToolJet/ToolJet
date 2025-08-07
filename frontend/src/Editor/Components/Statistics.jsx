import React, { useEffect, useState } from 'react';
import * as Icons from '@tabler/icons-react';

import { cn } from '@/lib/utils';
import WidgetIcon from '@/../assets/images/icons/widgets';

export const Statistics = function Statistics({
  width,
  height,
  properties,
  styles,
  darkMode,
  dataCy,
  setExposedVariable,
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
    disabledState,
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

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  useEffect(() => {
    setExposedVariable('primaryLabel', primaryValueLabel);
  }, [primaryValueLabel]);

  useEffect(() => {
    setExposedVariable('secondaryLabel', secondaryValueLabel);
  }, [secondaryValueLabel]);

  useEffect(() => {
    setExposedVariable('primaryValue', primaryValue);
    updateExposedVariablesState('primaryValue', primaryValue);
  }, [primaryValue]);

  useEffect(() => {
    setExposedVariable('secondaryValue', secondaryValue);
    updateExposedVariablesState('secondaryValue', secondaryValue);
  }, [secondaryValue]);

  useEffect(() => {
    setExposedVariable('secondarySignDisplay', secondarySignDisplay);
  }, [secondarySignDisplay]);

  useEffect(() => {
    setExposedVariable('isLoading', loadingState);
    updateExposedVariablesState('isLoading', loadingState);
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('isVisible', visibility);
    updateExposedVariablesState('isVisible', visibility);
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useEffect(() => {
    setExposedVariable('setPrimaryValue', async function (newValue) {
      setExposedVariable('primaryValue', newValue);
      updateExposedVariablesState('primaryValue', newValue);
    });

    setExposedVariable('setSecondaryValue', async function (newValue) {
      setExposedVariable('secondaryValue', newValue);
      updateExposedVariablesState('secondaryValue', newValue);
    });

    setExposedVariable('setDisable', async function (disable) {
      setExposedVariable('isDisabled', !!disable);
    });

    setExposedVariable('setLoading', async function (loading) {
      setExposedVariable('isLoading', !!loading);
      updateExposedVariablesState('isLoading', !!loading);
    });

    setExposedVariable('setVisibility', async function (visibility) {
      setExposedVariable('isVisible', !!visibility);
      updateExposedVariablesState('isVisible', !!visibility);
    });
  }, []);

  const baseStyle = {
    borderRadius: `${borderRadius ?? 4}px`,
    backgroundColor: backgroundColor ?? 'var(--cc-surface1-surface)',
    margin: '0px auto',
    border: `0.75px solid ${borderColor ?? 'var(--cc-default-border)'}`,
    fontFamily: 'Inter',
    display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
    gap: '1.5rem 2rem',
    wordBreak: 'break-all',
    overflow: 'hidden',
    height,
    boxShadow,
    padding: padding === 'default' ? '1.5rem' : 0,
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

  // eslint-disable-next-line import/namespace
  const IconElement = Icons[icon] ?? Icons['IconHome2'];
  const derivedPrimaryValue = `
    ${primaryPrefixText ?? ''}${String(exposedVariablesTemporaryState.primaryValue)}${primarySuffixText ?? ''}
  `;
  const derivedSecondaryValue = `
    ${secondaryPrefixText ?? ''}${exposedVariablesTemporaryState.secondaryValue}${secondarySuffixText ?? ''}
  `;
  const trendIconSize = (secondaryValueSize ?? 14) * 1.3;

  return (
    <div style={baseStyle} data-cy={dataCy}>
      {exposedVariablesTemporaryState.isLoading === true ? (
        <div style={{ width }} className="p-2">
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      ) : (
        <>
          {Boolean(iconVisibility) && (
            <IconElement className="tw-shrink-0" size={(primaryValueSize ?? 34) * 1.3} stroke={1.5} color={iconColor} />
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
