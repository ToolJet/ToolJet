import React, { useState } from 'react';
import './list.scss';
import ListGroup from 'react-bootstrap/ListGroup';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import classNames from 'classnames';
import Edit from '@/_ui/Icon/bulkIcons/Edit';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import MoreVertical from '@/_ui/Icon/solidIcons/MoreVertical';
import SortableList from '@/_components/SortableList';
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
          </div>
          <div className="col-auto">
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
                  <ButtonSolid
                    variant="tertiary"
                    size="xs"
                    className={'list-menu-option-btn'}
                    // data-cy={'page-menu'}
                  >
                    <span>
                      <MoreVertical fill={'var(--slate12)'} width={'20'} />
                    </span>
                  </ButtonSolid>
                )}
              </span>
            </OverlayTrigger>
          </div>
        </div>
      </ListGroup.Item>
    </div>
  );
}

List.Item = ListItem;

export default List;
