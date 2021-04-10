import React from 'react';

export const TextArea = function TextArea({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    const placeholder = component.definition.properties.placeholder.value;

    return (
        <textarea 
            onClick={() => onComponentClick(id, component) }
            onChange={(e) => onComponentOptionChanged(component, 'value', e.target.value)}
            type="text" 
            class="form-control" 
            placeholder={placeholder} 
            style={{width, height}} 
        ></textarea>
    );
};
