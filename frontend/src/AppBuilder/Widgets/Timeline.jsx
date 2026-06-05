import React, { useEffect, useState } from 'react';
import { isArray } from 'lodash';
import { getSafeRenderableValue } from './utils';

export const Timeline = function Timeline({
  height,
  darkMode,
  properties,
  styles,
  dataCy,
  setExposedVariable,
  setExposedVariables,
}) {
  const { visibility, boxShadow } = styles;
  const { data, hideDate } = properties;

  // Set by the setValue CSA. When non-null, this overrides the property-driven
  // `data` below — the widget renders these events until setValue is called
  // again with null/[] to revert to the `data` property.
  const [overrideData, setOverrideData] = useState(null);
  const renderData = overrideData !== null ? overrideData : isArray(data) ? data : [];

  // Keep the exposed `value` in sync with whatever is rendering.
  useEffect(() => {
    if (typeof setExposedVariable === 'function') {
      setExposedVariable('value', renderData);
    }
    // Re-run when the rendered list changes (either via property data or override).
  }, [JSON.stringify(renderData), setExposedVariable]);

  // Register CSAs once on mount.
  useEffect(() => {
    if (typeof setExposedVariables !== 'function') return;
    setExposedVariables({
      value: renderData,
      // setValue replaces the rendered timeline events. Accepts an array of
      // event objects matching the `data` property's shape. Pass null/[] to
      // clear the override and revert to the property-driven source.
      setValue: async function (newEvents) {
        if (newEvents == null) {
          setOverrideData(null);
          return;
        }
        if (!isArray(newEvents)) {
          setOverrideData([]);
          return;
        }
        setOverrideData(newEvents);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const darkModeStyle = darkMode && 'text-white-50';

  return (
    <div
      className="card"
      style={{
        display: visibility ? '' : 'none',
        height,
        overflow: 'auto',
        overflowWrap: 'normal',
        boxShadow,
        backgroundColor: 'var(--cc-surface1-surface)',
      }}
      data-cy={dataCy}
    >
      <div className="card-body">
        <ul className={`list list-timeline ${hideDate && 'list-timeline-simple'}`}>
          {renderData.map((item, index) => (
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
