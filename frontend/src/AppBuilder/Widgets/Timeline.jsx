import React from 'react';
import { isArray } from 'lodash';

export const Timeline = function Timeline({ height, darkMode, properties, styles, dataCy }) {
  const { visibility, boxShadow } = styles;
  const { data, hideDate } = properties;

  const darkModeStyle = darkMode && 'text-white-50';

  return (
    <div
      className="card"
      style={{ display: visibility ? '' : 'none', height, overflow: 'auto', overflowWrap: 'normal', boxShadow }}
      data-cy={dataCy}
    >
      <div className="card-body">
        <ul className={`list list-timeline ${hideDate && 'list-timeline-simple'}`}>
          {(isArray(data) ? data : []).map((item, index) => (
            <li key={index}>
              <div className="list-timeline-icon" style={{ backgroundColor: item.iconBackgroundColor }}></div>
              <div className="list-timeline-content">
                {!hideDate && <div className={`list-timeline-time ${darkModeStyle}`}>{item.date}</div>}
                <p className="list-timeline-title">{item.title}</p>
                <p className={`${darkModeStyle || 'text-muted'}`}>{item.subTitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
