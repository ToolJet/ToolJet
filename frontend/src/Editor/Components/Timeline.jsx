import React from 'react';
import { isArray } from 'lodash';
import config from 'config';
import { Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import TimelineMUI from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

export const Timeline = function Timeline({ height, darkMode, properties, styles, dataCy }) {
  const { visibility, boxShadow } = styles;
  const { data, hideDate } = properties;

  const darkModeStyle = darkMode && 'text-white-50';

  return (
    <>
      {config.UI_LIB === 'tooljet' && (
        <div
          className="card"
          style={{
            display: visibility ? '' : 'none',
            height,
            overflow: 'auto',
            overflowWrap: 'normal',
            boxShadow,
          }}
          data-cy={dataCy}
        >
          <div className="card-body">
            <ul className={`list list-timeline ${hideDate && 'list-timeline-simple'}`}>
              {(isArray(data) ? data : []).map((item, index) => (
                <li key={index}>
                  <div
                    className="list-timeline-icon"
                    style={{ backgroundColor: item.iconBackgroundColor }}
                  ></div>
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
      )}
      {config.UI_LIB === 'mui' && (
        <Card
          className="card"
          style={{
            display: visibility ? '' : 'none',
            height,
            overflow: 'auto',
            overflowWrap: 'normal',
            boxShadow,
          }}
          data-cy={dataCy}
        >
          <CardContent>
            <TimelineMUI>
              {(isArray(data) ? data : []).map((item, index) => (
                <TimelineItem key={index}>
                  {!hideDate ? (
                    <TimelineOppositeContent
                      className={`list-timeline-time ${darkModeStyle}`}
                      style={{ flex: 'none' }}
                    >
                      {item.date}
                    </TimelineOppositeContent>
                  ) : (
                    <TimelineOppositeContent style={{ flex: 'none' }}></TimelineOppositeContent>
                  )}
                  <TimelineSeparator>
                    <TimelineDot style={{ backgroundColor: item.iconBackgroundColor }} />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography className="list-timeline-title">{item.title}</Typography>
                    <Typography className={`${darkModeStyle || 'text-muted'}`}>{item.subTitle}</Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </TimelineMUI>
          </CardContent>
        </Card>
      )}
    </>
  );
};
