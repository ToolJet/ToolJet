import React from 'react';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import { resolve_references } from '@/_helpers/utils';

export const Datepicker = function Datepicker({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    const formatProp = component.definition.properties.format;
    const enableTimeProp = component.definition.properties.enableTime;

    const enabletime = resolve_references(enableTimeProp.value, currentState, false);

    function onDateChange(event) {
        onComponentOptionChanged(component, 'value', event.format(formatProp.value))
    }

    return (
        <div style={{width, height}} onClick={() => onComponentClick(id, component) }>
            <Datetime 
                onChange={onDateChange}
                timeFormat={enabletime}
            />
        </div>
);
};
