import React from 'react';

export const ConfigHandle = function ConfigHandle({
    id,
    component,
    configHandleClicked,
    dragRef
}) {

    return <div className="config-handle" ref={dragRef}>
         <span onClick={(e) => { e.preventDefault(); configHandleClicked(id, component) }} className="badge badge bg-azure-lt" role="button">
            <img src="https://www.svgrepo.com/show/83981/menu.svg" width="8" height="8" style={{marginRight: '5px'}}/>
            {component.name}
         </span>
    </div>
}
