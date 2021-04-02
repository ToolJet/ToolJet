import React from 'react';
import { ActionTypes } from '../ActionTypes';

export const EventSelector = ({ param, definition, eventUpdated, eventOptionUpdated }) => {

    return (
        <div className="field mb-2 mt-1">
            <label class="form-label">{param.name}</label>
            <select onChange={(e) => eventUpdated(param, e.target.value)} value={definition.actionId} class="form-select" >
                <option value="none">None</option>
                {ActionTypes.map((action) => (<option value={action.id}>{action.name}</option>))}
            </select>

            {definition && 
                <div>
                    {definition.actionId === 'show-alert' && 
                        <div className="p-3">
                            <label class="form-label mt-2">Message</label>
                            <input 
                                onChange={(e) => eventOptionUpdated(param, 'message', e.target.value)} 
                                value={definition.options.message}
                                type="text" 
                                class="form-control form-control-sm" 
                                placeholder="Text goes here" />
                        </div>
                    }
                </div> 
            }
        </div>
    );
}
