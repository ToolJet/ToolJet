import React from 'react';
import { Calendar as ReactCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export const Calendar = function ({ height, width }) {
  return (
    <div>
      <ReactCalendar
        localizer={localizer}
        events={[]}
        startAccessor="start"
        endAccessor="end"
        style={{ height, width, backgroundColor: 'white', padding: 10 }}
      />
    </div>
  );
};
