import React from 'react'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export const SidebarPinned = ({ state, component, updateState }) => {

    const tooltipMsg = state ? `Unpin ${component}` : `Pin ${component}`
    return (
        <SidebarPinned.OverlayContainer tip={tooltipMsg}>
            <div className="btn btn-light btn-sm m-1" onClick={updateState} >
                <img className="svg-icon" src={`/assets/images/icons/editor/left-sidebar/pinned.svg`} width="16" height="16" />
            </div>            
        </SidebarPinned.OverlayContainer>
    )
}


function OverlayContainer({ children, tip }) {
    return (
        <>
            <OverlayTrigger
              trigger={['click','hover', 'focus']}
              placement="top"
              delay={{ show: 800, hide: 100 }}
              overlay={<Tooltip id="button-tooltip">{tip}</Tooltip>}
            >
              { children }
            </OverlayTrigger>
        </>
    )
  }
  
  
  SidebarPinned.OverlayContainer = OverlayContainer
