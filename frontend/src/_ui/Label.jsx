import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import useStore from '@/AppBuilder/_stores/store';
import { cn } from '@/lib/utils';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';

function Label({
  label,
  width,
  labelRef,
  color,
  defaultAlignment,
  direction,
  auto,
  isMandatory,
  _width,
  top,
  widthType,
  inputId,
  id,
  classes = null,
  dataCy,
  style = {},
  fontSize = '12px',
  overflowTooltip = false,
  overlayContainer,
  overlayClassName = '',
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipWidth, setTooltipWidth] = useState();
  const { moduleId } = useModuleContext();
  const isViewerMode = useStore((state) => state.modeStore.modules[moduleId].currentMode === 'view', shallow);
  const labelText = (
    <p
      onMouseEnter={
        overflowTooltip
          ? (e) => {
              setTooltipWidth(e.currentTarget.offsetWidth);
              setShowTooltip(e.currentTarget.scrollWidth > e.currentTarget.clientWidth);
            }
          : undefined
      }
      onMouseLeave={overflowTooltip ? () => setShowTooltip(false) : undefined}
      style={{
        position: 'relative',
        color: !['#1B1F24', '#000', '#11181C', '#000000ff'].includes(color) ? color : 'var(--text-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block',
        margin: '0px',
        paddingRight:
          direction == 'right'
            ? '6px'
            : (label?.length > 0 && defaultAlignment === 'side') || defaultAlignment === 'top'
              ? '12px'
              : '',
        paddingLeft: label?.length > 0 && defaultAlignment === 'side' && direction != 'left' ? '12px' : '',
        ...(top && { top }),
      }}
    >
      {label}
      {isMandatory && (
        <span
          style={{
            color: 'var(--cc-error-systemStatus)',
            position: 'absolute',
            right: direction == 'right' ? '0px' : '4px',
            top: '0px',
          }}
        >
          *
        </span>
      )}
    </p>
  );

  return (
    <>
      {label && (width > 0 || auto) && (
        <label
          ref={labelRef}
          style={{
            width: label?.length === 0 ? '0%' : auto ? 'auto' : defaultAlignment === 'side' ? `${_width}%` : '100%',
            maxWidth: widthType === 'ofField' && defaultAlignment === 'side' ? '70%' : '100%', // Maintaining this for backward compatibility
            display: 'flex',
            fontWeight: 500,
            justifyContent: direction == 'right' ? 'flex-end' : 'flex-start',
            fontSize,
            height: defaultAlignment === 'top' && `calc(${fontSize} + 8px)`,
            ...style,
          }}
          htmlFor={isViewerMode ? inputId : undefined} // To avoid focus on label in edit mode which prevents copy/paste
          className={cn(classes?.labelContainer)}
          id={id}
          data-cy={`${dataCy}-label`}
        >
          {overflowTooltip ? (
            <OverlayTrigger
              placement="bottom"
              show={showTooltip}
              container={overlayContainer}
              overlay={
                <div className={overlayClassName} style={{ color: 'var(--text-primary)' }}>
                  <span style={{ width: tooltipWidth && `${tooltipWidth}px` }}>{label}</span>
                </div>
              }
            >
              {labelText}
            </OverlayTrigger>
          ) : (
            labelText
          )}
        </label>
      )}
    </>
  );
}

export default Label;
