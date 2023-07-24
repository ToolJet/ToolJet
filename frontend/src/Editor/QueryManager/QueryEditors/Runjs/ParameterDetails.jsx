import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup, OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import PlusRectangle from '@/_ui/Icon/solidIcons/PlusRectangle';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import ParameterForm from './ParameterForm';

const ParameterDetails = ({ darkMode, onSubmit, isEdit, name, defaultValue, onRemove, currentState, otherParams }) => {
  const [showModal, setShowModal] = useState(false);
  const closeMenu = () => setShowModal(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickedOnAddButton = !!event.target.closest('#runjs-param-add-btn');
      if (isClickedOnAddButton) {
        return; //modal closing on this even will be taken care by onClick attached to trigger button
      }
      if (
        showModal &&
        event.target.closest('#parameter-form-popover') === null &&
        event.target.closest('#cm-complete-0') === null
      ) {
        closeMenu();
      }
    };

    if (showModal) {
      document.addEventListener('mouseup', handleClickOutside);
    } else {
      document.removeEventListener('mouseup', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleSubmit = (param) => {
    if (param.name) {
      onSubmit && onSubmit(param);
      setShowModal(false);
    }
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={true}
      show={showModal}
      overlay={
        <Popover
          id="parameter-form-popover"
          className={`query-manager-sort-filter-popup ${darkMode && 'popover-dark-themed dark-theme theme-dark'}`}
          style={{ width: '268px' }}
        >
          <ParameterForm
            darkMode={darkMode}
            isEdit={isEdit}
            otherParams={otherParams}
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
          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            onClick={() => setShowModal((show) => !show)}
            className="ms-2"
            id="runjs-param-add-btn"
          >
            <span className="m-0">
              <PlusRectangle fill={'#3E63DD'} width={15} />
            </span>
            Add
          </ButtonSolid>
        )}
      </span>
    </OverlayTrigger>
  );
};

export const PillButton = ({ name, onClick, onRemove, marginBottom, className, size }) => (
  <ButtonGroup
    aria-label="Parameter"
    className={cx('ms-2', { 'mb-2': marginBottom, ...(className && { [className]: true }) })}
  >
    <Button
      size="sm"
      className={cx('bg-slate3 color-slate12 runjs-parameter-badge', { 'py-0 px-2': size === 'sm' })}
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
        className={cx('bg-slate3 color-slate12', { 'p-0 pe-1': size === 'sm' })}
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

export default ParameterDetails;
