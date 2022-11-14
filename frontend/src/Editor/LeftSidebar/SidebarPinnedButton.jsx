import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { Button } from '@/_ui/LeftSidebar';

export const SidebarPinnedButton = ({ state, component, updateState, darkMode }) => {
  const tooltipMsg = state ? `Unpin ${component}` : `Pin ${component}`;
  const pinnedIcon = !state ? 'pinned' : 'pinnedoff';
  const iconSrc = `assets/images/icons/editor/left-sidebar/${pinnedIcon}.svg`;

  // Todo: Uniform styles for all pinned buttons

  return (
    <SidebarPinnedButton.OverlayContainer tip={tooltipMsg}>
      {component === 'PageSelector' ? (
        <Button darkMode={darkMode} onClick={updateState} size="sm" styles={{ width: '28px', padding: 0 }}>
          <Button.Content iconSrc={iconSrc} />
        </Button>
      ) : (
        <div
          className={`btn btn-sm btn-light m-1 ${darkMode && 'btn-outline-secondary'} ${state && 'active'} ${
            component === 'Inspector' && 'position-absolute end-0'
          }`}
          onClick={updateState}
        >
          <img
            className="svg-icon"
            src={`assets/images/icons/editor/left-sidebar/${pinnedIcon}.svg`}
            width="16"
            height="16"
          />
        </div>
      )}
    </SidebarPinnedButton.OverlayContainer>
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

SidebarPinnedButton.OverlayContainer = OverlayContainer;
