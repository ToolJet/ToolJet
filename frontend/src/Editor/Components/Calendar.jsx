import React, { useEffect, useState } from 'react';
import { Calendar as ReactCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEventPopover } from './CalendarPopover';

const localizer = momentLocalizer(moment);

const prepareEvent = (event, dateFormat) => ({
  ...event,
  start: moment(event.start, dateFormat).toDate(),
  end: moment(event.end, dateFormat).toDate(),
});

const parseDate = (date, dateFormat) => moment(date, dateFormat).toDate();

const allowedCalendarViews = ['month', 'week', 'day'];

export const Calendar = function ({
  id,
  height,
  properties,
  styles,
  fireEvent,
  darkMode,
  containerProps,
  removeComponent,
  setExposedVariable,
  exposedVariables,
}) {
  const style = { height };
  const resourcesParam = properties.resources?.length === 0 ? {} : { resources: properties.resources };

  const events = properties.events ? properties.events.map((event) => prepareEvent(event, properties.dateFormat)) : [];
  const defaultDate = parseDate(properties.defaultDate, properties.dateFormat);
  const todayStartTime = moment().startOf('day').toDate();
  const todayEndTime = moment().endOf('day').toDate();
  const startTime = properties.startTime ? parseDate(properties.startTime, properties.dateFormat) : todayStartTime;
  const endTime = properties.endTime ? parseDate(properties.endTime, properties.dateFormat) : todayEndTime;

  const [eventPopoverOptions, setEventPopoverOptions] = useState({ show: false });

  const eventPropGetter = (event) => {
    const backgroundColor = event.color;
    const textStyle =
      event.textOrientation === 'vertical' && exposedVariables.currentView != 'month'
        ? { writingMode: 'vertical-rl', textOrientation: 'mixed' }
        : {};
    const color = event.textColor ?? 'white';
    const style = { backgroundColor, ...textStyle, padding: 3, paddingLeft: 5, paddingRight: 5, color };

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

  function popoverClosed() {
    setEventPopoverOptions({
      ...eventPopoverOptions,
      show: false,
    });
  }

  const defaultView = allowedCalendarViews.includes(properties.defaultView)
    ? properties.defaultView
    : allowedCalendarViews[0];

  useEffect(() => {
    setExposedVariable('currentView', defaultView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultView]);

  const components = {
    timeGutterHeader: () => <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>All day</div>,
    week: {
      header: (props) => <div>{moment(props.date).format(styles.weekDateFormat)}</div>,
    },
  };

  if (exposedVariables.currentDate === undefined) setExposedVariable('currentDate', properties.defaultDate);

  return (
    <div id={id} style={{ display: styles.visibility ? 'block' : 'none' }}>
      <ReactCalendar
        className={`calendar-widget
        ${darkMode ? 'dark-mode' : ''}
        ${styles.cellSizeInViewsClassifiedByResource}
        ${properties.highlightToday ? '' : 'dont-highlight-today'}
        ${exposedVariables.currentView === 'week' ? 'resources-week-cls' : ''}
        ${properties.displayViewSwitcher ? '' : 'hide-view-switcher'}`}
        localizer={localizer}
        defaultDate={defaultDate}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={style}
        views={allowedCalendarViews}
        defaultView={defaultView}
        onView={(view) => {
          setExposedVariable('currentView', view);
          fireEvent('onCalendarViewChange');
        }}
        {...resourcesParam}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="title"
        min={startTime}
        max={endTime}
        onSelectEvent={(calendarEvent, e) => {
          fireEvent('onCalendarEventSelect', { calendarEvent });
          if (properties.showPopOverOnEventClick)
            setEventPopoverOptions({
              ...eventPopoverOptions,
              show: true,
              offset: {
                left: e.target.getBoundingClientRect().x,
                top: e.target.getBoundingClientRect().y,
                width: e.target.getBoundingClientRect().width,
                height: e.target.getBoundingClientRect().height,
              },
            });
        }}
        onNavigate={(date) => {
          setExposedVariable('currentDate', moment(date).format(properties.dateFormat));
          fireEvent('onCalendarNavigate');
        }}
        selectable={true}
        onSelectSlot={slotSelectHandler}
        toolbar={properties.displayToolbar}
        eventPropGetter={eventPropGetter}
        tooltipAccessor="tooltip"
        popup={true}
        components={components}
      />
      <CalendarEventPopover
        calenderWidgetId={id}
        show={eventPopoverOptions.show}
        offset={eventPopoverOptions.offset}
        containerProps={containerProps}
        removeComponent={removeComponent}
        popoverClosed={popoverClosed}
      />
    </div>
  );
};
