import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';

export const Transformation = ({ changeOption, options  }) => {

    const value = options.transformation || `// write your code here
// return value will be set as data and the original data will be available as rawData
return data.filter(row => row.amount > 1000);`;

    return (
        <div className="field mb-2">
            <label class="form-check form-switch my-2">
                <input 
                    class="form-check-input" 
                    type="checkbox" 
                    onClick={() => changeOption('enableTransformation', !options.enableTransformation)}
                    checked={options.enableTransformation} 
                />
                <span class="form-check-label">Transformations</span>
            </label>
            <br></br>
            {options.enableTransformation && 
                <CodeMirror
                    height ="100px"
                    fontSize="1"
                    onChange={ (instance, change) => changeOption('transformation', instance.getValue()) }
                    value={value}
                    options={{
                        theme: 'duotone-light',
                        mode: 'javascript',
                        lineWrapping: true,
                        scrollbarStyle: null,
                        
                    }}
                />
            }
        </div>
    );
}
