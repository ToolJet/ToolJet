import React, { useEffect } from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';

import { cn } from '@/lib/utils';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export const Statistics = function Statistics({
  id,
  width,
  height,
  properties,
  styles,
  darkMode,
  dataCy,
  setExposedVariables,
  fireEvent,
  componentType,
  moduleId,
  resolveIndex,
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

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const exposedPrimaryValue = useExposedVariable(id, 'primaryValue', exposedOpts, primaryValue);
  const exposedSecondaryValue = useExposedVariable(id, 'secondaryValue', exposedOpts, secondaryValue);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);

  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setPrimaryValue/setSecondaryValue/setLoading/setVisibility) ────────── */
  useEffect(() => {
    setExposedVariables({
      primaryLabel: primaryValueLabel,
      secondaryLabel: secondaryValueLabel,
      primaryValue,
      secondaryValue,
      secondarySignDisplay,
      isLoading: loadingState,
      isVisible: visibility,
      ...csaShims(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Property-change write-throughs (skip-initial via the batched hook) ── */
  useBatchedUpdateEffectArray([
    {
      dep: primaryValueLabel,
      sideEffect: () => setExposedVariables({ primaryLabel: primaryValueLabel }),
    },
    {
      dep: secondaryValueLabel,
      sideEffect: () => setExposedVariables({ secondaryLabel: secondaryValueLabel }),
    },
    {
      dep: primaryValue,
      sideEffect: () => setExposedVariables({ primaryValue }),
    },
    {
      dep: secondaryValue,
      sideEffect: () => setExposedVariables({ secondaryValue }),
    },
    {
      dep: secondarySignDisplay,
      sideEffect: () => setExposedVariables({ secondarySignDisplay }),
    },
    {
      dep: loadingState,
      sideEffect: () => setExposedVariables({ isLoading: loadingState }),
    },
    {
      dep: visibility,
      sideEffect: () => setExposedVariables({ isVisible: visibility }),
    },
  ]);

  const baseStyle = {
    borderRadius: `${borderRadius ?? 4}px`,
    backgroundColor: backgroundColor ?? 'var(--cc-surface1-surface)',
    margin: '0px auto',
    border: `1px solid ${borderColor ?? 'var(--cc-default-border)'}`,
    fontFamily: 'Inter',
    display: isVisible ? 'flex' : 'none',
    gap: '1.5rem 2rem',
    wordBreak: 'break-all',
    overflow: 'hidden',
    height: padding === 'default' ? height : height + BOX_PADDING * 2,
    boxShadow,
    padding: '1.5rem',
    ...((dataAlignment === 'center' || isLoading === true) && {
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
    ${primaryPrefixText ?? ''}${String(exposedPrimaryValue)}${primarySuffixText ?? ''}
  `;
  const derivedSecondaryValue = `
    ${secondaryPrefixText ?? ''}${exposedSecondaryValue}${secondarySuffixText ?? ''}
  `;
  const trendIconSize = (secondaryValueSize ?? 14) * 1.3;

  return (
    <div style={baseStyle} data-cy={dataCy}>
      {isLoading === true ? (
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
