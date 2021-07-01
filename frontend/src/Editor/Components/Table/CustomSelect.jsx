import React from 'react';
import SelectSearch from 'react-select-search';

export const CustomSelect = ({ options, value, multiple, disabled, onChange }) => {
 
    function renderValue(valueProps) {
        if(valueProps) {
            return valueProps.value.split(', ').map((value) => <span {...valueProps} className="badge bg-blue-lt p-2 mx-1">{value}</span>);
        }
    }

    return (
        <div className="custom-select">
            <SelectSearch
                options={options}
                printOptions="on-focus"
                value={value}
                renderValue={renderValue}
                search={false}
                onChange={onChange}
                multiple={multiple}
                placeholder="Select.."
            />
        </div>
    );
};