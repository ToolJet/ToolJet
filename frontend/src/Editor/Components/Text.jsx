import React from 'react';
import { resolve_references } from '@/_helpers/utils';
import DOMPurify from 'dompurify';

export const Text = function Text({ id, width, height, component, onComponentClick, currentState }) {

    const text = component.definition.properties.text.value;
    const color = component.definition.styles.textColor.value;

    let data = text;
    if(currentState) {

        const matchedParams  = text.match(/\{\{(.*?)\}\}/g);

        if (matchedParams) {
            for(const param of matchedParams) {
                const resolvedParam = resolve_references(param, currentState, '');
                console.log('resolved param', param, resolvedParam);
                data = data.replace(param, resolvedParam);
            }
        }

    }


    const computedStyles = {
        color,
        width,
        height,
    }

    return (
        <div style={computedStyles} onClick={() => onComponentClick(id, component) }>
            <div
                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(data)}}
            />
        </div>
    );
};
