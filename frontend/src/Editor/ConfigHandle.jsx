import React from 'react';

export const ConfigHandle = function ConfigHandle({
    id,
    component,
    configHandleClicked
}) {

    return <div className="config-handle">
         <span onClick={() => configHandleClicked(id, component)} className="badge badge bg-azure-lt" role="button">
            <img src="https://www.svgrepo.com/show/83981/menu.svg" width="8" height="8" style={{marginRight: '5px'}} />
            {component.name}
         </span>
    </div>
}
