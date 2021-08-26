import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export const LeftSidebarItem = ({ tip = '', className, icon, text, onClick, badge=false, count,...rest }) => {

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
      {badge && <LeftSidebarItem.Badge count={count} /> }
      {text && text}
      </div>
    </OverlayTrigger>
  )
}

function NotificationBadge({count}) {
  return <span class="badge badge-pill bg-red debugger-badge p-1">{count}</span>
}


LeftSidebarItem.Badge = NotificationBadge