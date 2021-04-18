import React from 'react';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";


export const Datepicker = function Datepicker({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    const formatProp = component.definition.properties.format;

    function onDateChange(event) {
        onComponentOptionChanged(component, 'value', event.format(formatProp.value))
    }

    return (
        <div style={{width, height}} onClick={() => onComponentClick(id, component) }>
            <Datetime 
                onChange={onDateChange}
            />
        </div>
);
};
