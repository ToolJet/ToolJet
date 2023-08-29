import React, { useState } from 'react';
import './list.scss';
import ListGroup from 'react-bootstrap/ListGroup';
import SortableList from '@/_components/SortableList';
import { Button } from '@/_ui/LeftSidebar';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import classNames from 'classnames';
import Edit from '@/_ui/Icon/bulkIcons/Edit';

function List({ children, ...restProps }) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const renderChildrenWithProps = () => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { showActionsMenu, setShowActionsMenu });
      }
      return child;
    });
  };
  return <ListGroup {...restProps}>{renderChildrenWithProps()}</ListGroup>;
}

function ListItem({
  primaryText = '',
  secondaryText = '',
  isDraggable = false,
  Icon,
  showActionsMenu,
  setShowActionsMenu,
  darkMode,
  enableActionsMenu,
  menuActions = [],
  onMenuOptionClick,
  isEditable,
  ...restProps
}) {
  const [isHovered, setIsHovered] = useState(false);
  const closeMenu = () => {
    setShowActionsMenu(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsMenu && event.target.closest('.list-menu') === null) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ showActionsMenu })]);

  return (
    <ListGroup.Item
      action
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={showActionsMenu ? { backgroundColor: '#E6E8EB' } : {}}
      {...restProps}
    >
      <div className="row" role="button">
        <div className="col-auto d-flex align-items-center">
          {!isHovered && Icon && <Icon />}
          <SortableList.DragHandle show={isDraggable && isHovered} />
        </div>
        <div
          className="col text-truncate"
          data-cy={`pages-name-${String(primaryText).toLowerCase()}`}
          style={{ paddingLeft: '0px' }}
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
          {enableActionsMenu && isHovered && (
            <OverlayTrigger
              trigger={'click'}
              placement={'bottom-end'}
              rootClose={false}
              show={showActionsMenu}
              overlay={
                <Popover id="list-menu" className={darkMode && 'popover-dark-themed'}>
                  <Popover.Body bsPrefix="list-item-popover-body">
                    {menuActions.map((action) => (
                      <div className="list-item-popover-option" key={action.label}>
                        <div className="list-item-popover-menu-option-icon">
                          {action.label === 'Delete' ? <Trash fill={'#E54D2E'} width={16} /> : action.icon}
                        </div>
                        <div
                          className={classNames('list-item-option-menu-label', {
                            'color-tomato9': action.label === 'Delete',
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMenuOptionClick(primaryText, action.label);
                          }}
                        >
                          {action.label}
                        </div>
                      </div>
                    ))}
                  </Popover.Body>
                </Popover>
              }
            >
              <span>
                <Button.UnstyledButton
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowActionsMenu(true);
                  }}
                  styles={{ height: '20px', backgroundColor: 'white' }}
                >
                  <Button.Content dataCy={`page-menu`} iconSrc={'assets/images/icons/3dots-menu.svg'} />
                </Button.UnstyledButton>
              </span>
            </OverlayTrigger>
          )}
        </div>
      </div>
    </ListGroup.Item>
  );
}

List.Item = ListItem;

export default List;
