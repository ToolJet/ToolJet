import React, {useState, useEffect} from 'react';
import { resolve, resolve_references } from '@/_helpers/utils';

export const Button = function Button({ id, width, height, component, onComponentClick, currentState }) {

    console.log('currentState', currentState);

    const [loadingState, setLoadingState] = useState(false);

    useEffect(() => {

		const loadingStateProperty = component.definition.properties.loadingState;
		if(loadingStateProperty && currentState) { 
			const newState = resolve_references(loadingStateProperty.value, currentState, false);
			setLoadingState(newState);
		}
        
    }, [currentState]);
    
    const text = component.definition.properties.text.value;
    const backgroundColor = component.definition.styles.backgroundColor.value;
    const color = component.definition.styles.textColor.value;

    const computedStyles = { 
        backgroundColor,
        color,
        width,
        height
    }

    return (
        <button 
            class={`btn btn-primary p-1 m-1 ${loadingState ? ' btn-loading' : ''}`}
            style={computedStyles}
            onClick={() => onComponentClick(id, component) }>
            {text}
        </button>
    );
};
