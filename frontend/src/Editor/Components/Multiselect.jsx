import React, { useState, useEffect} from 'react';
import { resolve_references } from '@/_helpers/utils';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const Multiselect = function Multiselect({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    const label = component.definition.properties.label.value;
    const values = component.definition.properties.option_values.value;
    const display_values = component.definition.properties.display_values.value;

    const parsed_values = JSON.parse(values);
    const parsed_display_values = JSON.parse(display_values);

    const selectOptions = [
        ...parsed_values.map((value, index) => { return {name: parsed_display_values[index], value: value }} )
    ]

    const currentValueProperty = component.definition.properties.values;
    const value = currentValueProperty ? currentValueProperty.value : '';
    const [currentValue, setCurrentValue] = useState(value);

    let newValue = value;
    if(currentValueProperty && currentState) { 
        newValue = resolve_references(currentValueProperty.value, currentState, '');
    }

    useEffect(() => {
		setCurrentValue(newValue);
    }, [newValue]);

    return (
        <div className="row" style={{width, height}} onClick={() => onComponentClick(id, component) }>
            <div className="col-auto">
                <label className="form-label p-2">{label}</label>
            </div>
            <div className="col">
                <SelectSearch 
                    options={selectOptions}
                    value={currentValue} 
                    search={true}
                    multiple={true}
                    printOptions="on-focus"
                    onChange={(values) => { onComponentOptionChanged(component, 'values', values)}}
                    filterOptions={fuzzySearch}
                    placeholder="Select.." 
                />
                
            </div>
        </div>
    );
};
