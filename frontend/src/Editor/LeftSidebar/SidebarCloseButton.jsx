import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export const SidebarCloseButton = ({ state, component, updateState, darkMode }) => {
  const tooltipMsg = `Close ${component}`;

  return (
    <SidebarCloseButton.OverlayContainer tip={tooltipMsg}>
      <div
        className={`btn btn-sm btn-light m-1 ${darkMode && 'btn-outline-secondary'} ${state && 'active'} ${
          component === 'Inspector' && 'position-absolute end-0'
        }`}
        onClick={updateState}
      >
        <img className="svg-icon" src={'/assets/images/icons/close.svg'} width="12" height="12" />
      </div>
    </SidebarCloseButton.OverlayContainer>
  );
};

function OverlayContainer({ children, tip }) {
  return (
    <>
      <OverlayTrigger
        trigger={['click', 'hover', 'focus']}
        placement="top"
        delay={{ show: 800, hide: 100 }}
        overlay={<Tooltip id="button-tooltip">{tip}</Tooltip>}
      >
        {children}
      </OverlayTrigger>
    </>
  );
}

SidebarCloseButton.OverlayContainer = OverlayContainer;
