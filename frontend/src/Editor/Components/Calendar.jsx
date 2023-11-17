import React, { useEffect, useState } from 'react';
import { Calendar as ReactCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEventPopover } from './CalendarPopover';
import _ from 'lodash';

const localizer = momentLocalizer(moment);

const prepareEvent = (event, dateFormat) => ({
  ...event,
  start: moment(event.start, dateFormat).toDate(),
  end: moment(event.end, dateFormat).toDate(),
});

const parseDate = (date, dateFormat) => {
  const parsed = moment(date, dateFormat).toDate();

  //handle invalid dates
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const allowedCalendarViews = ['month', 'week', 'day'];

export const Calendar = function ({
  id,
  component,
  height,
  properties,
  styles,
  fireEvent,
  darkMode,
  containerProps,
  removeComponent,
  setExposedVariable,
  exposedVariables,
  dataCy,
}) {
  const style = { height };
  const resourcesParam = properties.resources?.length === 0 ? {} : { resources: properties.resources };
  const events = Array.isArray(properties?.events)
    ? properties?.events?.map((event) => prepareEvent(event, properties.dateFormat))
    : [];
  const defaultDate = parseDate(properties.defaultDate, properties.dateFormat);
  const todayStartTime = moment().startOf('day').toDate();
  const todayEndTime = moment().endOf('day').toDate();
  const startTime = properties.startTime ? parseDate(properties.startTime, properties.dateFormat) : todayStartTime;
  const endTime = properties.endTime ? parseDate(properties.endTime, properties.dateFormat) : todayEndTime;

  const [currentDate, setCurrentDate] = useState(defaultDate);
  const [eventPopoverOptions, setEventPopoverOptions] = useState({ show: false });
  const [defaultView, setDefaultValue] = useState(allowedCalendarViews[0]);

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

    fireEvent('onCalendarSlotSelect', { component, selectedSlots });
  };

  function popoverClosed() {
    setEventPopoverOptions({
      ...eventPopoverOptions,
      show: false,
    });
  }

  useEffect(() => {
    const view = allowedCalendarViews.includes(properties.defaultView)
      ? properties.defaultView
      : allowedCalendarViews[0];
    if (exposedVariables.currentView !== view) {
      setDefaultValue(view);
      setExposedVariable('currentView', view);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.defaultView]);

  useEffect(() => {
    //check if the default date is a valid date

    if (defaultDate !== null && !_.isEqual(exposedVariables.currentDate, properties.defaultDate)) {
      setExposedVariable('currentDate', moment(defaultDate).format(properties.dateFormat));
      setCurrentDate(defaultDate);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(moment(defaultDate).format('DD-MM-YYYY'))]);

  const components = {
    timeGutterHeader: () => <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>All day</div>,
    week: {
      header: (props) => <div>{moment(props.date).format(styles.weekDateFormat)}</div>,
    },
  };

  return (
    <div
      id={id}
      style={{ display: styles.visibility ? 'block' : 'none', boxShadow: styles.boxShadow }}
      data-cy={dataCy}
    >
      <ReactCalendar
        className={`calendar-widget
        ${darkMode ? 'dark-mode' : ''}
        ${styles.cellSizeInViewsClassifiedByResource}
        ${properties.highlightToday ? '' : 'dont-highlight-today'}
        ${exposedVariables.currentView === 'week' ? 'resources-week-cls' : ''}
        ${properties.displayViewSwitcher ? '' : 'hide-view-switcher'}`}
        localizer={localizer}
        date={currentDate}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={style}
        views={allowedCalendarViews}
        defaultView={defaultView}
        view={defaultView}
        onView={(view) => {
          setDefaultValue(view);
          setExposedVariable('currentView', view);
          fireEvent('onCalendarViewChange');
        }}
        {...resourcesParam}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="title"
        min={startTime}
        max={endTime}
        onSelectEvent={(calendarEvent, e) => {
          fireEvent('onCalendarEventSelect', { component, calendarEvent });
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
          const formattedDate = moment(date).format(properties.dateFormat);
          setExposedVariable('currentDate', formattedDate);
          setCurrentDate(date);
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
        calendarWidgetId={id}
        darkMode={darkMode}
        show={eventPopoverOptions.show}
        offset={eventPopoverOptions.offset}
        containerProps={containerProps}
        removeComponent={removeComponent}
        popoverClosed={popoverClosed}
        component={component}
      />
    </div>
  );
};
