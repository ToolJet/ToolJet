import React from 'react';
import { isArray } from 'lodash';

export const Timeline = function Timeline({ height, darkMode, properties, styles, dataCy, fireEvent, setExposedVariable, }) {
  const { visibility, fontColor, subTitleColor, boxShadow } = styles;
  const { data, hideDate } = properties;


  const darkModeStyle = darkMode && 'text-white-50';
  // 点击事件处理
  const itemClick = (item, index) => {
    setExposedVariable('clickedItem', item)
    fireEvent('onClick')
  }

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
              <div className="list-timeline-icon" style={{ cursor: 'pointer', backgroundColor: item.iconBackgroundColor }} onClick={() => itemClick(item, index)}></div>
              <div className="list-timeline-icon" style={{ cursor: 'pointer!important', 'pointer-events': 'none', backgroundColor: 'white', height: '1.1rem', width: '1.1rem', top: '0.7rem', left: hideDate ? '0.7rem' : '7.2rem' }}></div>
              <div className="list-timeline-content">
                {!hideDate && <div className={`list-timeline-time ${darkModeStyle}`}>{item.date}</div>}
                <a className="list-timeline-title" onClick={() => itemClick(item, index)} style={{ color: fontColor }}>{item.title}</a>
                <p className={`${darkModeStyle || 'text-muted'}`} style={{ color: `${subTitleColor} !important` }}>{item.subTitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
