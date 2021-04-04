import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';

export const Json = ({ param, definition, onChange, paramType  }) => {

    const value = definition ? definition.value : `[{
        "id": 1,
        "name": "Sam",
        "email": "hanson@example.com"
      }]`;

    return (
        <div className="field mb-2">
            <label class="form-label">{param.name}</label>
            <CodeMirror
                height ="300px"
                fontSize="2"
                onChange={ (instance, change) => onChange(param, 'value', JSON.parse(instance.getValue()), paramType) }
                value={JSON.stringify(value)}
                options={{
                    theme: 'duotone-light',
                    mode: 'json',
                    lineWrapping: true,
                    scrollbarStyle: null,
                    
                }}
            />
        </div>
    );
}
