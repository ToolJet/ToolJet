import React from 'react';
import SelectSearch from 'react-select-search';

export const CustomSelect = ({ options, value, multiple, disabled, onChange }) => {
 
    function renderValue(valueProps) {
        return <span {...valueProps} class="badge bg-blue-lt p-2">{valueProps.value}</span>
    }

    return (
        <div class="custom-select">
            <SelectSearch
                options={options}
                value={value}
                renderValue={renderValue}
                search={true}
                onChange={onChange}
                placeholder="Select.."
            />
        </div>
    );
};