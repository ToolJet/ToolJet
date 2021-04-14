import React from 'react';
import { resolve } from '@/_helpers/utils';

export const TextArea = function TextArea({ id, width, height, component, onComponentClick, currentState, onComponentOptionChanged }) {

    console.log('currentState', currentState);

    const text = component.definition.properties.value ? component.definition.properties.value.value : '';

    let data = text;
    if(currentState) {

        const matchedParams  = text.match(/\{\{(.*?)\}\}/g);

        if (matchedParams) {
            for(const param of matchedParams) {
                const resolvedParam = resolve(param, currentState, '');
                console.log('resolved param', param, resolvedParam);
                data = data.replace(param, resolvedParam);
            }
        }

    }

    const placeholder = component.definition.properties.placeholder.value;

    return (
        <textarea 
            onClick={() => onComponentClick(id, component) }
            onChange={(e) => onComponentOptionChanged(component, 'value', e.target.value)}
            type="text" 
            class="form-control" 
            placeholder={placeholder} 
            style={{width, height}} 
            value={data}
        ></textarea>
    );
};
