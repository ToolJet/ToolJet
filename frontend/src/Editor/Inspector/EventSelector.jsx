import React from 'react';
import { ActionTypes } from '../ActionTypes';

export const EventSelector = ({ param, definition, eventUpdated, eventOptionUpdated, dataQueries, extraData }) => {

    console.log('dq', dataQueries);

    function onChange(e) {
        const query = dataQueries.find(query => query.id === e.target.value) 
        eventOptionUpdated(param, 'queryId', query.id, extraData);
        eventOptionUpdated(param, 'queryName', query.name, extraData);
    }
    
    if(definition === undefined) {
        definition = {}
    }

    if(definition.options === undefined) {
        definition.options = {}
    }

    const message = definition.options.message;

    return (
        <div className="field mb-2 mt-1">
            <label class="form-label">{param.name}</label>
            <select onClick={(e) => {  e.stopPropagation(); e.preventDefault() } } onChange={(e) => { e.stopPropagation(); eventUpdated(param, e.target.value, extraData)}} value={definition.actionId} class="form-select" >
                <option value="none">None</option>
                {ActionTypes.map((action) => (<option value={action.id}>{action.name}</option>))}
            </select>

            {definition && 
                <div>
                    {definition.actionId === 'show-alert' && 
                        <div className="p-3">
                            <label class="form-label mt-2">Message</label>
                            <input 
                                onChange={(e) => eventOptionUpdated(param, 'message', e.target.value, extraData)} 
                                value={message}
                                type="text" 
                                class="form-control form-control-sm" 
                                placeholder="Text goes here" />
                        </div>
                    }

                    {definition.actionId === 'run-query' && 
                        <div className="p-3">
                            <label class="form-label mt-2">Query</label>
                            <select class="form-select" onChange={onChange} >
                                {dataQueries.map((query) => (<option value={query.id}>{query.name}</option>))}
                            </select>
                        </div>
                    }
                </div> 
            }
        </div>
    );
}
