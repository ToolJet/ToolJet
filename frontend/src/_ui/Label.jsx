import React from 'react';

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
}) {
  const { moduleId } = useModuleContext();
  const isViewerMode = useStore((state) => state.modeStore.modules[moduleId].currentMode === 'view', shallow);
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
          {/*
            The asterisk is an in-flow, non-shrinking flex sibling rather than an absolutely
            positioned overlay, so the browser reserves its width for us. That keeps it clear of
            the label text for ANY font, weight and size — a reserve computed here would have to
            assume a glyph width, and the `*` advance ranges from 0.28em to 0.60em across
            families, so any constant is wrong as soon as the label font changes.

            `flex-shrink: 0` on the asterisk with the ellipsis moved onto the text span keeps the
            property the absolute positioning was there to protect: an over-long label truncates,
            and the required marker survives instead of being clipped away with the text.
          */}
          <p
            style={{
              position: 'relative',
              color: !['#1B1F24', '#000', '#11181C', '#000000ff'].includes(color) ? color : 'var(--text-primary)',
              display: 'flex',
              minWidth: 0,
              margin: '0px',
              // The asterisk now occupies this space itself, so a mandatory label drops the
              // padding to the inset the star used to be positioned at. Keeping the full
              // padding as well would pay for the same gap twice and widen every mandatory
              // label by the glyph's width — at the default size this reproduces the old box
              // exactly, and only an enlarged label grows, by just what the larger star needs.
              paddingRight:
                direction == 'right'
                  ? isMandatory
                    ? '0px'
                    : '6px'
                  : (label?.length > 0 && defaultAlignment === 'side') || defaultAlignment === 'top'
                  ? isMandatory
                    ? '4px'
                    : '12px'
                  : '',
              paddingLeft: label?.length > 0 && defaultAlignment === 'side' && direction != 'left' ? '12px' : '',
              ...(top && { top }),
            }}
          >
            <span
              style={{
                // Repeated from the row so the colour still travels with the element that
                // actually holds the label text: callers reach it by its text, and before the
                // text moved into this span that element was the row itself.
                color: !['#1B1F24', '#000', '#11181C', '#000000ff'].includes(color) ? color : 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {label}
            </span>
            {isMandatory && (
              <span
                style={{
                  color: 'var(--cc-error-systemStatus)',
                  flexShrink: 0,
                  paddingLeft: '2px', // the gap the absolute star left at the default size (1.82px)
                }}
              >
                *
              </span>
            )}
          </p>
        </label>
      )}
    </>
  );
}

export default Label;
