import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Button } from '@/_ui/LeftSidebar';

export const PagehandlerMenu = ({
  page,
  darkMode,
  handlePageCallback,
  showMenu,
  setShowMenu,
  isHome,
  isHidden,
  isDisabled,
}) => {
  const closeMenu = () => {
    setShowMenu(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && event.target.closest('.pagehandler-menu') === null) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ page, showMenu })]);
  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={false}
      show={showMenu}
      overlay={
        <Popover key={page.id} id="page-handler-menu" className={darkMode && 'popover-dark-themed'}>
          <Popover.Body key={page.id} bsPrefix="popover-body">
            <div className="card-body">
              <PageHandleField page={page} updatePageHandle={handlePageCallback} />
              <hr style={{ margin: '0.75rem 0' }} />
              <div className="menu-options mb-0">
                <Field
                  id="rename-page"
                  text="Rename"
                  iconSrc={'assets/images/icons/input.svg'}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />
                {isDisabled || isHidden ? null : (
                  <Field
                    id="mark-as-home-page"
                    text="Mark home"
                    iconSrc={'assets/images/icons/home.svg'}
                    closeMenu={closeMenu}
                    callback={handlePageCallback}
                  />
                )}

                {!isDisabled && (
                  <Field
                    id={isHidden ? 'unhide-page' : 'hide-page'}
                    text={isHidden ? 'Show page on app menu' : 'Hide page on app menu'}
                    iconSrc={`assets/images/icons/${isHidden ? 'eye' : 'eye-off'}.svg`}
                    closeMenu={closeMenu}
                    callback={handlePageCallback}
                    disabled={isHome}
                  />
                )}

                <Field
                  id="clone-page"
                  text="Duplicate page"
                  iconSrc={`assets/images/icons/clone.svg`}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />

                <Field
                  id="settings"
                  text="Event Handlers"
                  customClass={'delete-btn'}
                  iconSrc={'assets/images/icons/editor/left-sidebar/page-settings.svg'}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                />
                <Field
                  id={isDisabled ? 'enable-page' : 'disable-page'}
                  text={isDisabled ? 'Enable' : 'Disable'}
                  customClass={'delete-btn'}
                  iconSrc={`assets/images/icons/editor/left-sidebar/${isDisabled ? 'file-accept' : 'file-remove'}.svg`}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                  disabled={isHome}
                />
                <Field
                  id="delete-page"
                  text="Delete page"
                  iconSrc={'assets/images/icons/delete.svg'}
                  customClass={isHome ? 'delete-btn' : 'field__danger delete-btn'}
                  closeMenu={closeMenu}
                  callback={handlePageCallback}
                  disabled={isHome}
                />
              </div>
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      <span>
        <Button.UnstyledButton
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu(true);
          }}
          styles={{ height: '20px', marginTop: '2px' }}
        >
          <Button.Content dataCy={`page-menu`} iconSrc={'assets/images/icons/3dots-menu.svg'} />
        </Button.UnstyledButton>
      </span>
    </OverlayTrigger>
  );
};

const PageHandleField = ({ page, updatePageHandle }) => {
  const Label = () => {
    return (
      <label htmlFor="pin" className="form-label" data-cy={`header-page-handle`}>
        Page Handle
      </label>
    );
  };

  const content = () => {
    return (
      <div className="col text-truncate pe-3">
        <span style={{ color: '#889096' }}>.../</span>
        <span data-cy={`page-handle-text`}>{page.handle}</span>
      </div>
    );
  };

  return (
    <div className="mb-2 px-2">
      <Label />
      <Button.UnstyledButton
        onClick={(e) => {
          e.stopPropagation();
          updatePageHandle('edit-page-handle');
        }}
        classNames="page-handle-button-container"
      >
        <Button.Content
          title={content}
          iconSrc={'assets/images/icons/input.svg'}
          direction="right"
          dataCy={`page-handler`}
        />
      </Button.UnstyledButton>
    </div>
  );
};

const Field = ({ id, text, iconSrc, customClass = '', closeMenu, disabled = false, callback = () => null }) => {
  const handleOnClick = (e) => {
    e.stopPropagation();
    closeMenu();
    callback(id);
  };

  return (
    <div className={`field ${customClass ? ` ${customClass}` : ''}`}>
      <Button.UnstyledButton onClick={handleOnClick} styles={{ height: '28px' }} disabled={disabled}>
        <Button.Content title={text} iconSrc={iconSrc} direction="left" />
      </Button.UnstyledButton>
    </div>
  );
};
