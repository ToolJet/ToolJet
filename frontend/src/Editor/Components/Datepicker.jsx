import React from 'react';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";


export const Datepicker = function Datepicker({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    function onDateChange(event) {
        onComponentOptionChanged(component, 'value', event.format())
    }

    return (
        <Datetime 
            onChange={onDateChange}
        />
    );
};
