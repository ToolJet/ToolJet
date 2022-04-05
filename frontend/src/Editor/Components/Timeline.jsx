import React from 'react';
import { isArray } from 'lodash';

export const Timeline = function Timeline({ properties, styles }) {
  const { visibility } = styles;
  const { data } = properties;

  return (
    <div className="card" style={{ display: visibility ? '' : 'none' }}>
      <div className="card-body">
        <ul className="list list-timeline">
          {(isArray(data) ? data : []).map((item, index) => (
            <li key={index}>
              <div className="list-timeline-icon" style={{ backgroundColor: item.iconBackgroundColor }}></div>
              <div className="list-timeline-content">
                <div className="list-timeline-time">{item.date}</div>
                <p className="list-timeline-title">{item.title}</p>
                <p className="text-muted">{item.subTitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
