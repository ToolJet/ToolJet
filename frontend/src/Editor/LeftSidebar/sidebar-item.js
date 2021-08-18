import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export const LeftSidebarItem = ({ tip = '', className, icon, text, onClick, ...rest }) => {

  return (
    <OverlayTrigger
      trigger={['click','hover', 'focus']}
      placement="right"
      delay={{ show: 800, hide: 100 }}
      overlay={<Tooltip id="button-tooltip">
        {tip}
      </Tooltip>}
    >
      <div {...rest} className={className} onClick={onClick && onClick}>
      {icon && <img className="svg-icon" src={`/assets/images/icons/editor/left-sidebar/${icon}.svg`} width="20" height="20" />}
      {text && text}
    </div>
    </OverlayTrigger>
  )
}
