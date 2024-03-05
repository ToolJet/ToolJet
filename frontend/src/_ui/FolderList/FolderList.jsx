import React, { useState, useRef } from 'react';
import './FolderList.scss';
import SolidIcon from '../Icon/solidIcons/index';
import Skeleton from 'react-loading-skeleton';
import { ButtonSolid } from '../AppButton/AppButton';
import Overlay from 'react-bootstrap/Overlay';
import cx from 'classnames';

function FolderList({
  overlayFunctionParam,
  className,
  backgroundColor,
  disabled,
  RightIcon,
  LeftIcon,
  children,
  onClick,
  selectedItem,
  dataCy = '',
  isLoading = false,
  renderBadgeForItems = [],
  renderBadge = null,
  overLayComponent,
  darkMode,
  toolTipText,
  ...restProps
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHoveredInside, setIsHoveredInside] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const target = useRef(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const menuToggle = () => {
    setShowGroupOptions(!showGroupOptions);
  };
  const handleMouseEnterInside = () => {
    setIsHoveredInside(true);
  };

  const handleMouseLeaveInside = () => {
    setIsHoveredInside(false);
  };

  return (
    <>
      {!isLoading ? (
        <button
          {...restProps}
          className={cx(`tj-list-item ${className}`, {
            'tj-list-item-selected': selectedItem,
            'tj-list-item-disabled': disabled,
            'tj-list-item-option-opened': showGroupOptions,
          })}
          style={backgroundColor && { backgroundColor }}
          onClick={isHoveredInside ? menuToggle : onClick}
          data-cy={`${dataCy}-list-item`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-tooltip-content={toolTipText}
          data-tooltip-id="button-content"
        >
          {LeftIcon && (
            <div className="tj-list-item-icon">
              <SolidIcon name={LeftIcon} />
            </div>
          )}

          {children}

          {RightIcon && <div className="tj-list-item-icon">{RightIcon && <SolidIcon name={RightIcon} />}</div>}
          {overLayComponent && (isHovered || showGroupOptions) && (
            <>
              <div ref={target}>
                <ButtonSolid
                  className="groups-list-option-button"
                  fill={`var(--slate12)`}
                  leftIcon="options"
                  iconWidth="14"
                  variant="tertiary"
                  onMouseEnter={handleMouseEnterInside}
                  onMouseLeave={handleMouseLeaveInside}
                ></ButtonSolid>
              </div>
              <Overlay
                target={target.current}
                show={showGroupOptions}
                placement="bottom"
                rootClose={true}
                style={{ zIndex: 9999 }}
                onHide={isHoveredInside ? () => 0 : menuToggle}
              >
                {({
                  placement: _placement,
                  arrowProps: _arrowProps,
                  show: _show,
                  popper: _popper,
                  hasDoneInitialMeasure: _hasDoneInitialMeasure,
                  ...props
                }) => overLayComponent(props, overlayFunctionParam)}
              </Overlay>
            </>
          )}
          {renderBadgeForItems.includes(children) && renderBadge && renderBadge()}
        </button>
      ) : (
        <Skeleton count={4} />
      )}
    </>
  );
}

export default FolderList;
