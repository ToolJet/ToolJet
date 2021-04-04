import React from 'react';
import { ActionTypes } from '../ActionTypes';

export const EventSelector = ({ param, definition, eventUpdated, eventOptionUpdated, dataQueries }) => {

    console.log('dq', dataQueries);

    function onChange(e) {
        const query = dataQueries.find(query => query.id === e.target.value) 
        eventOptionUpdated(param, 'queryId', query.id);
        eventOptionUpdated(param, 'queryName', query.name);
    }

    const message = definition.options ? definition.options.message : 'Message';

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
