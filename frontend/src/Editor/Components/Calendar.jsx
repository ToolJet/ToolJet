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

const parseDate = (date, dateFormat) => moment(date, dateFormat).toDate();

export const Calendar = function ({ height, width, properties, styles, fireEvent }) {
  const style = { height, width, backgroundColor: 'white', padding: 10 };
  const resourcesParam = properties.resources?.length === 0 ? {} : { resources: properties.resources };

  const events = properties.events ? properties.events.map((event) => prepareEvent(event, properties.dateFormat)) : [];
  const defaultDate = parseDate(properties.defaultDate, properties.dateFormat);

  const eventPropGetter = (event) => {
    const backgroundColor = event.color;
    const textStyle =
      event.textOrientation === 'vertical' ? { writingMode: 'vertical-rl', textOrientation: 'mixed' } : {};
    const style = { backgroundColor, ...textStyle };

    return { style };
  };

  return (
    <div>
      <ReactCalendar
        className={styles.cellSizeInViewsClassifiedByResource === 'compact' ? 'calendar-widget' : ''}
        localizer={localizer}
        defaultDate={defaultDate}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={style}
        views={properties.views}
        defaultView={properties.defaultView}
        {...resourcesParam}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="title"
        onSelectEvent={(calendarEvent) => fireEvent('onCalendarEventSelect', { calendarEvent })}
        selectable={true}
        onSelectSlot={(calendarSlot) => fireEvent('onCalendarSlotSelect', { calendarSlot })}
        toolbar={properties.displayToolbar}
        eventPropGetter={eventPropGetter}
      />
    </div>
  );
};
