import React, { useEffect, useRef, useState } from 'react';
import { isArray } from 'lodash';
import { getSafeRenderableValue } from './utils';

function deriveEvents(data) {
  return isArray(data) ? data : [];
}

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

  const [renderData, setRenderData] = useState(() => deriveEvents(data));

  useEffect(() => {
    setRenderData(deriveEvents(data));
  }, [JSON.stringify(data)]);

  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (typeof setExposedVariable === 'function') {
      setExposedVariable('value', renderData);
    }
  }, [JSON.stringify(renderData), setExposedVariable]);

  // Register CSAs once on mount.
  useEffect(() => {
    if (typeof setExposedVariables !== 'function') return;
    setExposedVariables({
      value: renderData,
      setValue: async function (newEvents) {
        if (newEvents == null) {
          setRenderData(deriveEvents(dataRef.current));
          return;
        }
        if (!isArray(newEvents)) {
          setRenderData([]);
          return;
        }
        setRenderData(newEvents);
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
