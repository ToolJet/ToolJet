import React from 'react';

export const LeftSidebarItem = ({ className, icon, text, onClick, ...rest }) => {
  return (
    <div {...rest} className={className} onClick={onClick && onClick}>
      {icon && <img className="svg-icon" src={`/assets/images/icons/editor/left-sidebar/${icon}.svg`} width="35" height="35" />}
      {text && text} 
    </div>
  )
}
