import React from 'react';
import { Calendar as ReactCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export const Calendar = function ({ height, width, properties }) {
  const style = { height, width, backgroundColor: 'white', padding: 10 };
  const resourcesParam = properties.resources?.length === 0 ? {} : { resources: properties.resources };

  return (
    <div>
      <ReactCalendar
        localizer={localizer}
        events={properties.events}
        startAccessor="start"
        endAccessor="end"
        style={style}
        views={['day', 'week', 'month']}
        defaultView={properties.defaultView}
        {...resourcesParam}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="title"
      />
    </div>
  );
};
