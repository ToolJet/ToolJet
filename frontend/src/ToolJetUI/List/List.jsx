import React, { useState } from 'react';
import './list.scss';
import ListGroup from 'react-bootstrap/ListGroup';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import classNames from 'classnames';
import Edit from '@/_ui/Icon/bulkIcons/Edit';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import MoreVertical from '@/_ui/Icon/solidIcons/MoreVertical';
import SortableList from '@/_components/SortableList';
import { DeprecatedColumnTooltip } from '@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/DeprecatedColumnTypeMsg';
import Icons from '@/_ui/Icon/solidIcons/index';

function List({ children, ...restProps }) {
  return <ListGroup {...restProps}>{children}</ListGroup>;
}

function ListItem({
  primaryText = '',
  secondaryText = '',
  Icon,
  darkMode,
  enableActionsMenu,
  menuActions = [],
  onMenuOptionClick,
  isEditable,
  isDraggable,
  deleteIconOutsideMenu = false,
  showCopyColumnOption = false,
  showVisibilityIcon = false,
  isColumnVisible = true,
  columnType,
  isDeprecated,
  ...restProps
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  return (
    <div>
      <ListGroup.Item
        style={{ marginBottom: '8px', backgroundColor: 'var(--slate3)' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...restProps}
      >
        <div className="row">
          {(Icon || isDraggable) && (
            <div className="col-auto d-flex align-items-center">
              {!isHovered && Icon && <Icon />}
              <SortableList.DragHandle show={isDraggable} />
            </div>
          )}
          <div
            className="col text-truncate cursor-pointer"
            data-cy={`pages-name-${String(primaryText).toLowerCase()}`}
            style={Icon ? { paddingLeft: '0px' } : { paddingLeft: '8px' }}
          >
            {primaryText}
            <span className="list-item-secondary-text">{secondaryText}</span>
            {isEditable && (
              <span style={{ marginLeft: '8px' }}>
                <Edit width={16} />
              </span>
            )}
            {showVisibilityIcon && !isColumnVisible && (
              <span style={{ marginLeft: '8px' }}>
                <SolidIcon name="eyedisable" width={16} />
              </span>
            )}

            {isDeprecated && (
              <DeprecatedColumnTooltip columnType={columnType}>
                <span className={'list-item-deprecated-column-type'}>
                  <Icons name={'warning'} height={14} width={14} fill="#DB4324" />
                </span>
              </DeprecatedColumnTooltip>
            )}
          </div>
          <div className="col-auto d-flex align-items-center custom-gap-4">
            <OverlayTrigger
              trigger={'click'}
              placement={'bottom-end'}
              rootClose={true}
              show={showActionsMenu}
              onToggle={(show) => setShowActionsMenu(show)}
              overlay={
                <Popover id="list-menu" className={darkMode && 'dark-theme'}>
                  <Popover.Body bsPrefix="list-item-popover-body" className={`list-item-popover-body`}>
                    {menuActions.map((action) => (
                      <div
                        className="list-item-popover-option"
                        key={action.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuOptionClick(primaryText, action.label);
                        }}
                      >
                        <div className="list-item-popover-menu-option-icon">
                          {action.label === 'Delete' ? <Trash fill={'#E54D2E'} width={16} /> : action.icon}
                        </div>
                        <div
                          className={classNames('list-item-option-menu-label', {
                            'color-tomato9': action.label === 'Delete',
                          })}
                        >
                          {action.label}
                        </div>
                      </div>
                    ))}
                  </Popover.Body>
                </Popover>
              }
            >
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  setShowActionsMenu(true);
                }}
              >
                {enableActionsMenu && isHovered && (
                  <ButtonSolid variant="tertiary" size="xs" className={'list-menu-option-btn'}>
                    <span>
                      <MoreVertical fill={'var(--slate12)'} width={'20'} />
                    </span>
                  </ButtonSolid>
                )}
              </span>
            </OverlayTrigger>
            {showCopyColumnOption && isHovered && (
              <ButtonSolid
                variant="ghostBlack"
                size="xs"
                className={'copy-column-icon'}
                // data-cy={'page-menu'}
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuOptionClick(primaryText, 'copyColumn');
                }}
              >
                <span className="d-flex">
                  <SolidIcon name="copy" fill={'var(--icons-strong)'} width={16} />
                </span>
              </ButtonSolid>
            )}
            {deleteIconOutsideMenu && isHovered && (
              <ButtonSolid
                variant="danger"
                size="xs"
                className={'delete-icon-btn'}
                // data-cy={'page-menu'}
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuOptionClick(primaryText, 'Delete');
                }}
              >
                <span className="d-flex">
                  <Trash fill={'var(--tomato9)'} width={16} />
                </span>
              </ButtonSolid>
            )}
          </div>
        </div>
      </ListGroup.Item>
    </div>
  );
}

List.Item = ListItem;

export default List;
