import React from 'react';
import { Calendar as ReactCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const prepareEvent = (event, dateFormat) => ({
  ...event,
  start: moment(event.start, dateFormat).toDate(),
  end: moment(event.end, dateFormat).toDate(),
});

export const Calendar = function ({ height, width, properties, fireEvent }) {
  const style = { height, width, backgroundColor: 'white', padding: 10 };
  const resourcesParam = properties.resources?.length === 0 ? {} : { resources: properties.resources };

  const events = properties.events ? properties.events.map((event) => prepareEvent(event, properties.dateFormat)) : [];

  return (
    <div>
      <ReactCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={style}
        views={properties.views}
        defaultView={properties.defaultView}
        {...resourcesParam}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="title"
        onSelectEvent={(calendarEvent) => fireEvent('onEventSelect', { calendarEvent })}
        toolbar={properties.displayToolbar}
      />
    </div>
  );
};
