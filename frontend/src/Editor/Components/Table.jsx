import React from 'react';
import { resolve } from '@/_helpers/utils';

export const Table = function Table({ id, component, onComponentClick, currentState, onEvent }) {
    
    const backgroundColor = component.definition.styles.backgroundColor.value;
    const color = component.definition.styles.textColor.value;
    const columns = component.definition.properties.columns.value;
    const actions = component.definition.properties.actions || { value: []};

    console.log('currentState', currentState);

    let data = []
    if(currentState) {
        data = resolve(component.definition.properties.data.value, currentState, []);
        console.log('resolved param', data);
    }

    // Quick fix, need to remove later
    data = data ? data : [];

    const computedStyles = { 
        backgroundColor,
        color
    }

    return (
        <div class="table-responsive table-bordered" style={{...computedStyles, width: '700px'}} onClick={() => onComponentClick(id, component) }>
            <table
                    class="table table-vcenter table-nowrap">
                <thead>
                <tr>
                    {columns.map((column) => <th>{column.name}</th>)}
                    {actions.value.length > 0 && 
                        <th>Actions</th>
                    }
                </tr>
                </thead>
                <tbody>

                {data.map((row => 
                    <tr onClick={(e) => { e.stopPropagation(); onEvent('onRowClicked',  { component, row }); }}>
                        {columns.map((column) => <td>{row[column.name]}</td>)}
                        
                        <td>
                            {actions.value.map((action) => ( 
                                <button 
                                    class="btn btn-sm m-1 btn-light"
                                    onClick={(e) => { e.stopPropagation(); onEvent('onTableActionButtonClicked', { component, data: row, action }); }}
                                >
                                    {action.buttonText}
                                </button>
                            ))}
                        </td>
                    </tr>
                ))}
                </tbody>
                {/* <div className="table-footer p-2">
                    Records 1-10 of 242
                </div> */}
            </table>
        </div>
    );
};
