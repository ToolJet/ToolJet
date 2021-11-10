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

const allowedCalendarViews = ['month', 'week', 'day'];

export const Calendar = function ({ height, width, properties, styles, fireEvent, darkMode }) {
  const style = { height, width };
  const resourcesParam = properties.resources?.length === 0 ? {} : { resources: properties.resources };

  const events = properties.events ? properties.events.map((event) => prepareEvent(event, properties.dateFormat)) : [];
  const defaultDate = parseDate(properties.defaultDate, properties.dateFormat);

  const eventPropGetter = (event) => {
    const backgroundColor = event.color;
    const textStyle =
      event.textOrientation === 'vertical' ? { writingMode: 'vertical-rl', textOrientation: 'mixed' } : {};
    const style = { backgroundColor, ...textStyle, padding: 3, paddingLeft: 5, paddingRight: 5 };

    return { style };
  };

  const slotSelectHandler = (calendarSlots) => {
    const { slots, start, end, resourceId, action } = calendarSlots;
    const formattedSlots = slots.map((slot) => moment(slot).format(properties.dateFormat));
    const formattedStart = moment(start).format(properties.dateFormat);
    const formattedEnd = moment(end).format(properties.dateFormat);

    const selectedSlots = {
      slots: formattedSlots,
      start: formattedStart,
      end: formattedEnd,
      resourceId,
      action,
    };

    fireEvent('onCalendarSlotSelect', { selectedSlots });
  };

  const defaultView = allowedCalendarViews.includes(properties.defaultView)
    ? properties.defaultView
    : allowedCalendarViews[0];

  return (
    <div>
      <ReactCalendar
        className={`calendar-widget
        ${darkMode ? 'dark-mode' : ''}
        ${styles.cellSizeInViewsClassifiedByResource}
        ${properties.highlightToday ? '' : 'dont-highlight-today'}
        ${properties.displayViewSwitcher ? '' : 'hide-view-switcher'}`}
        localizer={localizer}
        defaultDate={defaultDate}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={style}
        views={allowedCalendarViews}
        defaultView={defaultView}
        {...resourcesParam}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="title"
        onSelectEvent={(calendarEvent) => fireEvent('onCalendarEventSelect', { calendarEvent })}
        selectable={true}
        onSelectSlot={slotSelectHandler}
        toolbar={properties.displayToolbar}
        eventPropGetter={eventPropGetter}
        tooltipAccessor="tooltip"
        popup={true}
      />
    </div>
  );
};
