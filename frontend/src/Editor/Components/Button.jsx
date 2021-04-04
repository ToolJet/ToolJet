import React from 'react';

export const Button = function Button({ id, component, onComponentClick, currentState }) {

    console.log('currentState', currentState);
    
    const text = component.definition.properties.text.value;
    const backgroundColor = component.definition.styles.backgroundColor.value;
    const color = component.definition.styles.textColor.value;

    const computedStyles = { 
        backgroundColor,
        color
    }

    return (
        <button 
            class="btn btn-primary p-1 m-1"
            style={computedStyles}
            onClick={() => onComponentClick(id, component) }>
            {text}
        </button>
    );
};
