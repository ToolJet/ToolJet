import React from 'react';

export const ConfigHandle = function ConfigHandle({
    id,
    component,
    configHandleClicked,
    dragRef,
    removeComponent
}) {

return <div className="config-handle" ref={dragRef}>
         <span 
          style={{cursor: 'move'}} 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); configHandleClicked(id, component) }}
          className="badge badge bg-azure-lt" 
          role="button"
        >
            <img 
              style={{cursor: 'pointer'}} 
              src="/assets/images/icons/menu.svg" 
              width="8" 
              height="8" 
              style={{marginRight: '5px'}}
            />
            {component.name}

         </span>
         <img 
          style={{cursor: 'pointer'}} 
          src="/assets/images/icons/trash.svg" 
          width="12" 
          role="button"
          className="mx-2"
          height="12" 
          onClick={() => removeComponent({id})}
          style={{marginRight: '5px'}}
        />
    </div>
}
