import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup, Col, Form, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import PlusRectangle from '@/_ui/Icon/solidIcons/PlusRectangle';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import ArgumentFormOverlay from './ArgumentFormOverlay';

const ArgumentFormPopup = ({ darkMode, onSubmit, isEdit, name, defaultValue, onRemove, currentState, otherArgs }) => {
  const [showModal, setShowModal] = useState(false);
  const closeMenu = () => setShowModal(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showModal && event.target.closest('#argument-form-popover') === null) {
        closeMenu();
      }
    };

    document.addEventListener('mouseup', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleSubmit = (args) => {
    onSubmit && onSubmit(args);
    setShowModal(false);
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={true}
      show={showModal}
      overlay={
        <Popover
          id="argument-form-popover"
          className={`query-manager-sort-filter-popup ${darkMode && 'popover-dark-themed dark-theme theme-dark'}`}
          style={{ width: '268px' }}
        >
          <ArgumentFormOverlay
            darkMode={darkMode}
            isEdit={isEdit}
            otherArgs={otherArgs}
            name={name}
            defaultValue={defaultValue}
            onSubmit={handleSubmit}
            showModal={showModal}
            currentState={currentState}
          />
        </Popover>
      }
    >
      <span>
        {isEdit ? (
          <PillButton name={name} onClick={() => setShowModal(true)} onRemove={onRemove} />
        ) : (
          <Button
            variant="link"
            onClick={() => setShowModal(true)}
            className="border-0 ms-2"
            size="sm"
            style={{ textDecoration: 'none' }}
          >
            <span className="me-1">
              <PlusRectangle fill={'#3E63DD'} width={15} />
            </span>
            Add
          </Button>
        )}
      </span>
    </OverlayTrigger>
  );
};

export const PillButton = ({ name, onClick, onRemove, marginBottom }) => (
  <ButtonGroup aria-label="Argument Badge" className={cx('ms-2', { 'mb-2': marginBottom })}>
    <Button
      size="sm"
      className="bg-slate3 color-slate12 argument-badge"
      onClick={onClick}
      style={{
        borderTopLeftRadius: '15px',
        borderBottomLeftRadius: '15px',
        textTransform: 'none',
        padding: '0.8rem',
        fontWeight: 500,
        ...(!onRemove && { borderRadius: '15px' }),
      }}
    >
      <span className="text-truncate">{name}</span>
    </Button>
    {onRemove && (
      <Button
        onClick={onRemove}
        size="sm"
        className="bg-slate3 color-slate12"
        style={{
          borderTopRightRadius: '15px',
          borderBottomRightRadius: '15px',
          paddingLeft: 0,
          paddingRight: '0.75rem',
        }}
      >
        <Remove fill="var(--slate12)" />
      </Button>
    )}
  </ButtonGroup>
);

export default ArgumentFormPopup;
