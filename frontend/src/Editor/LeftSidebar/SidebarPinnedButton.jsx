import React from 'react'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export const SidebarPinnedButton = ({ state, component, updateState }) => {

    const tooltipMsg = state ? `Unpin ${component}` : `Pin ${component}`
    return (
        <SidebarPinnedButton.OverlayContainer tip={tooltipMsg}>
            <div className={`btn btn-light btn-sm m-1 ${(component === 'Inspector') && "position-absolute end-0" }`} onClick={updateState} >
                <img className="svg-icon" src={`/assets/images/icons/editor/left-sidebar/pinned.svg`} width="16" height="16" />
            </div>            
        </SidebarPinnedButton.OverlayContainer>
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
  
  
  SidebarPinnedButton.OverlayContainer = OverlayContainer
