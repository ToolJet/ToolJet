import React from 'react';
import moment from 'moment';
import TimePickerComponent from '@/ToolJetUI/Timepicker/Timepicker';

export const TimePicker = ({ value, onChange, component }) => {
  const currentDay = moment().format('YYYY-MM-DD');
  const dateTimeString = `${currentDay} ${value}`;
  const dateObject = moment(dateTimeString, 'YYYY-MM-DD hh:mm').toDate();

  return (
    <div className="xxx">
      <TimePickerComponent
        selected={value && moment(dateObject.toISOString()).toDate()}
        timeFormat={
          component.component.definition.properties.enableTwentyFourHour.value == '{{true}}' ? `HH:mm a` : `hh:mm a`
        }
        onChange={(value) => {
          onChange(moment(value).format('hh:mm'));
        }}
        enableTime={true}
      />
    </div>
  );
};
