import React from 'react';
import { isArray } from 'lodash';
import { getSafeRenderableValue } from './utils';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';

export const Timeline = function Timeline({
  id,
  height,
  width,
  darkMode,
  properties,
  styles,
  dataCy,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
}) {
  const { boxShadow } = styles;
  const { data, hideDate, visibility } = properties;

  const darkModeStyle = darkMode && 'text-white-50';

  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  // Timeline height is a function of its items (and whether dates show). Trigger the reflow
  // off that data rather than a DOM observer — width changes are already a hook dependency,
  // so text re-wrapping on resize is still re-measured.
  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: JSON.stringify({ data, hideDate }),
    currentLayout,
    width,
    visibility,
    subContainerIndex,
    componentType,
  });

  return (
    <div
      className="card"
      style={{
        display: visibility ? '' : 'none',
        height: isDynamicHeightEnabled ? 'auto' : height,
        ...(isDynamicHeightEnabled && { minHeight: height }),
        overflow: isDynamicHeightEnabled ? 'visible' : 'auto',
        overflowWrap: 'normal',
        boxShadow,
        backgroundColor: 'var(--cc-surface1-surface)',
      }}
      data-cy={dataCy}
    >
      <div className="card-body">
        <ul className={`list list-timeline ${hideDate && 'list-timeline-simple'}`}>
          {(isArray(data) ? data : []).map((item, index) => (
            <li key={index}>
              <div className="list-timeline-icon" style={{ backgroundColor: item.iconBackgroundColor }}></div>
              <div className="list-timeline-content">
                {!hideDate && (
                  <div className={`list-timeline-time ${darkModeStyle}`}>{getSafeRenderableValue(item.date)}</div>
                )}
                <p className="list-timeline-title">{getSafeRenderableValue(item.title)}</p>
                <p className={`${darkModeStyle || 'text-muted'}`}>{getSafeRenderableValue(item.subTitle)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
