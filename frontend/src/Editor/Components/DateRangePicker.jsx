import React, { useMemo, useState, useEffect } from "react";
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import 'react-dates/initialize';
import {
    START_DATE,
    END_DATE,
} from 'react-dates/constants';

export const DaterangePicker = function DaterangePicker({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    const startDateProp = component.definition.properties.startDate;
    const endDateProp = component.definition.properties.endDate;
    const formatProp = component.definition.properties.format;

    const [focusedInput, setFocusedInput] = useState(null);
    const [startDate, setStartDate] = useState(startDateProp ? startDateProp.value : null);
    const [endDate, setEendDate] = useState(endDateProp ? endDateProp.value : null);

    function onDateChange({ startDate, endDate }) {
        
        if(startDate){
            onComponentOptionChanged(component, 'startDate', startDate.format(formatProp.value));
        }

        if(endDate){
            onComponentOptionChanged(component, 'endDate', endDate.format(formatProp.value));
        }

        setStartDate(startDate);
        setEendDate(endDate);
    }

    function focusChanged(focus){
        setFocusedInput(focus);
    }

    return (
        <div style={{width, height}} onClick={() => onComponentClick(id, component) }>
            <DateRangePicker
                startDate={startDate}
                startDateId="startDate" 
                isOutsideRange={() => false}
                endDate={endDate}
                endDateId="endDate"
                onDatesChange={({ startDate, endDate }) => onDateChange({ startDate, endDate })} 
                onFocusChange={focus => focusChanged(focus)}
                focusedInput={focusedInput}
            />
        </div>
    );
}
