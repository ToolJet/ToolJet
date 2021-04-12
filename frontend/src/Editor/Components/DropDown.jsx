import React from 'react';

export const DropDown = function DropDown({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    const label = component.definition.properties.label.value;
    const values = component.definition.properties.values.value;
    const display_values = component.definition.properties.display_values.value;

    const parsed_values = JSON.parse(values);
    const parsed_display_values = JSON.parse(display_values);

    return (
        <div className="row" style={{width, height}} >
            <div className="col-auto">
                <label className="form-label p-2">{label}</label>
            </div>

            <div className="col">
                <select 
                onClick={() => onComponentClick(id, component) }
                onChange={(e) => { e.stopPropagation(); onComponentOptionChanged(component, 'value', e.target.value)}}
                placeholder="Select a value"
                class="form-select">
                    {parsed_values.map((value, index) =>  <option value={value}>{parsed_display_values[index]}</option> )}
                </select>
            </div>
        </div>
    );
};
